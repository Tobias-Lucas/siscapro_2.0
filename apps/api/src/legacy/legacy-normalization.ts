/** Normalizacao de campos opcionais do legado: preserva a origem no staging. */
export function normalizeLegacyBirthDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && !Number.isFinite(value.getTime())) return null;
  const text = value instanceof Date ? value.toISOString() : String(value).trim();
  if (!text || text.startsWith('0000-00-00') || text === '0') return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(text);
  const date = new Date(dateOnly ? `${text}T00:00:00.000Z` : text);
  if (!Number.isFinite(date.getTime())) return null;
  // JavaScript normaliza datas impossiveis; nao inventar data de nascimento.
  if (dateOnly && date.toISOString().slice(0, 10) !== text) return null;
  return date;
}

/** Categorias tecnicas seguras; nunca grava mensagem do Prisma contendo PII. */
export function classifyPromotionFailure(error: unknown): { reason: string; explanation: string } {
  const info = error && typeof error === 'object' ? error as { code?: unknown; name?: unknown; message?: unknown } : {};
  const code = String(info.code ?? '');
  const name = String(info.name ?? '');
  const message = String(info.message ?? (error instanceof Error ? error.message : '')).toLowerCase();
  if (code === 'P2002') return {
    reason: 'UNIQUE_CONFLICT',
    explanation: 'Identificador unico (por exemplo, CPF/CNPJ) ja utilizado. Origem preservada para reconciliacao, sem sobrescrever outro cadastro.',
  };
  if (code === 'P2003' || code === 'P2025') return {
    reason: 'MISSING_DEPENDENCY',
    explanation: 'Vinculo de destino necessario nao localizado. Origem preservada para nova tentativa apos converter os cadastros.',
  };
  if (/nao migra|ausent|depende|vinculo/i.test(message)) return {
    reason: 'MISSING_DEPENDENCY',
    explanation: 'Relacionamento necessario ausente ou ainda nao transformado; registro original preservado.',
  };
  if (name === 'PrismaClientValidationError' || /incomplet|invalid|ausente/i.test(message)) return {
    reason: 'INVALID_SOURCE',
    explanation: 'Formato ou campo obrigatorio rejeitado pelo transformador; registro original preservado.',
  };
  return {
    reason: 'TRANSFORMATION_FAILED',
    explanation: code ? `Falha tecnica ${code}; registro original preservado.` : 'Falha tecnica de transformacao; registro original preservado.',
  };
}
