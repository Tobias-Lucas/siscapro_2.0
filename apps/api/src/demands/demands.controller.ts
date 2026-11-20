import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IsBoolean, IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../generated/prisma/client.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { DepartmentOnly } from '../common/department-only.decorator.js';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import { AccessService } from '../iam/access.service.js';

type ScopeContext =
  | { kind:'GLOBAL' }
  | { kind:'UNIT'; ids:string[] }
  | { kind:'DEPARTMENT'; ids:string[] }
  | { kind:'COMPANY'; companyId:string|null }
  | { kind:'OWN'; userId:string };

class DemandDto {
  @IsOptional() @IsString() @MaxLength(180) title?:string;
  @IsOptional() @IsString() @MaxLength(12000) description?:string;
  @IsOptional() @IsString() companyId?:string;
  @IsOptional() @IsString() typeId?:string;
  @IsOptional() @IsString() unitId?:string;
  @IsOptional() @IsString() departmentId?:string;
  @IsOptional() @IsString() assignedUserId?:string;
  @IsOptional() @IsDateString() receivedAt?:string;
  @IsOptional() @IsString() originChannel?:string;
  @IsOptional() @IsDateString() dueAt?:string;
}
class DemandTaskDto {
  @IsOptional() @IsString() @MaxLength(180) title?:string;
  @IsOptional() @IsString() @MaxLength(12000) description?:string;
  @IsOptional() @IsString() personId?:string;
  @IsOptional() @IsString() assignedUserId?:string;
  @IsOptional() @IsDateString() dueAt?:string;
}
class DemandTypeDto {
  @IsString() @MinLength(2) @MaxLength(80) name!:string;
  @IsString() @MinLength(2) @MaxLength(50) code!:string;
  @IsOptional() @IsBoolean() active?:boolean;
}

const toDate=(value?:string)=>value?new Date(value):undefined;
const channels=['MANUAL','EMAIL','WHATSAPP','PHONE','PORTAL','PRESENTIAL','API'] as const;
const checkChannel=(value:unknown)=>{if(typeof value!=='string'||!channels.includes(value as any))throw new BadRequestException('Canal de origem invalido');return value;};
const validStatus=(value:string)=>['OPEN','IN_PROGRESS','WAITING','DONE','CANCELLED'].includes(value);
const pageValues=(page:string,pageSize:string)=>({page:Math.max(1,Number.parseInt(page||'1',10)||1),pageSize:Math.min(100,Math.max(1,Number.parseInt(pageSize||'25',10)||25))});

@Controller('demands')
@DepartmentOnly(UserRole.SUPER_ADMIN,UserRole.ADMIN,UserRole.COMMERCIAL,UserRole.CONTRACTS,UserRole.FINANCE,UserRole.HR,UserRole.RECEPTION,UserRole.SECRETARY,UserRole.TRIAGE)
export class DemandsController {
  constructor(private readonly db:PrismaService,private readonly access:AccessService,private readonly audit:AuditService){}

