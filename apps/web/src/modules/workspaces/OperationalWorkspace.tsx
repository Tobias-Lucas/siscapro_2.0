import React,{useEffect,useMemo,useState} from 'react';
import {get,post} from '../../lib/api';
import {CrudPage} from '../../components/CrudPage';
import {LookupPicker} from '../../components/LookupPicker';
import {resourceConfigs} from '../catalog/resource-configs';
import {useAccess} from '../../security/access';
import {classeSituacao,situacao} from '../../lib/format';
import '../../styles/operational.css';

type Kind='students'|'groups'|'companies'|'contracts';
type Row={id:string;status?:string;[key:string]:any};
type Section={key:string;title:string;columns:{key:string;label:string}[];items:Row[];total:number;truncated:boolean};
type Dossier={id:string;kind:Kind;title:string;subtitle?:string;status:string;fields:{label:string;value:any}[];sections:Section[]};
type Action='student-enrollment'|'group-enrollment'|'transition'|'amendment';
const setups:Record<Kind,{title:string;subtitle:string;listUrl:string;catalog:string;itemTitle:(r:Row)=>string;itemMeta:(r:Row)=>string;search:string}>={
 students:{title:'Gestão de alunos',subtitle:'Ficha 360: cadastro, matrículas, contratos, frequência, notas e requerimentos em um só lugar.',listUrl:'/api/people/students',catalog:'people',itemTitle:r=>r.fullName,itemMeta:r=>[r.city,r.state].filter(Boolean).join(' / '),search:'Buscar aluno por nome, CPF ou e-mail'},
 groups:{title:'Operação das turmas',subtitle:'Cursos compartilhados, alunos, professores, aulas e frequência da turma.',listUrl:'/api/academic/groups',catalog:'groups',itemTitle:r=>r.name,itemMeta:r=>[r.unit,r.room].filter(Boolean).join(' · '),search:'Localizar turma ou unidade'},
 companies:{title:'Carteira de empresas',subtitle:'Contratos, vagas, cobranças e contatos vinculados a cada parceiro.',listUrl:'/api/companies',catalog:'companies',itemTitle:r=>r.tradeName||r.legalName,itemMeta:r=>r.legalName,search:'Buscar empresa por razão social, nome ou CNPJ'},
 contracts:{title:'Gestão contratual',subtitle:'Vigências, movimentações auditadas, aditivos e obrigações financeiras.',listUrl:'/api/contracts',catalog:'contracts',itemTitle:r=>r.number||r.person?.fullName||'Contrato sem número',itemMeta:r=>[r.person?.fullName,r.company?.tradeName].filter(Boolean).join(' · '),search:'Localizar contrato, aluno ou empresa'},
};
const dateValue=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60_000).toISOString().slice(0,10)};
const visible=(value:any,key='')=>{
 if(value===null||value===undefined||value==='')return '—';
 if(typeof value==='boolean')return value?'Sim':'Não';
 if(key==='status')return situacao(String(value));
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value))return value.split('-').reverse().join('/');
 if(typeof value==='number'&&['amount','paid','outstanding'].includes(key))return value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 return String(value);
};
const toText=(v:FormDataEntryValue|null)=>typeof v==='string'?v.trim():'';

