import { BadRequestException, Controller, Get, Param, Post, Query, Body, ForbiddenException } from '@nestjs/common';
import { Prisma, UserRole } from '../generated/prisma/client.js';
import { DepartmentOnly } from '../common/department-only.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PrismaService } from '../common/prisma.service.js';
import { AccessService } from '../iam/access.service.js';

const validDay=(value:unknown)=>{
  if(typeof value!=='string'|| !/^\d{4}-\d{2}-\d{2}$/.test(value))throw new BadRequestException('Data no formato AAAA-MM-DD é obrigatória');
  const day=new Date(`${value}T00:00:00.000Z`);
  if(Number.isNaN(day.getTime())||day.toISOString().slice(0,10)!==value)throw new BadRequestException('Data inválida');
  return day;
};
const key=(v:unknown)=>{
  if(v===undefined||v===null||v==='')return 'turn';
  if(typeof v!=='string'||!/^[-a-zA-Z0-9_]{1,40}$/.test(v))throw new BadRequestException('Identificador da sessão inválido');
  return v;
};

type Mark = {personId:string;present:boolean;justified?:boolean;reason?:string};
@Controller('academic') @DepartmentOnly(UserRole.SECRETARY)
export class AttendanceBoardController {
  constructor(private readonly db:PrismaService,private readonly access:AccessService){}
  private async check(u:any,code:string){
    if(u.accessMode!=='CUSTOM'||u.role==='SUPER_ADMIN')return;
    const permission=await this.access.evaluate(u.sub,u.role,u.accessMode,code);
    if(!permission.allowed||permission.scope!=='GLOBAL')throw new ForbiddenException(`Permissão necessária: ${code}`);
  }

  @Get('attendance/group-options')
  async groupOptions(@CurrentUser()u:any){
    await this.check(u,'secretaria.frequencia.visualizar');
    return this.db.classGroup.findMany({select:{id:true,name:true,unit:true},orderBy:{name:'asc'},take:5000});
  }

