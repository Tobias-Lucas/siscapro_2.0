import { Controller, ForbiddenException, Get, Param } from '@nestjs/common';
import { UserRole } from '../generated/prisma/client.js';
import { DepartmentOnly } from '../common/department-only.decorator.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PrismaService } from '../common/prisma.service.js';
import { AccessService } from '../iam/access.service.js';

/**
 * Operational read models. Each read is bounded and separately authorized.
 * No PDF, storage key, password, API secret or legacy raw payload is returned.
 * A workspace is not a second database: it reads normalized domain tables.
 */
type Col = { key: string; label: string };
const col = (key:string,label:string):Col=>({key,label});
const section = (key:string,title:string,columns:Col[],items:Record<string,unknown>[],total:number)=>({
  key,title,columns,items,total,truncated:items.length<total,
});
const field = (label:string,value:any)=>({label,value:value??null});
const date = (d:Date|null|undefined)=>d?d.toISOString().slice(0,10):null;
const money = (d:any)=>d==null?null:Number(d);
const internalRoles = [UserRole.SECRETARY,UserRole.CONTRACTS,UserRole.FINANCE,UserRole.TRIAGE,
  UserRole.RECEPTION,UserRole.SOCIAL_SERVICE,UserRole.COMMERCIAL,UserRole.HR];

@Controller('workspaces')
@DepartmentOnly(...internalRoles)
export class WorkspacesController {
  constructor(private readonly db:PrismaService,private readonly access:AccessService){}

  private async permit(user:any, code:string, legacyRoles:UserRole[]):Promise<boolean>{
    if(user.role===UserRole.SUPER_ADMIN)return true;
    if(user.accessMode==='CUSTOM'){
      const d=await this.access.evaluate(user.sub,user.role,user.accessMode,code);
      return d.allowed && d.scope==='GLOBAL';
    }
    return user.role===UserRole.ADMIN || legacyRoles.includes(user.role);
  }
  private async require(user:any, code:string, roles:UserRole[]){
    if(!await this.permit(user,code,roles))throw new ForbiddenException('Permissao insuficiente para esta ficha');
  }

