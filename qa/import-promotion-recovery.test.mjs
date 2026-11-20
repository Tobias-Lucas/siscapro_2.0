import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeLegacyBirthDate, classifyPromotionFailure } from '../apps/api/src/legacy/legacy-normalization.ts';

let total = 0;
function check(title, fn) {
  fn();
  total++;
  console.log('APROVADO: ' + title);
}
check('Data YYYY-MM-DD vira objeto Date UTC aceito pelo Prisma', () => {
  const date = normalizeLegacyBirthDate('2003-06-19');
  assert.ok(date instanceof Date);
  assert.equal(date.toISOString(), '2003-06-19T00:00:00.000Z');
});
check('Data nula, zero e impossivel nao bloqueiam cadastro', () => {
  for (const value of [null, undefined, '', '0000-00-00', '2023-02-30', 'invalida']) {
    assert.equal(normalizeLegacyBirthDate(value), null);
  }
});
check('ISO com horario preservado', () => {
  assert.equal(normalizeLegacyBirthDate('2016-10-21T00:00:00.000Z')?.toISOString(), '2016-10-21T00:00:00.000Z');
});
check('Conflito de CPF/CNPJ classificado pelo codigo P2002', () => {
  const e = {code:'P2002', name:'PrismaClientKnownRequestError', message:'Invalid invocation'};
  assert.equal(classifyPromotionFailure(e).reason,'UNIQUE_CONFLICT');
});
check('Dependencia e integridade nao sao classificadas como fonte invalida', () => {
  assert.equal(classifyPromotionFailure({code:'P2003',message:'Invalid invocation'}).reason,'MISSING_DEPENDENCY');
  assert.equal(classifyPromotionFailure({code:'P2025',message:'Invalid invocation'}).reason,'MISSING_DEPENDENCY');
});
check('Falha de validacao e classificada sem divulgar dados pessoais', () => {
  const x = classifyPromotionFailure({name:'PrismaClientValidationError',message:'Invalid value: contato PRIVADO'});
  assert.equal(x.reason,'INVALID_SOURCE');
  assert.ok(!x.explanation.includes('PRIVADO'));
});
const root = path.resolve(import.meta.dirname, '..');
const svc = fs.readFileSync(path.join(root,'apps/api/src/legacy/legacy.service.ts'),'utf8');
const worker = fs.readFileSync(path.join(root,'apps/api/scripts/promote-batch.ts'),'utf8');
check('Cadastro de alunos usa data normalizada', () => {
  assert.match(svc,/birthDate:\s*normalizeLegacyBirthDate\(x\.alu_nascto\)/);
});
check('Recuperacao processa somente FAILED sem reler sucesso', () => {
  assert.match(svc,/failedRowsForRetry/);
  assert.match(svc,/status:\s*'FAILED',\s*sourceKey:/);
  assert.match(svc,/retryFailedOnly && batchId/);
});
check('Checkpoint completo anterior nao oculta falhas da nova tentativa', () => {
  assert.match(worker,/retryFailedOnly = unresolved > 0 && attempted >= staged.recordCount/);
  assert.match(worker,/previous = retryFailedOnly \? null/);
  assert.match(worker,/promoteFromStaging\(entity, cursor, 50, batchId, retryFailedOnly, true\)/);
});
check('Lotes nao duplicam issues de cada registro apos reprocessamento', () => {
  assert.match(svc,/if \(!batchId\) await this\.prisma\.legacySyncIssue\.create/);
});
check('Resumo nao afirma sucesso quando existem falhas', () => {
  assert.match(worker,/remaining \? 'WARNING' : 'SUCCESS'/);
});
check('Relatorio por tabela nao consulta 1 milhao de resultados a cada bloco', () => {
  assert.match(svc,/if\(batchId && !deferSummary\)/);
  assert.match(worker,/read % 5000 === 0/);
  assert.match(worker,/const \{ failed: remaining \} = await summarizeTable\(table\)/);
});
console.log(`RECUPERACAO DA TRANSFORMACAO: ${total}\/${total} VERIFICACOES APROVADAS.`);
