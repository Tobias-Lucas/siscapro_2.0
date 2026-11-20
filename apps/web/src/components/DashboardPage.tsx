import React, { useEffect, useState } from 'react';
import { get } from '../lib/api';
import { Icon } from './Icon';
import '../styles/dashboard.css';

 type DashboardData = {
  generatedAt: string;
  permissions: { finance: boolean; contracts: boolean; secretary: boolean; service: boolean; triage: boolean };
  metrics: Record<string, number | null>;
  charts: {
    receiptsByMonth: Array<{ key: string; label: string; value: number }>;
    enrollmentsByMonth: Array<{ key: string; label: string; value: number }>;
    contractsByStatus: Array<{ status: string; label: string; value: number }>;
    financialByStatus: Array<{ status: string; label: string; value: number }>;
  };
  expiringContracts: Array<{ id: string; number: string | null; endDate: string; person: { fullName: string }; companyName: string; daysRemaining: number }>;
  financialAttention: Array<{ id: string; description: string; dueDate: string; amount: number; paid: number; remaining: number; personName: string | null; companyName: string | null; overdue: boolean }>;
  serviceAttention: Array<{ id: string; type: string; description: string | null; dueDate: string | null; status: string; person: { fullName: string } | null }>;
  academicWeek: Array<{ id: string; title: string; lessonDate: string; shift: string; room: string | null; state: string; teacherName: string | null; disciplineName: string | null; classGroupName: string; courseName: string | null }>;
  scheduleReadiness: { curriculumMatrices: number; curriculumModules: number; activeClassrooms: number; teacherAvailabilityRules: number; scheduleTemplates: number; activeScheduleRules: number; scheduleGenerationRuns: number; openScheduleConflicts: number; registeredLessons: number | null; note: string } | null;
 };

const currency = (value: number | null | undefined) => value == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
const dateLabel = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).replace('.', '') : 'Sem data';
const statusClass = (value: string) => value === 'ACTIVE' || value === 'DONE' ? 'good' : value === 'CANCELLED' || value === 'TERMINATED' ? 'muted' : value === 'SUSPENDED' ? 'warning' : 'pending';