  private async scope(user:any,code:string):Promise<ScopeContext>{
    if(user.role===UserRole.SUPER_ADMIN||user.accessMode!=='CUSTOM')return {kind:'GLOBAL'};
    const decision=await this.access.evaluate(user.sub,user.role,user.accessMode,code);
    if(!decision.allowed)throw new ForbiddenException(`Acesso nao autorizado: ${code}`);
    if(decision.scope==='GLOBAL')return {kind:'GLOBAL'};
    if(decision.scope==='OWN')return {kind:'OWN',userId:user.sub};
    if(decision.scope==='COMPANY'){
      const account=await this.db.user.findUnique({where:{id:user.sub},select:{companyId:true}});
      return {kind:'COMPANY',companyId:account?.companyId||null};
    }
    const assignments=await this.db.userUnit.findMany({where:{userId:user.sub,active:true},select:{unitId:true,departmentId:true}});
    if(decision.scope==='UNIT')return {kind:'UNIT',ids:[...new Set(assignments.map(x=>x.unitId))]};
    return {kind:'DEPARTMENT',ids:[...new Set(assignments.map(x=>x.departmentId).filter((x):x is string=>!!x))]};
  }
  private demandWhere(scope:ScopeContext):any{
    if(scope.kind==='UNIT')return {unitId:{in:scope.ids.length?scope.ids:['__NO_ACCESS__']}};
    if(scope.kind==='DEPARTMENT')return {departmentId:{in:scope.ids.length?scope.ids:['__NO_ACCESS__']}};
    if(scope.kind==='COMPANY')return {companyId:scope.companyId||'__NO_ACCESS__'};
    if(scope.kind==='OWN')return {assignedUserId:scope.userId};
    return {};
  }
  private taskWhere(scope:ScopeContext):any{
    if(scope.kind==='UNIT')return {demand:{unitId:{in:scope.ids.length?scope.ids:['__NO_ACCESS__']}}};
    if(scope.kind==='DEPARTMENT')return {demand:{departmentId:{in:scope.ids.length?scope.ids:['__NO_ACCESS__']}}};
    if(scope.kind==='COMPANY')return {demand:{companyId:scope.companyId||'__NO_ACCESS__'}};
    if(scope.kind==='OWN')return {assignedUserId:scope.userId};
    return {};
  }
  private async unitForCreate(scope:ScopeContext,requested?:string){
    if(scope.kind!=='UNIT')return requested||undefined;
    if(requested){if(!scope.ids.includes(requested))throw new ForbiddenException('Unidade fora do escopo do usuario');return requested;}
    if(scope.ids.length===1)return scope.ids[0];
    throw new BadRequestException('Selecione uma unidade autorizada para esta demanda');
  }
  private async departmentForCreate(scope:ScopeContext,requested?:string){
    if(scope.kind!=='DEPARTMENT')return requested||undefined;
    if(requested){if(!scope.ids.includes(requested))throw new ForbiddenException('Departamento fora do escopo do usuario');return requested;}
    if(scope.ids.length===1)return scope.ids[0];
    throw new BadRequestException('Selecione um departamento autorizado para esta demanda');
  }
  private async validateCompany(scope:ScopeContext,companyId?:string){
    if(!companyId||scope.kind==='GLOBAL')return;
    let where:any={id:companyId};
    if(scope.kind==='COMPANY')where={...where,id:scope.companyId||'__NO_ACCESS__'};
    else if(scope.kind==='UNIT')where={...where,demandEntries:{some:{unitId:{in:scope.ids.length?scope.ids:['__NO_ACCESS__']}}}};
    else if(scope.kind==='DEPARTMENT')where={...where,demandEntries:{some:{departmentId:{in:scope.ids.length?scope.ids:['__NO_ACCESS__']}}}};
    else if(scope.kind==='OWN')where={...where,demandEntries:{some:{assignedUserId:scope.userId}}};
    const company=await this.db.company.findFirst({where,select:{id:true}});if(!company)throw new ForbiddenException('Empresa fora do escopo do usuario');
  }
  private async validateLocation(scope:ScopeContext,unitId?:string,departmentId?:string,userId?:string){
    if(scope.kind==='UNIT'&&departmentId){const link=await this.db.userUnit.findFirst({where:{userId,active:true,unitId:unitId||{in:scope.ids},departmentId},select:{id:true}});if(!link)throw new ForbiddenException('Departamento nao pertence a unidade autorizada');}
    if(scope.kind==='DEPARTMENT'&&unitId){const link=await this.db.userUnit.findFirst({where:{userId,active:true,unitId,departmentId:{in:scope.ids}},select:{id:true}});if(!link)throw new ForbiddenException('Unidade nao pertence ao departamento autorizado');}
  }
  private async validateAssignee(scope:ScopeContext,assignedUserId?:string){
    if(!assignedUserId||scope.kind==='GLOBAL')return;
    if(scope.kind==='OWN'){if(assignedUserId!==scope.userId)throw new ForbiddenException('O escopo pessoal permite atribuir somente ao proprio usuario');return;}
    if(scope.kind==='COMPANY'){const target=await this.db.user.findFirst({where:{id:assignedUserId,companyId:scope.companyId||'__NO_ACCESS__'},select:{id:true}});if(!target)throw new ForbiddenException('Responsavel nao pertence a empresa vinculada');return;}
    const where:any=scope.kind==='UNIT'?{userId:assignedUserId,active:true,unitId:{in:scope.ids.length?scope.ids:['__NO_ACCESS__']}}:{userId:assignedUserId,active:true,departmentId:{in:scope.ids.length?scope.ids:['__NO_ACCESS__']}};
    const target=await this.db.userUnit.findFirst({where,select:{id:true}});if(!target)throw new ForbiddenException('Responsavel fora do escopo de unidade/departamento');
  }
  private async assertScopeUpdate(scope:ScopeContext,data:any){
    if(scope.kind==='UNIT'&&data.unitId!==undefined&&!scope.ids.includes(data.unitId))throw new ForbiddenException('Unidade fora do escopo do usuario');
    if(scope.kind==='DEPARTMENT'&&data.departmentId!==undefined&&!scope.ids.includes(data.departmentId))throw new ForbiddenException('Departamento fora do escopo do usuario');
    if(scope.kind==='COMPANY'&&data.companyId!==undefined&&data.companyId!==scope.companyId)throw new ForbiddenException('Empresa fora do escopo do usuario');
    if(scope.kind==='OWN'&&Object.keys(data).some(k=>!['title','description','dueAt'].includes(k)))throw new ForbiddenException('O escopo pessoal permite alterar somente titulo, descricao e prazo');
  }