  @Get('students/:id')
  async student(@Param('id')id:string,@CurrentUser()u:any){
    await this.require(u,'alunos.cadastro.visualizar',[UserRole.SECRETARY,UserRole.CONTRACTS,UserRole.TRIAGE,UserRole.RECEPTION,UserRole.SOCIAL_SERVICE,UserRole.COMMERCIAL,UserRole.HR]);
    const p=await this.db.person.findUniqueOrThrow({where:{id}});
    const canSensitive=await this.permit(u,'alunos.dados_sensiveis.visualizar',[UserRole.SECRETARY,UserRole.CONTRACTS,UserRole.TRIAGE,UserRole.RECEPTION,UserRole.SOCIAL_SERVICE,UserRole.HR]);
    const sections:any[]=[];
    let primaryCourseName:string|null=null;
    if(await this.permit(u,'matriculas.vinculos.visualizar',[UserRole.SECRETARY])){
      const [rows,total]=await Promise.all([
        this.db.enrollment.findMany({where:{personId:id},include:{course:{select:{name:true}},classGroup:{select:{name:true}},company:{select:{tradeName:true}},contract:{select:{number:true}}},orderBy:{createdAt:'desc'},take:100}),
        this.db.enrollment.count({where:{personId:id}}),
      ]);
      sections.push(section('enrollments','Matrículas e vínculos',[
        col('course','Curso'),col('group','Turma'),col('company','Empresa'),col('contract','Contrato'),col('startDate','Início'),col('status','Situação'),
      ],rows.map(r=>({id:r.id,course:r.course?.name||'Curso não informado',group:r.classGroup?.name,company:r.company?.tradeName,contract:r.contract?.number,startDate:date(r.startDate),status:r.status})),total));
    }
    if(await this.permit(u,'contratos.instrumentos.visualizar',[UserRole.CONTRACTS,UserRole.HR,UserRole.FINANCE])){
      const [rows,total]=await Promise.all([
        this.db.contract.findMany({where:{personId:id},include:{company:{select:{tradeName:true}},course:{select:{name:true}}},take:100,orderBy:{createdAt:'desc'}}),
        this.db.contract.count({where:{personId:id}}),
      ]);
      sections.push(section('contracts','Contratos',[
        col('number','Contrato'),col('company','Empresa'),col('course','Curso'),col('startDate','Início'),col('endDate','Término'),col('status','Situação'),
      ],rows.map(r=>({id:r.id,number:r.number||r.type||'Sem número',company:r.company?.tradeName,course:r.course?.name,startDate:date(r.startDate),endDate:date(r.endDate),status:r.status})),total));
    }
    if(await this.permit(u,'secretaria.frequencia.visualizar',[UserRole.SECRETARY])){
      const [rows,total]=await Promise.all([
        this.db.attendance.findMany({where:{personId:id},include:{classGroup:{select:{name:true}}},orderBy:{classDate:'desc'},take:100}),
        this.db.attendance.count({where:{personId:id}}),
      ]);
      sections.push(section('attendance','Frequência',[
        col('classDate','Data'),col('group','Turma'),col('session','Sessão'),col('mark','Registro'),col('reason','Justificativa'),
      ],rows.map(r=>({id:r.id,classDate:date(r.classDate),group:r.classGroup.name,session:r.sessionKey,mark:r.present?'Presente':r.justified?'Falta justificada':'Falta',reason:r.reason})),total));
    }
    if(await this.permit(u,'secretaria.notas.visualizar',[UserRole.SECRETARY])){
      const [rows,total]=await Promise.all([
        this.db.grade.findMany({where:{personId:id},include:{classGroup:{select:{name:true}}},orderBy:{date:'desc'},take:100}),
        this.db.grade.count({where:{personId:id}}),
      ]);
      sections.push(section('grades','Notas e avaliações',[
        col('date','Data'),col('group','Turma'),col('label','Avaliação'),col('value','Nota'),col('maxValue','Máximo'),
      ],rows.map(r=>({id:r.id,date:date(r.date),group:r.classGroup.name,label:r.label,value:money(r.value),maxValue:money(r.maxValue)})),total));
    }
    if(await this.permit(u,'atendimento.requerimentos.visualizar',[UserRole.RECEPTION,UserRole.SOCIAL_SERVICE,UserRole.SECRETARY])){
      const [rows,total]=await Promise.all([
        this.db.serviceRequest.findMany({where:{personId:id},orderBy:{createdAt:'desc'},take:60}),
        this.db.serviceRequest.count({where:{personId:id}}),
      ]);
      sections.push(section('requests','Atendimento e requerimentos',[
        col('createdAt','Abertura'),col('type','Tipo'),col('description','Solicitação'),col('status','Situação'),
      ],rows.map(r=>({id:r.id,createdAt:date(r.createdAt),type:r.type,description:r.description,status:r.status})),total));
    }
    if(await this.permit(u,'triagem.vagas.visualizar',[UserRole.TRIAGE,UserRole.COMMERCIAL])){
      const [rows,total]=await Promise.all([
        this.db.application.findMany({where:{personId:id},include:{vacancy:{select:{title:true}}},orderBy:{createdAt:'desc'},take:60}),
        this.db.application.count({where:{personId:id}}),
      ]);
      sections.push(section('applications','Candidaturas',[
        col('createdAt','Data'),col('vacancy','Vaga'),col('status','Situação'),
      ],rows.map(r=>({id:r.id,createdAt:date(r.createdAt),vacancy:r.vacancy.title,status:r.status})),total));
    }
    if(await this.permit(u,'documentos.arquivos.visualizar',[UserRole.SECRETARY,UserRole.CONTRACTS,UserRole.HR,UserRole.SOCIAL_SERVICE])){
      const [rows,total]=await Promise.all([
        this.db.document.findMany({where:{personId:id},orderBy:{createdAt:'desc'},take:60,select:{id:true,type:true,fileName:true,createdAt:true,status:true}}),
        this.db.document.count({where:{personId:id}}),
      ]);
      sections.push(section('documents','Documentos — somente metadados',[
        col('createdAt','Data'),col('type','Tipo'),col('fileName','Referência'),col('status','Situação'),
      ],rows.map(r=>({id:r.id,createdAt:date(r.createdAt),type:r.type,fileName:r.fileName,status:r.status})),total));
    }
    return {kind:'students',id,title:p.fullName,subtitle:p.socialName||'Vida acadêmica e vínculos',status:p.status,
      fields:[field('Nome completo',p.fullName),field('Nome social',p.socialName),field('Nascimento',canSensitive?date(p.birthDate):null),field('CPF',canSensitive?p.cpf:null),
      field('E-mail',canSensitive?p.email:null),field('Telefone',canSensitive?p.phone:null),field('Cidade',p.city),field('Estado',p.state),
      field('Responsável legal',canSensitive?p.legalGuardian:null),field('Situação',p.status)],sections};
  }

