export const TABELAS_PRIORITARIAS = Object.freeze([
  'alunos',
  'empresas',
  'curso_appa',
  'curso',
  'disciplinas',
  'montar_turma',
  'frequencia_master',
]);

const tabelas = new Set(TABELAS_PRIORITARIAS);

export function deveExecutarNoEscopo(descricao, escopo) {
  if (escopo !== 'PRIORITY_SEVEN') {
    return true;
  }
  return descricao.kind === 'SESSION' || tabelas.has(descricao.table);
}
