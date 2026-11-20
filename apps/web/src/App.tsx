import React,{useEffect,useMemo,useState} from 'react';
import { get,post } from './lib/api';
import { Icon } from './components/Icon';
import { CrudPage } from './components/CrudPage';
import { OperationsPage } from './components/OperationsPage';
import { PortalActions } from './components/PortalActions';
import { DocumentsPage } from './components/DocumentsPage';
import { situacao, traduzirValor, formatarData } from './lib/format';
import { ReportsCenter } from './components/ReportsCenter';
import {LookupPicker} from './components/LookupPicker';
import { DashboardPage } from './components/DashboardPage';
import { SchedulePreparationPage } from './components/SchedulePreparationPage';
import { nav, groupIcons, canAccessRoute } from './modules/navigation/nav';
import { resourceConfigs } from './modules/catalog/resource-configs';
import { AccessProvider, type AccessInfo } from './security/access';
import { AccessManagementPage } from './modules/access/AccessManagementPage';
import { ImportCenterPage } from './modules/imports/ImportCenterPage';
import { GroupCoursesPage } from './modules/academico/GroupCoursesPage';
import { OperationalWorkspace } from './modules/workspaces/OperationalWorkspace';
import { AttendanceBoardPage } from './modules/academico/AttendanceBoardPage';
import { DemandsPage } from './modules/demands/DemandsPage';

type User={id:string;name:string;email:string;role:string};

export default function App(){
 const [user,setUser]=useState<User|null>(null),[checking,setChecking]=useState(true),[route,setRoute]=useState('dashboard');
 const [access,setAccess]=useState<AccessInfo>({mode:'PENDING'});
 const [accessIssue,setAccessIssue]=useState(false);
 const [accessRevision,setAccessRevision]=useState(0);
 useEffect(()=>{
  let mounted=true;
  let retryTimer:ReturnType<typeof setTimeout>|undefined;
  if(user){
   // A identidade de superadministrador ja foi validada por /api/auth/me.
   // Uma falha temporaria em /api/iam/me nunca deve esconder o menu desse perfil.
   setAccess(user.role==='SUPER_ADMIN'?{mode:'SUPER_ADMIN'}:{mode:'PENDING'});
   setAccessIssue(false);
   const loadAccess=()=>{
    get<AccessInfo>('/api/iam/me')
     .then(result=>{if(!mounted)return;setAccess(result);setAccessIssue(false)})
     .catch((error:any)=>{
      if(!mounted)return;
      if(error?.status===401){setUser(null);return}
      setAccessIssue(true);
      // Para os demais perfis, falhar de forma restritiva e mostrar erro explicito.
      if(user.role!=='SUPER_ADMIN')setAccess({mode:'UNAVAILABLE',codes:[]});
      retryTimer=setTimeout(loadAccess,3000);
     });
   };
   loadAccess();
  }else{setAccess({mode:'PENDING'});setAccessIssue(false)}
  return ()=>{mounted=false;if(retryTimer)clearTimeout(retryTimer)};
 },[user?.id,accessRevision]);
 useEffect(()=>{get<User>('/api/auth/me').then(setUser).catch(()=>setUser(null)).finally(()=>setChecking(false));},[]);
 if(checking)return <Splash/>;
 if(!user)return <Login onLogin={u=>{setAccess({mode:'PENDING'});setUser(u)}}/>;
 if(access.mode==='PENDING')return <Splash/>;
 if(access.mode==='UNAVAILABLE')return <div className="login-page login-clean"><main className="login-panel"><div className="login-card"><h1>Conexao temporariamente indisponivel</h1><p>Nao foi possivel consultar as permissoes. O sistema tentara reconectar automaticamente; suas permissoes nao foram alteradas.</p><button className="btn primary" type="button" onClick={()=>setAccessRevision(value=>value+1)}>Tentar novamente</button></div></main></div>;
 if(['STUDENT','APPRENTICE','CANDIDATE','LEGAL_GUARDIAN','COMPANY','PROFESSOR','INTERNSHIP_SUPERVISOR'].includes(user.role)) return <ExternalPortal user={user} onLogout={async()=>{await post('/api/auth/logout',{});setUser(null)}}/>;
 return <Shell user={user} access={access} accessIssue={accessIssue} onRetryAccess={()=>setAccessRevision(value=>value+1)} route={route} setRoute={setRoute} onLogout={async()=>{await post('/api/auth/logout',{});setUser(null)}}/>;
}
function Splash(){return <div className="splash"><img src="/logo-proativa.png"/><span>Carregando…</span></div>}
function Login({onLogin}:{onLogin:(u:User)=>void}){
 const [identifier,setIdentifier]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const r=await post<{user:User}>('/api/auth/login',{identifier,password});onLogin(r.user)}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 return <div className="login-page login-clean"><main className="login-panel"><form onSubmit={submit} className="login-card"><img className="login-main-logo" src="/logo-proativa.png" alt="Proativa"/><div className="login-title"><span className="eyebrow">PROATIVA 2.0</span><h1>Acesso ao sistema</h1><p>Informe suas credenciais para continuar.</p></div>{error&&<div className="alert error" role="alert">{error}</div>}
 <label><span>Usuário ou e-mail</span><input required autoFocus value={identifier} onChange={e=>setIdentifier(e.target.value)} autoComplete="username" placeholder="Informe seu usuário"/></label>
 <label><span>Senha</span><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="Digite sua senha"/></label>
 <button className="btn primary large" disabled={busy}>{busy?'Verificando acesso…':'Entrar'}<Icon name="arrow" size={18}/></button></form></main></div>;
}