  @Get('groups/:id')
  async group(@Param('id')id:string,@CurrentUser()u:any){
    await this.require(u,'secretaria.turmas.visualizar',[UserRole.SECRETARY]);
    const r=await this.db.classGroup.findUniqueOrThrow({where:{id},select:{id:true,name:true,code:true,type:true,unit:true,room:true,startDate:true,endDate:true,status:true,courseId:true}});
    const sections:any[]=[];
    let primaryCourseName:string|null=null;
    if(await this.permit(u,'matriculas.vinculos.visualizar',[UserRole.SECRETARY])){
      const [rows,total]=await Promise.all([
        this.db.enrollment.findMany({where:{classGroupId:id},include:{person:{select:{fullName:true}},course:{select:{name:true}},company:{select:{tradeName:true}}},orderBy:{createdAt:'desc'},take:200}),
        this.db.enrollment.count({where:{classGroupId:id}}),
      ]);
      sections.push(section('enrollments','Alunos vinculados',[
        col('person','Aluno'),col('course','Curso'),col('company','Empresa'),col('startDate','Início'),col('status','Situação'),
      ],rows.map(x=>({id:x.id,person:x.person.fullName,course:x.course?.name,company:x.company?.tradeName,startDate:date(x.startDate),status:x.status})),total));
    }
    if(await this.permit(u,'secretaria.frequencia.visualizar',[UserRole.SECRETARY])){
      const [rows,total]=await Promise.all([
        this.db.attendance.findMany({where:{classGroupId:id},include:{person:{select:{fullName:true}}},take:100,orderBy:{classDate:'desc'}}),
        this.db.attendance.count({where:{classGroupId:id}}),
      ]);
      sections.push(section('attendance','Registros recentes de frequência',[
        col('classDate','Data'),col('person','Aluno'),col('mark','Presença'),col('session','Sessão'),
      ],rows.map(x=>({id:x.id,classDate:date(x.classDate),person:x.person.fullName,mark:x.present?'Presente':x.justified?'Falta justificada':'Falta',session:x.sessionKey})),total));
    }
    if(await this.permit(u,'secretaria.turmas_cursos.visualizar',[UserRole.SECRETARY])){
      const [links,primary]=await Promise.all([
        this.db.classGroupCourse.findMany({where:{classGroupId:id},include:{course:{select:{name:true,code:true}}},take:100}),
        r.courseId?this.db.course.findUnique({where:{id:r.courseId},select:{id:true,name:true,code:true}}):Promise.resolve(null),
      ]);
      primaryCourseName=primary?.name||null;
      const courseRows=[...(primary?[{id:`primary-${primary.id}`,name:primary.name,code:primary.code,origin:'Vínculo principal'}]:[]),...links.map(x=>({id:x.id,name:x.course.name,code:x.course.code,origin:x.evidence}))];
      sections.push(section('courses','Cursos relacionados',[
        col('name','Curso'),col('code','Código'),col('origin','Origem do vínculo'),
      ],courseRows,courseRows.length));
    }
    if(await this.permit(u,'secretaria.facilitadores.visualizar',[UserRole.SECRETARY])){
      const teachers=await this.db.teacherAssignment.findMany({where:{classGroupId:id},include:{user:{select:{name:true}}},take:40});
      sections.push(section('teachers','Facilitadores',[
        col('name','Professor'),col('assignedAt','Vínculo'),
      ],teachers.map(x=>({id:x.id,name:x.user.name,assignedAt:date(x.assignedAt)})),teachers.length));
    }
    if(await this.permit(u,'cronogramas.aulas.visualizar',[UserRole.SECRETARY])){
      const lessons=await this.db.academicLesson.findMany({where:{classGroupId:id},orderBy:{lessonDate:'desc'},take:50,select:{id:true,title:true,lessonDate:true,state:true}});
      sections.push(section('lessons','Aulas registradas',[
        col('lessonDate','Data'),col('title','Aula'),col('state','Situação'),
      ],lessons.map(x=>({id:x.id,lessonDate:date(x.lessonDate),title:x.title,state:x.state})),lessons.length));
    }
    return {kind:'groups',id,title:r.name,subtitle:primaryCourseName||'Turma compartilhada por cursos',status:r.status,
      fields:[field('Código',r.code),field('Curso principal',primaryCourseName),field('Unidade',r.unit),field('Sala',r.room),field('Modalidade',r.type),field('Início',date(r.startDate)),field('Término',date(r.endDate)),field('Situação',r.status)],sections};
  }