export function OperationalWorkspace({kind}:{kind:Kind}){
 const setup=setups[kind],access=useAccess();
 const [mode,setMode]=useState<'operational'|'register'>('operational');
 const [query,setQuery]=useState(''),[status,setStatus]=useState(''),[page,setPage]=useState(1);
 const [items,setItems]=useState<Row[]>([]),[total,setTotal]=useState(0),[selected,setSelected]=useState('');
 const [details,setDetails]=useState<Dossier|null>(null),[tab,setTab]=useState('summary'),[action,setAction]=useState<Action|null>(null);
 const [courses,setCourses]=useState<{id:string;name:string}[]>([]),[groups,setGroups]=useState<{id:string;name:string}[]>([]);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[detailBusy,setDetailBusy]=useState(false);
 const [error,setError]=useState(''),[detailError,setDetailError]=useState(''),[notice,setNotice]=useState(''),[refresh,setRefresh]=useState(0);
 const [to,setTo]=useState(''),[signed,setSigned]=useState(false);
 const selectedRow=items.find(x=>x.id===selected);
 useEffect(()=>{setSelected('');setDetails(null);setQuery('');setPage(1);setStatus('');setMode('operational')},[kind]);
 useEffect(()=>{if(mode!=='operational')return;let active=true;setLoading(true);setError('');const timer=setTimeout(()=>{
  get<{items:Row[];total:number}>(`${setup.listUrl}?paged=1&page=${page}&pageSize=25&q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`)
   .then(d=>{if(active){setItems(d.items||[]);setTotal(d.total||0)}}).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false));
 },query?320:0);return()=>{active=false;clearTimeout(timer)}},[kind,mode,page,query,status,refresh]);
 useEffect(()=>{if(!selected||mode!=='operational')return;let active=true;setDetailBusy(true);setDetailError('');
  get<Dossier>(`/api/workspaces/${kind}/${encodeURIComponent(selected)}`).then(d=>{if(active){setDetails(d);setTab('summary')}}).catch(e=>{if(active){setDetails(null);setDetailError(e.message)}}).finally(()=>active&&setDetailBusy(false));
  return()=>{active=false};},[kind,selected,refresh,mode]);
 useEffect(()=>{if(!action||!['student-enrollment','group-enrollment'].includes(action))return;let active=true;
  Promise.all([get<{id:string;name:string}[]>('/api/academic/course-options'),get<{id:string;name:string}[]>('/api/academic/group-options')])
   .then(([cs,gs])=>{if(active){setCourses(cs);setGroups(gs)}}).catch(e=>active&&setError(e.message));return()=>{active=false};
 },[action]);
 const actions=useMemo(()=>{
  if(!details)return [] as {id:Action;label:string}[];
  if(kind==='students'&&access.has('matriculas.vinculos.criar')&&access.has('secretaria.cursos.listar')&&access.has('secretaria.turmas.listar'))return [{id:'student-enrollment' as Action,label:'Nova matrícula'}];
  if(kind==='groups'&&access.has('matriculas.vinculos.criar')&&access.has('alunos.cadastro.listar')&&access.has('secretaria.cursos.listar'))return [{id:'group-enrollment' as Action,label:'Vincular aluno à turma'}];
  if(kind==='contracts')return [
    ...(access.has('contratos.movimentacoes.criar')&&access.has('contratos.instrumentos.editar')?[{id:'transition' as Action,label:'Alterar situação'}]:[]),
    ...(access.has('contratos.aditivos.criar')?[{id:'amendment' as Action,label:'Solicitar aditivo'}]:[]),
  ];
  return [] as {id:Action;label:string}[];
 },[details,kind,access]);
 function beginAction(id:Action){setTo('');setSigned(false);setError('');setAction(id)}
 async function save(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(!action||!selected)return;
  setBusy(true);setError('');setNotice('');const f=new FormData(event.currentTarget);
  try{
   if(action==='student-enrollment'||action==='group-enrollment'){
    const personId=action==='student-enrollment'?selected:toText(f.get('personId'));
    if(!personId)throw new Error('Selecione um aluno');
    const courseId=toText(f.get('courseId')),classGroupId=action==='group-enrollment'?selected:toText(f.get('classGroupId'));
    if(!courseId&&!classGroupId)throw new Error('Informe ao menos um curso ou uma turma');
    await post('/api/academic/enrollments',{personId,...(courseId?{courseId}:{}),...(classGroupId?{classGroupId}:{}),...(toText(f.get('startDate'))?{startDate:toText(f.get('startDate'))}:{})});
    setNotice('Matrícula registrada. O vínculo poderá ser consultado nesta ficha e no módulo de matrículas.');
   }else if(action==='transition'){
    if(!to)throw new Error('Selecione a situação de destino');
    const r:any={to,effectiveAt:toText(f.get('effectiveAt')),reason:toText(f.get('reason'))};
    if(to==='ACTIVE')r.signedConfirmed=signed;
    await post(`/api/contracts/${encodeURIComponent(selected)}/transition`,r);
    setNotice('Situação contratual atualizada com movimentação e auditoria.');
   }else if(action==='amendment'){
    await post(`/api/contracts/${encodeURIComponent(selected)}/amendments`,{type:toText(f.get('type')),description:toText(f.get('description')),effectiveAt:toText(f.get('effectiveAt'))});
    setNotice('Solicitação de aditivo registrada. Nenhum PDF foi gerado ou importado.');
   }
   setAction(null);setRefresh(n=>n+1);
  }catch(e:any){setError(e.message)}finally{setBusy(false)}
 }
 const options:Record<string,string[]>={DRAFT:['PENDING_SIGNATURE','CANCELLED'],PENDING_SIGNATURE:['ACTIVE','CANCELLED'],ACTIVE:['SUSPENDED','TERMINATED'],SUSPENDED:['ACTIVE','TERMINATED'],TERMINATED:[],CANCELLED:[]};
 const transitions=options[details?.status||'']||[];
 if(mode==='register')return <><div className="ops-back"><button className="btn ghost" type="button" onClick={()=>setMode('operational')}>← Voltar à visão operacional</button></div><CrudPage {...resourceConfigs[setup.catalog]}/></>;
 return <section className="page operational-page"><header className="page-header"><div><span className="eyebrow">FICHA OPERACIONAL</span><h1>{setup.title}</h1><p>{setup.subtitle}</p></div><div className="page-actions"><button className="btn ghost" onClick={()=>{setMode('register');setAction(null)}}>Cadastros e edição</button><button className="btn ghost" onClick={()=>setRefresh(v=>v+1)}>Atualizar</button></div></header>
 {notice&&<div className="alert info" role="status">{notice}</div>}
 <div className="ops-layout"><aside className="ops-list" aria-label="Localizar registros"><div className="ops-list-head"><strong>Localizar registros</strong><span>{total.toLocaleString('pt-BR')} registros</span></div>
 <input type="search" aria-label={setup.search} placeholder={setup.search} value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/>
 <select aria-label="Filtrar situação" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">Todas as situações</option>{(kind==='contracts'?['DRAFT','PENDING_SIGNATURE','ACTIVE','SUSPENDED','TERMINATED','CANCELLED']:['ACTIVE','PENDING','INACTIVE','ARCHIVED']).map(s=><option key={s} value={s}>{situacao(s)}</option>)}</select>
 {error&&!action&&<div className="alert error">{error}</div>}
 <div className="ops-records">{loading?<p>Carregando registros…</p>:items.length?items.map(r=><button key={r.id} type="button" className={`ops-record ${selected===r.id?'active':''}`} onClick={()=>{setSelected(r.id);setNotice('')}}><strong>{setup.itemTitle(r)}</strong><small>{setup.itemMeta(r)||'Sem informações adicionais'}</small><span className={`status ${classeSituacao(r.status)}`}>{situacao(r.status)}</span></button>):<p>Não foram encontrados registros com estes filtros.</p>}</div>
 <div className="ops-pages"><button className="btn ghost" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>{page} / {Math.max(1,Math.ceil(total/25))}</span><button className="btn ghost" disabled={page>=Math.ceil(total/25)} onClick={()=>setPage(p=>p+1)}>Próxima</button></div>
 </aside><main className="ops-detail">{!selected?<div className="ops-empty"><h2>Selecione um registro</h2><p>As informações detalhadas, os vínculos e as operações aparecerão aqui, sem abrir várias telas.</p><button className="btn primary" onClick={()=>setMode('register')}>Ir para cadastros</button></div>:detailBusy?<div className="panel">Carregando histórico e vínculos…</div>:detailError?<div className="alert error">{detailError}</div>:details?<>
 <div className="ops-profile"><div><span className="eyebrow">FICHA OPERACIONAL · {kind==='students'?'ALUNO':kind==='groups'?'TURMA':kind==='contracts'?'CONTRATO':'EMPRESA'}</span><h2>{details.title}</h2><p>{details.subtitle}</p><span className={`status ${classeSituacao(details.status)}`}>{situacao(details.status)}</span></div><div className="ops-profile-actions">{actions.map(a=><button key={a.id} className="btn primary" onClick={()=>beginAction(a.id)}>{a.label}</button>)}</div></div>
 <div className="ops-metrics">{details.sections.slice(0,4).map(s=><button type="button" key={s.key} onClick={()=>setTab(s.key)} className="ops-metric"><strong>{s.total.toLocaleString('pt-BR')}</strong><span>{s.title}</span></button>)}</div>
 <div className="ops-section"><div className="ops-tabs" role="tablist" aria-label="Seções da ficha"><button role="tab" aria-selected={tab==='summary'} className={tab==='summary'?'active':''} onClick={()=>setTab('summary')}>Dados gerais</button>{details.sections.map(s=><button role="tab" key={s.key} aria-selected={tab===s.key} className={tab===s.key?'active':''} onClick={()=>setTab(s.key)}>{s.title} <span>{s.total}</span></button>)}</div>
 {tab==='summary'?<dl className="ops-fields">{details.fields.map((f,i)=><div key={`${f.label}-${i}`}><dt>{f.label}</dt><dd>{visible(f.value,f.label==='Situação'?'status':'')}</dd></div>)}</dl>:details.sections.filter(s=>s.key===tab).map(s=><div key={s.key} className="ops-section-body"><div className="ops-section-title"><h3>{s.title}</h3><small>{s.total} registro(s){s.truncated?' · Exibindo os mais recentes':''}</small></div>{s.items.length?<div className="table-wrap"><table><thead><tr>{s.columns.map(c=><th key={c.key}>{c.label}</th>)}</tr></thead><tbody>{s.items.map((r,i)=><tr key={r.id||i}>{s.columns.map(c=><td key={c.key}>{c.key==='status'?<span className={`status ${classeSituacao(r[c.key])}`}>{situacao(r[c.key])}</span>:visible(r[c.key],c.key)}</td>)}</tr>)}</tbody></table></div>:<p className="ops-no-records">Nenhum registro nesta seção.</p>}</div>)}
 </div></>:<div className="panel">Selecione outro registro para consultar sua ficha.</div>}</main></div>
 {action&&details&&<div className="modal-backdrop" onMouseDown={e=>e.currentTarget===e.target&&setAction(null)}><div className="modal ops-action-modal" role="dialog" aria-modal="true" aria-label="Operação vinculada"><div className="modal-head"><div><span className="eyebrow">OPERAÇÃO VINCULADA</span><h2>{action==='transition'?'Movimentação de contrato':action==='amendment'?'Solicitar aditivo':'Registrar matrícula'}</h2><p>{details.title}</p></div><button type="button" className="icon-btn" onClick={()=>setAction(null)} aria-label="Fechar">×</button></div>
 {error&&<div className="alert error">{error}</div>}
 <form onSubmit={save} className="ops-action-form">
 {(action==='student-enrollment'||action==='group-enrollment')&&<>
 {action==='group-enrollment'&&<label><span>Aluno *</span><LookupPicker name="personId" endpoint="/api/people/students" labelKey="fullName" required/></label>}
 <label><span>Curso {action==='group-enrollment'?'(opcional)':''}</span><select name="courseId" defaultValue=""><option value="">Selecione um curso</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 {action==='student-enrollment'&&<label><span>Turma (opcional)</span><select name="classGroupId" defaultValue=""><option value="">Selecione uma turma</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>}
 <label><span>Início</span><input name="startDate" type="date" defaultValue={dateValue()}/></label>
 <p className="ops-help">O aluno pode possuir vários cursos simultaneamente. Uma mesma turma pode atender cursos diferentes, desde que o vínculo esteja cadastrado.</p>
 </>}
 {action==='transition'&&<>
 <label><span>Nova situação *</span><select value={to} required onChange={e=>{setTo(e.target.value);setSigned(false)}}><option value="">Selecione</option>{transitions.map(s=><option value={s} key={s}>{situacao(s)}</option>)}</select></label>
 <label><span>Data efetiva *</span><input type="date" name="effectiveAt" defaultValue={dateValue()} required/></label>
 <label><span>Motivo ou observação</span><textarea name="reason" rows={4} placeholder="Descreva a movimentação contratual"/></label>
 {to==='ACTIVE'&&details.status==='PENDING_SIGNATURE'&&<label className="ops-checkbox"><input type="checkbox" checked={signed} onChange={e=>setSigned(e.target.checked)} required/><span>Confirmo que o contrato foi assinado e efetivado. A ativação exige confirmação documental externa.</span></label>}
 <p className="ops-help">O histórico de estados e o responsável pela mudança serão registrados em auditoria. Estados encerrados não podem ser reativados por esta operação.</p>
 </>}
 {action==='amendment'&&<><label><span>Tipo de aditivo *</span><input name="type" placeholder="Ex.: Alteração de vigência" minLength={3} maxLength={120} required/></label><label><span>Início da vigência *</span><input name="effectiveAt" type="date" defaultValue={dateValue()} required/></label><label><span>Descrição *</span><textarea name="description" minLength={10} maxLength={5000} required rows={5} placeholder="Detalhe a alteração solicitada e suas condições"/></label><p className="ops-help">O aditivo será criado como solicitação aberta. Não há geração ou upload de PDFs nesta etapa.</p></>}
 <div className="modal-actions"><button type="button" className="btn ghost" onClick={()=>setAction(null)}>Cancelar</button><button className="btn primary" disabled={busy||!!(action==='transition'&&to==='ACTIVE'&&details.status==='PENDING_SIGNATURE'&&!signed)}>{busy?'Salvando…':'Confirmar operação'}</button></div>
 </form></div></div>}
 </section>;
}
