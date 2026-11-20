/** Dicionário de apresentação: códigos técnicos permanecem internos à API. */
const labels:Record<string,string>={
 ACTIVE:'Ativo',INACTIVE:'Inativo',PENDING:'Pendente',ARCHIVED:'Arquivado',
 DRAFT:'Rascunho',PENDING_SIGNATURE:'Aguardando assinatura',SUSPENDED:'Suspenso',TERMINATED:'Encerrado',CANCELLED:'Cancelado',
 OPEN:'Aberto',IN_PROGRESS:'Em andamento',WAITING:'Aguardando',DONE:'Concluído',
 PRESENT:'Presente',ABSENT:'Falta',JUSTIFIED:'Justificada',FALTA:'Falta',FALTA_JUSTIFICADA:'Falta justificada',PRESENTE:'Presente',
 PLANNED:'Planejado',RESCHEDULED:'Remarcado',IN:'Entrada',OUT:'Saída',
 STUDENT:'Aluno',COMPANY:'Empresa',PROFESSOR:'Professor',INTERNSHIP_SUPERVISOR:'Supervisor de estágio',
 SUPER_ADMIN:'Superadministrador',ADMIN:'Administrador',SECRETARY:'Secretaria',FINANCE:'Financeiro',TRIAGE:'Triagem',CONTRACTS:'Contratos',SOCIAL_SERVICE:'Serviço Social',RECEPTION:'Recepção',COMMERCIAL:'Comercial',HR:'Departamento Pessoal',
 APPRENTICESHIP:'Aprendizagem',INTERNSHIP:'Estágio',PREPARATORY:'Preparatório',
 DECLARACAO:'Declaração',TROCA_TURMA:'Troca de turma',DOCUMENTACAO:'Documentação',CERTIFICADO:'Certificado',CONTRATO:'Contrato',ADITIVO:'Aditivo',BOLETO:'Boleto',NOTA_FISCAL:'Nota fiscal',OUTROS:'Outros',
 RA:'Relatório de atividades',TRE:'Termo de realização de estágio',OTHER:'Outro',
 INSTITUTIONAL:'Institucional',MUNICIPAL:'Municipal',STATE:'Estadual',NATIONAL:'Nacional',IN_APP:'No sistema',EMAIL:'E-mail',WHATSAPP:'WhatsApp',
 CREATE:'Criação',UPDATE:'Atualização',ARCHIVE:'Arquivamento',DELETE:'Exclusão',
 F:'Falta',P:'Presença',FJ:'Falta justificada',
 YES:'Sim',NO:'Não',TRUE:'Sim',FALSE:'Não',
};
export function situacao(value:unknown):string{
 if(value===null||value===undefined||value==='')return '—';
 const s=String(value).trim();
 return labels[s]||labels[s.toUpperCase()]||s.replaceAll('_',' ').replace(/([a-z])([A-Z])/g,'$1 $2');
}
export function formatarData(v:unknown):string{
 if(!v)return '—';const d=v instanceof Date?v:new Date(String(v));
 if(Number.isNaN(d.getTime()))return String(v);
 return d.toLocaleDateString('pt-BR',{timeZone:'UTC'});
}
export function formatarMoeda(v:unknown):string{
 const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—';
}
export function traduzirValor(value:any,key=''):string{
 if(value===null||value===undefined||value==='')return '—';
 if(typeof value==='boolean')return value?'Sim':'Não';
 if(Array.isArray(value))return `${value.length} registro(s)`;
 if(typeof value==='object')return 'Consultar ficha';
 if(/(amount|value|scholarship|monthlyValue|saldo|total recebido|valor mensal|valor do título|bolsa)/i.test(key)&&!/(tipo|id)/i.test(key)){
  if(!Number.isNaN(Number(value)))return formatarMoeda(value);
 }
 if(/\d{4}-\d{2}-\d{2}T/.test(String(value)) || value instanceof Date)return formatarData(value);
 if(typeof value==='string' && /^(\d{2}:\d{2}(:\d{2})?)$/.test(value))return value.slice(0,5);
 return situacao(value);
}
export function classeSituacao(value:any){const v=String(value||'').toUpperCase();return ['ACTIVE','DONE','PRESENT','PRESENTE','P'].includes(v)?'active':['CANCELLED','TERMINATED','INACTIVE','ARCHIVED','FALTA'].includes(v)?'inactive':'pending'}
