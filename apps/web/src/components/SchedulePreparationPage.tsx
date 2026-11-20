import React, { useEffect, useState } from 'react';
import { get } from '../lib/api';
import { Icon } from './Icon';

type Readiness = {
  curriculumMatrices: number;
  curriculumModules: number;
  activeClassrooms: number;
  teacherAvailabilityRules: number;
  scheduleTemplates: number;
  activeScheduleRules: number;
  scheduleGenerationRuns: number;
  openScheduleConflicts: number;
  registeredLessons: number | null;
  note: string;
};

const phases = [
  { number: '01', title: 'Configuração semestral', description: 'Cursos e matrizes de 16/24 meses, ementas, módulos, sequência, carga horária e duração prevista.', icon: 'academic' },
  { number: '02', title: 'Recursos e disponibilidade', description: 'Facilitadores, formação, disciplinas habilitadas, disponibilidade por dia/turno, salas e unidades.', icon: 'people' },
  { number: '03', title: 'Montagem semanal', description: 'Distribuição por turma, dia, turno, faixa horária e ambiente, considerando retornos nas semanas 1ª/3ª/5ª, 2ª/4ª e exceções por curso.', icon: 'calendar' },
  { number: '04', title: 'Validação e publicação', description: 'Conferência de conflitos, ajustes manuais, substituições, reposições, publicação e histórico.', icon: 'check' },
];
const days = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

