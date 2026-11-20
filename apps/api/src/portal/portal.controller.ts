import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsBoolean, IsDateString, IsEmail, IsInt, IsIn, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { AuthGuard } from '../common/auth.guard.js';
import { RolesGuard } from '../common/roles.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import { UserRole } from '../generated/prisma/client.js';

const formBoolean = ({ value }: {value: unknown}) => value === 'true' || value === '1' || value === true ? true : value === 'false' || value === '0' || value === false ? false : value;
class TeacherAttendanceDto {
  @IsString() classGroupId!: string;
  @IsString() personId!: string;
  @IsDateString() classDate!: string;
  @IsOptional() @IsString() sessionKey?: string;
  @Transform(formBoolean) @IsBoolean() present!: boolean;
  @IsOptional() @Transform(formBoolean) @IsBoolean() justified?: boolean;
  @IsOptional() @IsString() reason?: string;
}

class StudentRequestDto { @IsString() @MaxLength(100) type!:string; @IsString() @MaxLength(4000) description!:string; }
class StudentProfileDto { @IsOptional() @IsString() @MaxLength(20) phone?:string; @IsOptional() @IsString() @MaxLength(20) secondaryPhone?:string; @IsOptional() @IsEmail() email?:string; }
class StudentApplyDto { @IsString() vacancyId!:string; }
class StudentJustificationDto { @IsString() @MaxLength(4000) reason!:string; }
class CompanyVacancyDto { @IsString() @MaxLength(180) title!:string; @IsOptional() @IsString() @MaxLength(1000) profile?:string; @IsOptional() @IsInt() @Min(1) quantity?:number; @IsOptional() @IsString() city?:string; }
class SupervisorReportDto { @IsString() internshipId!:string; @IsIn(['RA','TRE']) kind!:'RA'|'TRE'; @IsDateString() periodStart!:string; @IsDateString() periodEnd!:string; @IsString() @MaxLength(20000) content!:string; }

