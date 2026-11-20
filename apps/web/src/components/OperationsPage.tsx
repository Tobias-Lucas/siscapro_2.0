import React,{useEffect,useMemo,useState} from 'react';
import {get,post,patch} from '../lib/api';
import {Icon} from './Icon';
import {DossierDrawer} from './DossierDrawer';
import {situacao,traduzirValor} from '../lib/format';
import {useAccess} from '../security/access';

type Field={key:string;type:string;optional:boolean;ref?:string|null;default?:string;label:string;multiline?:boolean;options?:string[]};
type Resource={model:string;slug:string;label:string;group:string;roles:string[];fields:Field[]};
type Paged={items:any[];total:number;page:number;pageSize:number};
const safe=(v:any)=>v===null||v===undefined?'':String(v);
const dateValue=(v:any)=>typeof v==='string'?v.slice(0,10):'';
const format=(v:any,t?:string)=>{
 if(v===null||v===undefined||v==='')return '—';
 if(t==='Boolean')return v?'Sim':'Não';
 if(t==='DateTime')return new Date(v).toLocaleDateString('pt-BR');
 if(t==='Decimal')return Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
 return situacao(v);
};
const emptyForm=(resource:Resource,record:any|null)=>Object.fromEntries(resource.fields.filter(f=>f.key!=='amount'||resource.model!=='InvoiceLine').map(f=>[f.key,record?((f.type==='DateTime'?dateValue(record[f.key]):record[f.key])??''):(f.default==='true'?true:f.default==='false'?false:(f.default&&f.default!=='now()'?f.default:''))]));

