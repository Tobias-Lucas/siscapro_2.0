import React,{useEffect,useMemo,useState} from 'react';
import {del,get,patch,post} from '../lib/api';
import {Icon} from './Icon';
import {DossierDrawer} from './DossierDrawer';
import {LookupPicker} from './LookupPicker';
import {classeSituacao,situacao,traduzirValor} from '../lib/format';
import {useAccess,endpointPolicy} from '../security/access';

export type Field={key:string;label:string;type?:'text'|'email'|'password'|'number'|'date'|'textarea'|'select'|'boolean';required?:boolean;options?:{label:string;value:string}[];lookup?:string;lookupLabel?:string;placeholder?:string;section?:string};
export type Column={key:string;label:string;render?:(row:any)=>React.ReactNode};
const read=(record:any,path:string)=>path.split('.').reduce((value,key)=>value?.[key],record);
const display=(v:any)=>v===null||v===undefined?'':String(v);
const initial=(v:any,type?:Field['type'])=>type==='date'&&typeof v==='string'?v.slice(0,10):display(v);
const pagedEndpoints=['/api/people','/api/people/students','/api/companies','/api/contracts','/api/recruitment/vacancies','/api/service/requests','/api/finance/titles','/api/academic/groups','/api/academic/courses','/api/academic/enrollments','/api/academic/attendance','/api/academic/grades'];
const stateFilters:Record<string,string[]>={
 '/api/people':['ACTIVE','PENDING','INACTIVE','ARCHIVED'],'/api/people/students':['ACTIVE','PENDING','INACTIVE','ARCHIVED'],'/api/companies':['ACTIVE','PENDING','INACTIVE','ARCHIVED'],
 '/api/academic/courses':['ACTIVE','PENDING','INACTIVE','ARCHIVED'],'/api/academic/groups':['ACTIVE','PENDING','INACTIVE','ARCHIVED'],
 '/api/academic/enrollments':['ACTIVE','PENDING','INACTIVE','ARCHIVED'],
 '/api/contracts':['DRAFT','PENDING_SIGNATURE','ACTIVE','SUSPENDED','TERMINATED','CANCELLED'],
 '/api/recruitment/vacancies':['ACTIVE','PENDING','INACTIVE','ARCHIVED'],
 '/api/service/requests':['OPEN','IN_PROGRESS','WAITING','DONE','CANCELLED'],
 '/api/finance/titles':['OPEN','IN_PROGRESS','WAITING','DONE','CANCELLED']
};
const sectionFor=(field:Field)=>{
 if(field.section)return field.section;
 const label=field.label.toLowerCase();
 if(/(logradouro|endereço|bairro|cidade|estado|cep|uf|número|complemento)/.test(label))return 'Endereço e localização';
 if(/(telefone|e-mail|contato|responsável|mãe|pai)/.test(label))return 'Contatos e responsáveis';
 if(/(data|início|fim|término|prazo|vencimento|carga|valor|salário|bolsa|jornada)/.test(label))return 'Prazos e condições';
 return 'Dados principais';
};
const groupFields=(fields:Field[])=>Object.entries(fields.reduce((all,f)=>{(all[sectionFor(f)] ||= []).push(f);return all},{} as Record<string,Field[]>));