export function DashboardPage({ onNavigate, role }: { onNavigate: (route: string) => void; role: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    setLoading(true);
    setError('');
    setRetrying(false);
    const loadSummary = () => {
      get<DashboardData>('/api/dashboard/summary')
        .then(result => {
          if (!alive) return;
          setData(result);
          setError('');
          setRetrying(false);
          setLoading(false);
        })
        .catch((err: any) => {
          if (!alive) return;
          const temporary = [502, 503, 504].includes(Number(err?.status)) || err instanceof TypeError;
          if (temporary && attempts < 4) {
            attempts += 1;
            setRetrying(true);
            setError('Conexao temporaria com a API. Tentando reconectar automaticamente...');
            retryTimer = setTimeout(loadSummary, 2500);
            return;
          }
          setRetrying(false);
          setError(err.message || 'Não foi possível carregar os indicadores.');
          setLoading(false);
        });
    };
    loadSummary();
    return () => { alive = false; if (retryTimer) clearTimeout(retryTimer); };
  }, [revision]);

  const metrics = data?.metrics;
  const canSeeFinance = data?.permissions.finance ?? ['SUPER_ADMIN', 'ADMIN', 'FINANCE'].includes(role);
  const canSeeContracts = data?.permissions.contracts ?? ['SUPER_ADMIN', 'ADMIN', 'CONTRACTS', 'HR'].includes(role);
  const canSeeSecretary = data?.permissions.secretary ?? ['SUPER_ADMIN', 'ADMIN', 'SECRETARY'].includes(role);
  const canSeeService = data?.permissions.service ?? ['SUPER_ADMIN', 'ADMIN', 'RECEPTION', 'SOCIAL_SERVICE', 'SECRETARY'].includes(role);
  const canSeeTriage = data?.permissions.triage ?? ['SUPER_ADMIN', 'ADMIN', 'TRIAGE', 'COMMERCIAL'].includes(role);
  const canSeeAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(role);

  const routeAccess: Record<string, string[]> = { people: ['SUPER_ADMIN','ADMIN','SECRETARY','CONTRACTS','TRIAGE','SOCIAL_SERVICE','RECEPTION','COMMERCIAL','HR'], contracts: ['SUPER_ADMIN','ADMIN','CONTRACTS','HR'], companies: ['SUPER_ADMIN','ADMIN','CONTRACTS','FINANCE','COMMERCIAL','HR'], groups: ['SUPER_ADMIN','ADMIN','SECRETARY'], finance: ['SUPER_ADMIN','ADMIN','FINANCE'], requests: ['SUPER_ADMIN','ADMIN','SOCIAL_SERVICE','RECEPTION','SECRETARY'], documents: ['SUPER_ADMIN','ADMIN','CONTRACTS','SECRETARY','HR','SOCIAL_SERVICE'], schedulePlan: ['SUPER_ADMIN','ADMIN','SECRETARY'], 'op.Recrutamento': ['SUPER_ADMIN','ADMIN','TRIAGE','COMMERCIAL'], vacancies: ['SUPER_ADMIN','ADMIN','TRIAGE','COMMERCIAL'], reports: ['SUPER_ADMIN','ADMIN','SECRETARY','FINANCE','TRIAGE','CONTRACTS','SOCIAL_SERVICE','RECEPTION','COMMERCIAL','HR'] };
  const canNavigate = (route: string) => ['SUPER_ADMIN','ADMIN'].includes(role) || (routeAccess[route] || []).includes(role);

  const primaryCards = [
    { label: 'Alunos com matrícula ativa', value: metrics?.activeStudents, detail: `${(metrics?.activeEnrollments ?? 0).toLocaleString('pt-BR')} vínculos ativos`, icon: 'people', route: 'people', tone: 'blue' },
    { label: 'Contratos ativos', value: metrics?.activeContracts, detail: canSeeContracts ? `${(metrics?.contractsExpiring30 ?? 0).toLocaleString('pt-BR')} vencem em 30 dias` : 'Vínculos contratuais', icon: 'contract', route: 'contracts', tone: 'navy' },
    { label: 'Empresas ativas', value: metrics?.activeCompanies, detail: 'Empresas cadastradas como ativas', icon: 'company', route: 'companies', tone: 'cyan' },
    { label: 'Turmas ativas', value: metrics?.activeGroups, detail: canSeeSecretary ? `${(metrics?.lessonsWeek ?? 0).toLocaleString('pt-BR')} aulas previstas na semana` : 'Turmas em operação', icon: 'academic', route: 'groups', tone: 'purple' },
  ];

  const alerts = [
    canSeeContracts ? { label: 'Contratos a vencer', value: metrics?.contractsExpiring30, detail: 'Próximos 30 dias', icon: 'contract', route: 'contracts', tone: 'amber' } : null,
    canSeeFinance ? { label: 'Pagamentos atrasados', value: metrics?.overdueTitles, detail: currency(metrics?.overdueAmount), icon: 'finance', route: 'finance', tone: 'red' } : null,
    canSeeFinance ? { label: 'Pagamentos a vencer', value: metrics?.dueSoonTitles, detail: `Próximos 7 dias · ${currency(metrics?.dueSoonAmount)}`, icon: 'calendar', route: 'finance', tone: 'amber' } : null,
    canSeeFinance ? { label: 'Recebido no mês', value: currency(metrics?.receivedMonth), detail: 'Pagamentos registrados no mês atual', icon: 'finance', route: 'finance', tone: 'blue' } : null,
    canSeeService ? { label: 'Atendimentos vencidos', value: metrics?.overdueRequests, detail: `${(metrics?.openRequests ?? 0).toLocaleString('pt-BR')} solicitações em aberto`, icon: 'service', route: 'requests', tone: 'red' } : null,
    { label: 'Documentos em análise', value: metrics?.pendingDocumentReviews, detail: 'Aguardando revisão', icon: 'docs', route: 'documents', tone: 'blue' },
    canSeeSecretary ? { label: 'Aulas sem facilitador', value: metrics?.lessonsWithoutTeacher, detail: 'Na programação dos próximos 7 dias', icon: 'academic', route: 'schedulePlan', tone: 'amber' } : null,
    canSeeSecretary ? { label: 'Aulas sem sala informada', value: metrics?.lessonsWithoutRoom, detail: 'Na programação dos próximos 7 dias', icon: 'company', route: 'schedulePlan', tone: 'amber' } : null,
    canSeeContracts ? { label: 'Contratos com prazo vencido', value: metrics?.expiredContracts, detail: 'Ainda marcados como ativos', icon: 'contract', route: 'contracts', tone: 'red' } : null,
    canSeeTriage ? { label: 'Vagas abertas', value: metrics?.openVacancies, detail: 'Vagas com situação ativa', icon: 'briefcase', route: 'vacancies', tone: 'blue' } : null,
    canSeeTriage ? { label: 'Candidaturas em andamento', value: metrics?.applicationsInProgress, detail: 'Aguardando movimentação', icon: 'people', route: 'op.Recrutamento', tone: 'blue' } : null,
    canSeeAdmin ? { label: 'Equipe ativa', value: metrics?.activeStaff, detail: 'Contas internas habilitadas', icon: 'users', route: 'users', tone: 'blue' } : null,
  ].filter(Boolean) as Array<{ label: string; value: number | string | null | undefined; detail: string; icon: string; route: string; tone: string }>;

  const quickLinks = [
    { label: 'Alunos', detail: 'Cadastros, vínculos e histórico', route: 'people', icon: 'people', roles: ['SUPER_ADMIN', 'ADMIN', 'SECRETARY', 'CONTRACTS', 'TRIAGE', 'SOCIAL_SERVICE', 'RECEPTION', 'COMMERCIAL', 'HR'] },
    { label: 'Secretaria', detail: 'Cursos, turmas e frequência', route: 'groups', icon: 'academic', roles: ['SUPER_ADMIN', 'ADMIN', 'SECRETARY'] },
    { label: 'Contratos', detail: 'Vigências, aditivos e movimentações', route: 'contracts', icon: 'contract', roles: ['SUPER_ADMIN', 'ADMIN', 'CONTRACTS', 'HR'] },
    { label: 'Financeiro', detail: 'Títulos, pagamentos e faturamento', route: 'finance', icon: 'finance', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'] },
    { label: 'Triagem', detail: 'Vagas e processos seletivos', route: 'vacancies', icon: 'briefcase', roles: ['SUPER_ADMIN', 'ADMIN', 'TRIAGE', 'COMMERCIAL'] },
    { label: 'Relatórios', detail: 'Consultas e exportações', route: 'reports', icon: 'report', roles: ['SUPER_ADMIN', 'ADMIN', 'SECRETARY', 'FINANCE', 'TRIAGE', 'CONTRACTS', 'SOCIAL_SERVICE', 'RECEPTION', 'COMMERCIAL', 'HR'] },
  ].filter(item => item.roles.includes(role));

  return <section className="page dashboard-page">
    <header className="page-header dashboard-header">
      <div><span className="eyebrow">PAINEL DE GESTÃO</span><h1>Visão geral</h1><p>Acompanhamento dos principais indicadores, prazos e atividades da Proativa.</p></div>
      <div className="dashboard-header-actions"><div className="date-chip">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div><button type="button" className="btn ghost dashboard-refresh" onClick={() => setRevision(value => value + 1)} disabled={loading}><Icon name="refresh" size={16}/>{loading ? 'Atualizando…' : 'Atualizar dados'}</button></div>
    </header>

    {error && <div className={`alert ${retrying ? "info" : "error"}`} role="alert">{error}</div>}
    {loading && !data ? <div className="dashboard-loading"><div/><div/><div/><div/></div> : <>
      <section className="dashboard-section" aria-label="Indicadores principais">
        <div className="dashboard-section-heading"><div><span className="eyebrow">OPERAÇÃO</span><h2>Indicadores principais</h2></div><span className="dashboard-caption">Dados consolidados do banco de dados</span></div>
        <div className="primary-kpi-grid">{primaryCards.map(card => <button type="button" className={`primary-kpi ${card.tone}`} key={card.label} onClick={() => canNavigate(card.route) && onNavigate(card.route)} disabled={!canNavigate(card.route)}>
          <span className="kpi-icon"><Icon name={card.icon} size={20}/></span><span className="kpi-label">{card.label}</span><strong className="kpi-value">{card.value == null ? '—' : typeof card.value === 'number' ? card.value.toLocaleString('pt-BR') : card.value}</strong><span className="kpi-detail">{card.detail}</span><span className="kpi-arrow">↗</span>
        </button>)}</div>
      </section>

      <section className="dashboard-section" aria-label="Alertas e prazos">
        <div className="dashboard-section-heading"><div><span className="eyebrow">ATENÇÃO</span><h2>Prazos e pendências</h2></div><span className="dashboard-caption">Itens que podem exigir ação da equipe</span></div>
        <div className="alert-kpi-grid">{alerts.map(card => <button type="button" className={`alert-kpi ${card.tone} ${typeof card.value === 'string' ? 'money' : ''}`} key={card.label} onClick={() => canNavigate(card.route) && onNavigate(card.route)} disabled={!canNavigate(card.route)}><span className="alert-kpi-icon"><Icon name={card.icon} size={17}/></span><span className="alert-kpi-label">{card.label}</span><strong>{card.value == null ? '—' : typeof card.value === 'number' ? card.value.toLocaleString('pt-BR') : card.value}</strong><small>{card.detail}</small></button>)}</div>
      </section>

      <section className="dashboard-section" aria-label="Gráficos gerenciais">
        <div className="dashboard-section-heading"><div><span className="eyebrow">ANÁLISE</span><h2>Indicadores ao longo do tempo</h2></div></div>
        <div className="dashboard-chart-grid">
          {canSeeFinance && <ChartPanel title="Recebimentos" subtitle="Valores efetivamente pagos nos últimos seis meses" empty="Não há pagamentos registrados no período."><MonthlyBars rows={data?.charts.receiptsByMonth || []} money/></ChartPanel>}
          {canSeeSecretary && <ChartPanel title="Matrículas registradas" subtitle="Novos vínculos cadastrados nos últimos seis meses" empty="Não há matrículas registradas no período."><MonthlyBars rows={data?.charts.enrollmentsByMonth || []}/></ChartPanel>}
          {canSeeContracts && <ChartPanel title="Situação dos contratos" subtitle="Distribuição dos contratos cadastrados" empty="Ainda não há contratos cadastrados."><StatusBars rows={data?.charts.contractsByStatus || []}/></ChartPanel>}
          {canSeeFinance && <ChartPanel title="Situação dos títulos" subtitle="Distribuição dos títulos financeiros" empty="Ainda não há títulos financeiros cadastrados."><StatusBars rows={data?.charts.financialByStatus || []}/></ChartPanel>}
        </div>
      </section>

      {(canSeeContracts || canSeeFinance) && <section className="dashboard-section" aria-label="Listas de atenção">
        <div className="dashboard-section-heading"><div><span className="eyebrow">ACOMPANHAMENTO</span><h2>Itens que exigem acompanhamento</h2></div></div>
        <div className="dashboard-list-grid">
          {canSeeContracts && <div className="panel dashboard-data-panel"><div className="panel-head"><div><h3>Contratos próximos do vencimento</h3><p>Contratos ativos com término nos próximos 30 dias</p></div><button className="text-link" onClick={() => onNavigate('contracts')}>Ver contratos</button></div>
            {data?.expiringContracts.length ? <div className="attention-list">{data.expiringContracts.map(item => <div className="attention-row" key={item.id}><div className="attention-main"><strong>{item.person?.fullName || 'Pessoa não informada'}</strong><span>{item.companyName}{item.number ? ` · Contrato ${item.number}` : ''}</span></div><div className="attention-date"><strong>{dateLabel(item.endDate)}</strong><span className="attention-badge warning">{item.daysRemaining === 0 ? 'Vence hoje' : `${item.daysRemaining} dias`}</span></div></div>)}</div> : <EmptyState text="Nenhum contrato ativo vence nos próximos 30 dias."/>}
          </div>}
          {canSeeFinance && <div className="panel dashboard-data-panel"><div className="panel-head"><div><h3>Pagamentos em atenção</h3><p>Valores vencidos ou com vencimento nos próximos sete dias</p></div><button className="text-link" onClick={() => onNavigate('finance')}>Ver financeiro</button></div>
            {data?.financialAttention.length ? <div className="attention-list">{data.financialAttention.map(item => <div className="attention-row" key={item.id}><div className="attention-main"><strong>{item.description}</strong><span>{item.companyName || item.personName || 'Sem vínculo informado'} · Vencimento {dateLabel(item.dueDate)}</span></div><div className="attention-date"><strong>{currency(item.remaining)}</strong><span className={`attention-badge ${item.overdue ? 'danger' : 'warning'}`}>{item.overdue ? 'Atrasado' : 'A vencer'}</span></div></div>)}</div> : <EmptyState text="Não há títulos vencidos ou próximos do vencimento."/>}
          </div>}
        </div>
      </section>}

      {canSeeSecretary && <section className="dashboard-section" aria-label="Agenda acadêmica">
        <div className="dashboard-section-heading"><div><span className="eyebrow">SECRETARIA</span><h2>Atividades acadêmicas da semana</h2></div><button className="text-link" onClick={() => onNavigate('schedulePlan')}>Planejamento acadêmico</button></div>
        <div className="academic-summary-grid">
          <SummaryTile label="Aulas hoje" value={metrics?.lessonsToday} icon="calendar"/>
          <SummaryTile label="Aulas nos próximos 7 dias" value={metrics?.lessonsWeek} icon="academic"/>
          <SummaryTile label="Sem facilitador vinculado" value={metrics?.lessonsWithoutTeacher} icon="people" warning/>
          <SummaryTile label="Sem sala informada" value={metrics?.lessonsWithoutRoom} icon="company" warning/>
        </div>
        <div className="panel dashboard-data-panel academic-week-panel"><div className="panel-head"><div><h3>Aulas programadas</h3><p>Registros já existentes; a geração automática semanal ainda não está ativada.</p></div></div>
          {data?.academicWeek.length ? <div className="table-wrap dashboard-table-wrap"><table><thead><tr><th>Data</th><th>Turma</th><th>Atividade / módulo</th><th>Facilitador</th><th>Turno</th><th>Sala</th></tr></thead><tbody>{data.academicWeek.slice(0, 12).map(item => <tr key={item.id}><td>{dateLabel(item.lessonDate)}</td><td>{item.classGroupName}</td><td>{item.disciplineName || item.title}</td><td>{item.teacherName || <span className="table-warning">Não vinculado</span>}</td><td>{item.shift}</td><td>{item.room || <span className="table-warning">Não informada</span>}</td></tr>)}</tbody></table></div> : <EmptyState text="Ainda não há aulas programadas para os próximos sete dias."/>}
        </div>
      </section>}

      {canSeeService && <section className="dashboard-section" aria-label="Atendimento">
        <div className="dashboard-section-heading"><div><span className="eyebrow">ATENDIMENTO</span><h2>Solicitações com prazo próximo</h2></div><button className="text-link" onClick={() => onNavigate('requests')}>Ver solicitações</button></div>
        <div className="panel dashboard-data-panel">{data?.serviceAttention.length ? <div className="attention-list">{data.serviceAttention.map(item => <div className="attention-row" key={item.id}><div className="attention-main"><strong>{item.type}</strong><span>{item.person?.fullName || 'Solicitante não informado'}{item.description ? ` · ${item.description}` : ''}</span></div><div className="attention-date"><strong>{dateLabel(item.dueDate)}</strong><span className={`attention-badge ${item.dueDate && new Date(item.dueDate) < new Date() ? 'danger' : 'warning'}`}>{item.dueDate && new Date(item.dueDate) < new Date() ? 'Prazo vencido' : 'Prazo próximo'}</span></div></div>)}</div> : <EmptyState text="Não há solicitações com vencimento nos próximos sete dias."/>}</div>
      </section>}

      {canSeeSecretary && <section className="dashboard-section schedule-readiness-panel">
        <div className="panel readiness-card"><div><span className="eyebrow">PREPARAÇÃO DA SECRETARIA</span><h3>Planejamento do cronograma semanal</h3><p>{data?.scheduleReadiness?.note || 'A estrutura acadêmica está preparada para receber a futura automação do cronograma.'}</p><div className="readiness-tags"><span>Matrizes: {(data?.scheduleReadiness?.curriculumMatrices ?? 0).toLocaleString('pt-BR')}</span><span>Módulos: {(data?.scheduleReadiness?.curriculumModules ?? 0).toLocaleString('pt-BR')}</span><span>Salas: {(data?.scheduleReadiness?.activeClassrooms ?? 0).toLocaleString('pt-BR')}</span><span>Disponibilidades: {(data?.scheduleReadiness?.teacherAvailabilityRules ?? 0).toLocaleString('pt-BR')}</span><span>Modelos: {(data?.scheduleReadiness?.scheduleTemplates ?? 0).toLocaleString('pt-BR')}</span><span>Regras semanais: {(data?.scheduleReadiness?.activeScheduleRules ?? 0).toLocaleString('pt-BR')}</span></div></div><button type="button" className="btn secondary" onClick={() => onNavigate('schedulePlan')}>Ver preparação <Icon name="arrow" size={16}/></button></div>
      </section>}

      <section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="eyebrow">ACESSO RÁPIDO</span><h2>Áreas de trabalho</h2></div></div><div className="dashboard-quick-grid">{quickLinks.map(link => <button type="button" key={link.route} onClick={() => onNavigate(link.route)}><span><Icon name={link.icon} size={19}/></span><strong>{link.label}</strong><small>{link.detail}</small><b>↗</b></button>)}</div></section>
    </>}
  </section>;
}