  @Get('companies/:id')
  async company(@Param('id')id:string,@CurrentUser()u:any){
    await this.require(u,'empresas.cadastro.visualizar',[UserRole.CONTRACTS,UserRole.FINANCE,UserRole.COMMERCIAL,UserRole.HR]);
    const r=await this.db.company.findUniqueOrThrow({where:{id}});
    const sections:any[]=[];
    if(await this.permit(u,'contratos.instrumentos.visualizar',[UserRole.CONTRACTS,UserRole.HR,UserRole.FINANCE])){
      const [rows,total]=await Promise.all([this.db.contract.findMany({where:{companyId:id},include:{person:{select:{fullName:true}}},orderBy:{createdAt:'desc'},take:100}),this.db.contract.count({where:{companyId:id}})]);
      sections.push(section('contracts','Contratos de alunos',[
        col('number','Número'),col('person','Aluno'),col('startDate','Início'),col('endDate','Término'),col('status','Situação'),
      ],rows.map(x=>({id:x.id,number:x.number,person:x.person.fullName,startDate:date(x.startDate),endDate:date(x.endDate),status:x.status})),total));
    }
    if(await this.permit(u,'triagem.vagas.visualizar',[UserRole.TRIAGE,UserRole.COMMERCIAL])){
      const [rows,total]=await Promise.all([this.db.vacancy.findMany({where:{companyId:id},include:{_count:{select:{applications:true}}},orderBy:{createdAt:'desc'},take:80}),this.db.vacancy.count({where:{companyId:id}})]);
      sections.push(section('vacancies','Vagas e candidaturas',[
        col('title','Vaga'),col('quantity','Quantidade'),col('applications','Candidatos'),col('status','Situação'),
      ],rows.map(x=>({id:x.id,title:x.title,quantity:x.quantity,applications:x._count.applications,status:x.status})),total));
    }
    if(await this.permit(u,'financeiro.titulos.visualizar',[UserRole.FINANCE])){
      const [rows,total]=await Promise.all([this.db.financialTitle.findMany({where:{companyId:id},include:{payments:{select:{amount:true}}},orderBy:{dueDate:'desc'},take:100}),this.db.financialTitle.count({where:{companyId:id}})]);
      sections.push(section('finance','Cobranças e pagamentos',[
        col('description','Título'),col('dueDate','Vencimento'),col('amount','Valor'),col('paid','Recebido'),col('outstanding','Saldo'),col('status','Situação'),
      ],rows.map(x=>({id:x.id,description:x.description,dueDate:date(x.dueDate),amount:money(x.amount),paid:x.payments.reduce((sum,p)=>sum+Number(p.amount),0),outstanding:Number(x.amount)-x.payments.reduce((sum,p)=>sum+Number(p.amount),0),status:x.status})),total));
    }
    if(await this.permit(u,'cadastros.company-contacts.listar',[UserRole.CONTRACTS,UserRole.COMMERCIAL,UserRole.HR])){
      const rows=await this.db.companyContact.findMany({where:{companyId:id},orderBy:{createdAt:'desc'},take:100});
      sections.push(section('contacts','Contatos da empresa',[
        col('fullName','Nome'),col('position','Cargo'),col('email','E-mail'),col('phone','Telefone'),col('status','Situação'),
      ],rows.map(x=>({id:x.id,fullName:x.fullName,position:x.position,email:x.email,phone:x.phone,status:x.status})),rows.length));
    }
    return {kind:'companies',id,title:r.tradeName||r.legalName,subtitle:r.legalName,status:r.status,
      fields:[field('Razão social',r.legalName),field('Nome fantasia',r.tradeName),field('CNPJ',r.cnpj),field('E-mail',r.email),field('Financeiro',r.financeEmail),field('Telefone',r.phone),field('Representante legal',r.legalRep),field('Cidade',r.city),field('Estado',r.state),field('Situação',r.status)],sections};
  }