export function CrudPage({title,eyebrow,description,endpoint,listEndpoint,columns,fields,editFields,editable=true,createOnly=false,archive=false,empty='Nenhum registro encontrado.',createLabel='Novo registro',archiveLabel='Arquivar',archiveMessage='O histórico será preservado.'}:{
 title:string;eyebrow?:string;description:string;endpoint:string;listEndpoint?:string;columns:Column[];fields?:Field[];editFields?:Field[];editable?:boolean;createOnly?:boolean;archive?:boolean;empty?:string;createLabel?:string;archiveLabel?:string;archiveMessage?:string;
}){
 const [rows,setRows]=useState<any[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[q,setQ]=useState(''),[stateFilter,setStateFilter]=useState('');
 const [loading,setLoading]=useState(true),[editing,setEditing]=useState<any|null>(null),[modal,setModal]=useState(false),[detail,setDetail]=useState<any|null>(null),[saving,setSaving]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[formError,setFormError]=useState(''),[revision,setRevision]=useState(0);
 const access=useAccess();const permission=endpointPolicy(endpoint);
 const canCreate=access.has(`${permission}.criar`) && editable;
 const canEdit=access.has(`${permission}.editar`) && editable;
 const canArchive=access.has(`${permission}.inativar`) && archive;
 const canExport=access.mode!=='CUSTOM'||(access.has(`${permission}.exportar`) && (!permission.startsWith('alunos.')||access.has('alunos.dados_sensiveis.visualizar')));
 const sourceEndpoint=listEndpoint||endpoint;
 const isPaged=pagedEndpoints.includes(sourceEndpoint),pageSize=25;
 const activeFields=editing?(editFields||fields||[]):(fields||[]);
 const canModify=(canCreate||canEdit)&&!!(editFields||fields);
 const formGroups=useMemo(()=>groupFields(activeFields),[activeFields]);
 useEffect(()=>{setPage(1);setQ('');setStateFilter('');setDetail(null)},[endpoint,sourceEndpoint]);
 useEffect(()=>{
  let alive=true;setLoading(true);setError('');
  const timer=setTimeout(()=>{
   const query=isPaged?`?paged=1&page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(q)}&status=${encodeURIComponent(stateFilter)}`:'';
   get<any>(sourceEndpoint+query).then(result=>{
    if(!alive)return;
    if(isPaged&&result&&Array.isArray(result.items)){setRows(result.items);setTotal(result.total)}
    else if(Array.isArray(result)){setRows(result);setTotal(result.length)}
    else{setRows([]);setTotal(0)}
   }).catch(e=>alive&&setError(e.message)).finally(()=>alive&&setLoading(false));
  },q?320:0);
  return()=>{alive=false;clearTimeout(timer)};
 },[sourceEndpoint,page,q,stateFilter,revision]);
 const filtered=useMemo(()=>isPaged?rows:rows.filter(r=>(!stateFilter||r.status===stateFilter)&&(!q||JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))),[rows,isPaged,q,stateFilter]);
 const count=isPaged?total:filtered.length;
 function showForm(record:any|null){setEditing(record);setModal(true);setFormError('');setDetail(null)}
 function updated(){setRevision(v=>v+1)}
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setSaving(true);setFormError('');
  const form=new FormData(event.currentTarget);const payload:Record<string,any>={};
  for(const field of activeFields){const raw=form.get(field.key);if(raw===null||raw===''){if(editing&&!field.required&&field.type!=='password')payload[field.key]=null;continue;}
   payload[field.key]=field.type==='number'?Number(raw):field.type==='boolean'?raw==='true':raw;
  }
  try{if(editing)await patch(`${endpoint}/${editing.id}`,payload);else await post(endpoint,payload);setModal(false);setEditing(null);setNotice('Registro salvo com sucesso.');updated()}
  catch(e:any){setFormError(e.message)}finally{setSaving(false)}
 }
 async function archiveRow(row:any){if(!window.confirm(`${archiveLabel} ${read(row,columns[0].key)||'este cadastro'}? ${archiveMessage}`))return;
  try{await del(`${endpoint}/${row.id}`);setNotice('Registro arquivado.');updated()}catch(e:any){setError(e.message)}
 }
 function exportCsv(){if(!filtered.length)return;const esc=(v:any)=>{const raw=String(v??'');const safe=/^[\t\r\n =+@-]/.test(raw)?"'"+raw:raw;return '"'+safe.replaceAll('"','""')+'"'};
  const csv=[columns.map(c=>esc(c.label)).join(';'),...filtered.map(r=>columns.map(c=>esc(traduzirValor(read(r,c.key),c.key))).join(';'))].join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`siscapro-${endpoint.split('/').pop()}-pagina-${page}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),500);
 }
 return <section className="page">
  <header className="page-header"><div><span className="eyebrow">{eyebrow||'CADASTROS'}</span><h1>{title}</h1><p>{description}</p></div><div className="page-actions">{canExport&&<button type="button" className="btn ghost" onClick={exportCsv} disabled={!filtered.length}>Exportar {isPaged?'página':'CSV'}</button>}{canCreate&&fields&&<button type="button" className="btn primary" onClick={()=>showForm(null)}><Icon name="plus" size={17}/>{createLabel}</button>}</div></header>
  <div className="toolbar toolbar-expanded"><div className="searchbox"><Icon name="search" size={17}/><input aria-label="Pesquisar" value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Pesquisar por nome, documento ou referência"/></div>
   {stateFilters[endpoint]&&<select className="status-filter" value={stateFilter} aria-label="Filtrar por situação" onChange={e=>{setStateFilter(e.target.value);setPage(1)}}><option value="">Todas as situações</option>{stateFilters[endpoint].map(x=><option key={x} value={x}>{situacao(x)}</option>)}</select>}
   <span className="record-count">{count.toLocaleString('pt-BR')} registro{count===1?'':'s'}</span><button type="button" className="btn ghost" title="Atualizar resultados" onClick={updated}>Atualizar</button></div>
  {error&&<div className="alert error" role="alert">{error}</div>}{notice&&<div className="alert info" role="status">{notice}</div>}
  <div className="data-card"><div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c.key}>{c.label}</th>)}<th>Ações</th></tr></thead>
   <tbody>{loading?<tr><td colSpan={columns.length+1}><div className="loading-line">Carregando…</div></td></tr>:filtered.length?filtered.map((r,i)=><tr key={r.id||i}>{columns.map(c=><td key={c.key}>{c.render?c.render(r):traduzirValor(read(r,c.key),c.key)}</td>)}<td><div className="table-actions"><button type="button" className="btn ghost" onClick={()=>setDetail(r)}>Abrir ficha</button>{canEdit&&!createOnly&&<button type="button" className="btn ghost" onClick={()=>showForm(r)}>Editar</button>}{canArchive&&<button type="button" className="btn ghost" onClick={()=>archiveRow(r)}>{archiveLabel}</button>}</div></td></tr>):<tr><td colSpan={columns.length+1}><div className="empty-state"><strong>{empty}</strong><span>Altere os filtros ou cadastre um novo registro.</span></div></td></tr>}</tbody></table></div></div>
  {isPaged&&count>pageSize&&<div className="op-pages"><button type="button" className="btn ghost" disabled={page<=1} onClick={()=>setPage(x=>x-1)}>Anterior</button><span>Página {page} de {Math.ceil(count/pageSize)}</span><button type="button" className="btn ghost" disabled={page>=Math.ceil(count/pageSize)} onClick={()=>setPage(x=>x+1)}>Próxima</button></div>}
  {detail&&<DossierDrawer endpoint={endpoint} record={detail} fields={columns} onClose={()=>setDetail(null)} onEdit={canEdit&&!createOnly?()=>showForm(detail):undefined}/>}
  {modal&&<div className="modal-backdrop" onMouseDown={e=>e.currentTarget===e.target&&setModal(false)}><div className="modal large-form-modal" key={editing?.id||'new'} role="dialog" aria-modal="true" aria-label={`${editing?'Editar':'Cadastrar'} ${title}`}>
   <div className="modal-head"><div><span className="eyebrow">{editing?'EDITAR CADASTRO':'NOVO CADASTRO'}</span><h2>{title}</h2></div><button type="button" className="icon-btn" onClick={()=>setModal(false)} aria-label="Fechar"><Icon name="close"/></button></div>
   <form onSubmit={submit}>{formError&&<div className="alert error" role="alert">{formError}</div>}
   <div className="form-sections">{formGroups.map(([group,grouped])=><section className="form-section" key={group}><h3>{group}</h3><div className="form-grid">{grouped.map(field=>{
    const current=initial(editing?.[field.key],field.type);
    const opts=field.options||[];
    const valueFromRecord=(name:string):any=>editing?.[name]?.fullName||editing?.[name]?.tradeName||editing?.[name]?.legalName||editing?.[name]?.name||editing?.[name]?.number;
    const initialLabel=field.key==='personId'?valueFromRecord('person'):field.key==='companyId'?valueFromRecord('company'):field.key==='contractId'?valueFromRecord('contract'):field.key==='courseId'?valueFromRecord('course'):field.key==='classGroupId'?valueFromRecord('classGroup'):field.key==='disciplineId'?valueFromRecord('discipline'):field.key==='teacherId'?valueFromRecord('teacher'):field.key==='userId'?valueFromRecord('user'):'';
    return <label key={field.key} className={field.type==='textarea'?'span-2':''}><span>{field.label}{field.required?' *':''}</span>
    {field.lookup?<LookupPicker key={`${field.key}-${editing?.id||'new'}`} name={field.key} endpoint={field.lookup} labelKey={field.lookupLabel||'name'} initialId={current} initialLabel={initialLabel||''} required={field.required}/>:
    field.type==='select'||field.type==='boolean'?<select name={field.key} defaultValue={current||''} required={field.required}><option value="">Selecione</option>{current&&opts.every(x=>x.value!==current)&&<option value={current}>{situacao(current)} (atual)</option>}{(field.type==='boolean'?[{label:'Sim',value:'true'},{label:'Não',value:'false'}]:opts).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:
    field.type==='textarea'?<textarea name={field.key} defaultValue={current} required={field.required} placeholder={field.placeholder} rows={4}/>:
    <input name={field.key} type={field.type||'text'} defaultValue={editing&&field.type==='password'?'':current} required={field.required&&!editing} placeholder={field.placeholder} step={field.type==='number'?'any':undefined}/>}</label>
   })}</div></section>)}</div><div className="modal-actions"><button type="button" className="btn ghost" onClick={()=>setModal(false)}>Cancelar</button><button type="submit" className="btn primary" disabled={saving}>{saving?'Salvando…':editing?'Salvar alterações':'Cadastrar'}</button></div></form>
  </div></div>}
 </section>;
}
export const status=(key='status')=>(row:any)=><span className={`status ${classeSituacao(row[key])}`}>{situacao(row[key])}</span>;
