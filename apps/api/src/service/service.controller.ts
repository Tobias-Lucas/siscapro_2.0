import { PatchFieldsPipe } from '../common/patch-fields.pipe.js';
import { UserRole } from '../generated/prisma/client.js';
import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { DepartmentOnly } from '../common/department-only.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import { clean,toDate } from '../common/crud.util.js';
import { parsePage,allowedStatus,compactQuery } from '../common/pagination.js';
class RequestDto { @IsString() type!:string; @IsOptional() @IsString() personId?:string; @IsOptional() @IsString() description?:string; @IsOptional() @IsString() response?:string; @IsOptional() @IsString() dueDate?:string; @IsOptional() @IsString() status?:any; }
class InteractionDto {
 @IsString() @MinLength(3) body!:string;
 @IsOptional() @IsIn(['OPEN','IN_PROGRESS','WAITING','DONE','CANCELLED']) status?:'OPEN'|'IN_PROGRESS'|'WAITING'|'DONE'|'CANCELLED';
}
@Controller('service') @DepartmentOnly(UserRole.SOCIAL_SERVICE,UserRole.RECEPTION,UserRole.SECRETARY)
export class ServiceController {
 constructor(private prisma:PrismaService,private audit:AuditService){}
 @Get('requests') async list(@Query('status')status='',@Query('q')q='',@Query('paged')paged='',@Query('page')page='1',@Query('pageSize')pageSize='25'){
  const term=compactQuery(q),state=allowedStatus(status,['OPEN','IN_PROGRESS','WAITING','DONE','CANCELLED']);
  const where:any={...(state?{status:state}:{}),...(term?{OR:[{type:{contains:term,mode:'insensitive'}},{description:{contains:term,mode:'insensitive'}},{person:{is:{fullName:{contains:term,mode:'insensitive'}}}}]}:{})};
  if(paged==='1'){const opts=parsePage(page,pageSize);const [items,total]=await Promise.all([this.prisma.serviceRequest.findMany({where,include:{person:true},orderBy:{createdAt:'desc'},skip:opts.skip,take:opts.take}),this.prisma.serviceRequest.count({where})]);return {items,total,page:opts.page,pageSize:opts.pageSize};}
  return this.prisma.serviceRequest.findMany({where,include:{person:true},orderBy:{createdAt:'desc'},take:500});
 }
 @Post('requests') async create(@Body()d:RequestDto,@CurrentUser()u:any){const r=await this.prisma.serviceRequest.create({data:clean({...d,dueDate:toDate(d.dueDate)}) as any});await this.audit.log({userId:u.sub,action:'CREATE',entity:'ServiceRequest',entityId:r.id});return r;}
 @Patch('requests/:id') async update(@Param('id')id:string,@Body(new PatchFieldsPipe(['type','personId','description','response','dueDate','status'],[],[],{status:['OPEN','IN_PROGRESS','WAITING','DONE','CANCELLED']}))d:Partial<RequestDto>,@CurrentUser()u:any){const r=await this.prisma.serviceRequest.update({where:{id},data:clean({...d,dueDate:toDate(d.dueDate)}) as any});await this.audit.log({userId:u.sub,action:'UPDATE',entity:'ServiceRequest',entityId:id});return r;}
 /** O autor é sempre o usuário autenticado; não pode ser indicado pelo navegador. */
 @Post('requests/:id/interactions') async addInteraction(@Param('id')id:string,@Body()dto:InteractionDto,@CurrentUser()u:any){
  const body=String(dto.body||'').trim();if(body.length<3||body.length>5000)throw new BadRequestException('A descrição deve conter entre 3 e 5.000 caracteres');
  const result=await this.prisma.$transaction(async tx=>{
   await tx.serviceRequest.findUniqueOrThrow({where:{id},select:{id:true}});
   const interaction=await tx.serviceInteraction.create({data:{requestId:id,authorId:u.sub,body,status:dto.status||'IN_PROGRESS'}});
   if(dto.status)await tx.serviceRequest.update({where:{id},data:{status:dto.status}});
   return interaction;
  });
  await this.audit.log({userId:u.sub,action:'ADD_INTERACTION',entity:'ServiceRequest',entityId:id,metadata:{interactionId:result.id}});
  return result;
 }
}