function Shell({user,access,accessIssue,onRetryAccess,route,setRoute,onLogout}:{user:User;access:AccessInfo;accessIssue:boolean;onRetryAccess:()=>void;route:string;setRoute:(r:string)=>void;onLogout:()=>void}){
 const [openGroup,setOpenGroup]=useState<string|null>(null);
 const [mobileOpen,setMobileOpen]=useState(false);
 const visibleNav=nav.filter(item=>canAccessRoute(user.role,item.key,access));
 const groups=[...new Set(visibleNav.map(x=>x.group))];
 const selected=nav.find(x=>x.key===route);
 useEffect(()=>{if(selected)setOpenGroup(selected.group)},[route]);
 const choose=(key:string)=>{setRoute(key);setMobileOpen(false);window.scrollTo(0,0)};
 return <AccessProvider value={{...access,role:user.role}}><div className="shell">
 {mobileOpen&&<button aria-label="Fechar menu" className="nav-scrim" onClick={()=>setMobileOpen(false)}/>}
 <aside className={`sidebar ${mobileOpen?'mobile-visible':''}`}><div className="side-brand"><img src="/logo-proativa.png" alt="Proativa"/><div><strong>Proativa 2.0</strong></div></div>
 <nav aria-label="Navegação principal" className="accordion-nav">{groups.map(g=><div className="nav-group" key={g}>
 <button type="button" className={`nav-category ${openGroup===g?'expanded':''}`} aria-expanded={openGroup===g} onClick={()=>setOpenGroup(x=>x===g?null:g)}><Icon name={groupIcons[g]} size={18}/><span>{g}</span><span className="nav-chevron" aria-hidden="true">{openGroup===g?'−':'+'}</span></button>
 {openGroup===g&&<div className="nav-children">{visibleNav.filter(x=>x.group===g).map(x=><button type="button" key={x.key} className={`nav-child ${route===x.key?'active':''}`} aria-current={route===x.key?'page':undefined} onClick={()=>choose(x.key)}><span>{x.label}</span></button>)}</div>}</div>)}</nav>
 <div className="side-footer"><div className="avatar">{user.name.slice(0,2).toUpperCase()}</div><div className="user-mini"><strong>{user.name}</strong><span>{roleLabel(user.role)}</span></div><button className="logout" title="Sair" aria-label="Sair" onClick={onLogout}><Icon name="logout" size={18}/></button></div></aside>
 <main className="workspace"><div className="topbar"><div className="context"><button type="button" className="mobile-menu-btn" aria-label="Abrir menu" onClick={()=>setMobileOpen(true)}>☰</button><span>{selected?.group||'Painel'}</span><b>/</b><strong>{selected?.label||'Visão geral'}</strong></div><div className="top-status"><span>{roleLabel(user.role)}</span></div></div>{accessIssue&&<div className="alert error" role="status">A API nao respondeu a consulta de permissoes. Tentando reconectar automaticamente. <button type="button" className="btn ghost" onClick={onRetryAccess}>Tentar agora</button></div>}<RouteView route={route} setRoute={setRoute} userRole={user.role}/></main>
 </div></AccessProvider>;
}

