import { Controller, ForbiddenException, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/auth.guard.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { PrismaService } from '../common/prisma.service.js';

type DossierItem = { title: string; meta?: string; status?: string };
type Section = { title: string; items: DossierItem[] };
const hasAccess=(role:string, allowed:string[])=>['SUPER_ADMIN','ADMIN'].includes(role)||allowed.includes(role);
const V={
 people:['SECRETARY','CONTRACTS','TRIAGE','SOCIAL_SERVICE','RECEPTION','COMMERCIAL','HR'],
 companies:['CONTRACTS','FINANCE','COMMERCIAL','HR'],
 courses:['SECRETARY'], groups:['SECRETARY'], enrollments:['SECRETARY'], attendance:['SECRETARY'],
 contracts:['CONTRACTS','HR','FINANCE'], internships:['CONTRACTS','SECRETARY'],
 vacancies:['TRIAGE','COMMERCIAL'], finance:['FINANCE'], requests:['SOCIAL_SERVICE','RECEPTION','SECRETARY'],
 documents:['CONTRACTS','SECRETARY','HR','SOCIAL_SERVICE'],
} as Record<string,string[]>;
const item=(title:any,meta?:any,status?:any):DossierItem=>({title:String(title??'—'),meta:meta==null?'':String(meta),status:status==null?'':String(status)});
const sec=(title:string,items:DossierItem[]):Section=>({title,items});
const fld=(label:string,value:any)=>({label,value:value??null});
const money=(x:any)=>x==null?null:Number(x);
const join=(...parts:any[])=>parts.filter(x=>x!==null&&x!==undefined&&String(x).trim()!=='').join(' · ');

/** Resumo contextual. Nenhum endpoint devolve senhas, hashes, tokens ou caminhos privados. */
@Controller('dossiers')
@UseGuards(AuthGuard)
export class DossiersController {
 constructor(private readonly db:PrismaService){}
 @Get(':domain/:id')
 async get(@Param('domain')domain:string,@Param('id')id:string,@CurrentUser()user:{role:string;accessMode?:string}) {
  if(!V[domain]||(user.accessMode !== 'CUSTOM' && !hasAccess(user.role,V[domain])))throw new ForbiddenException('Sem permissão para consultar este cadastro');
  const role=user.role;
  const compact = (data:any) => user.accessMode === 'CUSTOM' ? {...data,sections:[]} : data;
  const allow=(...roles:string[])=>user.accessMode !== 'CUSTOM' && hasAccess(role,roles);
  if(domain==='people'){
   const r=await this.db.person.findUniqueOrThrow({where:{id},include:{
    enrollments:{include:{course:true,classGroup:true,company:true},orderBy:{createdAt:'desc'},take:40},
    contracts:{include:{company:true,course:true},orderBy:{createdAt:'desc'},take:40},
    attendances:{include:{classGroup:true},orderBy:{classDate:'desc'},take:30},
    grades:{include:{classGroup:true},orderBy:{date:'desc'},take:30},
    applications:{include:{vacancy:true},orderBy:{createdAt:'desc'},take:30},
    serviceRequests:{orderBy:{createdAt:'desc'},take:30},documents:{orderBy:{createdAt:'desc'},take:30}
   }});
   return {title:r.fullName,subtitle:join(r.socialName,r.city,r.state),fields:[fld('Nome completo',r.fullName),fld('Nome social',r.socialName),fld('CPF',r.cpf),fld('RG',r.rg),fld('Data de nascimento',r.birthDate),fld('Situação',r.status),fld('E-mail',r.email),fld('Telefone',r.phone),fld('Telefone adicional',r.secondaryPhone),fld('CEP',r.zipCode),fld('Logradouro',r.address),fld('Número',r.addressNumber),fld('Complemento',r.addressExtra),fld('Bairro',r.district),fld('Cidade',r.city),fld('Estado',r.state),fld('Nome da mãe',r.motherName),fld('Nome do pai',r.fatherName),fld('Responsável legal',r.legalGuardian),fld('CPF do responsável',r.guardianCpf),fld('E-mail do responsável',r.guardianEmail)],sections:[
    allow('SECRETARY','CONTRACTS','HR')?sec('Matrículas e turmas',r.enrollments.map(x=>item(x.course?.name||x.classGroup?.name||'Matrícula',join(x.classGroup?.name,x.company?.tradeName,x.startDate?.toLocaleDateString('pt-BR')),x.status))):null,
    allow('CONTRACTS','HR')?sec('Contratos',r.contracts.map(x=>item(x.number||x.type||'Contrato',join(x.company?.tradeName,x.course?.name),x.status))):null,
    allow('SECRETARY')?sec('Frequência recente',r.attendances.map(x=>item(x.classGroup.name,join(x.classDate.toLocaleDateString('pt-BR'),x.sessionKey),x.present?'PRESENTE':x.justified?'FALTA_JUSTIFICADA':'FALTA'))):null,
    allow('SECRETARY')?sec('Notas e avaliações',r.grades.map(x=>item(x.label,join(x.classGroup.name,`${x.value}/${x.maxValue||10}`)))):null,
    allow('TRIAGE','COMMERCIAL')?sec('Candidaturas',r.applications.map(x=>item(x.vacancy.title,x.vacancy.city,x.status))):null,
    allow('RECEPTION','SOCIAL_SERVICE','SECRETARY')?sec('Requerimentos',r.serviceRequests.map(x=>item(x.type,x.description?.slice(0,160),x.status))):null,
    allow('SECRETARY','CONTRACTS','HR','SOCIAL_SERVICE')?sec('Documentos',r.documents.map(x=>item(x.fileName,x.type,x.status))):null
   ].filter(Boolean)};
  }
  if(domain==='companies'){
   const r=await this.db.company.findUniqueOrThrow({where:{id},include:{
    contracts:{include:{person:true},orderBy:{createdAt:'desc'},take:40},
    vacancies:{include:{_count:{select:{applications:true}}},orderBy:{createdAt:'desc'},take:40},
    financialTitles:{include:{payments:true},orderBy:{dueDate:'desc'},take:40},
    companyContactEntries:{take:40},businessContractEntries:{orderBy:{createdAt:'desc'},take:40}
   }});
   return {title:r.tradeName||r.legalName,subtitle:r.legalName,fields:[fld('Razão social',r.legalName),fld('Nome fantasia',r.tradeName),fld('CNPJ',r.cnpj),fld('Situação',r.status),fld('E-mail',r.email),fld('E-mail financeiro',r.financeEmail),fld('Telefone',r.phone),fld('CEP',r.zipCode),fld('Endereço',r.address),fld('Número',r.addressNumber),fld('Bairro',r.district),fld('Cidade',r.city),fld('Estado',r.state),fld('Representante legal',r.legalRep)],sections:[
    sec('Contatos',r.companyContactEntries.map(x=>item(x.fullName,join(x.position,x.email,x.phone),x.status))),
    allow('CONTRACTS','HR')?sec('Contratos de alunos',r.contracts.map(x=>item(x.person.fullName,join(x.number,x.type),x.status))):null,
    allow('TRIAGE','COMMERCIAL','CONTRACTS')?sec('Vagas',r.vacancies.map(x=>item(x.title,`${x._count.applications} candidaturas`,x.status))):null,
    allow('FINANCE')?sec('Títulos financeiros',r.financialTitles.map(x=>item(x.description,join(`R$ ${money(x.amount)?.toFixed(2)}`,x.dueDate.toLocaleDateString('pt-BR'),`${x.payments.length} pagamento(s)`),x.status))):null,
    allow('CONTRACTS','HR','FINANCE')?sec('Contratos empresariais',r.businessContractEntries.map(x=>item(x.number,join(x.modality,x.startDate.toLocaleDateString('pt-BR')),x.status))):null
   ].filter(Boolean)};
  }
  if(domain==='courses'){
   const r=await this.db.course.findUniqueOrThrow({where:{id},include:{classGroups:{orderBy:{createdAt:'desc'},take:60},disciplines:{orderBy:{createdAt:'desc'},take:70},curriculumMatrixEntries:{orderBy:{createdAt:'desc'},take:15},_count:{select:{enrollments:true,classGroups:true}}}});
   return {title:r.name,subtitle:join(r.code,r.modality),fields:[fld('Curso',r.name),fld('Código',r.code),fld('Modalidade',r.modality),fld('Carga horária',r.workload),fld('Carga teórica',r.theoryWorkloadRaw),fld('Carga prática',r.practiceWorkloadRaw),fld('Protocolo de autorização',r.authorizationProtocol),fld('Situação',r.status),fld('Turmas cadastradas',r._count.classGroups),fld('Matrículas cadastradas',r._count.enrollments)],sections:[sec('Turmas',r.classGroups.map(x=>item(x.name,join(x.unit,x.room,x.startDate?.toLocaleDateString('pt-BR')),x.status))),sec('Disciplinas e módulos',r.disciplines.map(x=>item(x.name,join(x.phaseCode,x.moduleLabel,x.workloadRaw)))),sec('Matrizes curriculares',r.curriculumMatrixEntries.map(x=>item(x.title,join(x.code,x.version),x.status)))]};
  }
  if(domain==='groups'){
   const r=await this.db.classGroup.findUniqueOrThrow({where:{id},include:{course:true,enrollments:{include:{person:true,company:true},orderBy:{createdAt:'desc'},take:100},teacherAssignments:{include:{user:true},take:30},academicLessonEntries:{orderBy:{lessonDate:'desc'},take:30},_count:{select:{enrollments:true,attendances:true}}}});
   return {title:r.name,subtitle:join(r.course?.name,r.unit),fields:[fld('Turma',r.name),fld('Código',r.code),fld('Curso',r.course?.name),fld('Unidade',r.unit),fld('Sala',r.room),fld('Tipo',r.type),fld('Data de início',r.startDate),fld('Data de término',r.endDate),fld('Situação',r.status),fld('Alunos vinculados',r._count.enrollments),fld('Registros de frequência',r._count.attendances)],sections:[sec('Alunos da turma',r.enrollments.map(x=>item(x.person.fullName,x.company?.tradeName,x.status))),sec('Facilitadores vinculados',r.teacherAssignments.map(x=>item(x.user.name,x.user.email))),sec('Aulas registradas',r.academicLessonEntries.map(x=>item(x.lessonDate.toLocaleDateString('pt-BR'),x.title||'',x.state)))]};
  }
  if(domain==='enrollments'){
   const r=await this.db.enrollment.findUniqueOrThrow({where:{id},include:{person:true,course:true,classGroup:true,company:true,contract:true}});
   return {title:r.person.fullName,subtitle:join(r.course?.name,r.classGroup?.name),fields:[fld('Pessoa',r.person.fullName),fld('Curso',r.course?.name),fld('Turma',r.classGroup?.name),fld('Empresa',r.company?.tradeName),fld('Contrato',r.contract?.number),fld('Início da matrícula',r.startDate),fld('Término',r.endDate),fld('Início na lista de chamada',r.rosterStartDate),fld('Término na lista',r.rosterEndDate),fld('Dia de retorno',r.returnDay),fld('Situação',r.status)],sections:[]};
  }
  if(domain==='attendance'){
   const r=await this.db.attendance.findUniqueOrThrow({where:{id},include:{person:true,classGroup:true,absenceJustificationEntries:true}});
   return {title:r.person.fullName,subtitle:r.classGroup.name,fields:[fld('Aluno',r.person.fullName),fld('Turma',r.classGroup.name),fld('Data da aula',r.classDate),fld('Sessão',r.sessionKey),fld('Código original',r.legacyCode),fld('Presença',r.present),fld('Justificada',r.justified),fld('Motivo',r.reason)],sections:[sec('Justificativas vinculadas',r.absenceJustificationEntries.map(x=>item(x.reason,x.createdAt.toLocaleDateString('pt-BR'),x.status)))]};
  }
  if(domain==='contracts'){
   const r=await this.db.contract.findUniqueOrThrow({where:{id},include:{person:true,company:true,course:true,internships:true,enrollments:true,contractAmendmentEntries:{orderBy:{effectiveAt:'desc'},take:30},contractMovementEntries:{orderBy:{effectiveAt:'desc'},take:30},financialTitles:{take:30},documents:{take:30}}});
   return {title:r.number||'Contrato',subtitle:join(r.person.fullName,r.company?.tradeName),fields:[fld('Número',r.number),fld('Aluno',r.person.fullName),fld('Empresa',r.company?.tradeName),fld('Curso',r.course?.name),fld('Tipo',r.type),fld('Situação',r.status),fld('Início',r.startDate),fld('Término previsto',r.endDate),fld('Início da suspensão',r.suspensionStart),fld('Fim da suspensão',r.suspensionEnd),fld('Data de desligamento',r.terminationDate),fld('Valor mensal',money(r.monthlyValue)),fld('Observações',r.notes)],sections:[sec('Movimentações',r.contractMovementEntries.map(x=>item(x.kind,join(x.effectiveAt.toLocaleDateString('pt-BR'),x.reason),x.newState))),sec('Aditivos',r.contractAmendmentEntries.map(x=>item(x.type,join(x.effectiveAt.toLocaleDateString('pt-BR'),x.description),x.status))),sec('Estágios',r.internships.map(x=>item(x.institution||x.courseName||'Estágio',x.supervisorName,x.status))),sec('Matrículas vinculadas',r.enrollments.map(x=>item(x.id,x.returnDay,x.status))),allow('FINANCE','CONTRACTS','HR')?sec('Títulos financeiros',r.financialTitles.map(x=>item(x.description,join(x.dueDate.toLocaleDateString('pt-BR'),`R$ ${money(x.amount)?.toFixed(2)}`),x.status))):null,sec('Documentos',r.documents.map(x=>item(x.fileName,x.type,x.status)))].filter(Boolean)};
  }
  if(domain==='internships'){
   const r=await this.db.internship.findUniqueOrThrow({where:{id},include:{contract:{include:{person:true,company:true}},internshipReportEntries:{orderBy:{createdAt:'desc'},take:30},internshipLeaveEntries:{orderBy:{createdAt:'desc'},take:30}}});
   return {title:r.contract.person.fullName,subtitle:r.contract.company?.tradeName,fields:[fld('Estagiário',r.contract.person.fullName),fld('Empresa',r.contract.company?.tradeName),fld('Instituição',r.institution),fld('Curso',r.courseName),fld('Semestre',r.semester),fld('Supervisor',r.supervisorName),fld('E-mail do supervisor',r.supervisorEmail),fld('Carga horária semanal',r.weeklyHours),fld('Início da jornada',r.startTime),fld('Fim da jornada',r.endTime),fld('Apólice de seguro',r.insurancePolicy),fld('Situação',r.status)],sections:[sec('Relatórios de estágio',r.internshipReportEntries.map(x=>item(x.kind,join(x.periodStart.toLocaleDateString('pt-BR'),x.periodEnd.toLocaleDateString('pt-BR')),x.status))),sec('Recessos',r.internshipLeaveEntries.map(x=>item(join(x.startDate.toLocaleDateString('pt-BR'),x.endDate.toLocaleDateString('pt-BR')),x.reason,x.status)))]};
  }
  if(domain==='vacancies'){
   const r=await this.db.vacancy.findUniqueOrThrow({where:{id},include:{company:true,applications:{include:{person:true},orderBy:{createdAt:'desc'},take:100}}});
   return {title:r.title,subtitle:r.company.tradeName||r.company.legalName,fields:[fld('Vaga',r.title),fld('Empresa',r.company.tradeName||r.company.legalName),fld('Área',r.area),fld('Perfil',r.profile),fld('Atividades',r.activities),fld('Cidade',r.city),fld('Bairro',r.district),fld('Idade mínima',r.minAge),fld('Idade máxima',r.maxAge),fld('Quantidade de vagas',r.quantity),fld('Bolsa',money(r.scholarship)),fld('Prazo',r.expiresAt),fld('Situação',r.status)],sections:[sec('Candidatos inscritos',r.applications.map(x=>item(x.person.fullName,x.notes,x.status)))]};
  }
  if(domain==='finance'){
   const r=await this.db.financialTitle.findUniqueOrThrow({where:{id},include:{company:true,contract:{include:{person:true}},payments:{orderBy:{paidAt:'desc'}},billingAttachmentEntries:{take:20}}});
   const paid=r.payments.reduce((s,x)=>s+Number(x.amount),0);
   return {title:r.description,subtitle:join(r.company?.tradeName,r.contract?.person.fullName),fields:[fld('Descrição',r.description),fld('Empresa',r.company?.tradeName),fld('Pessoa',r.contract?.person.fullName),fld('Competência',r.competence),fld('Vencimento',r.dueDate),fld('Valor do título',money(r.amount)),fld('Total recebido',paid),fld('Saldo',Math.max(0,Number(r.amount)-paid)),fld('Referência bancária',r.bankRef),fld('Situação',r.status)],sections:[sec('Pagamentos registrados',r.payments.map(x=>item(`R$ ${Number(x.amount).toFixed(2)}`,join(x.paidAt.toLocaleDateString('pt-BR'),x.externalRef))))]};
  }
  if(domain==='requests'){
   const r=await this.db.serviceRequest.findUniqueOrThrow({where:{id},include:{person:true,serviceInteractionEntries:{include:{author:true},orderBy:{createdAt:'asc'},take:100}}});
   return {title:r.type,subtitle:r.person?.fullName||'',fields:[fld('Tipo de solicitação',r.type),fld('Solicitante',r.person?.fullName),fld('Descrição',r.description),fld('Resposta',r.response),fld('Data de abertura',r.createdAt),fld('Prazo',r.dueDate),fld('Situação',r.status)],sections:[sec('Histórico do atendimento',r.serviceInteractionEntries.map(x=>item(x.author.name,join(x.createdAt.toLocaleString('pt-BR'),x.body),x.status)))]};
  }
  if(domain==='documents'){
   const r=await this.db.document.findUniqueOrThrow({where:{id},include:{person:true,contract:true,documentReviewEntries:{include:{reviewer:true},orderBy:{createdAt:'desc'},take:30}}});
   return {title:r.fileName,subtitle:join(r.type,r.person?.fullName),fields:[fld('Arquivo',r.fileName),fld('Tipo',r.type),fld('Pessoa',r.person?.fullName),fld('Contrato',r.contract?.number),fld('Versão',r.version),fld('Situação',r.status),fld('Cadastrado em',r.createdAt)],sections:[sec('Análises do documento',r.documentReviewEntries.map(x=>item(x.reviewer.name,join(x.reviewedAt?.toLocaleDateString('pt-BR'),x.note),x.status)))]};
  }
  throw new ForbiddenException('Consulta indisponível');
 }
}
