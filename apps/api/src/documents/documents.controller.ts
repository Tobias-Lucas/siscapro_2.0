import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Response } from 'express';
import { IsOptional, IsString } from 'class-validator';
import { UserRole } from '../generated/prisma/client.js';
import { DepartmentOnly } from '../common/department-only.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
const documentDir = process.env.DOCUMENTS_DIR || '/app/private-documents';
const accepted = new Set(['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
const safeExtension=(name:string)=>['.pdf','.jpg','.jpeg','.png','.docx'].includes(path.extname(name).toLowerCase())?path.extname(name).toLowerCase():'.dat';
const disk = diskStorage({ destination(_req,_file,cb){ fs.mkdirSync(documentDir,{recursive:true,mode:0o700});cb(null,documentDir); }, filename(_req,file,cb){cb(null,crypto.randomUUID()+safeExtension(file.originalname));} });
class DocumentDto { @IsString() type!:string; @IsString() fileName!:string; @IsString() storageKey!:string; @IsOptional() @IsString() mimeType?:string; @IsOptional() @IsString() checksum?:string; @IsOptional() @IsString() personId?:string; @IsOptional() @IsString() contractId?:string; }
class UploadDto { @IsString() type!:string; @IsOptional() @IsString() personId?:string; @IsOptional() @IsString() contractId?:string; }

@Controller('documents')
@DepartmentOnly(UserRole.CONTRACTS,UserRole.SECRETARY,UserRole.HR,UserRole.SOCIAL_SERVICE)
export class DocumentsController {
 constructor(private prisma:PrismaService,private audit:AuditService){}
 @Get() list(@Query('personId')personId?:string,@Query('contractId')contractId?:string){return this.prisma.document.findMany({where:{...(personId?{personId}:{}),...(contractId?{contractId}:{})},include:{person:{select:{id:true,fullName:true}},contract:{select:{id:true,number:true}}},orderBy:{createdAt:'desc'},take:500});}
 @Post() async metadata(@Body()d:DocumentDto,@CurrentUser()user:any){const r=await this.prisma.document.create({data:d});await this.audit.log({userId:user.sub,action:'REGISTER_DOCUMENT_METADATA',entity:'Document',entityId:r.id});return r;}
 @Post('upload')
 @UseInterceptors(FileInterceptor('file',{storage:disk,limits:{fileSize:12*1024*1024},fileFilter(_req,file,cb){if(!accepted.has(file.mimetype)||safeExtension(file.originalname)==='.dat')return cb(new BadRequestException('Tipo de arquivo nao permitido') as any,false);cb(null,true);}}))
 async upload(@UploadedFile() file:any,@Body()data:UploadDto,@CurrentUser()user:any){
  if(!file)throw new BadRequestException('Envie um arquivo valido');
  if(!data.type || data.type.length>100){fs.unlinkSync(file.path);throw new BadRequestException('Informe um tipo documental valido');}
  const buffer=fs.readFileSync(file.path);const checksum=crypto.createHash('sha256').update(buffer).digest('hex');
  const record=await this.prisma.document.create({data:{type:data.type,fileName:path.basename(file.originalname).slice(0,220),storageKey:'upload:'+path.basename(file.filename),mimeType:file.mimetype,checksum,personId:data.personId||null,contractId:data.contractId||null}});
  await this.audit.log({userId:user.sub,action:'UPLOAD_DOCUMENT',entity:'Document',entityId:record.id,metadata:{fileSize:file.size,checksum}});
  return {id:record.id,type:record.type,fileName:record.fileName,checksum};
 }
 @Get(':id/download')
 async download(@Param('id')id:string,@Res()res:Response){
  const d=await this.prisma.document.findUnique({where:{id}});
  if(!d||!d.storageKey.startsWith('upload:'))throw new NotFoundException('Arquivo ainda nao disponivel neste ambiente');
  const basename=d.storageKey.slice('upload:'.length);
  if(!/^[a-f0-9-]{36}\.(pdf|jpe?g|png|docx)$/.test(basename))throw new NotFoundException();
  const target=path.join(documentDir,basename);
  if(!fs.existsSync(target))throw new NotFoundException('Arquivo nao localizado');
  return res.download(target,d.fileName);
 }
}
