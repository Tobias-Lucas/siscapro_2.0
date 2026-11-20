/**
 * Opt-in local ONLY: creates standard IAM templates and synthetic development identities.
 * No production execution; does not overwrite existing passwords or grant escalated roles.
 * May read separately held planned credential Markdown (never included in source archives).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient, UserRole, PasswordAlgorithm } from '../src/generated/prisma/client.js';
import { PERMISSIONS } from '../src/iam/permissions.js';

const root = path.resolve(process.cwd());
if (process.env.NODE_ENV !== 'development' || process.env.DEV_USERS_PROVISIONING !== 'CONFIRMED_LOCAL_ONLY') {
  throw new Error('Provisionamento bloqueado: defina NODE_ENV=development e DEV_USERS_PROVISIONING=CONFIRMED_LOCAL_ONLY no .env.development.');
}
if (!process.env.DATABASE_URL || !/localhost|127\.0\.0\.1/.test(new URL(process.env.DATABASE_URL).hostname)) {
  throw new Error('Banco fora de localhost. O provisionamento e exclusivo do ambiente local.');
}
const prisma = new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});

type Profile = {login:string; label:string; role:UserRole; allow:string[]; readOnly?:boolean};
const profiles:Profile[] = [
  {login:'admin',label:'Superadministrador',role:UserRole.SUPER_ADMIN,allow:[]},
  {login:'administracao',label:'Administracao',role:UserRole.ADMIN,allow:['painel.','usuarios.','integracao.','cadastros.','relatorios.']},
  {login:'diretoria',label:'Diretoria',role:UserRole.ADMIN,allow:['painel.','relatorios.','alunos.','empresas.','contratos.','financeiro.','secretaria.'],readOnly:true},
  {login:'juridico',label:'Juridico',role:UserRole.CONTRACTS,allow:['painel.','contratos.','documentos.','empresas.cadastro.','relatorios.contratuais.','empresas.demandas.']},
  {login:'secretaria',label:'Secretaria',role:UserRole.SECRETARY,allow:['painel.','alunos.','matriculas.','secretaria.','cronogramas.','relatorios.academicos.','atendimento.requerimentos.']},
  {login:'financeiro',label:'Financeiro',role:UserRole.FINANCE,allow:['painel.','financeiro.','relatorios.financeiros.','empresas.cadastro.','empresas.demandas.']},
  {login:'triagem',label:'Triagem',role:UserRole.TRIAGE,allow:['painel.','triagem.','alunos.cadastro.','empresas.demandas.']},
  {login:'contratos',label:'Contratos',role:UserRole.CONTRACTS,allow:['painel.','contratos.','alunos.cadastro.','empresas.','documentos.','relatorios.contratuais.']},
  {login:'servicosocial',label:'Servico Social',role:UserRole.SOCIAL_SERVICE,allow:['painel.','alunos.cadastro.','atendimento.','empresas.demandas.']},
  {login:'recepcao',label:'Recepcao',role:UserRole.RECEPTION,allow:['painel.','alunos.cadastro.','atendimento.requerimentos.','empresas.demandas.']},
  {login:'comercial',label:'Comercial',role:UserRole.COMMERCIAL,allow:['painel.','empresas.','triagem.','empresas.demandas.']},
  {login:'dp',label:'Departamento Pessoal',role:UserRole.HR,allow:['painel.','contratos.','empresas.cadastro.','empresas.demandas.']},
  {login:'marketing',label:'Marketing',role:UserRole.COMMERCIAL,allow:['painel.','triagem.vagas.','empresas.demandas.']},
  {login:'atendimento',label:'Atendimento',role:UserRole.RECEPTION,allow:['painel.','atendimento.','empresas.demandas.']},
  {login:'demandas',label:'Demandas',role:UserRole.RECEPTION,allow:['painel.','empresas.demandas.','relatorios.demandas.']},
  {login:'documentos',label:'Documentos',role:UserRole.CONTRACTS,allow:['painel.','documentos.']},
  {login:'estagio',label:'Estagio',role:UserRole.SECRETARY,allow:['painel.','estagio.','relatorios.academicos.']},
  {login:'relatorios',label:'Relatorios',role:UserRole.RECEPTION,allow:['painel.','relatorios.'],readOnly:true},
  {login:'aluno',label:'Aluno Preparatório',role:UserRole.STUDENT,allow:[]},
  {login:'aprendiz',label:'Aprendiz',role:UserRole.APPRENTICE,allow:[]},
  {login:'candidato',label:'Candidato',role:UserRole.CANDIDATE,allow:[]},
  {login:'responsavel',label:'Responsavel Legal',role:UserRole.LEGAL_GUARDIAN,allow:[]},
  {login:'professor',label:'Professor',role:UserRole.PROFESSOR,allow:[]},
  {login:'empresa',label:'Empresa Parceira',role:UserRole.COMPANY,allow:[]},
  {login:'supervisor',label:'Supervisor de Estagio',role:UserRole.INTERNSHIP_SUPERVISOR,allow:[]},
];
const readAction=(code:string)=>/\.(listar|visualizar|ver|exportar)$/.test(code);
const makeGrants=(profile:Profile)=> PERMISSIONS.filter(item => profile.allow.some(prefix=>item.code.startsWith(prefix)) && (!profile.readOnly || readAction(item.code)))
  .map(item=>({code:item.code,scope:'GLOBAL'}));
const flags = process.argv.slice(2);
const flagIndex=flags.indexOf('--credentials-file');
let importedCredentials=new Map<string,string>();
if(flagIndex>=0){
 const name=flags[flagIndex+1]; if(!name)throw new Error('Informe o caminho do arquivo de credenciais.');
 const full=path.resolve(name);const contents=fs.readFileSync(full,'utf8');
 for(const line of contents.split(/\r?\n/)){
  const cols=line.split('|').map(s=>s.trim().replace(/`/g,''));
  const login=cols.find(v=>/^[a-z]+\.aitinet$/.test(v));
  if(login){const i=cols.indexOf(login);const password=cols[i+2]; if(password&&password.length>=14)importedCredentials.set(login,password);}
 }
 if(importedCredentials.size !== profiles.length) throw new Error(`Arquivo externo nao contem as ${profiles.length} credenciais esperadas. Nada foi provisionado.`);
}
const file = path.join(root,'.local-dev-users-credentials.md');
if(fs.existsSync(file))throw new Error('Arquivo local de senhas ja existe. Proteja/remova ou renomeie-o antes de uma nova criacao. Nenhuma conta alterada.');
const output:string[]=['# Contas criadas em desenvolvimento - PROATIVA 2.0', '', 'Arquivo confidencial. Nunca enviar ao Git, usar em producao ou incluir em arquivos SQL.', '', '| Usuario | Senha inicial | Resultado |','|---|---|---|'];
let created=0,already=0;
async function main(){
 for(const profile of profiles){
  const code=`dev_${profile.login}`;
  const grants=makeGrants(profile);
  let template=await prisma.accessTemplate.findUnique({where:{code}});
  if(!template){
   template=await prisma.accessTemplate.create({data:{code,name:`${profile.label} - Desenvolvimento`,description:`Template inicial de ${profile.label}; menor privilegio, sem homologacao funcional.`,
    grants:{create:grants},revisions:{create:{version:1,changeNote:'Provisionamento local inicial',grants:{create:grants}}}}});
  }
  const login=`${profile.login}.aitinet`, email=`${login}@proativa.test`;
  const existing=await prisma.user.findFirst({where:{OR:[{email},{login}]}});
  if(existing){
   if(existing.email!==email || existing.login!==login)throw new Error(`Login ou email ja existe em outra conta: ${login}`);
   already++; output.push(`| ${login} | (inalterada; utilize a senha anterior) | Existente |`);continue;
  }
  const password=importedCredentials.get(login) || crypto.randomBytes(23).toString('base64url');
  let personId:string|undefined;
  if([UserRole.STUDENT,UserRole.APPRENTICE,UserRole.CANDIDATE].includes(profile.role)){
   const person=await prisma.person.create({data:{fullName:`Pessoa Ficticia ${profile.label}`,email}});
   personId=person.id;
  }
  let companyId:string|undefined;
  if(profile.role===UserRole.COMPANY){
   const company=await prisma.company.create({data:{legalName:'EMPRESA FICTICIA - DESENVOLVIMENTO',email}});
   companyId=company.id;
  }
  await prisma.user.create({data:{name:`Teste ${profile.label}`,login,email,role:profile.role,personId,companyId,
   passwordHash:await argon2.hash(password,{type:argon2.argon2id}),passwordAlgorithm:PasswordAlgorithm.ARGON2ID,
   accessMode:profile.role===UserRole.SUPER_ADMIN?'LEGACY':'CUSTOM',
   accessTemplateId:profile.role===UserRole.SUPER_ADMIN?null:template.id,
   accessTemplateVersion:profile.role===UserRole.SUPER_ADMIN?null:template.version,
   active:true}});
  created++; output.push(`| ${login} | \`${password}\` | Criado |`);
 }
 fs.writeFileSync(file,output.join('\n')+'\n',{encoding:'utf8',mode:0o600,flag:'wx'});
 console.log(`Templates presentes: ${profiles.length}; contas criadas: ${created}; ja existentes: ${already}.`);
 console.log('As senhas foram gravadas somente no arquivo local .local-dev-users-credentials.md (ignorado no Git).');
}
main().catch(e=>{console.error('Erro no provisionamento (sem detalhes sensiveis):',e?.code||e?.message||'desconhecido');process.exitCode=1}).finally(async()=>{await prisma.$disconnect()});
