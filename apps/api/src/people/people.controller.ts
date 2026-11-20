import { PatchFieldsPipe } from '../common/patch-fields.pipe.js';
import { UserRole } from '../generated/prisma/client.js';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '../common/auth.guard.js'; import { DepartmentOnly } from '../common/department-only.decorator.js'; import { CurrentUser } from '../common/current-user.decorator.js';
import { PrismaService } from '../common/prisma.service.js'; import { AuditService } from '../common/audit.service.js'; import { clean, toDate } from '../common/crud.util.js'; import { parsePage,allowedStatus,compactQuery } from '../common/pagination.js';
class PersonDto {
 @IsString() fullName!: string; @IsOptional() @IsString() socialName?: string; @IsOptional() @IsString() cpf?: string; @IsOptional() @IsString() rg?: string;
 @IsOptional() @IsString() birthDate?: string; @IsOptional() @IsString() sex?: string; @IsOptional() @IsEmail() email?: string; @IsOptional() @IsString() phone?: string;
 @IsOptional() @IsString() secondaryPhone?: string; @IsOptional() @IsString() zipCode?: string; @IsOptional() @IsString() address?: string; @IsOptional() @IsString() addressNumber?: string;
 @IsOptional() @IsString() addressExtra?: string; @IsOptional() @IsString() district?: string; @IsOptional() @IsString() city?: string; @IsOptional() @IsString() state?: string;
 @IsOptional() @IsString() motherName?: string; @IsOptional() @IsString() fatherName?: string; @IsOptional() @IsString() legalGuardian?: string; @IsOptional() @IsString() guardianCpf?: string; @IsOptional() @IsEmail() guardianEmail?: string;
}
@Controller('people') @DepartmentOnly(UserRole.SECRETARY,UserRole.CONTRACTS,UserRole.TRIAGE,UserRole.SOCIAL_SERVICE,UserRole.RECEPTION,UserRole.COMMERCIAL,UserRole.HR)
export class PeopleController {
 constructor(private prisma: PrismaService, private audit: AuditService) {}
 @Get() async list(@Query('q')q='',@Query('status')status='',@Query('paged')paged='',@Query('page')page='1',@Query('pageSize')pageSize='25'){
  const term=compactQuery(q),state=allowedStatus(status,['ACTIVE','INACTIVE','PENDING','ARCHIVED']);
  const where:any={...(state?{status:state}:{}),...(term?{OR:[{fullName:{contains:term,mode:'insensitive'}},{cpf:{contains:term}},{email:{contains:term,mode:'insensitive'}}]}:{})};
  if(paged==='1'){const opts=parsePage(page,pageSize);const [items,total]=await Promise.all([this.prisma.person.findMany({where,orderBy:{fullName:'asc'},skip:opts.skip,take:opts.take}),this.prisma.person.count({where})]);return {items,total,page:opts.page,pageSize:opts.pageSize};}
  return this.prisma.person.findMany({where,orderBy:{fullName:'asc'},take:200});
 }
 /** Lista do domínio Alunos: exclui pessoas vinculadas a contas internas de colaboradores. */
 @Get('students') async listStudents(@Query('q')q='',@Query('status')status='',@Query('paged')paged='',@Query('page')page='1',@Query('pageSize')pageSize='25'){
  const term=compactQuery(q),state=allowedStatus(status,['ACTIVE','INACTIVE','PENDING','ARCHIVED']);
  const where:any={AND:[{NOT:{users:{some:{role:{not:UserRole.STUDENT}}}}}],...(state?{status:state}:{}),...(term?{OR:[{fullName:{contains:term,mode:'insensitive'}},{cpf:{contains:term}},{email:{contains:term,mode:'insensitive'}}]}:{})};
  if(paged==='1'){const opts=parsePage(page,pageSize);const [items,total]=await Promise.all([this.prisma.person.findMany({where,orderBy:{fullName:'asc'},skip:opts.skip,take:opts.take}),this.prisma.person.count({where})]);return {items,total,page:opts.page,pageSize:opts.pageSize};}
  return this.prisma.person.findMany({where,orderBy:{fullName:'asc'},take:200});
 }
 @Get(':id') get(@Param('id') id:string) { return this.prisma.person.findUniqueOrThrow({where:{id},include:{enrollments:{include:{course:true,classGroup:true}},contracts:true}}); }
 @Post() async create(@Body() dto:PersonDto,@CurrentUser() u:any){ const data:any=clean({...dto,birthDate:toDate(dto.birthDate)}); const row=await this.prisma.person.create({data}); await this.audit.log({userId:u.sub,action:'CREATE',entity:'Person',entityId:row.id}); return row; }
 @Patch(':id') async update(@Param('id') id:string,@Body(new PatchFieldsPipe(['fullName','socialName','cpf','rg','birthDate','sex','email','phone','secondaryPhone','zipCode','address','addressNumber','addressExtra','district','city','state','motherName','fatherName','legalGuardian','guardianCpf','guardianEmail','status'],[],[],{status:['ACTIVE','INACTIVE','PENDING','ARCHIVED']})) dto:Partial<PersonDto>,@CurrentUser() u:any){ const data:any=clean({...dto,birthDate:toDate(dto.birthDate)}); const row=await this.prisma.person.update({where:{id},data}); await this.audit.log({userId:u.sub,action:'UPDATE',entity:'Person',entityId:id}); return row; }
 @Delete(':id') async archive(@Param('id') id:string,@CurrentUser() u:any){ const row=await this.prisma.person.update({where:{id},data:{status:'ARCHIVED'}}); await this.audit.log({userId:u.sub,action:'ARCHIVE',entity:'Person',entityId:id}); return row; }
}
