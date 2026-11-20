import { BadRequestException, Controller, ForbiddenException, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../common/auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PrismaService } from '../common/prisma.service.js';
import { compactQuery,parsePage } from '../common/pagination.js';
import { AccessService } from '../iam/access.service.js';

type Domain='people'|'academic'|'attendance'|'contracts'|'finance'|'vacancies'|'service'|'audit';
type Spec={key:Domain;label:string;description:string;columns:string[];roles:string[]};
const SPECS:Spec[]=[
 {key:'people',label:'Alunos',description:'Cadastros de alunos e situações',columns:['Nome','CPF','E-mail','Telefone','Cidade','Situação'],roles:['SECRETARY','CONTRACTS','TRIAGE','SOCIAL_SERVICE','RECEPTION','COMMERCIAL','HR']},
 {key:'academic',label:'Matrículas',description:'Matrículas, cursos, turmas e empresas',columns:['Aluno','Curso','Turma','Empresa','Início','Situação'],roles:['SECRETARY']},
 {key:'attendance',label:'Frequência',description:'Registros de chamada e justificativas',columns:['Aluno','Turma','Data','Presença','Justificada','Código'],roles:['SECRETARY']},
 {key:'contracts',label:'Contratos',description:'Contratos, vigências e situações',columns:['Contrato','Aluno','Empresa','Curso','Início','Fim','Situação'],roles:['CONTRACTS','HR','FINANCE']},
 {key:'finance',label:'Títulos financeiros',description:'Vencimentos, pagamentos e saldos',columns:['Descrição','Empresa','Competência','Vencimento','Valor','Recebido','Saldo','Situação'],roles:['FINANCE']},
 {key:'vacancies',label:'Vagas e triagem',description:'Vagas, perfis e candidaturas',columns:['Vaga','Empresa','Perfil','Cidade','Quantidade','Candidaturas','Situação'],roles:['TRIAGE','COMMERCIAL']},
 {key:'service',label:'Requerimentos',description:'Solicitações, prazos e respostas',columns:['Tipo','Solicitante','Abertura','Prazo','Situação','Resposta'],roles:['SECRETARY','RECEPTION','SOCIAL_SERVICE']},
 {key:'audit',label:'Auditoria de alterações',description:'Ações de usuários e registros alterados',columns:['Data','Usuário','Ação','Entidade','Referência'],roles:['SUPER_ADMIN','ADMIN']}
];
const pt:Record<string,string>={ACTIVE:'Ativo',INACTIVE:'Inativo',PENDING:'Pendente',ARCHIVED:'Arquivado',DRAFT:'Rascunho',PENDING_SIGNATURE:'Aguardando assinatura',SUSPENDED:'Suspenso',TERMINATED:'Encerrado',CANCELLED:'Cancelado',OPEN:'Aberto',IN_PROGRESS:'Em andamento',WAITING:'Aguardando',DONE:'Concluído',P:'Presente',F:'Falta',FJ:'Falta justificada',CREATE:'Criação',UPDATE:'Atualização',ARCHIVE:'Arquivamento',UPSERT:'Registro atualizado'};
const translate=(v:any)=>v==null?'':(pt[String(v)]||String(v));
const date=(v:any)=>v?new Date(v).toLocaleDateString('pt-BR',{timeZone:'UTC'}):'';
const currency=(v:any)=>Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const str=(v:any)=>v==null?'':String(v);
const esc=(value:string)=>{const sanitized=/^[\t\r\n\s=+@-]/.test(value)?"'"+value:value;return '"'+sanitized.replaceAll('"','""')+'"'};
const can=(role:string,spec:Spec)=>role==='SUPER_ADMIN'||role==='ADMIN'||spec.roles.includes(role);
const reportGroup=(key:Domain)=>key==='finance'?'financeiros':key==='contracts'?'contratuais':['people','academic','attendance'].includes(key)?'academicos':'gerenciais';

