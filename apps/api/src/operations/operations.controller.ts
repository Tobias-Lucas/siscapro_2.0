import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PrismaService } from '../common/prisma.service.js';
import { AuditService } from '../common/audit.service.js';
import { CATALOG, type CatalogResource } from './catalog.js';
import { AccessService } from '../iam/access.service.js';

const INTERNAL = new Set(['SUPER_ADMIN','ADMIN','SECRETARY','FINANCE','CONTRACTS','HR','TRIAGE','COMMERCIAL','SOCIAL_SERVICE','RECEPTION']);
const RECORD_STATES = new Set(['ACTIVE','INACTIVE','PENDING','ARCHIVED']);
const REQUEST_STATES = new Set(['OPEN','IN_PROGRESS','WAITING','DONE','CANCELLED']);
const CONTRACT_STATES = new Set(['DRAFT','PENDING_SIGNATURE','ACTIVE','SUSPENDED','TERMINATED','CANCELLED']);
const MAX_PAGE_SIZE = 100;
const humanError = (message: string) => new BadRequestException(message);

function isAllowed(u: any, item: CatalogResource) {
  return (u.accessMode === 'CUSTOM' && u.role !== 'SUPER_ADMIN') || u.role === 'SUPER_ADMIN' || (u.role === 'ADMIN' && item.model !== 'LegacySyncIssue') || item.roles.includes(String(u.role));
}
function catalogItem(slug: string) {
  const resource = CATALOG.find(x => x.slug === slug);
  if (!resource) throw new NotFoundException('Cadastro nao encontrado');
  return resource;
}
function validatePayload(resource: CatalogResource, body: any, isUpdate: boolean) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw humanError('Envie um objeto valido');
  const allowed = new Map(resource.fields.map(f => [f.key, f]));
  const result: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(body)) {
    const field = allowed.get(key);
    if (!field) throw humanError(`Campo nao permitido: ${key}`);
    if (raw === null || raw === '') {
      if (!field.optional) throw humanError(`O campo ${field.label} e obrigatorio`);
      result[key] = null;
      continue;
    }
    if (field.type === 'Boolean') {
      if (typeof raw !== 'boolean') throw humanError(`Booleano invalido: ${key}`);
      result[key] = raw;
    } else if (field.type === 'Int') {
      if (typeof raw !== 'number' || !Number.isSafeInteger(raw) || Math.abs(raw) > 2_147_483_647) throw humanError(`Numero inteiro invalido: ${key}`);
      result[key] = raw;
    } else if (field.type === 'Decimal') {
      if (typeof raw !== 'number' && typeof raw !== 'string') throw humanError(`Valor numerico invalido: ${key}`);
      const n = Number(raw);
      if (!Number.isFinite(n) || Math.abs(n) > 1_000_000_000) throw humanError(`Valor invalido: ${key}`);
      if (['amount','unitPrice','quantity','plannedHours'].includes(key) && n < 0) throw humanError(`Valor negativo: ${key}`);
      result[key] = n;
    } else if (field.type === 'DateTime') {
      if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(raw)) throw humanError(`Data invalida: ${key}`);
      const date = new Date(raw);
      if (!Number.isFinite(date.getTime())) throw humanError(`Data invalida: ${key}`);
      result[key] = date;
    } else {
      if (typeof raw !== 'string') throw humanError(`Texto invalido: ${key}`);
      const value = raw.trim();
      if (!value || value.length > (field.multiline ? 60000 : 1500)) throw humanError(`Texto invalido ou excessivo: ${key}`);
      if (field.options && !field.options.includes(value)) throw humanError(`Opcao invalida para ${field.label}`);
      if (key === 'status') {
        const type = ['BusinessContract'].includes(resource.model) ? CONTRACT_STATES :
          ['Unit','Department','CompanyGroup','CompanyContact','Institution','InstitutionCourse','LearningMaterial','FinanceAccount','DocumentTemplate','InternshipSupervisor'].includes(resource.model) ? RECORD_STATES : REQUEST_STATES;
        if (!type.has(value)) throw humanError('Situacao invalida');
      }
      result[key] = value;
    }
  }
  if (!isUpdate) for (const field of resource.fields) {
    if (!field.optional && field.default === undefined && !(resource.model==='InvoiceLine' && field.key==='amount') && !(field.key in result)) throw humanError(`Preencha ${field.label}`);
  }
  for (const [left, right] of [['startDate','endDate'],['periodStart','periodEnd'],['effectiveFrom','effectiveTo']]) {
    const start = result[left], end = result[right];
    if (start instanceof Date && end instanceof Date && end < start) throw humanError(`Periodo invalido: ${right} anterior a ${left}`);
  }
  if (resource.model === 'FinanceMovement' && result.direction && !['IN','OUT'].includes(String(result.direction))) throw humanError('Direcao financeira invalida');
  if (resource.model === 'InternshipReport' && result.kind && !['RA','TRE','OTHER'].includes(String(result.kind))) throw humanError('Tipo de relatorio invalido');
  return result;
}