  @Get('options/units') async optionUnits(@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.visualizar');
    if(scope.kind==='UNIT')return this.db.unit.findMany({where:{id:{in:scope.ids},status:'ACTIVE'},select:{id:true,name:true,code:true},orderBy:{name:'asc'}});
    if(scope.kind==='DEPARTMENT'){
      const rows=await this.db.userUnit.findMany({where:{userId:user.sub,active:true,departmentId:{in:scope.ids}},select:{unitId:true}});
      return this.db.unit.findMany({where:{id:{in:[...new Set(rows.map(x=>x.unitId))]},status:'ACTIVE'},select:{id:true,name:true,code:true},orderBy:{name:'asc'}});
    }
    if(scope.kind!=='GLOBAL')return [];
    return this.db.unit.findMany({where:{status:'ACTIVE'},select:{id:true,name:true,code:true},orderBy:{name:'asc'},take:300});
  }
  @Get('options/departments') async optionDepartments(@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.visualizar');
    if(scope.kind==='DEPARTMENT')return this.db.department.findMany({where:{id:{in:scope.ids},status:'ACTIVE'},select:{id:true,name:true,code:true},orderBy:{name:'asc'}});
    if(scope.kind==='UNIT'){
      const rows=await this.db.userUnit.findMany({where:{userId:user.sub,active:true,unitId:{in:scope.ids},departmentId:{not:null}},select:{departmentId:true}});
      return this.db.department.findMany({where:{id:{in:[...new Set(rows.map(x=>x.departmentId).filter((x):x is string=>!!x))]},status:'ACTIVE'},select:{id:true,name:true,code:true},orderBy:{name:'asc'}});
    }
    if(scope.kind!=='GLOBAL')return [];
    return this.db.department.findMany({where:{status:'ACTIVE'},select:{id:true,name:true,code:true},orderBy:{name:'asc'},take:300});
  }
  @Get('options/companies') async optionCompanies(@Query('page')page='1',@Query('pageSize')pageSize='25',@Query('q')q='',@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.visualizar'),p=pageValues(page,pageSize),term=q.trim();let where:any={status:'ACTIVE'};
    if(scope.kind==='COMPANY')where={...where,id:scope.companyId||'__NO_ACCESS__'};
    else if(scope.kind==='UNIT')where={...where,demandEntries:{some:{unitId:{in:scope.ids.length?scope.ids:['__NO_ACCESS__']}}}};
    else if(scope.kind==='DEPARTMENT')where={...where,demandEntries:{some:{departmentId:{in:scope.ids.length?scope.ids:['__NO_ACCESS__']}}}};
    else if(scope.kind==='OWN')where={...where,demandEntries:{some:{assignedUserId:scope.userId}}};
    if(term)where={...where,OR:[{legalName:{contains:term,mode:'insensitive'}},{tradeName:{contains:term,mode:'insensitive'}}]};
    const [items,total]=await Promise.all([this.db.company.findMany({where,select:{id:true,legalName:true,tradeName:true},orderBy:{legalName:'asc'},skip:(p.page-1)*p.pageSize,take:p.pageSize}),this.db.company.count({where})]);return {items,total,...p};
  }
  @Get('options/users') async optionUsers(@Query('page')page='1',@Query('pageSize')pageSize='25',@Query('q')q='',@CurrentUser()user:any){return this.optionUsersFor('empresas.demandas.visualizar',page,pageSize,q,user);}
  @Get('options/task-users') async optionTaskUsers(@Query('page')page='1',@Query('pageSize')pageSize='25',@Query('q')q='',@CurrentUser()user:any){return this.optionUsersFor('empresas.demandas.tarefas.criar',page,pageSize,q,user);}
  private async optionUsersFor(code:string,page:string,pageSize:string,q:string,user:any){
    const scope=await this.scope(user,code),p=pageValues(page,pageSize),term=q.trim();let where:any={active:true,role:{in:[UserRole.ADMIN,UserRole.SECRETARY,UserRole.FINANCE,UserRole.TRIAGE,UserRole.CONTRACTS,UserRole.SOCIAL_SERVICE,UserRole.RECEPTION,UserRole.COMMERCIAL,UserRole.HR]}};
    if(scope.kind==='UNIT'||scope.kind==='DEPARTMENT'){
      const unitWhere=scope.kind==='UNIT'?{unitId:{in:scope.ids.length?scope.ids:['__NO_ACCESS__']}}:{departmentId:{in:scope.ids.length?scope.ids:['__NO_ACCESS__']}};
      const memberships=await this.db.userUnit.findMany({where:{...unitWhere,active:true},select:{userId:true}});where={...where,id:{in:[...new Set(memberships.map(x=>x.userId))]}};
    }else if(scope.kind==='COMPANY')where={...where,companyId:scope.companyId||'__NO_ACCESS__'};
    else if(scope.kind==='OWN')where={...where,id:scope.userId};
    if(term)where={...where,OR:[{name:{contains:term,mode:'insensitive'}},{email:{contains:term,mode:'insensitive'}}]};
    const [items,total]=await Promise.all([this.db.user.findMany({where,select:{id:true,name:true,email:true},orderBy:{name:'asc'},skip:(p.page-1)*p.pageSize,take:p.pageSize}),this.db.user.count({where})]);return {items,total,...p};
  }
  @Get('options/people') async optionPeople(@Query('page')page='1',@Query('pageSize')pageSize='25',@Query('q')q='',@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.tarefas.criar'),p=pageValues(page,pageSize),term=q.trim();let where:any={status:'ACTIVE'};
    if(scope.kind==='UNIT'||scope.kind==='DEPARTMENT'){
      let unitIds=scope.kind==='UNIT'?scope.ids:(await this.db.userUnit.findMany({where:{userId:user.sub,active:true,departmentId:{in:scope.ids}},select:{unitId:true}})).map(x=>x.unitId);
      const units=await this.db.unit.findMany({where:{id:{in:unitIds}},select:{name:true,code:true}});const values=[...new Set(units.flatMap(x=>[x.name,x.code]).filter(Boolean))];
      where={...where,enrollments:{some:{classGroup:{is:{unit:{in:values.length?values:['__NO_ACCESS__']}}}}}};
    }else if(scope.kind==='COMPANY')where={...where,enrollments:{some:{companyId:scope.companyId||'__NO_ACCESS__'}}};
    else if(scope.kind==='OWN')where={...where,demandTaskEntries:{some:{assignedUserId:scope.userId}}};
    if(term)where={...where,fullName:{contains:term,mode:'insensitive'}};
    const [items,total]=await Promise.all([this.db.person.findMany({where,select:{id:true,fullName:true},orderBy:{fullName:'asc'},skip:(p.page-1)*p.pageSize,take:p.pageSize}),this.db.person.count({where})]);return {items,total,...p};
  }

