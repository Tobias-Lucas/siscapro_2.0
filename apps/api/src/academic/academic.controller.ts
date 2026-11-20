import { PatchFieldsPipe } from '../common/patch-fields.pipe.js';
import { AccessService } from '../iam/access.service.js';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../generated/prisma/client.js';
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { AuthGuard } from '../common/auth.guard.js'; import { DepartmentOnly } from '../common/department-only.decorator.js'; import { CurrentUser } from '../common/current-user.decorator.js'; import { PrismaService } from '../common/prisma.service.js'; import { AuditService } from '../common/audit.service.js'; import { clean, toDate } from '../common/crud.util.js'; import { parsePage,allowedStatus,compactQuery } from '../common/pagination.js';
class CourseDto { @IsString() name!:string; @IsOptional() @IsString() code?:string; @IsOptional() @IsString() modality?:string; @IsOptional() @IsInt() workload?:number; @IsOptional() @IsString() theoryWorkloadRaw?:string; @IsOptional() @IsString() practiceWorkloadRaw?:string; @IsOptional() @IsString() authorizationProtocol?:string; }
class TeacherAssignmentDto { @IsString() userId!:string; @IsString() classGroupId!:string; }
class GroupDto { @IsString() name!:string; @IsOptional() @IsString() code?:string; @IsOptional() @IsString() type?:string; @IsOptional() @IsString() courseId?:string; @IsOptional() @IsString() unit?:string; @IsOptional() @IsString() room?:string; @IsOptional() @IsString() startDate?:string; @IsOptional() @IsString() endDate?:string; }
class EnrollmentDto { @IsString() personId!:string; @IsOptional() @IsString() courseId?:string; @IsOptional() @IsString() classGroupId?:string; @IsOptional() @IsString() companyId?:string; @IsOptional() @IsString() contractId?:string; @IsOptional() @IsDateString() rosterStartDate?:string; @IsOptional() @IsDateString() rosterEndDate?:string; @IsOptional() @IsString() returnDay?:string; @IsOptional() @IsDateString() startDate?:string; @IsOptional() @IsDateString() endDate?:string; }
const booleanFromForm=({value}:{value:unknown})=>value==='true'||value==='1'||value===true?true:value==='false'||value==='0'||value===false?false:value;
class AttendanceDto { @IsString() personId!:string; @IsString() classGroupId!:string; @IsDateString() classDate!:string; @IsOptional() @IsString() sessionKey?:string; @Transform(booleanFromForm) @IsBoolean() present!:boolean; @IsOptional() @Transform(booleanFromForm) @IsBoolean() justified?:boolean; @IsOptional() @IsString() reason?:string; }
class GradeDto { @IsString() personId!:string; @IsString() classGroupId!:string; @IsString() label!:string; @IsNumber() @Min(0) value!:number; @IsOptional() @IsNumber() @Min(0) maxValue?:number; }
@Controller('academic') @DepartmentOnly(UserRole.SECRETARY)
export class AcademicController { constructor(private prisma:PrismaService,private audit:AuditService,private access:AccessService){}
 /** New records must not introduce invalid references. Existing legacy anomalies remain untouched. */
 private async ensureEnrollmentLinks(personId:string,courseId?:string|null,classGroupId?:string|null,contractId?:string|null,ignoreId?:string){
  if(!courseId&&!classGroupId)throw new BadRequestException('Informe um curso ou uma turma');
  if(classGroupId&&courseId){
   const group=await this.prisma.classGroup.findUnique({where:{id:classGroupId},select:{courseId:true,courseLinks:{where:{courseId},select:{id:true},take:1}}});
   if(!group)throw new BadRequestException('Turma nao encontrada');
   if(group.courseId!==courseId&&!group.courseLinks.length)throw new BadRequestException('Curso nao vinculado a turma. Cadastre primeiro o relacionamento em Secretaria / Cursos por turma.');
  }
  if(contractId){
   const contract=await this.prisma.contract.findUnique({where:{id:contractId},select:{personId:true}});
   if(!contract||contract.personId!==personId)throw new BadRequestException('O contrato informado nao pertence ao aluno');
  }
  const existing=await this.prisma.enrollment.findFirst({where:{personId,courseId:courseId||null,classGroupId:classGroupId||null,status:'ACTIVE',...(ignoreId?{id:{not:ignoreId}}:{})},select:{id:true}});
  if(existing)throw new BadRequestException('Ja existe matricula ativa deste aluno para a mesma combinacao de curso e turma');
 }
 @Get('course-options') courseOptions(){
  return this.prisma.course.findMany({select:{id:true,name:true,code:true},orderBy:{name:'asc'},take:5000});
 }
 @Get('group-options') groupOptions(){
  return this.prisma.classGroup.findMany({select:{id:true,name:true,unit:true},orderBy:{name:'asc'},take:5000});
 }
 @Get('courses') async courses(@Query('q')q='',@Query('status')status='',@Query('paged')paged='',@Query('page')page='1',@Query('pageSize')pageSize='25'){
 const term=compactQuery(q),state=allowedStatus(status,['ACTIVE','INACTIVE','PENDING','ARCHIVED']);
 const where:any={...(state?{status:state}:{}),...(term?{OR:[{name:{contains:term,mode:'insensitive'}},{code:{contains:term,mode:'insensitive'}}]}:{})};
 if(paged==='1'){const opts=parsePage(page,pageSize);const [items,total]=await Promise.all([this.prisma.course.findMany({where,orderBy:{name:'asc'},skip:opts.skip,take:opts.take}),this.prisma.course.count({where})]);return {items,total,page:opts.page,pageSize:opts.pageSize};}
 return this.prisma.course.findMany({where,orderBy:{name:'asc'},take:300});
 }
 @Post('courses') async createCourse(@Body()d:CourseDto,@CurrentUser()u:any){const r=await this.prisma.course.create({data:clean(d) as any});await this.audit.log({userId:u.sub,action:'CREATE',entity:'Course',entityId:r.id});return r;}
 @Patch('courses/:id') updateCourse(@Param('id')id:string,@Body(new PatchFieldsPipe(['name','code','modality','workload','theoryWorkloadRaw','practiceWorkloadRaw','authorizationProtocol','status'],['workload'],[],{status:['ACTIVE','INACTIVE','PENDING','ARCHIVED']}))d:Partial<CourseDto>){return this.prisma.course.update({where:{id},data:clean(d) as any});}
 @Get('groups') async groups(@Query('courseId')courseId='',@Query('q')q='',@Query('status')status='',@Query('paged')paged='',@Query('page')page='1',@Query('pageSize')pageSize='25'){
 const term=compactQuery(q),state=allowedStatus(status,['ACTIVE','INACTIVE','PENDING','ARCHIVED']);
 const where:any={...(courseId?{courseId}:{}),...(state?{status:state}:{}),...(term?{OR:[{name:{contains:term,mode:'insensitive'}},{unit:{contains:term,mode:'insensitive'}},{course:{is:{name:{contains:term,mode:'insensitive'}}}}]}:{})};
 if(paged==='1'){const opts=parsePage(page,pageSize);const [items,total]=await Promise.all([this.prisma.classGroup.findMany({where,include:{course:true,courseLinks:{include:{course:true}}},orderBy:{name:'asc'},skip:opts.skip,take:opts.take}),this.prisma.classGroup.count({where})]);return {items,total,page:opts.page,pageSize:opts.pageSize};}
 return this.prisma.classGroup.findMany({where,include:{course:true,courseLinks:{include:{course:true}}},orderBy:{name:'asc'},take:300});
 }
 @Post('groups') async createGroup(@Body()d:GroupDto,@CurrentUser()u:any){const r=await this.prisma.classGroup.create({data:clean({...d,startDate:toDate(d.startDate),endDate:toDate(d.endDate)}) as any});await this.audit.log({userId:u.sub,action:'CREATE',entity:'ClassGroup',entityId:r.id});return r;}
 @Patch('groups/:id') updateGroup(@Param('id')id:string,@Body(new PatchFieldsPipe(['name','code','type','courseId','unit','room','startDate','endDate','status'],[],[],{status:['ACTIVE','INACTIVE','PENDING','ARCHIVED']}))d:Partial<GroupDto>){return this.prisma.classGroup.update({where:{id},data:clean({...d,startDate:toDate(d.startDate),endDate:toDate(d.endDate)}) as any});}
 @Get('groups/:id/courses') coursesOfGroup(@Param('id') id: string) {
  return this.prisma.classGroupCourse.findMany({where:{classGroupId:id},include:{course:{select:{id:true,name:true,code:true}}}});
 }
 @Post('groups/:id/courses') async addCourseToGroup(@Param('id') id:string,@Body() data:{courseId:string},@CurrentUser() u:any){
  if(!data?.courseId || typeof data.courseId !== 'string') throw new BadRequestException('Curso obrigatorio');
  const link=await this.prisma.classGroupCourse.upsert({where:{classGroupId_courseId:{classGroupId:id,courseId:data.courseId}},
   create:{classGroupId:id,courseId:data.courseId,evidence:'MANUAL'},update:{}});
  await this.audit.log({userId:u.sub,action:'LINK_GROUP_COURSE',entity:'ClassGroupCourse',entityId:link.id});
  return link;
 }
 @Get('teacher-assignments') assignments(){return this.prisma.teacherAssignment.findMany({include:{user:{select:{id:true,name:true}},classGroup:{select:{id:true,name:true}}},orderBy:{assignedAt:'desc'},take:1500});}
 @Post('teacher-assignments') async assign(@Body()d:TeacherAssignmentDto,@CurrentUser()u:any){const teacher=await this.prisma.user.findUnique({where:{id:d.userId},select:{role:true}});if(teacher?.role!==UserRole.PROFESSOR)throw new BadRequestException('Usuario nao e facilitador');const r=await this.prisma.teacherAssignment.upsert({where:{userId_classGroupId:{userId:d.userId,classGroupId:d.classGroupId}},create:d,update:{}});await this.audit.log({userId:u.sub,action:'ASSIGN_TEACHER',entity:'TeacherAssignment',entityId:r.id});return r;}
 @Delete('teacher-assignments/:id') async unassign(@Param('id')id:string,@CurrentUser()u:any){await this.prisma.teacherAssignment.delete({where:{id}});await this.audit.log({userId:u.sub,action:'UNASSIGN_TEACHER',entity:'TeacherAssignment',entityId:id});return {ok:true};}
 @Get('enrollments') async enrollments(@Query('personId')personId='',@Query('classGroupId')classGroupId='',@Query('q')q='',@Query('status')status='',@Query('paged')paged='',@Query('page')page='1',@Query('pageSize')pageSize='25'){
 const term=compactQuery(q),state=allowedStatus(status,['ACTIVE','INACTIVE','PENDING','ARCHIVED']);
 const where:any={...(personId?{personId}:{}),...(classGroupId?{classGroupId}:{}),...(state?{status:state}:{}),...(term?{OR:[{person:{is:{fullName:{contains:term,mode:'insensitive'}}}},{course:{is:{name:{contains:term,mode:'insensitive'}}}},{classGroup:{is:{name:{contains:term,mode:'insensitive'}}}}]}:{})};
 const include={person:true,course:true,classGroup:true,company:true};
 if(paged==='1'){const opts=parsePage(page,pageSize);const [items,total]=await Promise.all([this.prisma.enrollment.findMany({where,include,orderBy:{createdAt:'desc'},skip:opts.skip,take:opts.take}),this.prisma.enrollment.count({where})]);return {items,total,page:opts.page,pageSize:opts.pageSize};}
 return this.prisma.enrollment.findMany({where,include,orderBy:{createdAt:'desc'},take:500});
 }
 @Post('enrollments') async enroll(@Body()d:EnrollmentDto,@CurrentUser()u:any){
  await this.ensureEnrollmentLinks(d.personId,d.courseId,d.classGroupId,d.contractId);
  const r=await this.prisma.enrollment.create({data:clean({...d,startDate:toDate(d.startDate),endDate:toDate(d.endDate),rosterStartDate:toDate(d.rosterStartDate),rosterEndDate:toDate(d.rosterEndDate)}) as any});
  await this.audit.log({userId:u.sub,action:'CREATE',entity:'Enrollment',entityId:r.id});return r;
 }
 @Patch('enrollments/:id') async editEnrollment(@Param('id')id:string,@Body(new PatchFieldsPipe(['classGroupId','courseId','companyId','contractId','startDate','endDate','rosterStartDate','rosterEndDate','returnDay','status'],[],[],{status:['ACTIVE','INACTIVE','PENDING','ARCHIVED']}))d:Partial<EnrollmentDto>&{status?:string},@CurrentUser()u:any){
  const current=await this.prisma.enrollment.findUniqueOrThrow({where:{id}});
  if(d.classGroupId!==undefined||d.courseId!==undefined||d.contractId!==undefined||d.status==='ACTIVE'&&current.status!=='ACTIVE')
   await this.ensureEnrollmentLinks(current.personId,d.courseId===undefined?current.courseId:d.courseId,d.classGroupId===undefined?current.classGroupId:d.classGroupId,d.contractId===undefined?current.contractId:d.contractId,id);
  const data=clean({...d,startDate:toDate(d.startDate),endDate:toDate(d.endDate),rosterStartDate:toDate(d.rosterStartDate),rosterEndDate:toDate(d.rosterEndDate)});
  const r=await this.prisma.enrollment.update({where:{id},data:data as any});
  await this.audit.log({userId:u.sub,action:'REVIEW_ENROLLMENT',entity:'Enrollment',entityId:id,metadata:{fields:Object.keys(d)}});return r;
 }
 @Get('attendance') async attendance(@Query('classGroupId')classGroupId='',@Query('personId')personId='',@Query('q')q='',@Query('paged')paged='',@Query('page')page='1',@Query('pageSize')pageSize='25'){
  const term=compactQuery(q);const where:any={...(classGroupId?{classGroupId}:{}),...(personId?{personId}:{}),...(term?{OR:[{person:{is:{fullName:{contains:term,mode:'insensitive'}}}},{classGroup:{is:{name:{contains:term,mode:'insensitive'}}}}]}:{})};
  const include={person:true,classGroup:true};
  if(paged==='1'){const opts=parsePage(page,pageSize);const [items,total]=await Promise.all([this.prisma.attendance.findMany({where,include,orderBy:{classDate:'desc'},skip:opts.skip,take:opts.take}),this.prisma.attendance.count({where})]);return {items,total,page:opts.page,pageSize:opts.pageSize};}
  return this.prisma.attendance.findMany({where,include,orderBy:{classDate:'desc'},take:500});
 }
 @Post('attendance') async mark(@Body()d:AttendanceDto,@CurrentUser()u:any){
  const enrolled=await this.prisma.enrollment.findFirst({where:{personId:d.personId,classGroupId:d.classGroupId,status:'ACTIVE'}});
  if(!enrolled) throw new BadRequestException('Aluno nao esta matriculado nesta turma');
  const classDate=new Date(d.classDate);
  if ((enrolled.rosterStartDate && classDate < enrolled.rosterStartDate) || (enrolled.rosterEndDate && classDate > enrolled.rosterEndDate)) throw new BadRequestException('Data fora do periodo de enturmacao');
  const sessionKey=d.sessionKey||'turn';
  if(d.present&&d.justified)throw new BadRequestException('Presenca nao pode ser falta justificada');
  if(d.justified&&(!d.reason||d.reason.trim().length<5))throw new BadRequestException('Informe motivo da justificativa');
  const where={personId_classGroupId_classDate_sessionKey:{personId:d.personId,classGroupId:d.classGroupId,classDate,sessionKey}};
  const previous=await this.prisma.attendance.findUnique({where});
  if(previous&&u.accessMode==='CUSTOM'&&u.role!=='SUPER_ADMIN'){
   const permitted=await this.access.evaluate(u.sub,u.role,u.accessMode,'secretaria.frequencia.corrigir');
   if(!permitted.allowed||permitted.scope!=='GLOBAL')throw new ForbiddenException('Corrigir frequencia exige permissao especifica');
  }
  const next={present:d.present,justified:d.justified??false,reason:d.reason||null,legacyCode:d.present?'P':d.justified?'FJ':'F'};
  const r=await this.prisma.attendance.upsert({where,update:next,create:{personId:d.personId,classGroupId:d.classGroupId,classDate,sessionKey,...next}});
  await this.audit.log({userId:u.sub,action:previous?'ATTENDANCE_CORRECTED':'ATTENDANCE_MARKED',entity:'Attendance',entityId:r.id,metadata:{before:previous?{present:previous.present,justified:previous.justified,reason:previous.reason}:null,after:next}});return r;
 }
 @Get('grades') async grades(@Query('classGroupId')classGroupId='',@Query('personId')personId='',@Query('q')q='',@Query('paged')paged='',@Query('page')page='1',@Query('pageSize')pageSize='25'){
  const term=compactQuery(q);const where:any={...(classGroupId?{classGroupId}:{}),...(personId?{personId}:{}),...(term?{OR:[{label:{contains:term,mode:'insensitive'}},{person:{is:{fullName:{contains:term,mode:'insensitive'}}}},{classGroup:{is:{name:{contains:term,mode:'insensitive'}}}}]}:{})};
  const include={person:true,classGroup:true};
  if(paged==='1'){const opts=parsePage(page,pageSize);const [items,total]=await Promise.all([this.prisma.grade.findMany({where,include,orderBy:{date:'desc'},skip:opts.skip,take:opts.take}),this.prisma.grade.count({where})]);return {items,total,page:opts.page,pageSize:opts.pageSize};}
  return this.prisma.grade.findMany({where,include,orderBy:{date:'desc'},take:500});
 }
 @Post('grades') async grade(@Body()d:GradeDto,@CurrentUser()u:any){const r=await this.prisma.grade.create({data:d as any});await this.audit.log({userId:u.sub,action:'CREATE',entity:'Grade',entityId:r.id});return r;}
}