const SELECTS: Record<string, { field: string; label: string }> = {
  User: { field: 'name', label: 'Usuario' }, Person: { field: 'fullName', label: 'Pessoa' },
  Company: { field: 'legalName', label: 'Empresa' }, Course: { field: 'name', label: 'Curso' },
  ClassGroup: { field: 'name', label: 'Turma' }, Contract: { field: 'number', label: 'Contrato' },
  Discipline: { field: 'name', label: 'Disciplina' }, Attendance: { field: 'legacyCode', label: 'Frequencia' },
  Internship: { field: 'id', label: 'Estagio' }, Document: { field: 'fileName', label: 'Documento' },
  FinancialTitle: { field: 'description', label: 'Titulo' }, ServiceRequest: { field: 'type', label: 'Atendimento' },
};
for (const m of CATALOG) SELECTS[m.model] = {field: m.fields.find(x => ['name','title','fullName','description','reference','number','code','subject'].includes(x.key))?.key || 'id', label: m.label};

@Controller('operations')
@UseGuards(AuthGuard)
export class OperationsController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly access: AccessService) {}
  private resource(slug: string, user: any) {
    const item = catalogItem(slug);
    if (!INTERNAL.has(String(user.role)) || !isAllowed(user,item)) throw new ForbiddenException('Sem permissao para este cadastro');
    return item;
  }
  private delegate(item: CatalogResource) { return (this.prisma as any)[item.modelKey]; }

  @Get('catalog')
  async catalog(@CurrentUser() user: any) {
    if (!INTERNAL.has(String(user.role))) throw new ForbiddenException();
    if (user.accessMode !== 'CUSTOM' || user.role === 'SUPER_ADMIN') return CATALOG.filter(x => isAllowed(user,x));
    const checks = await Promise.all(CATALOG.map(async item => ({
      item, permitted: await this.access.evaluate(user.sub, user.role, user.accessMode, `cadastros.${item.slug}.listar`),
    })));
    return checks.filter(x => x.permitted.allowed && x.permitted.scope === 'GLOBAL').map(x => x.item);
  }
  @Get('options/:model')
  async options(@CurrentUser() user: any, @Param('model') model: string) {
    if (!INTERNAL.has(String(user.role))) throw new ForbiddenException();
    if (user.accessMode === 'CUSTOM' && user.role !== 'SUPER_ADMIN') {
      // Lookup access is independent from generic catalog access; never expose User options freely.
      const code = model === 'User' ? 'usuarios.contas.visualizar' : model === 'Person' ? 'alunos.cadastro.visualizar' : model === 'Company' ? 'empresas.cadastro.visualizar' : 'cadastros.referencias.visualizar';
      const lookup = await this.access.evaluate(user.sub,user.role,user.accessMode,code);
      if (!lookup.allowed || lookup.scope !== 'GLOBAL') throw new ForbiddenException();
    }
    // No arbitrary model or arbitrary SQL: only the fixed, documented list.
    const def = SELECTS[model];
    if (!def) throw new NotFoundException();
    const modelKey = model[0].toLowerCase() + model.slice(1);
    const delegate = (this.prisma as any)[modelKey];
    if (!delegate) throw new NotFoundException();
    const rows = await delegate.findMany({ take: 500, select: {id:true,[def.field]:true},orderBy:{id:'asc'} });
    return rows.map((r:any)=>({id:r.id,label:String(r[def.field]||r.id)}));
  }
  @Get(':resource')
  async list(@Param('resource') slug: string, @CurrentUser() user: any, @Query('page') page = '1', @Query('q') q = '') {
    const resource=this.resource(slug,user);
    const n=Math.min(Math.max(parseInt(page,10)||1,1),100000);
    const delegate=this.delegate(resource);
    const searchable=resource.fields.filter(f => f.type==='String' && !f.ref && !['status','state','channel','scope','kind'].includes(f.key)).slice(0,12).map(f=>f.key);
    const term=String(q||'').slice(0,90).trim();
    const where=term && searchable.length ? {OR:searchable.map(key=>({[key]:{contains:term,mode:'insensitive'}}))} : {};
    const [items,total]=await Promise.all([
      delegate.findMany({where,skip:(n-1)*MAX_PAGE_SIZE,take:MAX_PAGE_SIZE,orderBy:{createdAt:'desc'}}),
      delegate.count({where}),
    ]);
    return {items,total,page:n,pageSize:MAX_PAGE_SIZE};
  }
  @Post(':resource')
  async create(@Param('resource') slug: string,@Body() data: Record<string,unknown>,@CurrentUser() user:any){
    const resource=this.resource(slug,user);
    const payload=validatePayload(resource,data,false);
    if(resource.model==='InvoiceLine') {
      const count=Number(payload.quantity), price=Number(payload.unitPrice);
      payload.amount=Math.round(count*price*100)/100;
    }
    try {
      const record=await this.delegate(resource).create({data:payload});
      if(resource.model==='InvoiceLine') await this.recalculateInvoice(String(payload.invoiceId));
      await this.audit.log({userId:user.sub,action:'CREATE',entity:resource.model,entityId:record.id});
      return record;
    }catch(e:any){this.dbError(e);}
  }
  @Patch(':resource/:id')
  async update(@Param('resource') slug:string,@Param('id') id:string,@Body() data:Record<string,unknown>,@CurrentUser() user:any){
    const resource=this.resource(slug,user);
    const payload=validatePayload(resource,data,true);
    if(!Object.keys(payload).length) throw humanError('Nenhuma alteracao informada');
    const delegate=this.delegate(resource);
    try{
      const current=await delegate.findUnique({where:{id}});
      if(!current) throw new NotFoundException('Registro nao encontrado');
      if(resource.model==='InvoiceLine') {
        const count=Number(payload.quantity ?? current.quantity);
        const price=Number(payload.unitPrice ?? current.unitPrice);
        payload.amount=Math.round(count*price*100)/100;
      }
      const record=await delegate.update({where:{id},data:payload});
      if(resource.model==='InvoiceLine') {
        await this.recalculateInvoice(String(current.invoiceId));
        if(payload.invoiceId && payload.invoiceId!==current.invoiceId) await this.recalculateInvoice(String(payload.invoiceId));
      }
      await this.audit.log({userId:user.sub,action:'UPDATE',entity:resource.model,entityId:id,metadata:{fields:Object.keys(payload)}});
      return record;
    }catch(e:any){this.dbError(e);}
  }
  @Post(':resource/:id/archive')
  async archive(@Param('resource') slug:string,@Param('id') id:string,@CurrentUser() user:any){
    const resource=this.resource(slug,user);
    const field=resource.fields.find(f=>f.key==='status' && f.type==='RecordStatus');
    if(!field) throw humanError('Este cadastro nao possui arquivamento automatico');
    const record=await this.delegate(resource).update({where:{id},data:{status:'ARCHIVED'}});
    await this.audit.log({userId:user.sub,action:'ARCHIVE',entity:resource.model,entityId:id});
    return record;
  }
  private async recalculateInvoice(invoiceId:string){
    const rows=await this.prisma.invoiceLine.findMany({where:{invoiceId},select:{amount:true}});
    const total=rows.reduce((acc,row)=>acc+Number(row.amount),0);
    await this.prisma.invoice.update({where:{id:invoiceId},data:{amount:Math.round(total*100)/100}});
  }
  private dbError(e:any):never{
    if(e instanceof BadRequestException || e instanceof NotFoundException || e instanceof ForbiddenException)throw e;
    if(e?.code==='P2002') throw new BadRequestException('Ja existe um registro com esses identificadores');
    if(e?.code==='P2003') throw new BadRequestException('O registro vinculado nao existe ou nao permite essa operacao');
    if(e?.code==='P2025') throw new NotFoundException('Registro nao encontrado');
    throw e;
  }
}
