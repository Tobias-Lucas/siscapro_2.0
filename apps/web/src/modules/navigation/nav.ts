export type NavItem={key:string;label:string;icon:string;group:string};
/** Navegação organizada por área de trabalho; cada categoria abre seus próprios itens. */
export const nav:NavItem[]=[
 {key:'dashboard',label:'Visão geral',icon:'dashboard',group:'Painel'},
 {key:'people',label:'Gestão de alunos',icon:'people',group:'Alunos'},
 {key:'enrollments',label:'Matrículas e vínculos',icon:'academic',group:'Alunos'},
 {key:'courses',label:'Cursos e modalidades',icon:'academic',group:'Secretaria'},
 {key:'groups',label:'Gestão de turmas',icon:'academic',group:'Secretaria'},
 {key:'groupCourses',label:'Cursos por turma',icon:'academic',group:'Secretaria'},
 {key:'disciplines',label:'Disciplinas e módulos',icon:'academic',group:'Secretaria'},
 {key:'courseHours',label:'Horários e cargas horárias',icon:'calendar',group:'Secretaria'},
 {key:'teachingDays',label:'Dias de aula',icon:'calendar',group:'Secretaria'},
 {key:'disciplineTeachers',label:'Facilitadores por disciplina',icon:'people',group:'Secretaria'},
 {key:'teacherAssignments',label:'Facilitadores por turma',icon:'people',group:'Secretaria'},
 {key:'schedulePlan',label:'Planejamento do cronograma',icon:'calendar',group:'Secretaria'},
 {key:'op.Secretaria',label:'Aulas, grade e materiais',icon:'academic',group:'Secretaria'},
 {key:'attendanceBoard',label:'Chamada por turma',icon:'academic',group:'Secretaria'},
 {key:'attendance',label:'Frequência',icon:'academic',group:'Secretaria'},
 {key:'grades',label:'Notas e avaliações',icon:'report',group:'Secretaria'},
 {key:'companies',label:'Gestão de empresas',icon:'company',group:'Empresas'},
 {key:'op.Empresas',label:'Parcerias e contatos',icon:'company',group:'Empresas'},
 {key:'demands',label:'Gestão de demandas',icon:'service',group:'Demandas'},
 {key:'contracts',label:'Gestão de contratos',icon:'contract',group:'Contratos'},
 {key:'op.Contratos',label:'Aditivos e movimentações',icon:'contract',group:'Contratos'},
 {key:'vacancies',label:'Vagas',icon:'briefcase',group:'Triagem'},
 {key:'op.Recrutamento',label:'Processos seletivos',icon:'people',group:'Triagem'},
 {key:'internships',label:'Estágios',icon:'briefcase',group:'Estágio'},
 {key:'op.Estágio',label:'Supervisão e relatórios',icon:'report',group:'Estágio'},
 {key:'finance',label:'Títulos e pagamentos',icon:'finance',group:'Financeiro'},
 {key:'op.Financeiro',label:'Faturamento e caixa',icon:'finance',group:'Financeiro'},
 {key:'requests',label:'Requerimentos',icon:'service',group:'Atendimento'},
 {key:'op.Atendimento',label:'Interações e visitas',icon:'service',group:'Atendimento'},
 {key:'op.Comunicação',label:'Comunicação',icon:'service',group:'Atendimento'},
 {key:'documents',label:'Arquivos e documentos',icon:'docs',group:'Documentos'},
 {key:'op.Documentos',label:'Modelos e análises',icon:'docs',group:'Documentos'},
 {key:'reports',label:'Relatórios gerenciais',icon:'report',group:'Relatórios'},
 {key:'users',label:'Usuários e permissões',icon:'users',group:'Equipe e acessos'},
 {key:'op.Institucional',label:'Unidades e parâmetros',icon:'company',group:'Administração'},
 {key:'legacy',label:'Importação de dados',icon:'sync',group:'Administração'}
];
export const groupIcons:Record<string,string>={'Painel':'dashboard','Alunos':'people','Secretaria':'academic','Empresas':'company','Demandas':'service','Contratos':'contract','Triagem':'briefcase','Estágio':'briefcase','Financeiro':'finance','Atendimento':'service','Documentos':'docs','Relatórios':'report','Equipe e acessos':'users','Administração':'users'};

