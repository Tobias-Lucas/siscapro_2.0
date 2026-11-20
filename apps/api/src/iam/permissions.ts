import { CATALOG } from '../operations/catalog.js';
import entries from './permission-catalog.json' with { type: 'json' };

export type PermissionEntry = { module: string; resource: string; action: string; code: string };
const base: PermissionEntry[] = entries as PermissionEntry[];
const slugCodes: PermissionEntry[] = CATALOG.flatMap(item =>
  ['listar', 'visualizar', 'criar', 'editar', 'inativar'].map(action => ({
    module: 'cadastros', resource: item.slug, action, code: `cadastros.${item.slug}.${action}`,
  })),
);
export const PERMISSIONS: PermissionEntry[] = [...new Map([...base, ...slugCodes].map(item => [item.code, item])).values()];
export const PERMISSION_CODES = new Set(PERMISSIONS.map(x => x.code));

const methodAction = (method: string, hasId = false) =>
  method === 'GET' ? (hasId ? 'visualizar' : 'listar') :
  method === 'PATCH' || method === 'PUT' ? 'editar' :
  method === 'DELETE' ? 'inativar' : 'criar';

/** Fixed URL-to-permission matrix. Never authorize an unrecognized endpoint for CUSTOM users. */
export function requestPermission(method: string, url: string): string | null {
  const parts = url.split('?')[0].split('/').filter(Boolean);
  if (parts[0] !== 'api') return null;
  const [, area, ...tail] = parts;
  if (area === 'health') return null;
  if (area === 'auth') return ['me', 'change-password', 'logout'].includes(tail[0]) ? 'SELF' : null;
  if (area === 'iam') {
    if (tail[0] === 'catalog' || tail[0] === 'me') return 'SELF';
    if (tail[0] === 'templates') return `usuarios.templates.${methodAction(method, tail.length > 1)}`;
    if (tail[0] === 'overrides') return `usuarios.permissoes.${method === 'GET' ? 'visualizar' : 'atribuir'}`;
    return null;
  }
  if (area === 'users') return `usuarios.contas.${methodAction(method, tail.length > 0)}`;
  if (area === 'legacy') return method === 'GET' ? 'integracao.legado.visualizar' : 'integracao.legado.importar';
  if (area === 'staging') return method === 'GET' ? 'integracao.staging.visualizar' : 'integracao.staging.conciliar';
  if (area === 'operations') {
    if (tail[0] === 'catalog' || tail[0] === 'options') return 'cadastros.referencias.visualizar';
    if (!tail[0] || !CATALOG.some(x => x.slug === tail[0])) return null;
    const action = tail[2] === 'archive' ? 'inativar' : methodAction(method, tail.length > 1);
    return `cadastros.${tail[0]}.${action}`;
  }
  if (area === 'workspaces') {
    const mapping:Record<string,string>={students:'alunos.cadastro.visualizar',groups:'secretaria.turmas.visualizar',companies:'empresas.cadastro.visualizar',contracts:'contratos.instrumentos.visualizar'};
    return method === 'GET' && mapping[tail[0]] ? mapping[tail[0]] : null;
  }
  if (area === 'dashboard') return 'painel.visao_geral.ver';
  if (area === 'dossiers') {
    const modules:Record<string,string>={people:'alunos.cadastro',companies:'empresas.cadastro',courses:'secretaria.cursos',groups:'secretaria.turmas',enrollments:'matriculas.vinculos',attendance:'secretaria.frequencia',contracts:'contratos.instrumentos',internships:'estagio.vinculos',vacancies:'triagem.vagas',finance:'financeiro.titulos',requests:'atendimento.requerimentos',documents:'documentos.arquivos'};
    return modules[tail[0]] ? `${modules[tail[0]]}.visualizar` : null;
  }
  if (area === 'reports') {
    const type = tail[0];
    if (type === 'catalog') return 'REPORT_CATALOG';
    if (type === 'audit') return method === 'GET' && tail.includes('export') ? 'integracao.auditoria.exportar' : 'integracao.auditoria.visualizar';
    const group = type === 'finance' ? 'financeiros' : type === 'contracts' ? 'contratuais' : ['people','academic','attendance'].includes(type) ? 'academicos' : 'gerenciais';
    return `relatorios.${group}.${tail.includes('export') ? 'exportar' : 'visualizar'}`;
  }
  if (area === 'people') return `alunos.cadastro.${methodAction(method, tail.length > 0 && !['students'].includes(tail[0]))}`;
  if (area === 'companies') return `empresas.cadastro.${methodAction(method, tail.length > 0)}`;
  if (area === 'contracts') {
    if (tail[1] === 'transition' && method === 'POST') return 'contratos.movimentacoes.criar';
    if (tail[1] === 'amendments' && method === 'POST') return 'contratos.aditivos.criar';
    return `contratos.instrumentos.${methodAction(method, tail.length > 0)}`;
  }
  if (area === 'internships') return `estagio.vinculos.${methodAction(method, tail.length > 0)}`;
  if (area === 'recruitment') return `triagem.vagas.${methodAction(method, tail.length > 0)}`;
  if (area === 'finance') {
    if (tail[0] === 'payments') return method === 'GET' ? 'financeiro.pagamentos.visualizar' : 'financeiro.pagamentos.baixar';
    return `financeiro.titulos.${methodAction(method, tail.length > 1)}`;
  }
  if (area === 'service') return `atendimento.requerimentos.${methodAction(method, tail.length > 0)}`;
  if (area === 'demands') {
    if (tail[0] === 'options' && ['people','task-users'].includes(tail[1]||'')) return 'empresas.demandas.tarefas.criar';
    if (tail[0] === 'options') return 'empresas.demandas.visualizar';
    if (tail[0] === 'types') return method === 'GET' ? 'empresas.demandas.tipos.visualizar' : 'empresas.demandas.tipos.gerenciar';
    if (tail[0] === 'reports') return method === 'GET' ? 'relatorios.demandas.visualizar' : 'relatorios.demandas.exportar';
    if (tail[0] === 'tasks' && tail[1] === 'completed') return 'empresas.demandas.tarefas.listar';
    if (tail[0] === 'tasks') return `empresas.demandas.tarefas.${methodAction(method, tail.length > 1)}`;
    if (tail.includes('tasks') && tail[tail.indexOf('tasks') + 2] === 'complete') return 'empresas.demandas.tarefas.concluir';
    if (tail.includes('tasks')) return `empresas.demandas.tarefas.${methodAction(method, tail.length > 2)}`;
    if (tail[0] === 'completed') return 'empresas.demandas.listar';
    if (tail[1] === 'complete') return 'empresas.demandas.concluir';
    if (tail[1] === 'cancel') return 'empresas.demandas.cancelar';
    return `empresas.demandas.${methodAction(method, tail.length > 0)}`;
  }
  if (area === 'documents') {
    if (tail[0] === 'upload') return 'documentos.arquivos.enviar';
    if (tail.includes('download')) return 'documentos.arquivos.baixar';
    return `documentos.arquivos.${method === 'POST' ? 'enviar' : methodAction(method, tail.length > 0)}`;
  }
  if (area === 'academic') {
    const t = tail[0];
    if (t === 'groups' && tail[2] === 'roster' && method === 'GET') return 'secretaria.frequencia.visualizar';
    if (t === 'groups' && tail[2] === 'attendance' && tail[3] === 'batch' && method === 'POST') return 'secretaria.frequencia.lancar';
    if (t === 'course-options') return 'secretaria.cursos.listar';
    if (t === 'group-options') return 'secretaria.turmas.listar';
    if (t === 'teachers') return method === 'GET' && tail.length === 0 ? 'secretaria.facilitadores.listar' : 'secretaria.facilitadores.visualizar';
    if (t === 'teacher-assignments' || t === 'discipline-teachers') {
      if (method === 'GET') return tail.length === 0 ? 'secretaria.facilitadores.listar' : 'secretaria.facilitadores.visualizar';
      if (method === 'DELETE') return 'secretaria.facilitadores.excluir';
      if (method === 'POST') return 'secretaria.facilitadores.criar';
      return 'secretaria.facilitadores.editar';
    }
    if (t === 'enrollments') return `matriculas.vinculos.${methodAction(method, tail.length > 1)}`;
    if (t === 'attendance' || t === 'attendances') return method === 'POST' ? 'secretaria.frequencia.lancar' : `secretaria.frequencia.${methodAction(method, tail.length > 1)}`;
    if (t === 'grades') return method === 'POST' ? 'secretaria.notas.lancar' : `secretaria.notas.${methodAction(method, tail.length > 1)}`;
    if (t === 'classrooms' || t === 'schedule') return `cronogramas.planejamento.${method === 'GET' ? 'visualizar' : 'editar'}`;
    if ((t === 'groups' || t === 'classes') && tail[2] === 'courses') return `secretaria.turmas_cursos.${method === 'GET' ? 'visualizar' : 'editar'}`;
    if (t === 'groups' || t === 'classes') return `secretaria.turmas.${methodAction(method, tail.length > 1)}`;
    return `secretaria.cursos.${methodAction(method, tail.length > 1)}`;
  }
  // Portals are subject to original role and person/company ownership verification.
  if (area === 'portal') return 'PORTAL';
  return null;
}