  @Get('groups/:id/roster')
  async roster(@Param('id')classGroupId:string,@Query('classDate')classDate:string,@Query('sessionKey')sessionKey:string,@CurrentUser()u:any){
    await this.check(u,'secretaria.frequencia.visualizar');
    const day=validDay(classDate),session=key(sessionKey);
    const group=await this.db.classGroup.findUniqueOrThrow({where:{id:classGroupId},select:{id:true,name:true,unit:true}});
    // The same student may have multiple courses in the same class group; show once.
    const enrollments=await this.db.enrollment.findMany({where:{classGroupId,status:'ACTIVE'},include:{person:{select:{id:true,fullName:true}},course:{select:{name:true}}},take:2500,orderBy:{createdAt:'desc'}});
    const candidates=new Map<string,{id:string;name:string;courses:string[]}>();
    for(const row of enrollments){
      if((row.rosterStartDate&&day<row.rosterStartDate)||(row.rosterEndDate&&day>row.rosterEndDate))continue;
      const p=candidates.get(row.personId)||{id:row.personId,name:row.person.fullName,courses:[]};
      if(row.course?.name&&!p.courses.includes(row.course.name))p.courses.push(row.course.name);
      candidates.set(row.personId,p);
    }
    const ids=[...candidates.keys()];
    const entries=ids.length?await this.db.attendance.findMany({where:{classGroupId,classDate:day,sessionKey:session,personId:{in:ids}},select:{id:true,personId:true,present:true,justified:true,reason:true}}):[];
    const byPerson=new Map(entries.map(x=>[x.personId,x]));
    return {group,date:classDate,sessionKey:session,total:ids.length,truncated:enrollments.length===2500,
      rows:[...candidates.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(p=>({
        ...p,attendance:byPerson.get(p.id)||null,
      }))};
  }

  @Post('groups/:id/attendance/batch')
  async batch(@Param('id')classGroupId:string,@Body()body:{classDate?:unknown;sessionKey?:unknown;marks?:unknown},@CurrentUser()u:any){
    await this.check(u,'secretaria.frequencia.lancar');
    const day=validDay(body?.classDate),session=key(body?.sessionKey);
    const input=body?.marks;
    if(!Array.isArray(input)||input.length<1||input.length>300)throw new BadRequestException('Informe entre 1 e 300 alunos por lote');
    const marks:Mark[]=input.map((r:any)=>{
      if(!r||typeof r.personId!=='string'||typeof r.present!=='boolean'||(r.justified!==undefined&&typeof r.justified!=='boolean')||
        (r.reason!==undefined&&typeof r.reason!=='string')) throw new BadRequestException('Registro de presença inválido');
      if(r.present&&r.justified)throw new BadRequestException('Presença não pode ser falta justificada');
      if(r.justified && (!r.reason||r.reason.trim().length<5))throw new BadRequestException('Justificativa exige motivo com ao menos 5 caracteres');
      if(r.reason?.length>2000)throw new BadRequestException('Motivo excessivamente longo');
      return {personId:r.personId,present:r.present,justified:r.justified??false,reason:r.reason?.trim()||null} as Mark;
    });
    const ids=marks.map(x=>x.personId);
    if(new Set(ids).size!==ids.length)throw new BadRequestException('Aluno duplicado no lote');
    const valid=await this.db.enrollment.findMany({where:{classGroupId,personId:{in:ids},status:'ACTIVE'},select:{personId:true,rosterStartDate:true,rosterEndDate:true}});
    const permitted=new Set(valid.filter(r=>(!r.rosterStartDate||day>=r.rosterStartDate)&&(!r.rosterEndDate||day<=r.rosterEndDate)).map(x=>x.personId));
    if(ids.some(id=>!permitted.has(id)))throw new BadRequestException('Um ou mais alunos estão fora da lista de chamada nesta data');
    // Check the right to correct existing records *inside* the serializable transaction.
    // A preflight read alone would allow a concurrent insertion between permission check and upsert.
    const correctionDecision = u.accessMode==='CUSTOM' && u.role!=='SUPER_ADMIN'
      ? await this.access.evaluate(u.sub,u.role,u.accessMode,'secretaria.frequencia.corrigir') : null;
    const correctionAllowed = !correctionDecision || (correctionDecision.allowed && correctionDecision.scope==='GLOBAL');
    return this.db.$transaction(async tx=>{
      let changes=0;
      for(const mark of marks){
        const last=await tx.attendance.findUnique({where:{personId_classGroupId_classDate_sessionKey:{personId:mark.personId,classGroupId,classDate:day,sessionKey:session}},select:{id:true,present:true,justified:true,reason:true}});
        if(last && !correctionAllowed)throw new ForbiddenException('Corrigir frequência exige permissão específica');
        const next={present:mark.present,justified:mark.justified??false,reason:mark.reason||null,legacyCode:mark.present?'P':mark.justified?'FJ':'F'};
        if(last&&last.present===next.present&&last.justified===next.justified&&(last.reason||null)===next.reason)continue;
        const record=await tx.attendance.upsert({
          where:{personId_classGroupId_classDate_sessionKey:{personId:mark.personId,classGroupId,classDate:day,sessionKey:session}},
          create:{personId:mark.personId,classGroupId,classDate:day,sessionKey:session,...next},update:next,
        });
        await tx.auditLog.create({data:{userId:u.sub,action:last?'ATTENDANCE_CORRECTED':'ATTENDANCE_MARKED',entity:'Attendance',entityId:record.id,
          metadata:{classGroupId,personId:mark.personId,classDate:day.toISOString().slice(0,10),sessionKey:session,before:last?{present:last.present,justified:last.justified,reason:last.reason}:null,after:next}}});
        changes++;
      }
      return {ok:true,received:marks.length,changed:changes,unchanged:marks.length-changes};
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  }
}
