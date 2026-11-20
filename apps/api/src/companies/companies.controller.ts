import { PatchFieldsPipe } from '../common/patch-fields.pipe.js';
import { UserRole } from '../generated/prisma/client.js';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString } from 'class-validator'; import { AuthGuard } from '../common/auth.guard.js'; import { DepartmentOnly } from '../common/department-only.decorator.js'; import { CurrentUser } from '../common/current-user.decorator.js';
import { PrismaService } from '../common/prisma.service.js'; import { AuditService } from '../common/audit.service.js'; import { clean } from '../common/crud.util.js'; import { parsePage,allowedStatus,compactQuery } from '../common/pagination.js';
class CompanyDto { @IsString() legalName!:string; @IsOptional() @IsString() cnpj?:string; @IsOptional() @IsString() tradeName?:string; @IsOptional() @IsEmail() email?:string; @IsOptional() @IsEmail() financeEmail?:string; @IsOptional() @IsString() phone?:string; @IsOptional() @IsString() zipCode?:string; @IsOptional() @IsString() address?:string; @IsOptional() @IsString() addressNumber?:string; @IsOptional() @IsString() district?:string; @IsOptional() @IsString() city?:string; @IsOptional() @IsString() state?:string; @IsOptional() @IsString() legalRep?:string; }
@Controller('companies') @DepartmentOnly(UserRole.CONTRACTS,UserRole.FINANCE,UserRole.COMMERCIAL,UserRole.HR)
export class CompaniesController { constructor(private prisma:PrismaService,private audit:AuditService){}
 @Get() async list(@Query('q')q='',@Query('status')status='',@Query('paged')paged='',@Query('page')page='1',@Query('pageSize')pageSize='25'){
  const term=compactQuery(q),state=allowedStatus(status,['ACTIVE','INACTIVE','PENDING','ARCHIVED']);
  const where:any={...(state?{status:state}:{}),...(term?{OR:[{legalName:{contains:term,mode:'insensitive'}},{tradeName:{contains:term,mode:'insensitive'}},{cnpj:{contains:term}}]}:{})};
  if(paged==='1'){const opts=parsePage(page,pageSize);const [items,total]=await Promise.all([this.prisma.company.findMany({where,orderBy:{legalName:'asc'},skip:opts.skip,take:opts.take}),this.prisma.company.count({where})]);return {items,total,page:opts.page,pageSize:opts.pageSize};}
  return this.prisma.company.findMany({where,orderBy:{legalName:'asc'},take:200});
 }
 @Get(':id') get(@Param('id') id:string){return this.prisma.company.findUniqueOrThrow({where:{id},include:{contracts:true,vacancies:true}});}
 @Post() async create(@Body() dto:CompanyDto,@CurrentUser()u:any){const row=await this.prisma.company.create({data:clean(dto) as any});await this.audit.log({userId:u.sub,action:'CREATE',entity:'Company',entityId:row.id});return row;}
 @Patch(':id') async update(@Param('id')id:string,@Body(new PatchFieldsPipe(['legalName','tradeName','cnpj','email','financeEmail','phone','zipCode','address','addressNumber','district','city','state','legalRep','status'],[],[],{status:['ACTIVE','INACTIVE','PENDING','ARCHIVED']}))dto:Partial<CompanyDto>,@CurrentUser()u:any){const row=await this.prisma.company.update({where:{id},data:clean(dto) as any});await this.audit.log({userId:u.sub,action:'UPDATE',entity:'Company',entityId:id});return row;}
 @Delete(':id') async archive(@Param('id')id:string,@CurrentUser()u:any){const row=await this.prisma.company.update({where:{id},data:{status:'ARCHIVED'}});await this.audit.log({userId:u.sub,action:'ARCHIVE',entity:'Company',entityId:id});return row;}
}
