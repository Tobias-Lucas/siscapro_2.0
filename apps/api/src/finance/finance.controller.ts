import { BadRequestException, Body, ConflictException, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Prisma, UserRole } from '../generated/prisma/client.js';
import { DepartmentOnly } from '../common/department-only.decorator.js';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PatchFieldsPipe } from '../common/patch-fields.pipe.js';
import { clean, toDate } from '../common/crud.util.js'; import { parsePage,allowedStatus,compactQuery } from '../common/pagination.js';

class TitleDto {
  @IsString() description!: string;
  @IsDateString() dueDate!: string;
  @IsNumber() @Min(0.01) amount!: number;
  @IsOptional() @IsString() companyId?: string;
  @IsOptional() @IsString() contractId?: string;
  @IsOptional() @IsString() competence?: string;
  @IsOptional() @IsString() bankRef?: string;
}
class PaymentDto {
  @IsString() financialTitleId!: string;
  @IsDateString() paidAt!: string;
  @IsNumber() @Min(0.01) amount!: number;
  @IsOptional() @IsString() externalRef?: string;
}
const cents = (value: unknown) => Math.round(Number(value) * 100);

@Controller('finance')
@DepartmentOnly(UserRole.FINANCE)
export class FinanceController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Get('titles')
  async titles(@Query('status')status='',@Query('q')q='',@Query('paged')paged='',@Query('page')page='1',@Query('pageSize')pageSize='25'){
    const term=compactQuery(q),state=allowedStatus(status,['OPEN','IN_PROGRESS','WAITING','DONE','CANCELLED']);
    const where:any={...(state?{status:state}:{}),...(term?{OR:[{description:{contains:term,mode:'insensitive'}},{competence:{contains:term,mode:'insensitive'}},{company:{is:{tradeName:{contains:term,mode:'insensitive'}}}}]}:{})};
    const include={company:true,contract:{include:{person:true}},payments:true};
    if(paged==='1'){const opts=parsePage(page,pageSize);const [items,total]=await Promise.all([this.prisma.financialTitle.findMany({where,include,orderBy:{dueDate:'desc'},skip:opts.skip,take:opts.take}),this.prisma.financialTitle.count({where})]);return {items,total,page:opts.page,pageSize:opts.pageSize};}
    return this.prisma.financialTitle.findMany({where,include,orderBy:{dueDate:'desc'},take:500});
  }
  @Post('titles')
  async createTitle(@Body() dto: TitleDto, @CurrentUser() user: any) {
    const result = await this.prisma.financialTitle.create({ data: clean({ ...dto, dueDate: new Date(dto.dueDate), status: 'OPEN' }) as any });
    await this.audit.log({ userId: user.sub, action: 'CREATE', entity: 'FinancialTitle', entityId: result.id });
    return result;
  }
  @Patch('titles/:id')
  async updateTitle(@Param('id') id: string,
      @Body(new PatchFieldsPipe(['description', 'dueDate', 'amount', 'companyId', 'contractId', 'competence', 'bankRef'], ['amount'])) dto: Partial<TitleDto>,
      @CurrentUser() user: any) {
    if (dto.amount !== undefined && dto.amount <= 0) throw new BadRequestException('Valor do titulo deve ser positivo');
    const current = await this.prisma.financialTitle.findUniqueOrThrow({ where: { id }, include: { payments: true } });
    if (dto.amount !== undefined && current.payments.length > 0 && cents(dto.amount) !== cents(current.amount)) {
      throw new BadRequestException('Titulo com pagamentos nao permite alterar o valor; utilize ajuste financeiro auditado');
    }
    const result = await this.prisma.financialTitle.update({ where: { id }, data: clean({ ...dto, dueDate: toDate(dto.dueDate) }) as any });
    await this.audit.log({ userId: user.sub, action: 'UPDATE', entity: 'FinancialTitle', entityId: id, metadata: { fields: Object.keys(dto) } });
    return result;
  }
  @Post('payments')
  async pay(@Body() dto: PaymentDto, @CurrentUser() user: any) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await this.prisma.$transaction(async tx => {
          const title = await tx.financialTitle.findUniqueOrThrow({ where: { id: dto.financialTitleId }, include: { payments: true } });
          if (title.status === 'CANCELLED') throw new BadRequestException('Titulo cancelado');
          if (dto.externalRef && title.payments.some(p => p.externalRef === dto.externalRef)) {
            throw new ConflictException('Referencia de pagamento ja registrada');
          }
          const total = cents(title.amount);
          const alreadyPaid = title.payments.reduce((sum, p) => sum + cents(p.amount), 0);
          const amount = cents(dto.amount);
          if (amount <= 0 || amount > total - alreadyPaid) throw new BadRequestException('Pagamento excede o saldo ou valor invalido');
          const payment = await tx.payment.create({ data: {
            financialTitleId: title.id, paidAt: new Date(dto.paidAt), amount: dto.amount,
            externalRef: dto.externalRef || null,
          } });
          const outstandingCents = total - alreadyPaid - amount;
          await tx.financialTitle.update({ where: { id: title.id }, data: { status: outstandingCents === 0 ? 'DONE' : 'IN_PROGRESS' } });
          return { payment, outstanding: outstandingCents / 100, status: outstandingCents === 0 ? 'DONE' : 'IN_PROGRESS' };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        await this.audit.log({ userId: user.sub, action: 'CREATE', entity: 'Payment', entityId: result.payment.id, metadata: { financialTitleId: dto.financialTitleId } });
        return result;
      } catch (error: any) {
        if (error?.code === 'P2034' && attempt < 2) continue;
        throw error;
      }
    }
    throw new ConflictException('Pagamento concorrente, tente novamente');
  }
  @Get('summary')
  async summary() {
    const titles = await this.prisma.financialTitle.findMany({ select: { status: true, amount: true, payments: { select: { amount: true } } } });
    const totalPaid = titles.reduce((sum, t) => sum + t.payments.reduce((p, entry) => p + cents(entry.amount), 0), 0);
    const outstanding = titles.filter(t => t.status !== 'CANCELLED').reduce((sum, t) => sum + cents(t.amount) - t.payments.reduce((p, entry) => p + cents(entry.amount), 0), 0);
    return { totalPaid: totalPaid / 100, outstanding: outstanding / 100, openTitles: titles.filter(t => !['CANCELLED', 'DONE'].includes(t.status)).length };
  }
}