export function OperationsPage({group}:{group:string}){
 const access=useAccess();
 const [catalog,setCatalog]=useState<Resource[]>([]),[resourceId,setResourceId]=useState(''),[page,setPage]=useState(1),[q,setQ]=useState(''),[response,setResponse]=useState<Paged>({items:[],total:0,page:1,pageSize:100}),[loading,setLoading]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[refresh,setRefresh]=useState(0);
 const [showEditor,setShowEditor]=useState(false),[editing,setEditing]=useState<any|null>(null),[draft,setDraft]=useState<Record<string,any>>({}),[saving,setSaving]=useState(false);
 const [options,setOptions]=useState<Record<string,{id:string;label:string}[]>>({});
 const [detail,setDetail]=useState<any|null>(null);
 const resources=useMemo(()=>catalog.filter(r=>r.group===group),[catalog,group]);
 const resource=resources.find(x=>x.slug===resourceId)||resources[0];
 const canCreate=!!resource&&access.has(`cadastros.${resource.slug}.criar`);
 const canEdit=!!resource&&access.has(`cadastros.${resource.slug}.editar`);
 const canArchive=!!resource&&access.has(`cadastros.${resource.slug}.inativar`);
 useEffect(()=>{let active=true;get<Resource[]>('/api/operations/catalog').then(r=>active&&setCatalog(r)).catch(e=>active&&setError(e.message));return()=>{active=false}},[]);
 useEffect(()=>{setResourceId('');setPage(1);setQ('');setResponse({items:[],total:0,page:1,pageSize:100})},[group]);
 useEffect(()=>{if(!resource)return;let ok=true;setLoading(true);setError('');get<Paged>(`/api/operations/${resource.slug}?page=${page}&q=${encodeURIComponent(q)}`).then(d=>ok&&setResponse(d)).catch(e=>ok&&setError(e.message)).finally(()=>ok&&setLoading(false));return()=>{ok=false}},[resource?.slug,page,q,refresh]);
 useEffect(()=>{if(!resource)return;const refs=[...new Set(resource.fields.map(f=>f.ref).filter((x):x is string=>!!x))];let mounted=true;Promise.all(refs.map(async ref=>{try{return [ref,await get<{id:string;label:string}[]>(`/api/operations/options/${ref}`)] as const}catch{return [ref,[]] as const}})).then(rows=>mounted&&setOptions(old=>({...old,...Object.fromEntries(rows)})));return()=>{mounted=false}},[resource?.slug]);
 function choose(slug:string){setResourceId(slug);setDetail(null);setPage(1);setQ('');setNotice('');setError('')}
 function edit(record:any|null){if(!resource)return;setEditing(record);setDraft(emptyForm(resource,record));setShowEditor(true);setError('');setNotice('')}
 const columns=resource?.fields.filter(f=>!['body','templateText','reviewNotes','content'].includes(f.key)).slice(0,6)||[];
 const displayField=(row:any,field:Field)=>field.ref?options[field.ref]?.find(o=>o.id===row[field.key])?.label||format(row[field.key],field.type):format(row[field.key],field.type);
 async function save(event:React.FormEvent){event.preventDefault();if(!resource)return;setSaving(true);setError('');try{
   const values:Record<string,any>={};for(const field of resource.fields){if(field.key==='amount'&&resource.model==='InvoiceLine')continue;const raw=draft[field.key];if(raw===undefined||raw===null||raw===''){if(editing&&field.optional)values[field.key]=null;continue}
    values[field.key]=field.type==='Int'||field.type==='Decimal'?Number(raw):field.type==='Boolean'?raw===true||raw==='true':raw;}
   if(editing)await patch(`/api/operations/${resource.slug}/${editing.id}`,values);else await post(`/api/operations/${resource.slug}`,values);
   setShowEditor(false);setEditing(null);setNotice('Registro salvo e auditado.');setRefresh(v=>v+1);
 }catch(e:any){setError(e.message)}finally{setSaving(false)}}
 async function archive(record:any){if(!resource||!window.confirm('Arquivar este registro? O histórico permanecerá preservado.'))return;try{await post(`/api/operations/${resource.slug}/${record.id}/archive`,{});setNotice('Registro arquivado.');setRefresh(x=>x+1)}catch(e:any){setError(e.message)}}
 function exportCSV(){if(!resource)return;const esc=(v:string)=>{const a=/^[\s\t\r\n=+@-]/.test(v)?"'"+v:v;return '"'+a.replaceAll('"','""')+'"'};const csv=[columns.map(c=>esc(c.label)).join(';'),...response.items.map(r=>columns.map(c=>esc(displayField(r,c))).join(';'))].join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`proativa-${resource.slug}-p${page}.csv`;a.click();URL.revokeObjectURL(url)}
 return <section className="page operations-page"><header className="page-header"><div><span className="eyebrow">GESTÃO</span><h1>{group}</h1><p>Consulte e atualize os registros desta área.</p></div><span className="op-count">{resources.length} cadastros disponíveis</span></header>
  {!resources.length?<div className="panel">Nenhuma operação disponível para seu perfil.</div>:<>
   <div className="op-tabs">{resources.map(r=><button key={r.slug} type="button" className={resource?.slug===r.slug?'selected':''} onClick={()=>choose(r.slug)}>{r.label}</button>)}</div>
   <div className="panel op-current"><div className="panel-head"><div><span className="eyebrow">CADASTRO OPERACIONAL</span><h3>{resource?.label}</h3><p className="op-desc">Consulte os cadastros e mantenha as informações atualizadas.</p></div><div className="page-actions"><button className="btn ghost" onClick={exportCSV} disabled={!response.items.length}>Exportar CSV</button>{canCreate&&<button className="btn primary" onClick={()=>edit(null)}><Icon name="plus" size={17}/>Novo registro</button>}</div></div>
    <div className="toolbar"><div className="searchbox"><Icon name="search" size={17}/><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Pesquisar registros"/></div><span className="record-count">{response.total} registro(s)</span></div>
    {error&&<div className="alert error">{error}</div>}{notice&&<div className="alert info">{notice}</div>}
    <div className="table-wrap"><table><thead><tr>{columns.map(f=><th key={f.key}>{f.label}</th>)}<th>Ações</th></tr></thead><tbody>{loading?<tr><td colSpan={columns.length+1}>Carregando…</td></tr>:!response.items.length?<tr><td colSpan={columns.length+1}><div className="empty-state"><strong>Nenhum registro cadastrado</strong><span>Utilize Novo registro para realizar o cadastro.</span></div></td></tr>:response.items.map(r=><tr key={r.id}>{columns.map(f=><td key={f.key}>{displayField(r,f)}</td>)}<td><div className="table-actions"><button className="btn ghost" onClick={()=>setDetail(r)}>Abrir ficha</button>{canEdit&&<button className="btn ghost" onClick={()=>edit(r)}>Editar</button>}{canArchive&&resource?.fields.some(f=>f.key==='status'&&f.type==='RecordStatus')&&r.status!=='ARCHIVED'&&<button className="btn ghost" onClick={()=>archive(r)}>Arquivar</button>}</div></td></tr>)}</tbody></table></div>
    {response.total>response.pageSize&&<div className="op-pages"><button className="btn ghost" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page} de {Math.ceil(response.total/response.pageSize)}</span><button className="btn ghost" disabled={page>=Math.ceil(response.total/response.pageSize)} onClick={()=>setPage(p=>p+1)}>Próxima</button></div>}
   </div>
  </>}
  {detail&&resource&&<DossierDrawer endpoint={`/api/operations/${resource.slug}`} record={{...detail,name:displayField(detail,resource.fields[0]),...Object.fromEntries(resource.fields.map(f=>[f.key,displayField(detail,f)]))}} fields={resource.fields} onClose={()=>setDetail(null)} onEdit={canEdit?()=>{const current=detail;setDetail(null);edit(current)}:undefined}/>}
  {showEditor&&resource&&<div className="modal-backdrop" onMouseDown={e=>e.currentTarget===e.target&&setShowEditor(false)}><div className="modal op-modal"><div className="modal-head"><div><span className="eyebrow">{editing?'EDITAR':'NOVO'} REGISTRO</span><h2>{resource.label}</h2></div><button className="icon-btn" onClick={()=>setShowEditor(false)} aria-label="Fechar"><Icon name="close"/></button></div><form onSubmit={save}>{error&&<div className="alert error">{error}</div>}<div className="form-grid">{resource.fields.filter(f=>!(resource.model==='InvoiceLine'&&f.key==='amount')).map(f=><label key={f.key} className={f.multiline?'span-2':''}><span>{f.label}{!f.optional&&f.default===undefined?' *':''}</span>
    {f.ref?<select value={safe(draft[f.key])} required={!f.optional} onChange={e=>setDraft(d=>({...d,[f.key]:e.target.value}))}><option value="">Selecione</option>{(options[f.ref]||[]).map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select>:
    f.options?<select value={safe(draft[f.key])} required={!f.optional} onChange={e=>setDraft(d=>({...d,[f.key]:e.target.value}))}><option value="">Selecione</option>{f.options.map(o=><option key={o} value={o}>{situacao(o)}</option>)}</select>:
    f.type==='Boolean'?<select value={safe(draft[f.key])} onChange={e=>setDraft(d=>({...d,[f.key]:e.target.value==='true'}))}><option value="true">Sim</option><option value="false">Não</option></select>:
    f.multiline?<textarea rows={f.key==='templateText'?8:3} value={safe(draft[f.key])} onChange={e=>setDraft(d=>({...d,[f.key]:e.target.value}))} required={!f.optional}/>:
    <input type={f.type==='DateTime'?'date':f.type==='Int'||f.type==='Decimal'?'number':f.key.toLowerCase().includes('email')?'email':'text'} min={f.type==='Int'?'0':undefined} step={f.type==='Decimal'?'0.01':f.type==='Int'?'1':undefined} value={safe(draft[f.key])} onChange={e=>setDraft(d=>({...d,[f.key]:e.target.value}))} required={!f.optional&&f.default===undefined}/>}</label>)}</div>
    <div className="modal-actions"><button className="btn ghost" type="button" onClick={()=>setShowEditor(false)}>Cancelar</button><button className="btn primary" disabled={saving}>{saving?'Salvando…':editing?'Salvar alterações':'Cadastrar'}</button></div></form></div></div>}
 </section>;
}
