import React,{useEffect,useMemo,useState} from 'react';
import {get,post} from '../lib/api';
import {Icon} from './Icon';
import {classeSituacao,situacao,traduzirValor} from '../lib/format';

type F={label:string;value:any};
type Item={title:string;meta?:string;status?:string};
type Section={title:string;items:Item[]};
type Dossier={title:string;subtitle?:string;fields:F[];sections:Section[]};
const domains:Record<string,string>={
 '/api/people':'people','/api/companies':'companies','/api/academic/courses':'courses',
 '/api/academic/groups':'groups','/api/academic/enrollments':'enrollments',
 '/api/academic/attendance':'attendance','/api/contracts':'contracts','/api/internships':'internships',
 '/api/recruitment/vacancies':'vacancies','/api/finance/titles':'finance',
 '/api/service/requests':'requests','/api/documents':'documents'
};
const group=(name:string)=>{
 const l=name.toLowerCase();
 if(/(endereço|logradouro|cep|cidade|bairro|número|complemento|estado)/.test(l))return 'Endereço';
 if(/(e-mail|telefone|contato|responsável|nome da mãe|nome do pai)/.test(l))return 'Contatos e responsáveis';
 if(/(data|início|término|prazo|vencimento|competência|valor|saldo|bolsa|carga horária)/.test(l))return 'Datas, prazos e valores';
 return 'Identificação e informações gerais';
};
export function DossierDrawer({endpoint,record,onClose,onEdit,fields:baseFields=[]}:{endpoint:string;record:any;onClose:()=>void;onEdit?:()=>void;fields?:{key:string;label:string}[]}){
 const [data,setData]=useState<Dossier|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[tab,setTab]=useState(0);
 const [interaction,setInteraction]=useState(''),[interactionStatus,setInteractionStatus]=useState('IN_PROGRESS'),[savingInteraction,setSavingInteraction]=useState(false),[refresh,setRefresh]=useState(0);
 const domain=domains[endpoint];
 useEffect(()=>{let active=true;setData(null);setError('');if(!domain){setData({title:String(record?.name||record?.fullName||record?.legalName||'Cadastro'),fields:baseFields.map(f=>({label:f.label,value:record?.[f.key]})),sections:[]});return;}
 setLoading(true);get<Dossier>(`/api/dossiers/${domain}/${encodeURIComponent(record.id)}`).then(d=>active&&setData(d)).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false));return()=>{active=false};},[endpoint,record?.id,refresh]);
 useEffect(()=>{function escape(e:KeyboardEvent){if(e.key==='Escape')onClose()}document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape)},[onClose]);
 async function addInteraction(e:React.FormEvent){e.preventDefault();if(!record?.id||!interaction.trim())return;setSavingInteraction(true);setError('');try{await post(`/api/service/requests/${encodeURIComponent(record.id)}/interactions`,{body:interaction,status:interactionStatus});setInteraction('');setRefresh(n=>n+1);setTab(1);}catch(e:any){setError(e.message)}finally{setSavingInteraction(false)}}
 useEffect(()=>setTab(0),[endpoint,record?.id]);
 const sections=(data?.sections||[]) as Section[];
 const groups=useMemo(()=>Object.entries((data?.fields||[]).reduce((all,f)=>{(all[group(f.label)] ||= []).push(f);return all},{} as Record<string,F[]>)),[data]);
 return <div className="dossier-backdrop" onMouseDown={e=>e.currentTarget===e.target&&onClose()}><aside className="dossier-drawer" role="dialog" aria-modal="true" aria-label="Ficha detalhada"><div className="dossier-head"><div><span className="eyebrow">FICHA DETALHADA</span><h2>{data?.title||'Consultar cadastro'}</h2><p>{data?.subtitle||'Informações e vínculos do registro selecionado'}</p></div><button className="icon-btn" aria-label="Fechar ficha" onClick={onClose}><Icon name="close"/></button></div>
 <div className="dossier-tools">{onEdit&&<button type="button" className="btn primary" onClick={onEdit}>Editar cadastro</button>}<button type="button" className="btn ghost" onClick={onClose}>Voltar para a lista</button></div>
 {loading?<div className="dossier-content">Carregando informações…</div>:error?<div className="dossier-content"><div className="alert error">{error}</div></div>:<>
 <div className="dossier-tabs" role="tablist"><button role="tab" type="button" aria-selected={tab===0} className={tab===0?'selected':''} onClick={()=>setTab(0)}>Dados cadastrais</button>{sections.map((section,i)=><button role="tab" key={`${section.title}-${i}`} type="button" aria-selected={tab===i+1} className={tab===i+1?'selected':''} onClick={()=>setTab(i+1)}>{section.title}<span>{section.items.length}</span></button>)}</div>
 <div className="dossier-content">{tab===0?groups.map(([name,items])=><section className="dossier-section" key={name}><h3>{name}</h3><dl className="dossier-fields">{items.map(f=><div key={f.label}><dt>{f.label}</dt><dd>{traduzirValor(f.value,f.label)}</dd></div>)}</dl></section>):sections[tab-1]&&<section className="dossier-section"><h3>{sections[tab-1].title}</h3>{endpoint==='/api/service/requests'&&<form className="dossier-interaction" onSubmit={addInteraction}><h4>Registrar andamento</h4><label><span>Descrição da interação</span><textarea value={interaction} required maxLength={5000} minLength={3} onChange={e=>setInteraction(e.target.value)} rows={4}/></label><label><span>Atualizar situação para</span><select value={interactionStatus} onChange={e=>setInteractionStatus(e.target.value)}><option value="IN_PROGRESS">Em andamento</option><option value="WAITING">Aguardando</option><option value="DONE">Concluído</option><option value="OPEN">Aberto</option><option value="CANCELLED">Cancelado</option></select></label><button className="btn primary" type="submit" disabled={savingInteraction}>{savingInteraction?'Registrando…':'Salvar andamento'}</button></form>}
 {sections[tab-1].items.length?<div className="dossier-related">{sections[tab-1].items.map((x,i)=><div className="dossier-related-item" key={i}><div><strong>{x.title}</strong>{x.meta&&<span>{x.meta}</span>}</div>{x.status&&<span className={`status ${classeSituacao(x.status)}`}>{situacao(x.status)}</span>}</div>)}</div>:<div className="empty-compact">Nenhum vínculo registrado nesta seção.</div>}</section>}</div>
 </>}</aside></div>;
}
