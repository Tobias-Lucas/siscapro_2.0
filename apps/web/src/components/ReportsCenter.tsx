import React,{useEffect,useState} from 'react';
import {get} from '../lib/api';
import {Icon} from './Icon';

type Category={key:string;label:string;description:string;columns:string[];count:number};
type Preview={columns:string[];items:string[][];total:number;page:number;pageSize:number};
export function ReportsCenter(){
 const [catalog,setCatalog]=useState<Category[]>([]),[selected,setSelected]=useState(''),[loading,setLoading]=useState(false),[preview,setPreview]=useState<Preview|null>(null);
 const [page,setPage]=useState(1),[q,setQ]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState(''),[error,setError]=useState('');
 const selectedCategory=catalog.find(x=>x.key===selected);
 useEffect(()=>{get<Category[]>('/api/reports/catalog').then(data=>{setCatalog(data);if(data.length)setSelected(data[0].key)}).catch(e=>setError(e.message))},[]);
 useEffect(()=>{setPage(1)},[selected]);
 useEffect(()=>{if(!selected)return;let mounted=true;setLoading(true);setError('');const params=new URLSearchParams({page:String(page),q,from,to});const delay=setTimeout(()=>{
  get<Preview>(`/api/reports/${selected}/preview?${params}`).then(d=>mounted&&setPreview(d)).catch(e=>mounted&&setError(e.message)).finally(()=>mounted&&setLoading(false));
 },q?350:0);return()=>{mounted=false;clearTimeout(delay)}},[selected,q,from,to,page]);
 function exportFile(){
  if(!selected)return;
  const params=new URLSearchParams({q,from,to});
  const a=document.createElement('a');a.href=`/api/reports/${encodeURIComponent(selected)}/export?${params.toString()}`;
  a.download=`siscapro-relatorio-${selected}.csv`;
  document.body.append(a);a.click();a.remove();
 }
 return <section className="page reports-center"><header className="page-header"><div><span className="eyebrow">CONSULTAS</span><h1>Central de relatórios</h1><p>Consulte e exporte registros de acordo com as permissões do seu perfil.</p></div></header>
 {error&&<div className="alert error" role="alert">{error}</div>}
 <div className="reports-layout"><aside className="reports-menu" aria-label="Tipos de relatório">{catalog.map(x=><button type="button" key={x.key} className={selected===x.key?'active':''} onClick={()=>{setSelected(x.key);setQ('');setFrom('');setTo('')}}><strong>{x.label}</strong><span>{x.description}</span><small>{x.count.toLocaleString('pt-BR')} registros</small></button>)}</aside>
 <div className="reports-main"><div className="panel"><div className="panel-head report-section-head"><div><span className="eyebrow">RELATÓRIO</span><h3>{selectedCategory?.label||'Selecione um relatório'}</h3><p>{selectedCategory?.description}</p></div><button type="button" className="btn primary" onClick={exportFile} disabled={!selected}>Exportar CSV <Icon name="arrow" size={16}/></button></div>
 <div className="toolbar report-filter"><div className="searchbox"><Icon name="search" size={16}/><input value={q} onChange={e=>{setPage(1);setQ(e.target.value)}} placeholder="Pesquisar"/></div><label>De <input type="date" value={from} onChange={e=>{setPage(1);setFrom(e.target.value)}}/></label><label>Até <input type="date" value={to} onChange={e=>{setPage(1);setTo(e.target.value)}}/></label></div>
 <p className="report-count">{preview?.total.toLocaleString('pt-BR')||'0'} registros encontrados</p>
 <div className="table-wrap"><table><thead><tr>{preview?.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{loading?<tr><td colSpan={preview?.columns.length||1}>Consultando…</td></tr>:preview?.items.length?preview.items.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{v||'—'}</td>)}</tr>):<tr><td colSpan={preview?.columns.length||1}>Nenhum registro encontrado para o filtro selecionado.</td></tr>}</tbody></table></div>
 {preview&&preview.total>preview.pageSize&&<div className="op-pages"><button type="button" className="btn ghost" disabled={page<=1} onClick={()=>setPage(x=>x-1)}>Anterior</button><span>Página {page} de {Math.ceil(preview.total/preview.pageSize)}</span><button type="button" className="btn ghost" disabled={page>=Math.ceil(preview.total/preview.pageSize)} onClick={()=>setPage(x=>x+1)}>Próxima</button></div>}
 </div></div></div>
 </section>;
}
