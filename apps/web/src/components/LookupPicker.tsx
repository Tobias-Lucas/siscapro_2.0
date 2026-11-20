import React,{useEffect,useState} from 'react';
import {get} from '../lib/api';

export type Option={id:string;label:string};
const paging=new Set(['/api/people','/api/people/students','/api/companies','/api/contracts','/api/academic/courses','/api/academic/groups','/api/academic/enrollments','/api/finance/titles','/api/demands/options/companies','/api/demands/options/users','/api/demands/options/task-users','/api/demands/options/people']);
const rowLabel=(row:any,key:string)=>String(row?.[key]||row?.fullName||row?.tradeName||row?.legalName||row?.name||row?.number||row?.id||'');
/** Pesquisa remota de cadastros: não limita a seleção aos primeiros 200 alunos. */
export function LookupPicker({name,endpoint,labelKey='name',initialId='',initialLabel='',required=false,onSelect,onClear}:{
 name:string;endpoint:string;labelKey?:string;initialId?:string;initialLabel?:string;required?:boolean;onSelect?:(option:Option,row:any)=>void;onClear?:()=>void;
}){
 const [value,setValue]=useState(initialId),[selectedLabel,setSelectedLabel]=useState(initialId?(initialLabel||'Vínculo selecionado'):'');
 const [search,setSearch]=useState(''),[rows,setRows]=useState<(Option&{raw:any})[]>([]),[open,setOpen]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{setValue(initialId);setSelectedLabel(initialId?(initialLabel||'Vínculo selecionado'):'');setSearch('');setOpen(false)},[endpoint,initialId]);
 useEffect(()=>{
  let alive=true;const timer=setTimeout(async()=>{
   setBusy(true);setError('');try{
    const query=paging.has(endpoint)?`?paged=1&pageSize=25&q=${encodeURIComponent(search)}`:'';
    const result=await get<any>(endpoint+query);
    if(!alive)return;
    let list:Array<any>=Array.isArray(result)?result:(result?.items||[]);
    if(!paging.has(endpoint)&&search.trim()){
     const term=search.trim().toLocaleLowerCase('pt-BR');list=list.filter(r=>rowLabel(r,labelKey).toLocaleLowerCase('pt-BR').includes(term));
    }
    setRows(list.slice(0,25).map(r=>({id:String(r.id),label:rowLabel(r,labelKey),raw:r})));
   }catch(e:any){if(alive)setError(e.message||'Não foi possível consultar os cadastros');}
   finally{if(alive)setBusy(false)}
  },search?240:80);
  return()=>{alive=false;clearTimeout(timer)};
 },[endpoint,labelKey,search]);
 function select(o:Option&{raw:any}){setValue(o.id);setSelectedLabel(o.label);setSearch('');setOpen(false);onSelect?.(o,o.raw)}
 return <div className="lookup-picker">
  <input type="hidden" name={name} value={value}/>
  {value&&<div className="lookup-chosen"><span title={selectedLabel}>{selectedLabel}</span><button type="button" onClick={()=>{setValue('');setSelectedLabel('');setOpen(true);onClear?.()}} aria-label="Alterar seleção">Alterar</button></div>}
  {(!value||open)&&<div className="lookup-search">
    <input type="search" autoComplete="off" value={search} placeholder="Digite o nome ou a referência" onFocus={()=>setOpen(true)} onChange={e=>{setSearch(e.target.value);setOpen(true)}} aria-label="Pesquisar cadastro" aria-required={required&&!value}/>
    {open&&<div className="lookup-results" role="listbox">
      {busy?<div className="lookup-muted">Pesquisando…</div>:error?<div className="lookup-muted">{error}</div>:rows.length?rows.map(o=><button type="button" key={o.id} role="option" aria-selected={o.id===value} onClick={()=>select(o)}>{o.label}</button>):<div className="lookup-muted">Nenhum registro encontrado</div>}
      <button className="lookup-dismiss" type="button" onClick={()=>setOpen(false)}>Fechar pesquisa</button>
    </div>}
  </div>}
  {!value&&required&&<small className="lookup-hint">Selecione um registro para continuar.</small>}
 </div>
}
