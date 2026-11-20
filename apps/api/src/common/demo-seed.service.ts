import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PasswordAlgorithm, UserRole } from '../generated/prisma/client.js';
import { PrismaService } from './prisma.service.js';

/** Synthetic records for isolated local usability tests. Never loads production data. */
@Injectable()
export class DemoSeedService implements OnApplicationBootstrap {
  constructor(private readonly db: PrismaService) {}
  async onApplicationBootstrap(){
    if (process.env.DEMO_SEED_ENABLED!=='true') return;
    const pw=process.env.DEMO_PASSWORD||'';
    if (pw.length<14 || pw.includes('change-me')) throw new Error('Defina DEMO_PASSWORD com ao menos 14 caracteres via scripts/setup.');
    const hash=await argon2.hash(pw,{type:argon2.argon2id});
    const db=this.db;
    const unit=await db.unit.upsert({where:{code:'DEMO-BEL'},update:{},create:{code:'DEMO-BEL',name:'Unidade demonstrativa Belém',city:'Belém',state:'PA'}});
    const dept=await db.department.upsert({where:{code:'DEMO-SEC'},update:{},create:{code:'DEMO-SEC',name:'Secretaria'}});
    const company=await db.company.findFirst({where:{tradeName:'Empresa Demonstração Proativa'}}) || await db.company.create({data:{legalName:'Empresa Fictícia para Homologação Ltda.',tradeName:'Empresa Demonstração Proativa',status:'ACTIVE',city:'Belém',state:'PA'}});
    const person=await db.person.findFirst({where:{email:'aluno@demo.local'}}) || await db.person.create({data:{fullName:'Aluno Demonstração',email:'aluno@demo.local',city:'Belém',state:'PA',legalGuardian:'Responsável Demonstrativo'}});
    const personTwo=await db.person.findFirst({where:{email:'estagiario@demo.local'}}) || await db.person.create({data:{fullName:'Estagiária Demonstração',email:'estagiario@demo.local',city:'Belém',state:'PA'}});
    const user=async(email:string,name:string,role:UserRole,login:string,extra:Record<string,any>={})=>db.user.upsert({where:{email},update:{},create:{email,name,login,passwordHash:hash,passwordAlgorithm:PasswordAlgorithm.ARGON2ID,role,active:true,...extra}});
    const secret=await user('secretaria@demo.local','Secretaria - Demo',UserRole.SECRETARY,'demo_secretaria');
    await user('contratos@demo.local','Contratos - Demo',UserRole.CONTRACTS,'demo_contratos');
    await user('financeiro@demo.local','Financeiro - Demo',UserRole.FINANCE,'demo_financeiro');
    const teacher=await user('facilitador@demo.local','Facilitador - Demo',UserRole.PROFESSOR,'demo_facilitador');
    const stu=await user('aluno@demo.local','Aluno Demonstração',UserRole.STUDENT,'demo_aluno',{personId:person.id});
    const emp=await user('empresa@demo.local','Empresa - Demo',UserRole.COMPANY,'demo_empresa',{companyId:company.id});
    const supervisor=await user('supervisor@demo.local','Supervisor - Demo',UserRole.INTERNSHIP_SUPERVISOR,'demo_supervisor',{companyId:company.id});
    await db.userUnit.upsert({where:{userId_unitId:{userId:secret.id,unitId:unit.id}},update:{},create:{userId:secret.id,unitId:unit.id,departmentId:dept.id}});
    const course=await db.course.findFirst({where:{code:'DEM-ADM'}})||await db.course.create({data:{name:'Aprendizagem em Administração (Demonstração)',code:'DEM-ADM',modality:'APRENDIZAGEM',workload:400}});
    const prep=await db.course.findFirst({where:{code:'DEM-PREP'}})||await db.course.create({data:{name:'Preparatório de Jovens (Demonstração)',code:'DEM-PREP',modality:'PREPARATORIO',workload:80}});
    const group=await db.classGroup.findFirst({where:{code:'DEM-ADM-M'}})||await db.classGroup.create({data:{name:'Administração Manhã',code:'DEM-ADM-M',type:'APRENDIZAGEM',courseId:course.id,unit:'Belém',room:'Sala Exemplo 01'}});
    const prepGroup=await db.classGroup.findFirst({where:{code:'DEM-PREP-T'}})||await db.classGroup.create({data:{name:'Preparatório Tarde',code:'DEM-PREP-T',type:'PREPARATORIO',courseId:prep.id,room:'Sala Exemplo 02'}});
    const discipline=await db.discipline.findFirst({where:{name:'Atendimento ao Público (Demonstração)'}})||await db.discipline.create({data:{name:'Atendimento ao Público (Demonstração)',courseId:course.id,workloadRaw:'16'}});
    await db.teacherAssignment.upsert({where:{userId_classGroupId:{userId:teacher.id,classGroupId:group.id}},update:{},create:{userId:teacher.id,classGroupId:group.id}});
    await db.disciplineTeacher.upsert({where:{courseId_disciplineId_teacherId:{courseId:course.id,disciplineId:discipline.id,teacherId:teacher.id}},update:{},create:{courseId:course.id,disciplineId:discipline.id,teacherId:teacher.id}});
    const contract=await db.contract.findFirst({where:{number:'DEMO-APR-001'}})||await db.contract.create({data:{personId:person.id,companyId:company.id,courseId:course.id,number:'DEMO-APR-001',type:'APRENDIZAGEM',status:'ACTIVE',startDate:new Date('2026-10-01'),endDate:new Date('2027-09-30'),monthlyValue:350}});
    const stageContract=await db.contract.findFirst({where:{number:'DEMO-EST-001'}})||await db.contract.create({data:{personId:personTwo.id,companyId:company.id,number:'DEMO-EST-001',type:'ESTAGIO',status:'ACTIVE',startDate:new Date('2026-09-01'),endDate:new Date('2027-08-31')}});
    const internship=await db.internship.findFirst({where:{contractId:stageContract.id}})||await db.internship.create({data:{contractId:stageContract.id,institution:'Faculdade Exemplo',supervisorName:'Supervisor - Demo',courseName:'Administração',semester:'3º',weeklyHours:20}});
    if(!await db.enrollment.findFirst({where:{personId:person.id,courseId:course.id}}))await db.enrollment.create({data:{personId:person.id,courseId:course.id,classGroupId:group.id,companyId:company.id,contractId:contract.id,startDate:new Date('2026-10-01'),status:'ACTIVE'}});
    if(!await db.enrollment.findFirst({where:{personId:personTwo.id,courseId:prep.id}}))await db.enrollment.create({data:{personId:personTwo.id,courseId:prep.id,classGroupId:prepGroup.id,startDate:new Date('2026-10-15'),status:'ACTIVE'}});
    await db.attendance.upsert({where:{personId_classGroupId_classDate_sessionKey:{personId:person.id,classGroupId:group.id,classDate:new Date('2026-11-10'),sessionKey:'turn'}},update:{},create:{personId:person.id,classGroupId:group.id,classDate:new Date('2026-11-10'),sessionKey:'turn',present:true,legacyCode:'P'}});
    if(!await db.grade.findFirst({where:{personId:person.id,classGroupId:group.id,label:'Avaliação demonstrativa'}})) await db.grade.create({data:{personId:person.id,classGroupId:group.id,label:'Avaliação demonstrativa',value:8.5,maxValue:10}});
    const title=await db.financialTitle.findFirst({where:{bankRef:'DEMO-TIT-001'}})||await db.financialTitle.create({data:{companyId:company.id,contractId:contract.id,description:'Serviços educacionais - Demonstração',competence:'2026-11',dueDate:new Date('2026-11-30'),amount:350,bankRef:'DEMO-TIT-001'}});
    await db.payment.upsert({where:{financialTitleId_externalRef:{financialTitleId:title.id,externalRef:'DEMO-PAG-001'}},update:{},create:{financialTitleId:title.id,externalRef:'DEMO-PAG-001',paidAt:new Date('2026-11-10'),amount:100}});
    await db.financialTitle.update({where:{id:title.id},data:{status:'IN_PROGRESS'}});
    const vacancy=await db.vacancy.findFirst({where:{companyId:company.id,title:'Vaga demonstrativa de aprendiz'}})||await db.vacancy.create({data:{companyId:company.id,title:'Vaga demonstrativa de aprendiz',profile:'Administração',quantity:2,city:'Belém'}});
    await db.application.upsert({where:{vacancyId_personId:{vacancyId:vacancy.id,personId:person.id}},update:{},create:{vacancyId:vacancy.id,personId:person.id,status:'OPEN'}});
    const req=await db.serviceRequest.findFirst({where:{personId:person.id,type:'Requerimento demonstrativo'}})||await db.serviceRequest.create({data:{personId:person.id,type:'Requerimento demonstrativo',description:'Solicitação de declaração para teste',status:'OPEN'}});
    if(!await db.serviceInteraction.findFirst({where:{requestId:req.id,authorId:secret.id}}))await db.serviceInteraction.create({data:{requestId:req.id,authorId:secret.id,body:'Solicitação recebida. Avaliação pendente.'}});
    const matrix=await db.curriculumMatrix.findFirst({where:{courseId:course.id,code:'MATRIZ-DEMO'}})||await db.curriculumMatrix.create({data:{courseId:course.id,code:'MATRIZ-DEMO',version:'1.0',title:'Matriz de demonstração'}});
    if(!await db.curriculumModule.findFirst({where:{matrixId:matrix.id,title:'Atendimento ao Público'}}))await db.curriculumModule.create({data:{matrixId:matrix.id,title:'Atendimento ao Público',disciplineId:discipline.id,sequence:1,plannedHours:16,lessonCount:4}});
    if(!await db.academicLesson.findFirst({where:{classGroupId:group.id,title:'Aula demonstrativa de Atendimento'}}))await db.academicLesson.create({data:{classGroupId:group.id,disciplineId:discipline.id,teacherId:teacher.id,title:'Aula demonstrativa de Atendimento',lessonDate:new Date('2026-11-12'),shift:'MANHA',room:'Sala Exemplo 01'}});
    const account=await db.financeAccount.findFirst({where:{name:'Caixa demonstrativo'}})||await db.financeAccount.create({data:{name:'Caixa demonstrativo',bankName:'Simulação local'}});
    const category=await db.financeCategory.findFirst({where:{name:'Mensalidades demo'}})||await db.financeCategory.create({data:{name:'Mensalidades demo',kind:'RECEITA'}});
    if(!await db.financeMovement.findFirst({where:{externalReference:'DEMO-MOV-001'}}))await db.financeMovement.create({data:{accountId:account.id,categoryId:category.id,direction:'IN',description:'Recebimento fictício',occurredAt:new Date('2026-11-10'),amount:100,externalReference:'DEMO-MOV-001'}});
    const invoice=await db.invoice.upsert({where:{reference:'DEMO-FAT-001'},update:{},create:{reference:'DEMO-FAT-001',companyId:company.id,competence:'2026-11',dueDate:new Date('2026-11-30'),amount:350}});
    if(!await db.invoiceLine.findFirst({where:{invoiceId:invoice.id,description:'Formação de aprendiz - exemplo'}}))await db.invoiceLine.create({data:{invoiceId:invoice.id,description:'Formação de aprendiz - exemplo',quantity:1,unitPrice:350,amount:350}});
    const institution=await db.institution.findFirst({where:{name:'Instituição de Ensino Demonstrativa'}})||await db.institution.create({data:{name:'Instituição de Ensino Demonstrativa',city:'Belém',state:'PA'}});
    if(!await db.institutionCourse.findFirst({where:{institutionId:institution.id,name:'Administração'}}))await db.institutionCourse.create({data:{institutionId:institution.id,name:'Administração',level:'SUPERIOR'}});
    const sp=await db.internshipSupervisor.findFirst({where:{companyId:company.id,fullName:'Supervisor - Demo'}})||await db.internshipSupervisor.create({data:{companyId:company.id,userId:supervisor.id,fullName:'Supervisor - Demo',email:'supervisor@demo.local'}});
    if(!await db.internshipReport.findFirst({where:{internshipId:internship.id,kind:'RA'}}))await db.internshipReport.create({data:{internshipId:internship.id,supervisorId:sp.id,kind:'RA',periodStart:new Date('2026-10-01'),periodEnd:new Date('2026-10-31'),content:'Relatório demonstrativo, sem validade oficial.'}});
    if(!await db.documentTemplate.findFirst({where:{name:'Declaração demonstrativa'}}))await db.documentTemplate.create({data:{name:'Declaração demonstrativa',type:'DECLARACAO',templateText:'Declaramos que {aluno} encontra-se matriculado no curso {curso}.\nModelo demonstrativo, sujeito a homologação.',version:1}});
    console.info('[demo] Dados fictícios idempotentes disponíveis para testes de usabilidade.');
  }
}