export function SchedulePreparationPage() {
  const [readiness,setReadiness]=useState<Readiness|null>(null);
  const [readinessError,setReadinessError]=useState('');
  useEffect(()=>{let active=true;get<any>('/api/dashboard/summary').then(result=>{if(active)setReadiness(result.scheduleReadiness||null)}).catch((error:any)=>{if(active)setReadinessError(error.message||'Não foi possível consultar a preparação.')});return()=>{active=false}},[]);
  const count=(value:number|undefined)=>value==null?'—':value.toLocaleString('pt-BR');
  return <section className="page schedule-preparation-page">
    <header className="page-header"><div><span className="eyebrow">SECRETARIA</span><h1>Planejamento do cronograma</h1><p>Estrutura funcional preparada para a futura automatização do cronograma semanal.</p></div><span className="preparation-badge"><span/> Preparação estrutural</span></header>
    <div className="panel schedule-intro"><div className="schedule-intro-icon"><Icon name="calendar" size={25}/></div><div><h2>Base preparada; geração automática ainda não ativada</h2><p>Esta versão organiza os dados necessários para o planejamento semestral e semanal. A montagem automática, a resolução de conflitos e a publicação do cronograma serão implementadas em uma etapa posterior. Nenhum cronograma é gerado automaticamente nesta versão.</p></div></div>

    <div className="schedule-readiness-card panel"><div className="panel-head"><div><span className="eyebrow">ESTRUTURA CADASTRADA</span><h3>Preparação atual do banco de dados</h3><p>Contagens reais das estruturas já disponíveis no PostgreSQL.</p></div><span className="readiness-status"><i/> Modelo preparado</span></div>
      {readinessError?<div className="dashboard-empty"><span><Icon name="alert" size={18}/></span>{readinessError}</div>:<div className="schedule-readiness-grid">
        <ReadinessMetric label="Matrizes curriculares" value={count(readiness?.curriculumMatrices)} icon="academic"/>
        <ReadinessMetric label="Módulos curriculares" value={count(readiness?.curriculumModules)} icon="book"/>
        <ReadinessMetric label="Salas ativas" value={count(readiness?.activeClassrooms)} icon="company"/>
        <ReadinessMetric label="Disponibilidades de facilitadores" value={count(readiness?.teacherAvailabilityRules)} icon="people"/>
        <ReadinessMetric label="Modelos semestrais" value={count(readiness?.scheduleTemplates)} icon="calendar"/>
        <ReadinessMetric label="Regras semanais" value={count(readiness?.activeScheduleRules)} icon="list"/>
        <ReadinessMetric label="Aulas na próxima semana" value={count(readiness?.registeredLessons ?? undefined)} icon="calendar"/>
        <ReadinessMetric label="Execuções registradas" value={count(readiness?.scheduleGenerationRuns)} icon="history"/>
        <ReadinessMetric label="Conflitos em aberto" value={count(readiness?.openScheduleConflicts)} icon="alert" warning={Boolean(readiness?.openScheduleConflicts)}/>
      </div>}
      <p className="readiness-note">{readiness?.note || 'As estruturas de planejamento estão disponíveis. A automação ainda não foi ativada.'}</p>
    </div>

    <div className="schedule-reference-head"><div><span className="eyebrow">FLUXO PREVISTO</span><h2>Como o planejamento deverá funcionar</h2><p>A planilha de referência reúne cursos e ementas, disponibilidade de facilitadores e quadros separados por dia e turno. Ela identifica matrizes de 16 e 24 meses e, para cursos de 23 meses, retorno na 1ª e 5ª semana, além de outros padrões 1ª/3ª/5ª e 2ª/4ª. O cronograma visual também precisa permitir leitura por ambiente e por turma.</p></div></div>
    <div className="schedule-phase-grid">{phases.map(phase => <article className="schedule-phase-card" key={phase.number}><div className="schedule-phase-top"><span>{phase.number}</span><Icon name={phase.icon} size={20}/></div><h3>{phase.title}</h3><p>{phase.description}</p></article>)}</div>

    <div className="panel schedule-layout-preview"><div className="panel-head"><div><span className="eyebrow">REFERÊNCIA VISUAL</span><h3>Dois modos de leitura do cronograma</h3><p>Prévia estrutural baseada no quadro visual e na planilha recebidos. As células estão vazias intencionalmente: não há geração nem dados de cronograma nesta versão.</p></div><span className="preparation-badge"><span/> Somente referência</span></div>
      <div className="schedule-preview-shift"><h4>Visão por ambiente · manhã</h4><div className="schedule-preview-scroll"><table><thead><tr><th>Dia</th><th>Faixa horária</th>{['Sala / ambiente 01','Sala / ambiente 02','Sala / ambiente 03','Sala / ambiente 04','Sala / ambiente 05','Sala / ambiente 06'].map(room=><th key={room}>{room}</th>)}</tr></thead><tbody>{days.map(day=><tr key={day}><th>{day}</th><td><span>Horário</span><small>Início · término</small></td>{Array.from({length:6},(_,index)=><td key={index}><span>Turma / atividade</span><small>Módulo · facilitador</small></td>)}</tr>)}</tbody></table></div></div>
      <div className="schedule-preview-shift"><h4>Visão por turma · tarde</h4><div className="schedule-preview-scroll"><table><thead><tr><th>Dia</th><th>Faixa horária</th>{['Turma 01','Turma 02','Turma 03','Turma 04','Turma 05','Turma 06'].map(group=><th key={group}>{group}</th>)}</tr></thead><tbody>{days.map(day=><tr key={day}><th>{day}</th><td><span>Horário</span><small>Início · término</small></td>{Array.from({length:6},(_,index)=><td key={index}><span>Atividade / módulo</span><small>Sala · facilitador</small></td>)}</tr>)}</tbody></table></div></div>
    </div>

    <div className="panel schedule-structure"><div className="panel-head"><div><span className="eyebrow">ESTRUTURAS DO SISTEMA</span><h3>Dados necessários previstos na modelagem</h3></div></div><div className="schedule-structure-grid">
      <div><strong>Cursos, ementas e módulos</strong><span>Curso, duração da matriz (16/24 meses ou duração específica), versão, módulo, sequência, carga horária, quantidade de aulas e parte básica/profissionalizante.</span><small>Course · CurriculumMatrix.durationMonths · CurriculumModule · CourseHours · CourseTeachingDays</small></div>
      <div><strong>Turmas e regras recorrentes</strong><span>Turma, dia da semana, turno, faixa horária, padrão de repetição (23 meses: 1ª/5ª; 1ª/3ª/5ª; 2ª/4ª; ou personalizado) e semanas específicas do mês.</span><small>ClassGroup · ScheduleTemplate · ScheduleRule</small></div>
      <div><strong>Facilitadores e disponibilidade</strong><span>Formação, disciplinas habilitadas e disponibilidade por dia da semana, turno e faixa horária.</span><small>User · DisciplineTeacher · TeacherAssignment · TeacherAvailability</small></div>
      <div><strong>Salas e ambientes</strong><span>Unidade, sala, capacidade, identificação do ambiente e vínculo com turma/aula.</span><small>Unit · Classroom · ClassGroup · AcademicLesson</small></div>
      <div><strong>Calendário e exceções</strong><span>Feriados, padrões de retorno, semanas alternadas, datas especiais, substituições e reposições.</span><small>Holiday · ScheduleRule.weekPattern · weekNumbers</small></div>
      <div><strong>Execução, conflitos e auditoria</strong><span>Registro de futuras execuções, aulas criadas, conflitos identificados e resolução manual.</span><small>ScheduleGenerationRun · ScheduleConflict · AcademicLesson</small></div>
    </div></div>
    <div className="schedule-principles"><h3>Critérios que deverão orientar a automação</h3><ul><li>Respeitar a duração dos cursos/matrizes, a sequência dos módulos e a carga horária definida na ementa.</li><li>Suportar os retornos de cursos de 23 meses na 1ª/5ª semana, padrões 1ª/3ª/5ª e 2ª/4ª semanas, além de exceções por curso e atividades especiais registradas no calendário.</li><li>Considerar disponibilidade dos facilitadores, disciplinas habilitadas, salas, unidades, turnos e faixas horárias.</li><li>Evitar sobreposição de facilitador, turma e sala no mesmo período.</li><li>Desconsiderar feriados e registrar reposições sem apagar o histórico anterior.</li><li>Permitir revisão manual, substituições, validação e publicação auditada pela Secretaria.</li></ul></div>
  </section>;
}
function ReadinessMetric({label,value,icon,warning=false}:{label:string;value:string;icon:string;warning?:boolean}){return <div className={`schedule-readiness-metric ${warning?'warning':''}`}><span><Icon name={icon} size={17}/></span><div><strong>{value}</strong><small>{label}</small></div></div>}