  @Get('contracts/:id')
  async contract(@Param('id')id:string,@CurrentUser()u:any){
    await this.require(u,'contratos.instrumentos.visualizar',[UserRole.CONTRACTS,UserRole.HR,UserRole.FINANCE]);
    const r=await this.db.contract.findUniqueOrThrow({where:{id},include:{person:{select:{fullName:true}},company:{select:{tradeName:true}},course:{select:{name:true}}}});
    const sections:any[]=[];
    if(await this.permit(u,'contratos.movimentacoes.visualizar',[UserRole.CONTRACTS,UserRole.HR])){
      const rows=await this.db.contractMovement.findMany({where:{contractId:id},orderBy:{effectiveAt:'desc'},take:100});
      sections.push(section('movements','Movimentações do vínculo',[
        col('effectiveAt','Data'),col('kind','Movimentação'),col('previousState','Anterior'),col('newState','Nova'),col('reason','Motivo'),
      ],rows.map(x=>({id:x.id,effectiveAt:date(x.effectiveAt),kind:x.kind,previousState:x.previousState,newState:x.newState,reason:x.reason})),rows.length));
    }
    if(await this.permit(u,'contratos.aditivos.visualizar',[UserRole.CONTRACTS,UserRole.HR])){
      const rows=await this.db.contractAmendment.findMany({where:{contractId:id},orderBy:{effectiveAt:'desc'},take:100});
      sections.push(section('amendments','Aditivos e solicitações',[
        col('effectiveAt','Vigência'),col('type','Tipo'),col('description','Descrição'),col('status','Situação'),
      ],rows.map(x=>({id:x.id,effectiveAt:date(x.effectiveAt),type:x.type,description:x.description,status:x.status})),rows.length));
    }
    if(await this.permit(u,'matriculas.vinculos.visualizar',[UserRole.SECRETARY])){
      const rows=await this.db.enrollment.findMany({where:{contractId:id},include:{classGroup:{select:{name:true}},course:{select:{name:true}}},take:100});
      sections.push(section('enrollments','Vínculos acadêmicos',[
        col('group','Turma'),col('course','Curso'),col('startDate','Início'),col('status','Situação'),
      ],rows.map(x=>({id:x.id,group:x.classGroup?.name,course:x.course?.name,startDate:date(x.startDate),status:x.status})),rows.length));
    }
    if(await this.permit(u,'financeiro.titulos.visualizar',[UserRole.FINANCE])){
      const rows=await this.db.financialTitle.findMany({where:{contractId:id},include:{payments:true},orderBy:{dueDate:'desc'},take:100});
      sections.push(section('finance','Títulos e recebimentos',[
        col('description','Título'),col('dueDate','Vencimento'),col('amount','Valor'),col('paid','Pago'),col('outstanding','Saldo'),col('status','Situação'),
      ],rows.map(x=>({id:x.id,description:x.description,dueDate:date(x.dueDate),amount:money(x.amount),paid:x.payments.reduce((s,p)=>s+Number(p.amount),0),outstanding:Number(x.amount)-x.payments.reduce((s,p)=>s+Number(p.amount),0),status:x.status})),rows.length));
    }
    return {kind:'contracts',id,title:r.number||'Contrato sem número',subtitle:[r.person.fullName,r.company?.tradeName,r.course?.name].filter(Boolean).join(' · '),status:r.status,
      fields:[field('Aluno',r.person.fullName),field('Empresa',r.company?.tradeName),field('Curso',r.course?.name),field('Tipo',r.type),field('Início',date(r.startDate)),field('Fim previsto',date(r.endDate)),field('Suspensão',date(r.suspensionStart)),field('Desligamento',date(r.terminationDate)),field('Valor mensal',await this.permit(u,'contratos.valores.visualizar',[UserRole.CONTRACTS,UserRole.HR,UserRole.FINANCE])?money(r.monthlyValue):null),field('Observações',r.notes),field('Situação',r.status)],sections};
  }
}
