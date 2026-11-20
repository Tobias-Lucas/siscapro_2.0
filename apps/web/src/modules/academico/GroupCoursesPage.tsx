import React,{useEffect,useState} from 'react';
import {get,post} from '../../lib/api';
import {useAccess} from '../../security/access';
type Group={id:string;name:string;unit?:string|null;courseLinks?:Link[]};
type Course={id:string;name:string;code?:string|null};
type Link={id:string;courseId:string;course?:Course;evidence?:string};
/** Independent Secretaria module. Historical course links are never deleted automatically. */
export function GroupCoursesPage(){
 const access=useAccess(),[groups,setGroups]=useState<Group[]>([]),[courses,setCourses]=useState<Course[]>([]);
 const [groupId,setGroupId]=useState(''),[courseId,setCourseId]=useState(''),[links,setLinks]=useState<Link[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const allowEdit=access.has('secretaria.turmas_cursos.editar');
 const refresh=async()=>{const [g,c]=await Promise.all([get<Group[]>('/api/academic/group-options'),get<Course[]>('/api/academic/course-options')]);setGroups(g);setCourses(c);if(!groupId&&g.length)setGroupId(g[0].id)};
 useEffect(()=>{refresh().catch(e=>setError(e.message))},[]);
 useEffect(()=>{if(!groupId){setLinks([]);return;}let active=true;get<Link[]>(`/api/academic/groups/${encodeURIComponent(groupId)}/courses`).then(r=>active&&setLinks(r)).catch(e=>active&&setError(e.message));return()=>{active=false};},[groupId]);
 async function link(e:React.FormEvent){e.preventDefault();if(!groupId||!courseId||!allowEdit)return;setBusy(true);setError('');setMessage('');try{await post(`/api/academic/groups/${encodeURIComponent(groupId)}/courses`,{courseId});setCourseId('');setLinks(await get(`/api/academic/groups/${encodeURIComponent(groupId)}/courses`));setMessage('Curso vinculado à turma. Os vínculos anteriores foram preservados.')}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 return <section className="page"><header className="page-header"><div><span className="eyebrow">SECRETARIA · RELACIONAMENTOS</span><h1>Cursos vinculados às turmas</h1><p>Uma turma pode reunir estudantes de cursos diferentes. O curso de cada aluno permanece registrado na matrícula.</p></div></header>
 {error&&<div className="alert error" role="alert">{error}</div>}{message&&<div className="alert info">{message}</div>}
 <div className="panel"><label>Turma<select value={groupId} onChange={e=>{setGroupId(e.target.value);setMessage('')}}><option value="">Selecione a turma</option>{groups.map(g=><option value={g.id} key={g.id}>{g.name}{g.unit?` — ${g.unit}`:''}</option>)}</select></label>
 <h3>Cursos relacionados</h3><div className="table-wrap"><table><thead><tr><th>Curso</th><th>Código</th><th>Origem do vínculo</th></tr></thead><tbody>{links.map(x=><tr key={x.id}><td>{x.course?.name||x.courseId}</td><td>{x.course?.code||'—'}</td><td>{x.evidence==='MANUAL'?'Vínculo administrativo':x.evidence==='LEGACY_ENROLLMENT'?'Matrícula legada':x.evidence||'Referência histórica'}</td></tr>)}{!links.length&&<tr><td colSpan={3}>Nenhum curso associado nesta base.</td></tr>}</tbody></table></div>
 {allowEdit&&<form className="inline-form" onSubmit={link}><label>Adicionar curso<select value={courseId} required onChange={e=>setCourseId(e.target.value)}><option value="">Selecione</option>{courses.filter(c=>!links.some(l=>l.courseId===c.id)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button className="btn primary" disabled={!groupId||!courseId||busy}>{busy?'Vinculando…':'Vincular curso'}</button></form>}
 <p className="finance-helper">Esta tela não transfere alunos nem modifica matrículas; apenas mantém a associação entre turma e catálogo de cursos.</p></div></section>;
}
