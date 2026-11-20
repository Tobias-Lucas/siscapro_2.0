import { PatchFieldsPipe } from '../common/patch-fields.pipe.js';
import { UserRole } from '../generated/prisma/client.js';
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'; import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '../common/auth.guard.js'; import { DepartmentOnly } from '../common/department-only.decorator.js'; import { PrismaService } from '../common/prisma.service.js'; import { clean,toDate } from '../common/crud.util.js'; import { parsePage,allowedStatus,compactQuery } from '../common/pagination.js';
class VacancyDto { @IsString() companyId!:string; @IsString() title!:string; @IsOptional() @IsString() profile?:string; @IsOptional() @IsString() area?:string; @IsOptional() @IsString() activities?:string; @IsOptional() @IsString() city?:string; @IsOptional() @IsString() district?:string; @IsOptional() @IsInt() minAge?:number; @IsOptional() @IsInt() maxAge?:number; @IsOptional() @IsInt() quantity?:number; @IsOptional() @IsNumber() scholarship?:number; @IsOptional() @IsString() expiresAt?:string; }
class ApplicationDto { @IsString() vacancyId!:string; @IsString() personId!:string; @IsOptional() @IsString() status?:any; @IsOptional() @IsString() notes?:string; }
@Controller('recruitment') @DepartmentOnly(UserRole.TRIAGE,UserRole.COMMERCIAL)
export class RecruitmentController { constructor(private prisma:PrismaService){}
 @Get('vacancies') async vacancies(@Query('status')status='',@Query('q')q='',@Query('paged')paged='',@Query('page')page='1',@Query('pageSize')pageSize='25'){
 const term=compactQuery(q),state=allowedStatus(status,['ACTIVE','INACTIVE','PENDING','ARCHIVED']);
 const where:any={...(state?{status:state}:{}),...(term?{OR:[{title:{contains:term,mode:'insensitive'}},{profile:{contains:term,mode:'insensitive'}},{company:{is:{tradeName:{contains:term,mode:'insensitive'}}}}]}:{})};
 const include={company:true,_count:{select:{applications:true}}};
 if(paged==='1'){const opts=parsePage(page,pageSize);const [items,total]=await Promise.all([this.prisma.vacancy.findMany({where,include,orderBy:{createdAt:'desc'},skip:opts.skip,take:opts.take}),this.prisma.vacancy.count({where})]);return {items,total,page:opts.page,pageSize:opts.pageSize};}
 return this.prisma.vacancy.findMany({where,include,orderBy:{createdAt:'desc'},take:300});
 }
 @Post('vacancies') createVacancy(@Body()d:VacancyDto){return this.prisma.vacancy.create({data:clean({...d,expiresAt:toDate(d.expiresAt)}) as any});}
 @Patch('vacancies/:id') updateVacancy(@Param('id')id:string,@Body(new PatchFieldsPipe(['companyId','title','profile','area','activities','city','district','minAge','maxAge','quantity','scholarship','expiresAt','status'],['minAge','maxAge','quantity','scholarship'],[],{status:['OPEN','IN_PROGRESS','WAITING','DONE','CANCELLED','ACTIVE','INACTIVE','PENDING','ARCHIVED']}))d:Partial<VacancyDto>){return this.prisma.vacancy.update({where:{id},data:clean({...d,expiresAt:toDate(d.expiresAt)}) as any});}
 @Get('applications') applications(@Query('vacancyId')vacancyId?:string){return this.prisma.application.findMany({where:vacancyId?{vacancyId}:{},include:{person:true,vacancy:{include:{company:true}}},orderBy:{createdAt:'desc'},take:500});}
 @Post('applications') apply(@Body()d:ApplicationDto){return this.prisma.application.upsert({where:{vacancyId_personId:{vacancyId:d.vacancyId,personId:d.personId}},update:{status:d.status||'OPEN',notes:d.notes},create:d as any});}
 @Patch('applications/:id') updateApplication(@Param('id')id:string,@Body(new PatchFieldsPipe(['status','notes'],[],[],{status:['OPEN','IN_PROGRESS','WAITING','DONE','CANCELLED','ACTIVE','INACTIVE','PENDING','ARCHIVED']}))d:Partial<ApplicationDto>){return this.prisma.application.update({where:{id},data:clean(d) as any});}
}