function RouteView({route,setRoute,userRole}:{route:string;setRoute:(route:string)=>void;userRole:string}){
 if(route.startsWith('op.'))return <OperationsPage key={route} group={route.slice(3)}/>;
 if(route==='dashboard')return <DashboardPage onNavigate={setRoute} role={userRole}/>;
 if(route==='schedulePlan')return <SchedulePreparationPage/>;
 if(route==='groupCourses')return <GroupCoursesPage/>;
 if(route==='attendanceBoard')return <AttendanceBoardPage/>;
 if(route==='demands')return <DemandsPage/>;
 if(route==='people')return <OperationalWorkspace kind='students'/>;
 if(route==='groups')return <OperationalWorkspace kind='groups'/>;
 if(route==='companies')return <OperationalWorkspace kind='companies'/>;
 if(route==='contracts')return <OperationalWorkspace kind='contracts'/>;
 if(route==='finance')return <FinancePage/>;
 if(route==='documents')return <DocumentsPage/>;
 if(route==='legacy')return <ImportCenterPage/>;
 if(route==='reports')return <ReportsCenter/>;
 if(route==='users')return <AccessManagementPage/>;
 const cfg=resourceConfigs[route];
 return cfg?<CrudPage {...cfg}/>:<div className="page"><h1>Módulo</h1></div>;
}

function Flow({n,title,text}:{n:string;title:string;text:string}){return <div className="flow-item"><span>{n}</span><div><strong>{title}</strong><small>{text}</small></div><Icon name="arrow" size={17}/></div>}



function ProfessorContent({groups}:{groups:any[]}){
 const [groupId,setGroupId]=useState(groups[0]?.id||''),[date,setDate]=useState(new Date().toISOString().slice(0,10)),[marks,setMarks]=useState<Record<string,any>>({}),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const group=groups.find(g=>g.id===groupId);
 useEffect(()=>{if(!groupId)return;setError('');get<any[]>(`/api/portal/professor/attendance?classGroupId=${encodeURIComponent(groupId)}&classDate=${date}`).then(rows=>setMarks(Object.fromEntries(rows.map(r=>[r.personId,r])))).catch(e=>setError(e.message));},[groupId,date]);
 async function mark(personId:string,present:boolean,justified=false){setBusy(true);setError('');setNotice('');try{
  const attendance:any=await post('/api/portal/professor/attendance',{personId,classGroupId:groupId,classDate:date,present,justified});
  setMarks(old=>({...old,[personId]:attendance}));setNotice('Chamada registrada com sucesso.');
 }catch(e:any){setError(e.message)}finally{setBusy(false)}}
 return <div className="panel professor-panel"><div className="panel-head"><div><span className="eyebrow">CHAMADA</span><h3>Turmas vinculadas</h3></div></div>
  {!groups.length?<div className="empty-compact">Nenhuma turma vinculada ao facilitador. Solicite à Secretaria a vinculação de uma turma.</div>:<>
   <div className="professor-filter"><label>Turma<select value={groupId} onChange={e=>setGroupId(e.target.value)}>{groups.map(g=><option key={g.id} value={g.id}>{g.name}{g.course?` — ${g.course}`:''}</option>)}</select></label><label>Data<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div>
   {error&&<div className="alert error">{error}</div>}{notice&&<div className="alert info">{notice}</div>}
   <div className="table-wrap"><table><thead><tr><th>Aluno</th><th>Marcacao atual</th><th>Registrar</th></tr></thead><tbody>{(group?.people||[]).map((person:any)=><tr key={person.id}><td>{person.fullName}</td><td>{marks[person.id]?(marks[person.id].present?'Presente':marks[person.id].justified?'Falta justificada':'Falta'):'Pendente'}</td><td><div className="table-actions"><button className="btn ghost" disabled={busy} onClick={()=>mark(person.id,true)}>Presente</button><button className="btn ghost" disabled={busy} onClick={()=>mark(person.id,false)}>Falta</button><button className="btn ghost" disabled={busy} onClick={()=>mark(person.id,false,true)}>Justificar</button></div></td></tr>)}</tbody></table></div>
  </>}</div>;
}