@Controller('portal')
@UseGuards(AuthGuard, RolesGuard)
export class PortalController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Get('student') @Roles(UserRole.STUDENT,UserRole.APPRENTICE)
  async student(@CurrentUser() user:any){
    const u=await this.prisma.user.findUniqueOrThrow({where:{id:user.sub}});
    if(!u.personId)return {profile:null,enrollments:[],contracts:[],attendance:[],grades:[],requests:[],applications:[]};
    const [profile,enrollments,contracts,attendance,grades,requests,applications]=await Promise.all([
      this.prisma.person.findUnique({where:{id:u.personId}}),
      this.prisma.enrollment.findMany({where:{personId:u.personId},include:{course:true,classGroup:true,company:true},orderBy:{createdAt:'desc'}}),
      this.prisma.contract.findMany({where:{personId:u.personId},include:{company:true,course:true},orderBy:{createdAt:'desc'}}),
      this.prisma.attendance.findMany({where:{personId:u.personId},include:{classGroup:true},orderBy:{classDate:'desc'},take:200}),
      this.prisma.grade.findMany({where:{personId:u.personId},include:{classGroup:true},orderBy:{date:'desc'},take:200}),
      this.prisma.serviceRequest.findMany({where:{personId:u.personId},orderBy:{createdAt:'desc'},take:200}),
      this.prisma.application.findMany({where:{personId:u.personId},include:{vacancy:{include:{company:true}}},orderBy:{createdAt:'desc'},take:200}),
    ]);
    const [justifications,docs] = await Promise.all([
      this.prisma.absenceJustification.findMany({where:{personId:u.personId},orderBy:{createdAt:'desc'},take:100}),
      this.prisma.document.findMany({where:{personId:u.personId},select:{id:true,type:true,fileName:true,version:true,createdAt:true},orderBy:{createdAt:'desc'},take:100}),
    ]);
    return {profile,enrollments,contracts,attendance,grades,requests,applications,justifications,documents:docs};
  }

  @Get('candidate') @Roles(UserRole.CANDIDATE)
  async candidate(@CurrentUser() user:any){
    const u=await this.prisma.user.findUniqueOrThrow({where:{id:user.sub}});
    if(!u.personId)return {profile:null,applications:[],notice:'Conta sem vinculo validado de pessoa.'};
    const [profile,applications]=await Promise.all([
      this.prisma.person.findUnique({where:{id:u.personId},select:{id:true,fullName:true,email:true}}),
      this.prisma.application.findMany({where:{personId:u.personId},include:{vacancy:{select:{id:true,title:true}}},take:100})
    ]);
    return {profile,applications};
  }

  @Get('guardian') @Roles(UserRole.LEGAL_GUARDIAN)
  async guardian(@CurrentUser() user:any){
    // Never infer access to a minor from surname, CPF or email. Requires audited linkage.
    return {user:{name:user.name},students:[],notice:'A vinculacao comprovada ao menor ainda nao esta habilitada. Nenhum dado de aluno foi exposto.'};
  }

  @Get('company') @Roles(UserRole.COMPANY)
  async company(@CurrentUser() user:any){
    const u=await this.prisma.user.findUniqueOrThrow({where:{id:user.sub}});
    if(!u.companyId)return {company:null,vacancies:[],contracts:[],financialTitles:[]};
    const [company,vacancies,contracts,financialTitles]=await Promise.all([
      this.prisma.company.findUnique({where:{id:u.companyId}}),
      this.prisma.vacancy.findMany({where:{companyId:u.companyId},include:{_count:{select:{applications:true}}},orderBy:{createdAt:'desc'}}),
      this.prisma.contract.findMany({where:{companyId:u.companyId},include:{person:true,course:true},orderBy:{createdAt:'desc'}}),
      this.prisma.financialTitle.findMany({where:{companyId:u.companyId},include:{payments:true},orderBy:{dueDate:'desc'}}),
    ]);
    const internships=await this.prisma.internship.findMany({where:{contract:{companyId:u.companyId}},include:{contract:{include:{person:true}}},take:100});
    return {company,vacancies,contracts,financialTitles,internships};
  }

  @Get('professor') @Roles(UserRole.PROFESSOR)
  async professor(@CurrentUser() user: any) {
    const assignments = await this.prisma.teacherAssignment.findMany({
      where: { userId: user.sub },
      include: { classGroup: { include: {
        course: true,
        enrollments: { where: { status: 'ACTIVE' }, include: { person: { select: { id: true, fullName: true } } } },
      } } },
      orderBy: { assignedAt: 'desc' },
    });
    return { user: { id: user.sub, name: user.name, email: user.email },
      classGroups: assignments.map(a => ({ id: a.classGroup.id, name: a.classGroup.name,
        course: a.classGroup.course?.name, people: a.classGroup.enrollments.map(e => e.person) })) };
  }

  @Get('professor/attendance') @Roles(UserRole.PROFESSOR)
  async professorAttendance(@CurrentUser() user: any, @Query('classGroupId') groupId: string, @Query('classDate') date?: string) {
    const allowed = await this.prisma.teacherAssignment.findUnique({ where: { userId_classGroupId: { userId: user.sub, classGroupId: groupId } } });
    if (!allowed) throw new ForbiddenException('Professor nao vinculado a turma');
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BadRequestException('Data invalida');
    return this.prisma.attendance.findMany({ where: { classGroupId: groupId, ...(date ? { classDate: new Date(date) } : {}) }, select: {
      id: true, personId: true, classDate: true, sessionKey: true, present: true, justified: true, reason: true,
    }, orderBy: { classDate: 'desc' }, take: 500 });
  }

  @Post('professor/attendance') @Roles(UserRole.PROFESSOR)
  async registerAttendance(@CurrentUser() user: any, @Body() dto: TeacherAttendanceDto) {
    const assignment = await this.prisma.teacherAssignment.findUnique({
      where: { userId_classGroupId: { userId: user.sub, classGroupId: dto.classGroupId } },
    });
    if (!assignment) throw new ForbiddenException('Professor nao vinculado a turma');
    const enrolled = await this.prisma.enrollment.findFirst({
      where: { personId: dto.personId, classGroupId: dto.classGroupId, status: 'ACTIVE' },
    });
    if (!enrolled) throw new BadRequestException('Aluno nao esta matriculado nesta turma');
    const classDate = new Date(dto.classDate);
    if ((enrolled.rosterStartDate && classDate < enrolled.rosterStartDate) ||
        (enrolled.rosterEndDate && classDate > enrolled.rosterEndDate)) {
      throw new BadRequestException('Data da chamada fora do periodo de enturmacao');
    }
    const sessionKey = dto.sessionKey || 'turn';
    const attendance = await this.prisma.attendance.upsert({
      where: { personId_classGroupId_classDate_sessionKey: { personId: dto.personId, classGroupId: dto.classGroupId, classDate, sessionKey } },
      update: { present: dto.present, justified: dto.justified ?? false, reason: dto.reason, legacyCode: dto.present ? 'P' : dto.justified ? 'FJ' : 'F' },
      create: { personId: dto.personId, classGroupId: dto.classGroupId, classDate, sessionKey,
        present: dto.present, justified: dto.justified ?? false, reason: dto.reason, legacyCode: dto.present ? 'P' : dto.justified ? 'FJ' : 'F' },
    });
    await this.audit.log({ userId: user.sub, action: 'REGISTER_ATTENDANCE', entity: 'Attendance', entityId: attendance.id,
      metadata: { classGroupId: dto.classGroupId, classDate: dto.classDate } });
    return attendance;
  }

  @Get('supervisor') @Roles(UserRole.INTERNSHIP_SUPERVISOR)
  async supervisor(@CurrentUser() user:any){
    const u=await this.prisma.user.findUniqueOrThrow({where:{id:user.sub}});
    const internships=u.companyId?await this.prisma.internship.findMany({where:{contract:{companyId:u.companyId},OR:[{supervisorEmail:u.email},{supervisorName:u.name}]},include:{contract:{include:{person:true,company:true}}},orderBy:{createdAt:'desc'}}):[];
    const reports=await this.prisma.internshipReport.findMany({where:{internshipId:{in:internships.map(item=>item.id)}},orderBy:{createdAt:'desc'},take:100});
    return {user:{id:u.id,name:u.name,email:u.email},internships,reports};
  }

  @Post('student/requests') @Roles(UserRole.STUDENT)
  async studentRequest(@CurrentUser() user:any,@Body() dto: StudentRequestDto){
    const account=await this.prisma.user.findUniqueOrThrow({where:{id:user.sub}});
    if(!account.personId) throw new ForbiddenException('Conta sem vinculo com cadastro de pessoa');
    const record=await this.prisma.serviceRequest.create({data:{personId:account.personId,type:dto.type,description:dto.description,status:'OPEN'}});
    await this.audit.log({userId:user.sub,action:'STUDENT_REQUEST',entity:'ServiceRequest',entityId:record.id});
    return record;
  }

  @Patch('student/profile') @Roles(UserRole.STUDENT)
  async studentProfile(@CurrentUser() user:any,@Body() dto:StudentProfileDto){
    const account=await this.prisma.user.findUniqueOrThrow({where:{id:user.sub}});
    if(!account.personId) throw new ForbiddenException();
    const data:any={};
    if(dto.phone!==undefined)data.phone=dto.phone;
    if(dto.secondaryPhone!==undefined)data.secondaryPhone=dto.secondaryPhone;
    if(dto.email!==undefined)data.email=dto.email;
    if(!Object.keys(data).length)throw new BadRequestException('Nenhuma alteracao informada');
    const record=await this.prisma.person.update({where:{id:account.personId},data});
    await this.audit.log({userId:user.sub,action:'STUDENT_EDIT_CONTACT',entity:'Person',entityId:record.id,metadata:{fields:Object.keys(data)}});
    return {id:record.id,fullName:record.fullName,email:record.email,phone:record.phone,secondaryPhone:record.secondaryPhone};
  }

  @Post('student/applications') @Roles(UserRole.STUDENT)
  async studentApply(@CurrentUser() user:any,@Body() dto:StudentApplyDto){
    const account=await this.prisma.user.findUniqueOrThrow({where:{id:user.sub}});
    if(!account.personId)throw new ForbiddenException('Conta sem pessoa vinculada');
    const vacancy=await this.prisma.vacancy.findUnique({where:{id:dto.vacancyId}});
    if(!vacancy||vacancy.status!=='ACTIVE')throw new BadRequestException('Vaga indisponivel');
    const candidate=await this.prisma.application.upsert({where:{vacancyId_personId:{vacancyId:vacancy.id,personId:account.personId}},update:{},create:{vacancyId:vacancy.id,personId:account.personId,status:'OPEN'}});
    await this.audit.log({userId:user.sub,action:'STUDENT_APPLY',entity:'Application',entityId:candidate.id});
    return candidate;
  }

  @Get('student/vacancies') @Roles(UserRole.STUDENT)
  studentVacancies(){return this.prisma.vacancy.findMany({where:{status:'ACTIVE'},include:{company:{select:{tradeName:true,legalName:true}}},orderBy:{createdAt:'desc'},take:50});}

  @Post('student/absence-justifications') @Roles(UserRole.STUDENT)
  async studentJustification(@CurrentUser() user:any,@Body() dto:StudentJustificationDto){
    const account=await this.prisma.user.findUniqueOrThrow({where:{id:user.sub}});
    if(!account.personId)throw new ForbiddenException();
    const record=await this.prisma.absenceJustification.create({data:{personId:account.personId,reason:dto.reason,status:'OPEN'}});
    await this.audit.log({userId:user.sub,action:'STUDENT_ABSENCE_JUSTIFICATION',entity:'AbsenceJustification',entityId:record.id});
    return record;
  }

  @Post('company/vacancies') @Roles(UserRole.COMPANY)
  async companyVacancy(@CurrentUser() user:any,@Body() dto:CompanyVacancyDto){
    const account=await this.prisma.user.findUniqueOrThrow({where:{id:user.sub}});
    if(!account.companyId)throw new ForbiddenException('Conta sem empresa vinculada');
    const record=await this.prisma.vacancy.create({data:{companyId:account.companyId,title:dto.title,profile:dto.profile,quantity:dto.quantity??1,city:dto.city,status:'PENDING'}});
    await this.audit.log({userId:user.sub,action:'COMPANY_REQUEST_VACANCY',entity:'Vacancy',entityId:record.id});
    return record;
  }

  @Post('supervisor/reports') @Roles(UserRole.INTERNSHIP_SUPERVISOR)
  async supervisorReport(@CurrentUser() user:any,@Body() dto:SupervisorReportDto){
    const account=await this.prisma.user.findUniqueOrThrow({where:{id:user.sub}});
    if(!account.companyId)throw new ForbiddenException();
    const internship=await this.prisma.internship.findUnique({where:{id:dto.internshipId},include:{contract:{select:{companyId:true}}}});
    if(!internship||internship.contract.companyId!==account.companyId||(internship.supervisorEmail!==account.email && internship.supervisorName!==account.name))throw new ForbiddenException('Estagio nao atribuido a este supervisor');
    const start=new Date(dto.periodStart),end=new Date(dto.periodEnd);
    if(end<start)throw new BadRequestException('Periodo invalido');
    const supervisor=await this.prisma.internshipSupervisor.findFirst({where:{userId:user.sub,companyId:account.companyId}});
    const record=await this.prisma.internshipReport.create({data:{internshipId:dto.internshipId,supervisorId:supervisor?.id,kind:dto.kind,periodStart:start,periodEnd:end,content:dto.content,status:'OPEN'}});
    await this.audit.log({userId:user.sub,action:'SUPERVISOR_REPORT',entity:'InternshipReport',entityId:record.id});
    return record;
  }

  @Get('messages')
  async messages(@CurrentUser() user:any){return this.prisma.portalMessage.findMany({where:{recipientId:user.sub},select:{id:true,subject:true,body:true,readAt:true,channel:true,createdAt:true},orderBy:{createdAt:'desc'},take:100});}
  @Post('messages/:id/read')
  async readMessage(@CurrentUser() user:any,@Param('id') id:string){
    const record=await this.prisma.portalMessage.findUnique({where:{id}});
    if(!record||record.recipientId!==user.sub)throw new ForbiddenException();
    return this.prisma.portalMessage.update({where:{id},data:{readAt:record.readAt||new Date()}});
  }

}