function ChartPanel({ title, subtitle, children }: { title: string; subtitle: string; empty?: string; children: React.ReactNode }) {
  return <div className="panel dashboard-chart-panel"><div className="panel-head"><div><h3>{title}</h3><p>{subtitle}</p></div></div>{children}</div>;
}
function MonthlyBars({ rows, money = false }: { rows: Array<{ key: string; label: string; value: number }>; money?: boolean }) {
  const max = Math.max(1, ...rows.map(row => row.value));
  if (!rows.length || rows.every(row => row.value === 0)) return <EmptyState text="Não há registros no período selecionado."/>;
  return <div className="monthly-bars">{rows.map(row => <div className="monthly-bar-column" key={row.key}><strong>{money ? currency(row.value) : row.value.toLocaleString('pt-BR')}</strong><div className="monthly-bar-track"><span style={{ height: `${row.value > 0 ? Math.max(5, (row.value / max) * 100) : 0}%` }}/></div><small>{row.label}</small></div>)}</div>;
}
function StatusBars({ rows }: { rows: Array<{ status: string; label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map(row => row.value));
  if (!rows.length) return <EmptyState text="Não há registros para exibir."/>;
  return <div className="status-bars">{rows.length ? rows.map(row => <div className="status-bar-row" key={row.status}><div><span>{row.label}</span><strong>{row.value.toLocaleString('pt-BR')}</strong></div><div className="status-bar-track"><span className={`status-bar-fill ${statusClass(row.status)}`} style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}/></div></div>) : <EmptyState text="Não há registros para exibir."/>}</div>;
}
function SummaryTile({ label, value, icon, warning = false }: { label: string; value: number | null | undefined; icon: string; warning?: boolean }) {
  return <div className={`academic-summary-tile ${warning ? 'warning' : ''}`}><span><Icon name={icon} size={18}/></span><div><strong>{value == null ? '—' : value.toLocaleString('pt-BR')}</strong><small>{label}</small></div></div>;
}
function EmptyState({ text }: { text: string }) { return <div className="dashboard-empty"><span><Icon name="check" size={18}/></span>{text}</div>; }