function FinancePage(){
 const [selected,setSelected]=useState(''),[amount,setAmount]=useState(''),[date,setDate]=useState(new Date().toISOString().slice(0,10)),[reference,setReference]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[refresh,setRefresh]=useState(0),[saving,setSaving]=useState(false);
 async function savePayment(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setError('');setNotice('');if(!selected)return;setSaving(true);try{
  const result:any=await post('/api/finance/payments',{financialTitleId:selected,paidAt:date,amount:Number(amount),...(reference?{externalRef:reference}:{})});
  setNotice(`Pagamento registrado. Saldo restante: ${Number(result.outstanding).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}.`);setSelected('');setAmount('');setReference('');setRefresh(x=>x+1);
 }catch(e:any){setError(e.message)}finally{setSaving(false)}}
 return <><section className="page" style={{paddingBottom:0}}><div className="panel"><div className="panel-head"><div><span className="eyebrow">BAIXA FINANCEIRA</span><h3>Registrar pagamento</h3></div></div>
  <p className="finance-helper">Registre recebimentos totais ou parciais, preservando o histórico financeiro.</p>
  {error&&<div className="alert error">{error}</div>}{notice&&<div className="alert info">{notice}</div>}
  <form className="finance-payment-form" onSubmit={savePayment}><label>Título financeiro
   <LookupPicker key={refresh} name="financialTitleId" endpoint="/api/finance/titles" labelKey="description" required onSelect={(_,t)=>{setSelected(t.id);setAmount(Math.max(0,Number(t.amount)-(t.payments||[]).reduce((sum:number,p:any)=>sum+Number(p.amount),0)).toFixed(2))}} onClear={()=>{setSelected('');setAmount('')}}/>
   </label><label>Data<input required type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Valor recebido<input required type="number" step="0.01" min="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>Referência bancária<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Opcional"/></label>
   <button className="btn primary" type="submit" disabled={!selected||saving||!(Number(amount)>0)}>{saving?'Registrando…':'Registrar recebimento'}</button></form></div></section><CrudPage {...resourceConfigs.finance} key={refresh}/></>;
}