@Controller('reports') @UseGuards(AuthGuard)
export class ReportsController{
 constructor(private readonly db:PrismaService, private readonly access:AccessService){}
 private spec(key:string,user:{role:string;accessMode?:string}):Spec{
  const found=SPECS.find(x=>x.key===key);if(!found)throw new BadRequestException('Relatório desconhecido');
  if(user.accessMode!=='CUSTOM'&&!can(user.role,found))throw new ForbiddenException('Perfil sem permissão para este relatório');return found;
 }
 private where(key:Domain,q:string,from?:string,to?:string):any{
  const term=compactQuery(q),range:any={};
  if(from){if(!/^\d{4}-\d{2}-\d{2}$/.test(from))throw new BadRequestException('Data inicial inválida');range.gte=new Date(`${from}T00:00:00.000Z`);}
  if(to){if(!/^\d{4}-\d{2}-\d{2}$/.test(to))throw new BadRequestException('Data final inválida');range.lte=new Date(`${to}T23:59:59.999Z`);}
  if(from&&to&&from>to)throw new BadRequestException('O período final deve ser posterior ao inicial');
  const dateKey=key==='attendance'?'classDate':key==='finance'?'dueDate':'createdAt';
  const where:any=Object.keys(range).length?{[dateKey]:range}:{};
  if(key==='people')where.NOT={users:{some:{role:{not:'STUDENT'}}}};
  if(!term)return where;
  const like={contains:term,mode:'insensitive'};
  const queries:Record<Domain,any[]>={
   people:[{fullName:like},{cpf:{contains:term}},{email:like}],
   academic:[{person:{is:{fullName:like}}},{course:{is:{name:like}}},{classGroup:{is:{name:like}}}],
   attendance:[{person:{is:{fullName:like}}},{classGroup:{is:{name:like}}}],
   contracts:[{number:like},{person:{is:{fullName:like}}},{company:{is:{tradeName:like}}}],
   finance:[{description:like},{competence:like},{company:{is:{tradeName:like}}}],
   vacancies:[{title:like},{profile:like},{company:{is:{tradeName:like}}}],
   service:[{type:like},{person:{is:{fullName:like}}}],
   audit:[{action:like},{entity:like},{user:{is:{name:like}}}]
  };
  where.OR=queries[key];return where;
 }
 private delegate(key:Domain):any{
  // Lista fechada, sem acesso arbitrário aos modelos Prisma.
  if(key==='people')return this.db.person;
  if(key==='academic')return this.db.enrollment;
  if(key==='attendance')return this.db.attendance;
  if(key==='contracts')return this.db.contract;
  if(key==='finance')return this.db.financialTitle;
  if(key==='vacancies')return this.db.vacancy;
  if(key==='service')return this.db.serviceRequest;
  return this.db.auditLog;
 }
 private async queryRows(key:Domain,where:any,take:number,skip:number,cursor?:string):Promise<any[]>{
  // Explicitly type the optional cursor so Prisma receives one stable
  // argument shape regardless of whether this is the first page or a continuation.
  const common: {
   where: any;
   orderBy: { id: 'asc' };
   take: number;
   skip: number;
   cursor?: { id: string };
  } = { where, orderBy: { id: 'asc' }, take, skip: cursor ? 1 : skip };
  if (cursor) common.cursor = { id: cursor };
  switch(key){
   case 'people':return this.db.person.findMany(common);
   case 'academic':return this.db.enrollment.findMany({...common,include:{person:true,course:true,classGroup:true,company:true}});
   case 'attendance':return this.db.attendance.findMany({...common,include:{person:true,classGroup:true}});
   case 'contracts':return this.db.contract.findMany({...common,include:{person:true,company:true,course:true}});
   case 'finance':return this.db.financialTitle.findMany({...common,include:{company:true,payments:true}});
   case 'vacancies':return this.db.vacancy.findMany({...common,include:{company:true,_count:{select:{applications:true}}}});
   case 'service':return this.db.serviceRequest.findMany({...common,include:{person:true}});
   case 'audit':return this.db.auditLog.findMany({...common,include:{user:{select:{name:true}}}});
  }
 }
 private row(key:Domain,r:any):string[]{
  switch(key){
   case 'people':return [str(r.fullName),str(r.cpf),str(r.email),str(r.phone),str(r.city),translate(r.status)];
   case 'academic':return [str(r.person?.fullName),str(r.course?.name),str(r.classGroup?.name),str(r.company?.tradeName),date(r.startDate),translate(r.status)];
   case 'attendance':return [str(r.person?.fullName),str(r.classGroup?.name),date(r.classDate),r.present?'Sim':'Não',r.justified?'Sim':'Não',translate(r.legacyCode||'')];
   case 'contracts':return [str(r.number),str(r.person?.fullName),str(r.company?.tradeName),str(r.course?.name),date(r.startDate),date(r.endDate),translate(r.status)];
   case 'finance':{const paid=(r.payments||[]).reduce((s:number,p:any)=>s+Number(p.amount),0);return [str(r.description),str(r.company?.tradeName),str(r.competence),date(r.dueDate),currency(r.amount),currency(paid),currency(Math.max(0,Number(r.amount)-paid)),translate(r.status)];}
   case 'vacancies':return [str(r.title),str(r.company?.tradeName),str(r.profile),str(r.city),str(r.quantity),str(r._count?.applications),translate(r.status)];
   case 'service':return [str(r.type),str(r.person?.fullName),date(r.createdAt),date(r.dueDate),translate(r.status),str(r.response)];
   case 'audit':return [date(r.createdAt),str(r.user?.name),translate(r.action),str(r.entity),str(r.entityId)];
  }
 }
 @Get('catalog')async catalog(@CurrentUser()user:{role:string;accessMode?:string;sub:string}){
  const specs=user.accessMode==='CUSTOM' ? (await Promise.all(SPECS.map(async x=>({x,decision:await this.access.evaluate(user.sub,user.role,'CUSTOM',x.key==='audit'?'integracao.auditoria.visualizar':`relatorios.${reportGroup(x.key)}.visualizar`)})))).filter(x=>x.decision.allowed && x.decision.scope==='GLOBAL').map(x=>x.x) : SPECS.filter(x=>can(user.role,x));
  return Promise.all(specs.map(async s=>({key:s.key,label:s.label,description:s.description,columns:s.columns,count:await this.delegate(s.key).count()})));
 }
 @Get(':kind/preview')async preview(@CurrentUser()user:{role:string;accessMode?:string;sub:string},@Param('kind')key:string,@Query('q')q='',@Query('from')from='',@Query('to')to='',@Query('page')page='1'){
  const s=this.spec(key,user);
  if(user.accessMode==='CUSTOM'&&s.key==='people'&&!(await this.access.evaluate(user.sub,user.role,'CUSTOM','alunos.dados_sensiveis.visualizar')).allowed)throw new ForbiddenException('Relatorio de dados pessoais exige autorizacao especifica');
  const where=this.where(s.key,q,from,to),pg=parsePage(page,'30');
  const [rows,total]=await Promise.all([this.queryRows(s.key,where,pg.take,pg.skip),this.delegate(s.key).count({where})]);
  return {columns:s.columns,items:rows.map(r=>this.row(s.key,r)),total,page:pg.page,pageSize:pg.pageSize};
 }
 @Get(':kind/export')async export(@CurrentUser()user:{role:string;accessMode?:string;sub:string},@Param('kind')key:string,@Query('q')q='',@Query('from')from='',@Query('to')to='',@Res()res:Response){
  const s=this.spec(key,user),where=this.where(s.key,q,from,to);
  if(user.accessMode==='CUSTOM'&&s.key==='people'&&!(await this.access.evaluate(user.sub,user.role,'CUSTOM','alunos.dados_sensiveis.visualizar')).allowed)throw new ForbiddenException('Exportacao de dados pessoais nao autorizada');
  res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="siscapro-relatorio-${s.key}.csv"`);
  res.setHeader('Cache-Control','no-store');res.write('\ufeff'+s.columns.map(esc).join(';')+'\r\n');
  try{
   let cursor: string|undefined;const limit=500;
   while(!res.destroyed){
    const items=await this.queryRows(s.key,where,limit,0,cursor);
    if(!items.length)break;
    for(const r of items){
     if(res.destroyed)break;
     const accepted=res.write(this.row(s.key,r).map(esc).join(';')+'\r\n');
     if(!accepted){
      // Respeita a capacidade de escrita da conexão em relatórios com muitos registros.
      await new Promise<void>(resolve=>{const done=()=>{res.off('drain',done);res.off('close',done);resolve();};res.once('drain',done);res.once('close',done);});
     }
    }
    cursor=items[items.length-1].id;
    if(items.length<limit)break;
   }
   if(!res.destroyed)res.end();
  }catch(error){if(!res.destroyed)res.destroy(error instanceof Error?error:undefined);}
 }
}