  @Get('types') async types(){return this.db.demandType.findMany({where:{active:true},orderBy:{name:'asc'}});}
  @Post('types') async createType(@Body()dto:DemandTypeDto,@CurrentUser()user:any){
    const code=dto.code.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'-');
    if(!/^[a-z0-9_-]{2,50}$/.test(code))throw new BadRequestException('Codigo do tipo invalido');
    const row=await this.db.demandType.create({data:{name:dto.name.trim(),code,active:dto.active??true}});
    await this.audit.log({userId:user.sub,action:'CREATE',entity:'DemandType',entityId:row.id});return row;
  }
  @Patch('types/:id') async updateType(@Param('id')id:string,@Body()dto:Partial<DemandTypeDto>,@CurrentUser()user:any){
    const data:any={};if(dto.name!==undefined)data.name=dto.name.trim();if(dto.code!==undefined){data.code=dto.code.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'-');if(!/^[a-z0-9_-]{2,50}$/.test(data.code))throw new BadRequestException('Codigo do tipo invalido');}if(dto.active!==undefined)data.active=dto.active;
    if(!Object.keys(data).length)throw new BadRequestException('Nenhuma alteracao informada');
    const row=await this.db.demandType.update({where:{id},data});await this.audit.log({userId:user.sub,action:'UPDATE',entity:'DemandType',entityId:id});return row;
  }

  @Get('tasks/completed') async completedTasks(@Query('page')page='1',@Query('pageSize')pageSize='25',@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.tarefas.listar'),p=pageValues(page,pageSize),where={...this.taskWhere(scope),status:'DONE'};
    const [items,total]=await Promise.all([this.db.demandTask.findMany({where,include:{demand:{select:{id:true,title:true,status:true,company:{select:{legalName:true,tradeName:true}}}},person:{select:{id:true,fullName:true}},assignedUser:{select:{id:true,name:true}}},orderBy:{completedAt:'desc'},skip:(p.page-1)*p.pageSize,take:p.pageSize}),this.db.demandTask.count({where})]);
    return {items,total,...p};
  }
  @Get('tasks') async tasks(@Query('page')page='1',@Query('pageSize')pageSize='25',@Query('q')q='',@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.tarefas.listar'),p=pageValues(page,pageSize),term=q.trim();
    const where:any={...this.taskWhere(scope),...(term?{OR:[{title:{contains:term,mode:'insensitive'}},{description:{contains:term,mode:'insensitive'}},{demand:{title:{contains:term,mode:'insensitive'}}}]}:{})};
    const [items,total]=await Promise.all([this.db.demandTask.findMany({where,include:{demand:{select:{id:true,title:true,status:true,company:{select:{legalName:true,tradeName:true}}}},person:{select:{id:true,fullName:true}},assignedUser:{select:{id:true,name:true}}},orderBy:[{dueAt:'asc'},{createdAt:'desc'}],skip:(p.page-1)*p.pageSize,take:p.pageSize}),this.db.demandTask.count({where})]);
    return {items,total,...p};
  }
  @Get('completed') async completed(@Query('page')page='1',@Query('pageSize')pageSize='25',@Query('q')q='',@CurrentUser()user:any){return this.listInternal(page,pageSize,q,'DONE',user);}
  @Get('reports/summary') async summary(@CurrentUser()user:any){
    const where=this.demandWhere(await this.scope(user,'relatorios.demandas.visualizar'));
    const [total,open,inProgress,waiting,done,cancelled,overdue]=await Promise.all([
      this.db.demand.count({where}),this.db.demand.count({where:{...where,status:'OPEN'}}),this.db.demand.count({where:{...where,status:'IN_PROGRESS'}}),
      this.db.demand.count({where:{...where,status:'WAITING'}}),this.db.demand.count({where:{...where,status:'DONE'}}),this.db.demand.count({where:{...where,status:'CANCELLED'}}),
      this.db.demand.count({where:{...where,status:{in:['OPEN','IN_PROGRESS','WAITING']},dueAt:{lt:new Date()}}}),
    ]);return {total,open,inProgress,waiting,done,cancelled,overdue,notice:'Indicadores operacionais preliminares; nao substituem os relatorios legados de demandas atendidas e producao de contratos.'};
  }
  @Get() async list(@Query('page')page='1',@Query('pageSize')pageSize='25',@Query('q')q='',@Query('status')status='',@CurrentUser()user:any){return this.listInternal(page,pageSize,q,status,user);}
  private async listInternal(page:string,pageSize:string,q:string,status:string,user:any){
    const scope=await this.scope(user,'empresas.demandas.listar'),p=pageValues(page,pageSize),term=q.trim();
    if(status&&!validStatus(status))throw new BadRequestException('Situacao invalida');
    const where:any={...this.demandWhere(scope),...(status?{status}:{}),...(term?{OR:[{title:{contains:term,mode:'insensitive'}},{description:{contains:term,mode:'insensitive'}},{company:{legalName:{contains:term,mode:'insensitive'}}},{company:{tradeName:{contains:term,mode:'insensitive'}}},{type:{name:{contains:term,mode:'insensitive'}}}]}:{})};
    const [items,total]=await Promise.all([this.db.demand.findMany({where,include:{company:{select:{id:true,legalName:true,tradeName:true}},type:{select:{id:true,name:true}},unit:{select:{id:true,name:true}},department:{select:{id:true,name:true}},assignedUser:{select:{id:true,name:true}}},orderBy:[{dueAt:'asc'},{receivedAt:'desc'}],skip:(p.page-1)*p.pageSize,take:p.pageSize}),this.db.demand.count({where})]);
    return {items,total,...p};
  }

  @Get(':id') async detail(@Param('id')id:string,@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.visualizar');
    const row=await this.db.demand.findFirst({where:{id,...this.demandWhere(scope)},include:{company:{select:{id:true,legalName:true,tradeName:true}},type:{select:{id:true,code:true,name:true}},unit:{select:{id:true,code:true,name:true}},department:{select:{id:true,code:true,name:true}},assignedUser:{select:{id:true,name:true}},createdBy:{select:{id:true,name:true}}}});
    if(!row)throw new ForbiddenException('Demanda inexistente ou fora do escopo autorizado');
    const result:any={...row};
    const taskDecision=await this.access.evaluate(user.sub,user.role,user.accessMode,'empresas.demandas.tarefas.listar');
    if(taskDecision.allowed){const taskScope=await this.scope(user,'empresas.demandas.tarefas.listar');result.tasks=await this.db.demandTask.findMany({where:{demandId:id,...this.taskWhere(taskScope)},include:{person:{select:{id:true,fullName:true}},assignedUser:{select:{id:true,name:true}}},orderBy:{createdAt:'asc'}});}
    return result;
  }
  @Post() async create(@Body()dto:DemandDto,@CurrentUser()user:any){
    if(!String(dto.title||'').trim()&&!String(dto.description||'').trim())throw new BadRequestException('Informe o assunto ou a descricao da demanda');
    const scope=await this.scope(user,'empresas.demandas.criar');
    const unitId=await this.unitForCreate(scope,dto.unitId),departmentId=await this.departmentForCreate(scope,dto.departmentId);
    const companyId=scope.kind==='COMPANY'?scope.companyId:(dto.companyId||undefined);
    if(scope.kind==='COMPANY'&&!companyId)throw new ForbiddenException('Usuario sem empresa vinculada');
    await this.validateCompany(scope,companyId||undefined);
    await this.validateLocation(scope,unitId,departmentId,user.sub);
    const assignedUserId=scope.kind==='OWN'?scope.userId:(dto.assignedUserId||undefined);
    await this.validateAssignee(scope,assignedUserId);
    const row=await this.db.demand.create({data:{title:dto.title?.trim()||null,description:dto.description?.trim()||null,companyId,typeId:dto.typeId||undefined,unitId,departmentId,assignedUserId,createdById:user.sub,receivedAt:toDate(dto.receivedAt)||new Date(),dueAt:toDate(dto.dueAt),originChannel:dto.originChannel?checkChannel(dto.originChannel):'MANUAL'}});
    await this.audit.log({userId:user.sub,action:'CREATE',entity:'Demand',entityId:row.id});return row;
  }
  @Patch(':id') async update(@Param('id')id:string,@Body()body:any,@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.editar');
    const current=await this.db.demand.findFirst({where:{id,...this.demandWhere(scope)}});if(!current)throw new ForbiddenException('Demanda inexistente ou fora do escopo autorizado');
    const allowed=['title','description','companyId','typeId','unitId','departmentId','assignedUserId','receivedAt','dueAt','originChannel','cancellationReason'];
    const keys=Object.keys(body||{});if(!keys.length||keys.some(k=>!allowed.includes(k)))throw new BadRequestException('Campos de atualizacao invalidos');
    const data:any={};for(const k of keys){const v=body[k];if(k==='receivedAt'||k==='dueAt')data[k]=v?new Date(v):null;else if(k==='originChannel')data[k]=checkChannel(v);else data[k]=typeof v==='string'?v.trim():v;}
    await this.assertScopeUpdate(scope,data);
    if(data.assignedUserId!==undefined)await this.validateAssignee(scope,data.assignedUserId||undefined);
    if(data.companyId!==undefined)await this.validateCompany(scope,data.companyId||undefined);
    if(data.unitId!==undefined||data.departmentId!==undefined)await this.validateLocation(scope,data.unitId??current.unitId??undefined,data.departmentId??current.departmentId??undefined,user.sub);
    if(scope.kind==='COMPANY'&&data.companyId===undefined)data.companyId=scope.companyId;
    const row=await this.db.demand.update({where:{id},data});await this.audit.log({userId:user.sub,action:'UPDATE',entity:'Demand',entityId:id,metadata:{fields:keys}});return row;
  }
  @Post(':id/complete') async complete(@Param('id')id:string,@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.concluir');const current=await this.db.demand.findFirst({where:{id,...this.demandWhere(scope)}});if(!current)throw new ForbiddenException('Demanda inexistente ou fora do escopo autorizado');
    const row=await this.db.demand.update({where:{id},data:{status:'DONE',completedAt:new Date(),cancelledAt:null}});await this.audit.log({userId:user.sub,action:'COMPLETE',entity:'Demand',entityId:id});return row;
  }
  @Post(':id/cancel') async cancel(@Param('id')id:string,@Body()body:{reason?:string},@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.cancelar');const current=await this.db.demand.findFirst({where:{id,...this.demandWhere(scope)}});if(!current)throw new ForbiddenException('Demanda inexistente ou fora do escopo autorizado');
    const row=await this.db.demand.update({where:{id},data:{status:'CANCELLED',cancelledAt:new Date(),cancellationReason:String(body?.reason||'').slice(0,1000)}});await this.audit.log({userId:user.sub,action:'CANCEL',entity:'Demand',entityId:id});return row;
  }
  @Post(':id/tasks') async createTask(@Param('id')id:string,@Body()dto:DemandTaskDto,@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.tarefas.criar');const demand=await this.db.demand.findFirst({where:{id,...this.demandWhere(scope)}});if(!demand)throw new ForbiddenException('Demanda inexistente ou fora do escopo autorizado');
    if(!String(dto.title||'').trim()&&!String(dto.description||'').trim())throw new BadRequestException('Informe o titulo ou a descricao da tarefa');
    const assignedUserId=scope.kind==='OWN'?scope.userId:(dto.assignedUserId||undefined);
    await this.validateAssignee(scope,assignedUserId);
    const row=await this.db.demandTask.create({data:{demandId:id,title:dto.title?.trim()||null,description:dto.description?.trim()||null,personId:dto.personId||undefined,assignedUserId,createdById:user.sub,dueAt:toDate(dto.dueAt)}});
    await this.audit.log({userId:user.sub,action:'CREATE',entity:'DemandTask',entityId:row.id,metadata:{demandId:id}});return row;
  }
  @Patch(':id/tasks/:taskId') async updateTask(@Param('id')id:string,@Param('taskId')taskId:string,@Body()body:any,@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.tarefas.editar');const task=await this.db.demandTask.findFirst({where:{id:taskId,demandId:id,...this.taskWhere(scope)}});if(!task)throw new ForbiddenException('Tarefa inexistente ou fora do escopo autorizado');
    const allowed=['title','description','personId','assignedUserId','dueAt'];const keys=Object.keys(body||{});if(!keys.length||keys.some(k=>!allowed.includes(k)))throw new BadRequestException('Campos de atualizacao invalidos');
    if(scope.kind==='OWN'&&keys.some(k=>!['title','description','dueAt'].includes(k)))throw new ForbiddenException('O escopo pessoal permite alterar somente titulo, descricao e prazo');
    const data:any={};for(const k of keys)data[k]=k==='dueAt'?(body[k]?new Date(body[k]):null):typeof body[k]==='string'?body[k].trim():body[k];
    if(data.assignedUserId!==undefined)await this.validateAssignee(scope,data.assignedUserId||undefined);
    const row=await this.db.demandTask.update({where:{id:taskId},data});await this.audit.log({userId:user.sub,action:'UPDATE',entity:'DemandTask',entityId:taskId,metadata:{demandId:id,fields:keys}});return row;
  }
  @Post(':id/tasks/:taskId/complete') async completeTask(@Param('id')id:string,@Param('taskId')taskId:string,@CurrentUser()user:any){
    const scope=await this.scope(user,'empresas.demandas.tarefas.concluir');const task=await this.db.demandTask.findFirst({where:{id:taskId,demandId:id,...this.taskWhere(scope)}});if(!task)throw new ForbiddenException('Tarefa inexistente ou fora do escopo autorizado');
    const row=await this.db.demandTask.update({where:{id:taskId},data:{status:'DONE',completedAt:new Date()}});await this.audit.log({userId:user.sub,action:'COMPLETE',entity:'DemandTask',entityId:taskId,metadata:{demandId:id}});return row;
  }
}