function ExternalPortal({user,onLogout}:{user:User;onLogout:()=>void}){
 const kind=['STUDENT','APPRENTICE'].includes(user.role)?'student':user.role==='CANDIDATE'?'candidate':user.role==='LEGAL_GUARDIAN'?'guardian':user.role==='COMPANY'?'company':user.role==='PROFESSOR'?'professor':'supervisor';
 const [data,setData]=useState<any>(null),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{get(`/api/portal/${kind}`).then(setData).catch(e=>setError(e.message))},[kind,revision]);
 const title=user.role==='APPRENTICE'?'Portal do Aprendiz':user.role==='CANDIDATE'?'Portal do Candidato':user.role==='LEGAL_GUARDIAN'?'Portal do Responsável Legal':user.role==='STUDENT'?'Portal do Aluno':user.role==='COMPANY'?'Portal da Empresa':user.role==='PROFESSOR'?'Portal do Professor':'Portal do Supervisor de Estágio';
 return <div className="external-shell"><header className="external-top"><div className="external-brand"><img src="/logo-proativa.png"/><div><strong>{title}</strong><span>Proativa 2.0</span></div></div><div className="external-user"><div><strong>{user.name}</strong><span>{roleLabel(user.role)}</span></div><button className="btn ghost" onClick={onLogout}><Icon name="logout" size={16}/>Sair</button></div></header><main className="external-main"><div className="external-welcome"><span className="eyebrow">ÁREA EXTERNA</span><h1>Olá, {user.name.split(' ')[0]}.</h1><p>Consulte informações e acompanhe suas solicitações.</p></div>{error&&<div className="alert error">{error}</div>}{!data?<div className="panel">Carregando dados…</div>:<><ExternalContent role={user.role} data={data}/><PortalActions role={user.role} data={data} onRefresh={()=>setRevision(r=>r+1)}/></>}</main></div>
}
function ExternalContent({role,data}:{role:string;data:any}){
 if(role==='CANDIDATE')return <><div className="panel"><h3>Minhas candidaturas</h3><p>{data.notice||'Acompanhe seus processos seletivos.'}</p></div><ExternalList title="Candidaturas" rows={data.applications?.map((x:any)=>({title:x.vacancy?.title||'Vaga',meta:x.status||''}))||[]}/></>;
 if(role==='LEGAL_GUARDIAN')return <div className="panel"><h3>Responsável legal</h3><p>{data.notice||'Nenhum vínculo verificado.'}</p></div>;
 if(role==='STUDENT'||role==='APPRENTICE')return <><div className="external-cards"><MiniKpi label="Matrículas" value={data.enrollments?.length||0}/><MiniKpi label="Contratos" value={data.contracts?.length||0}/><MiniKpi label="Frequências" value={data.attendance?.length||0}/><MiniKpi label="Solicitações" value={data.requests?.length||0}/></div><ExternalList title="Meus vínculos" rows={data.enrollments?.map((x:any)=>({title:x.course?.name||'Curso',meta:x.classGroup?.name||'Turma a definir',status:x.status}))||[]}/><ExternalList title="Solicitações" rows={data.requests?.map((x:any)=>({title:x.type,meta:x.description||'Sem descrição',status:x.status}))||[]}/><ExternalList title="Notas e avaliações" rows={data.grades?.map((x:any)=>({title:x.label,meta:`${x.value} / ${x.maxValue||10} · ${x.classGroup?.name||'Turma'}`}))||[]}/><ExternalList title="Frequência" rows={data.attendance?.map((x:any)=>({title:new Date(x.classDate).toLocaleDateString('pt-BR'),meta:x.classGroup?.name||'Turma',status:x.present?'PRESENTE':x.justified?'FALTA_JUSTIFICADA':'FALTA'}))||[]}/><ExternalList title="Documentos vinculados" rows={data.documents?.map((x:any)=>({title:x.fileName,meta:x.type}))||[]}/><ExternalList title="Candidaturas" rows={data.applications?.map((x:any)=>({title:x.vacancy?.title||'Vaga',meta:x.vacancy?.company?.tradeName||'',status:x.status}))||[]}/></>;
 if(role==='COMPANY')return <><div className="external-cards"><MiniKpi label="Vagas" value={data.vacancies?.length||0}/><MiniKpi label="Contratos" value={data.contracts?.length||0}/><MiniKpi label="Títulos" value={data.financialTitles?.length||0}/><MiniKpi label="Candidaturas" value={(data.vacancies||[]).reduce((a:number,v:any)=>a+(v._count?.applications||0),0)}/></div><ExternalList title="Vagas da empresa" rows={data.vacancies?.map((x:any)=>({title:x.title,meta:`${x.quantity} vaga(s)`,status:x.status}))||[]}/><ExternalList title="Contratos" rows={data.contracts?.map((x:any)=>({title:x.person?.fullName||'Pessoa',meta:x.course?.name||x.type||'Contrato',status:x.status}))||[]}/><ExternalList title="Faturas e cobranças" rows={data.financialTitles?.map((x:any)=>({title:x.description,meta:`${Number(x.amount).toFixed(2)} · Venc. ${new Date(x.dueDate).toLocaleDateString('pt-BR')}`,status:x.status}))||[]}/><ExternalList title="Estagiários" rows={data.internships?.map((x:any)=>({title:x.contract?.person?.fullName||'Estagiário',meta:x.courseName||'Estágio',status:x.status}))||[]}/></>;
 if(role==='INTERNSHIP_SUPERVISOR')return <ExternalList title="Estagiários vinculados" rows={data.internships?.map((x:any)=>({title:x.contract?.person?.fullName||'Estagiário',meta:x.contract?.company?.tradeName||x.institution||'',status:x.status}))||[]}/>;
 if(role==='PROFESSOR')return <ProfessorContent groups={data.classGroups||[]}/>;
 return <div className="note-card">Nenhum dado disponível para este perfil.</div>;
}
function MiniKpi({label,value}:{label:string;value:any}){return <div className="mini-kpi"><span>{label}</span><strong>{value}</strong></div>}
function ExternalList({title,rows}:{title:string;rows:{title:string;meta:string;status?:string}[]}){return <div className="panel external-list"><div className="panel-head"><h3>{title}</h3></div>{rows.length?rows.map((r,i)=><div className="external-row" key={i}><div><strong>{r.title}</strong><span>{r.meta}</span></div>{r.status&&<span className={`status ${['ACTIVE','DONE'].includes(r.status)?'active':['ARCHIVED','CANCELLED','TERMINATED','INACTIVE'].includes(r.status)?'inactive':'pending'}`}>{situacao(r.status)}</span>}</div>):<div className="empty-compact">Nenhum registro disponível.</div>}</div>}

function roleLabel(r:string){const m:Record<string,string>={SUPER_ADMIN:'Super administrador',ADMIN:'Administrador',SECRETARY:'Secretaria',FINANCE:'Financeiro',TRIAGE:'Triagem',CONTRACTS:'Contratos',SOCIAL_SERVICE:'Serviço Social',RECEPTION:'Recepção',COMMERCIAL:'Comercial',HR:'Departamento Pessoal',STUDENT:'Aluno',PROFESSOR:'Professor / Facilitador',COMPANY:'Empresa',INTERNSHIP_SUPERVISOR:'Supervisor de estágio',APPRENTICE:'Aprendiz',CANDIDATE:'Candidato',LEGAL_GUARDIAN:'Responsável legal'};return m[r]||r.replaceAll('_',' ')}
