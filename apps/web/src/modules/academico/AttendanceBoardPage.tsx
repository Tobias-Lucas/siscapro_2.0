import React,{useEffect,useMemo,useState} from 'react';
import {get,post} from '../../lib/api';
import {useAccess} from '../../security/access';
import '../../styles/operational.css';

type Group={id:string;name:string;unit?:string};
type Attendance={id:string;present:boolean;justified:boolean;reason?:string|null};
type RosterRow={id:string;name:string;courses:string[];attendance:Attendance|null};
type Roster={group:Group;date:string;sessionKey:string;total:number;truncated?:boolean;rows:RosterRow[]};
type Mark={present:boolean;justified:boolean;reason:string};
const localDate=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60_000).toISOString().slice(0,10)};
const fromAttendance=(x:Attendance):Mark=>({present:x.present,justified:x.justified,reason:x.reason||''});
const markType=(x:Mark|null|undefined)=>!x?'':x.present?'P':x.justified?'FJ':'F';

/** A single read + one transactional write for a whole classroom attendance session. */
export function AttendanceBoardPage(){
 const access=useAccess();
 const [groups,setGroups]=useState<Group[]>([]),[groupId,setGroupId]=useState(''),[date,setDate]=useState(localDate()),[sessionKey,setSessionKey]=useState('turn');
 const [roster,setRoster]=useState<Roster|null>(null),[marks,setMarks]=useState<Record<string,Mark>>({}),[changed,setChanged]=useState<Set<string>>(new Set());
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[revision,setRevision]=useState(0);
 const canWrite=access.has('secretaria.frequencia.lancar');const canCorrect=access.has('secretaria.frequencia.corrigir');
 useEffect(()=>{get<Group[]>('/api/academic/attendance/group-options').then(d=>{setGroups(d);if(d.length)setGroupId(x=>x||d[0].id)}).catch(e=>setError(e.message))},[]);
 useEffect(()=>{if(!groupId){setRoster(null);return};let alive=true;setLoading(true);setError('');setChanged(new Set());
  get<Roster>(`/api/academic/groups/${encodeURIComponent(groupId)}/roster?classDate=${date}&sessionKey=${encodeURIComponent(sessionKey)}`)
  .then(d=>{if(!alive)return;setRoster(d);setMarks(Object.fromEntries(d.rows.filter(r=>r.attendance).map(r=>[r.id,fromAttendance(r.attendance!)])))}).catch(e=>{if(alive){setRoster(null);setError(e.message)}}).finally(()=>alive&&setLoading(false));return()=>{alive=false};
 },[groupId,date,sessionKey,revision]);
 const summary=useMemo(()=>({
  present:roster?.rows.filter(r=>markType(marks[r.id])==='P').length||0,
  absent:roster?.rows.filter(r=>markType(marks[r.id])==='F').length||0,
  justified:roster?.rows.filter(r=>markType(marks[r.id])==='FJ').length||0,
 }),[roster,marks]);
 function update(id:string,next:Mark){setMarks(prev=>({...prev,[id]:next}));setChanged(prev=>new Set(prev).add(id));setNotice('')}
 function setType(row:RosterRow,value:string){
  if(!value){
   // "Não lançado" restores an unmarked row; it must never be sent as an absence.
   if(!row.attendance){setMarks(prev=>{const next={...prev};delete next[row.id];return next});setChanged(prev=>{const next=new Set(prev);next.delete(row.id);return next})}
   return;
  }
  const existing=marks[row.id];update(row.id,{present:value==='P',justified:value==='FJ',reason:value==='FJ'?(existing?.reason||''):''});
 }
 function fillUnmarkedPresent(){if(!roster)return;const changes:Record<string,Mark>={};const updated=new Set(changed);
  for(const r of roster.rows){if(!r.attendance&&!marks[r.id]){changes[r.id]={present:true,justified:false,reason:''};updated.add(r.id)}}
  setMarks(prev=>({...prev,...changes}));setChanged(updated);
 }
 async function save(){if(!roster||!canWrite||!changed.size||roster.truncated)return;
  const invalid=roster.rows.find(r=>changed.has(r.id)&&marks[r.id]?.justified&&(marks[r.id].reason||'').trim().length<5);
  if(invalid){setError(`Informe um motivo de pelo menos 5 caracteres para a falta justificada de ${invalid.name}.`);return}
  const corrections=roster.rows.filter(r=>changed.has(r.id)&&!!r.attendance);
  if(corrections.length&&!canCorrect){setError('Corrigir marcações existentes exige a permissão específica de correção.');return}
  if(!window.confirm(`Salvar ${changed.size} marcação(ões) para ${roster.group.name} em ${date}?`))return;
  setBusy(true);setError('');setNotice('');
  try{
   const selected=roster.rows.filter(r=>changed.has(r.id)).map(r=>({personId:r.id,...marks[r.id]}));
   const result=await post<{received:number;changed:number;unchanged:number}>(`/api/academic/groups/${encodeURIComponent(groupId)}/attendance/batch`,{classDate:date,sessionKey,marks:selected});
   setNotice(`${result.changed} marcação(ões) gravadas com auditoria; ${result.unchanged} sem alteração.`);setRevision(n=>n+1);
  }catch(e:any){setError(e.message)}finally{setBusy(false)}
 }
 return <section className="page operational-page"><header className="page-header"><div><span className="eyebrow">SECRETARIA · DIÁRIO DE CLASSE</span><h1>Chamada por turma</h1><p>Registre a presença de toda a turma, com justificativas, consulta ao histórico existente e auditoria das correções.</p></div></header>
 <div className="panel ops-attendance-filters"><label>Turma<select value={groupId} onChange={e=>setGroupId(e.target.value)}><option value="">Selecione</option>{groups.map(g=><option value={g.id} key={g.id}>{g.name}{g.unit?` · ${g.unit}`:''}</option>)}</select></label><label>Data da aula<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Identificador da sessão<input value={sessionKey} maxLength={40} pattern="[-a-zA-Z0-9_]{1,40}" onChange={e=>setSessionKey(e.target.value)} placeholder="turn"/></label><button className="btn ghost" onClick={()=>setRevision(v=>v+1)}>Consultar chamada</button></div>
 {error&&<div className="alert error" role="alert">{error}</div>}{notice&&<div className="alert info" role="status">{notice}</div>}
 {loading?<div className="panel">Carregando lista de chamada…</div>:roster&&<>
 <div className="ops-attendance-summary"><div><strong>{roster.total}</strong><span>Alunos na lista</span></div><div><strong>{summary.present}</strong><span>Presentes</span></div><div><strong>{summary.absent}</strong><span>Faltas</span></div><div><strong>{summary.justified}</strong><span>Justificadas</span></div><div><strong>{changed.size}</strong><span>Alterações pendentes</span></div></div>
 {roster.truncated&&<div className="alert error">A lista excede o limite de leitura. Não é permitido salvar uma chamada incompleta nesta tela.</div>}
 <div className="panel"><div className="ops-attendance-head"><div><h3>{roster.group.name}</h3><p>Alunos com matrícula ativa e data dentro do período da lista de chamada. Várias matrículas do mesmo aluno são consolidadas.</p></div><div className="ops-attendance-actions"><button className="btn ghost" type="button" onClick={fillUnmarkedPresent} disabled={!canWrite||roster.truncated}>Marcar pendentes como presentes</button><button className="btn primary" type="button" onClick={save} disabled={!canWrite||!changed.size||busy||roster.truncated}>{busy?'Salvando…':`Salvar chamada (${changed.size})`}</button></div></div>
 <div className="table-wrap"><table className="ops-attendance-table"><thead><tr><th>Aluno</th><th>Curso(s)</th><th>Registro existente</th><th>Nova marcação</th><th>Motivo da justificativa</th></tr></thead><tbody>{roster.rows.map(r=>{
  const selected=marks[r.id];const existing=r.attendance;const readonly=!canWrite||(!!existing&&!canCorrect);
  return <tr key={r.id} className={changed.has(r.id)?'ops-modified':''}><td><strong>{r.name}</strong></td><td>{r.courses.join(', ')||'—'}</td><td>{existing?(existing.present?'Presente':existing.justified?'Falta justificada':'Falta'):'Pendente'}</td><td><select aria-label={`Presença de ${r.name}`} disabled={readonly} value={markType(selected)} onChange={e=>setType(r,e.target.value)}>{!existing&&<option value="">Não lançado</option>}<option value="P">Presente</option><option value="F">Falta</option><option value="FJ">Falta justificada</option></select></td><td>{markType(selected)==='FJ'?<input aria-label={`Motivo de ${r.name}`} disabled={readonly} minLength={5} maxLength={2000} placeholder="Motivo obrigatório" value={selected?.reason||''} onChange={e=>update(r.id,{...selected,reason:e.target.value})}/>:<span className="muted">—</span>}</td></tr>
 })}{!roster.rows.length&&<tr><td colSpan={5}>Nenhum aluno elegível para chamada nesta data.</td></tr>}</tbody></table></div>
 </div></>}
 </section>;
}
