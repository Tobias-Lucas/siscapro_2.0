import { BadRequestException, Body, ConflictException, Controller, Param, Post } from '@nestjs/common';
import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ContractStatus, Prisma, UserRole } from '../generated/prisma/client.js';
import { DepartmentOnly } from '../common/department-only.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PrismaService } from '../common/prisma.service.js';
import { AccessService } from '../iam/access.service.js';

const allowed: Record<ContractStatus,ContractStatus[]> = {
  DRAFT: ['PENDING_SIGNATURE','CANCELLED'],
  PENDING_SIGNATURE: ['ACTIVE','CANCELLED'],
  ACTIVE: ['SUSPENDED','TERMINATED'],
  SUSPENDED: ['ACTIVE','TERMINATED'],
  TERMINATED: [], CANCELLED: [],
};
class TransitionDto {
  @IsIn(['PENDING_SIGNATURE','ACTIVE','SUSPENDED','TERMINATED','CANCELLED']) to!:ContractStatus;
  @IsDateString() effectiveAt!:string;
  @IsOptional() @IsString() @MaxLength(3000) reason?:string;
  @IsOptional() @IsBoolean() signedConfirmed?:boolean;
}
class AmendmentDto {
  @IsString() @MinLength(3) @MaxLength(120) type!:string;
  @IsDateString() effectiveAt!:string;
  @IsString() @MinLength(10) @MaxLength(5000) description!:string;
}

/** Audit-ready contract workflow; attachments are intentionally out of scope. */
@Controller('contracts') @DepartmentOnly(UserRole.CONTRACTS,UserRole.HR)
export class ContractsWorkflowController {
  constructor(private readonly db:PrismaService,private readonly access:AccessService){}

  @Post(':id/transition')
  async transition(@Param('id')id:string,@Body()body:TransitionDto,@CurrentUser()u:any){
    if(u.accessMode==='CUSTOM' && u.role!=='SUPER_ADMIN'){
      const edit=await this.access.evaluate(u.sub,u.role,u.accessMode,'contratos.instrumentos.editar');
      if(!edit.allowed||edit.scope!=='GLOBAL')throw new BadRequestException('É necessária permissão para editar contratos');
    }
    const effectiveAt=new Date(body.effectiveAt);
    if(!Number.isFinite(effectiveAt.getTime()))throw new BadRequestException('Data inválida');
    if(['SUSPENDED','TERMINATED','CANCELLED'].includes(body.to) && (!body.reason||body.reason.trim().length<5))
      throw new BadRequestException('Informe o motivo da movimentação (mínimo 5 caracteres)');
    if(body.to==='ACTIVE' && effectiveAt.getTime()>Date.now())
      throw new BadRequestException('Não é possível efetivar um contrato com data futura');
    return this.db.$transaction(async tx=>{
      const before=await tx.contract.findUniqueOrThrow({where:{id}});
      if(!allowed[before.status]?.includes(body.to)) throw new ConflictException(`Transição não permitida: ${before.status} → ${body.to}`);
      if(before.status==='PENDING_SIGNATURE' && body.to==='ACTIVE' && body.signedConfirmed!==true)
        throw new BadRequestException('Confirme expressamente que o contrato está assinado e efetivado');
      const update:any={status:body.to};
      if(body.to==='SUSPENDED')update.suspensionStart=effectiveAt;
      if(body.to==='TERMINATED')update.terminationDate=effectiveAt;
      if(body.to==='ACTIVE' && before.status==='SUSPENDED')update.suspensionEnd=effectiveAt;
      if(body.to==='ACTIVE' && !before.startDate)update.startDate=effectiveAt;
      const changed=await tx.contract.updateMany({where:{id,status:before.status},data:update});
      if(changed.count!==1)throw new ConflictException('O contrato foi alterado por outra pessoa. Atualize a ficha.');
      const movement=await tx.contractMovement.create({data:{contractId:id,actorId:u.sub,kind:'STATUS_CHANGE',previousState:before.status,newState:body.to,effectiveAt,reason:body.reason?.trim()||null}});
      await tx.auditLog.create({data:{userId:u.sub,action:'CONTRACT_TRANSITION',entity:'Contract',entityId:id,metadata:{from:before.status,to:body.to,movementId:movement.id,effectiveAt:body.effectiveAt,signedConfirmed:body.signedConfirmed===true}}});
      return {id,status:body.to,movementId:movement.id};
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  }

  @Post(':id/amendments')
  async createAmendment(@Param('id')id:string,@Body()body:AmendmentDto,@CurrentUser()u:any){
    const effectiveAt=new Date(body.effectiveAt);
    if(!Number.isFinite(effectiveAt.getTime()))throw new BadRequestException('Data inválida');
    return this.db.$transaction(async tx=>{
      await tx.contract.findUniqueOrThrow({where:{id},select:{id:true}});
      const amendment=await tx.contractAmendment.create({data:{contractId:id,type:body.type.trim(),description:body.description.trim(),effectiveAt,status:'OPEN'}});
      await tx.auditLog.create({data:{userId:u.sub,action:'CONTRACT_AMENDMENT_REQUEST',entity:'ContractAmendment',entityId:amendment.id,metadata:{contractId:id}}});
      return amendment;
    });
  }
}