const routeRoles:Record<string,string[]>={
 dashboard:[],reports:[],people:['SECRETARY','CONTRACTS','TRIAGE','SOCIAL_SERVICE','RECEPTION','COMMERCIAL','HR'],
 companies:['CONTRACTS','FINANCE','COMMERCIAL','HR'],demands:['CONTRACTS','FINANCE','COMMERCIAL','HR','RECEPTION','SECRETARY','TRIAGE'],courses:['SECRETARY'],groups:['SECRETARY'],groupCourses:['SECRETARY'],attendanceBoard:['SECRETARY'],disciplines:['SECRETARY'],courseHours:['SECRETARY'],teachingDays:['SECRETARY'],disciplineTeachers:['SECRETARY'],teacherAssignments:['SECRETARY'],schedulePlan:['SECRETARY'],enrollments:['SECRETARY'],attendance:['SECRETARY'],grades:['SECRETARY'],
 contracts:['CONTRACTS','HR'],internships:['CONTRACTS','SECRETARY'],vacancies:['TRIAGE','COMMERCIAL'],finance:['FINANCE'],
 requests:['SOCIAL_SERVICE','RECEPTION','SECRETARY'],documents:['CONTRACTS','SECRETARY','HR','SOCIAL_SERVICE'],
 legacy:['SUPER_ADMIN'],users:['SUPER_ADMIN','ADMIN']
};
const operationRoles:Record<string,string[]>={
 'op.Institucional':['SUPER_ADMIN','ADMIN'],'op.Empresas':['CONTRACTS','FINANCE','COMMERCIAL','HR'],
 'op.Secretaria':['SECRETARY'],'op.Contratos':['CONTRACTS','HR'],'op.Estágio':['CONTRACTS','SECRETARY'],
 'op.Financeiro':['FINANCE'],'op.Atendimento':['RECEPTION','SECRETARY','SOCIAL_SERVICE'],
 'op.Recrutamento':['TRIAGE','COMMERCIAL'],'op.Documentos':['SECRETARY','CONTRACTS','HR','SOCIAL_SERVICE'],
 'op.Comunicação':['SECRETARY','CONTRACTS','SOCIAL_SERVICE','RECEPTION']
};
const legacyCanAccessRoute=(role:string,key:string)=>key.startsWith('op.') ? (role==='SUPER_ADMIN'||role==='ADMIN'||(operationRoles[key]||[]).includes(role)) : role==='SUPER_ADMIN' || (role==='ADMIN' && key!=='legacy') || (routeRoles[key]||[]).includes(role) || key==='dashboard' || key==='reports';

/** UI only; server remains the authority. */
export function canAccessRoute(role:string,key:string,access?:{mode:string;codes?:string[]}) {
 if (access?.mode === 'PENDING' || access?.mode === 'UNAVAILABLE') return false;
 if (access?.mode === 'SUPER_ADMIN') return role === 'SUPER_ADMIN' && legacyCanAccessRoute(role,key);
 if (!access || access.mode === 'LEGACY') return legacyCanAccessRoute(role,key);
 if (access.mode !== 'CUSTOM') return false;
 const codes=new Set(access.codes||[]);
 const group=(nav.find(x=>x.key===key)||{} as NavItem).group;
 const routes:Record<string,string>={dashboard:'painel.visao_geral.ver',people:'alunos.cadastro.listar',enrollments:'matriculas.vinculos.listar',courses:'secretaria.cursos.listar',groups:'secretaria.turmas.listar',groupCourses:'secretaria.turmas_cursos.visualizar',attendanceBoard:'secretaria.frequencia.visualizar',disciplines:'secretaria.cursos.listar',courseHours:'secretaria.cursos.listar',teachingDays:'secretaria.cursos.listar',disciplineTeachers:'secretaria.facilitadores.listar',teacherAssignments:'secretaria.facilitadores.listar',demands:'empresas.demandas.listar',schedulePlan:'cronogramas.planejamento.visualizar',attendance:'secretaria.frequencia.listar',grades:'secretaria.notas.listar',companies:'empresas.cadastro.listar',contracts:'contratos.instrumentos.listar',vacancies:'triagem.vagas.listar',internships:'estagio.vinculos.listar',finance:'financeiro.titulos.listar',requests:'atendimento.requerimentos.listar',documents:'documentos.arquivos.listar',reports:'relatorios.gerenciais.visualizar',users:'usuarios.contas.listar',legacy:'integracao.legado.visualizar'};
 if(key.startsWith('op.')) return [...codes].some(c=>c.startsWith('cadastros.'));
 if(key==='users'&&['SUPER_ADMIN','ADMIN'].includes(role))return true;
 if(key==='legacy' && role!=='SUPER_ADMIN')return false;
 if(group==='Relatórios')return [...codes].some(c=>c.startsWith('relatorios.') && c.endsWith('.visualizar'));
 return codes.has(routes[key]||'');
}

