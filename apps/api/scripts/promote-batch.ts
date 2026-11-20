/** Explicit seven-entity promotion; resumable per 50 source rows. */
import crypto from 'node:crypto';
import { Pool } from 'pg';
import { PrismaService } from '../src/common/prisma.service.js';
import { LegacyService } from '../src/legacy/legacy.service.js';

const batchId = process.argv[2] || '', token = process.argv[3] || '';
if (!/^[0-9a-f-]{36}$/.test(batchId) || token.length < 20) throw new Error('INVALID_PROMOTION_JOB');
if (process.env.NODE_ENV !== 'development' || process.env.LOCAL_SQL_IMPORT_ENABLED !== 'true' || !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL || 'postgres://invalid@invalid').hostname)) throw new Error('LOCAL_PROMOTION_DISABLED');
const db = new PrismaService(), legacy = new LegacyService(db);
const lockPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
let lockClient: any, lockHeld = false, heartbeatTimer: ReturnType<typeof setInterval> | undefined;
const order: [string, string][] = [['people', 'alunos'], ['companies', 'empresas'], ['courses', 'curso_appa'], ['groups', 'curso'], ['disciplines', 'disciplinas'], ['enrollments', 'montar_turma'], ['attendance', 'frequencia_master']];
class Stop extends Error { constructor(public reason: string) { super(reason); } }
let active = '';
let ultimoEvento = 0;

async function registrarEvento(
  fase: string,
  mensagem: string,
  nivel: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO',
  forcar = false,
) {
  if (!forcar && Date.now() - ultimoEvento < 3500) {
    return;
  }
  await db.legacyImportEvent.create({
    data: {
      id: crypto.randomUUID(),
      batchId,
      phase: fase,
      level: nivel,
      sourceTable: active || null,
      message: mensagem,
    },
  });
  ultimoEvento = Date.now();
}
/** Consolidacao controlada: evita COUNT/GROUP BY sobre 1 milhao de linhas a cada 50 registros. */
async function summarizeTable(table: string) {
  const counts = await db.legacyImportRecordResult.groupBy({
    by: ['status'], where: { batchId, sourceTable: table }, _count: { _all: true },
  });
  const amount = (statuses: string[]) => counts.filter(x => statuses.includes(x.status))
    .reduce((n, x) => n + x._count._all, 0);
  const written = amount(['INSERTED', 'UPDATED']);
  const failed = amount(['FAILED']);
  const skipped = amount(['SKIPPED_EXISTING']);
  const current = await db.legacyImportTableStatus.findUnique({
    where: { batchId_sourceTable: { batchId, sourceTable: table } },
  });
  if (!current) return { failed };
  const complete = written + failed + skipped >= current.recordCount;
  await db.legacyImportTableStatus.update({
    where: { id: current.id },
    data: {
      writtenCount: written, failedCount: failed, skippedCount: skipped,
      status: complete ? (failed ? 'COMPLETED_WITH_ERRORS' : 'TRANSFORMED') : 'TRANSFORMING',
      reason: failed ? 'Existem registros pendentes de reconciliacao; consulte motivos por chave.' : null,
      reasonCode: failed ? 'TRANSFORMATION_PARTIAL' : null,
    },
  });
  return { failed };
}

async function verifyControl() {
  const b = await db.legacyImportBatch.findUniqueOrThrow({ where: { id: batchId } });
  if (b.importWorkerToken !== token) throw new Stop('TOKEN_CHANGED');
  if (b.importControl === 'PAUSE_REQUESTED') throw new Stop('PAUSED');
  if (b.importControl === 'CANCEL_REQUESTED') throw new Stop('CANCELLED');
  await db.legacyImportBatch.updateMany({ where: { id: batchId, importWorkerToken: token }, data: { importHeartbeat: new Date() } });
}
async function main() {
  lockClient = await lockPool.connect();
  const lock = await lockClient.query('SELECT pg_try_advisory_lock(9177,34) AS ok');
  if (!lock.rows[0]?.ok) throw new Error('IMPORT_WORKER_ALREADY_RUNNING');
  lockHeld = true;
  heartbeatTimer = setInterval(() => { void db.legacyImportBatch.updateMany({ where: { id: batchId, importWorkerToken: token }, data: { importHeartbeat: new Date() } }).catch(() => { }); }, 5000);
  heartbeatTimer.unref();
  const b = await db.legacyImportBatch.findUniqueOrThrow({ where: { id: batchId } });
  if (b.source !== 'SISCAPRO_ORIGINAL_LOCAL' || b.status !== 'PROMOTING') throw new Error('PROMOTION_NOT_ALLOWED');
  const running = await db.legacyImportBatch.findMany({ where: { status: 'RUNNING' }, select: { id: true }, take: 1 });
  if (running.length) throw new Error('IMPORT_RUNNING_DURING_PROMOTION');
  let sequence = (await db.legacyImportChunkCheckpoint.aggregate({ where: { batchId, phase: 'TRANSFORM' }, _max: { sequence: true } }))._max.sequence || 0;
  await registrarEvento('TRANSFORM', 'Iniciada a conversao dos cadastros mapeados.', 'INFO', true);
  for (const [entity, table] of order) {
    active = table;
    const staged = await db.legacyImportTableStatus.findUnique({ where: { batchId_sourceTable: { batchId, sourceTable: table } } });
    if (!staged || ['EMPTY_OR_EXCLUDED', 'EXCLUDED', 'FAILED'].includes(staged.status)) continue;
    // So reprocessar falhas quando TODOS os registros da tabela ja foram tentados.
    // Caso o processamento inicial tenha parado no meio, retomar checkpoint normal.
    const attempted = await db.legacyImportRecordResult.count({ where: { batchId, sourceTable: table } });
    const unresolved = await db.legacyImportRecordResult.count({ where: { batchId, sourceTable: table, status: 'FAILED' } });
    const retryFailedOnly = unresolved > 0 && attempted >= staged.recordCount;
    const previous = retryFailedOnly ? null : await db.legacyImportChunkCheckpoint.findFirst({ where: { batchId, phase: 'TRANSFORM', sourceTable: table, status: 'COMPLETED' }, orderBy: { sequence: 'desc' } });
    let cursor = previous?.cursor || '', hasMore = true, read = 0;
    if (retryFailedOnly) await registrarEvento('TRANSFORM', `Recuperacao de ${table}: ${unresolved} pendencias anteriores, sem reler as linhas ja convertidas.`, 'INFO', true);
    while (hasMore) {
      await verifyControl();
      const result = await legacy.promoteFromStaging(entity, cursor, 50, batchId, retryFailedOnly, true);
      read += result.read; hasMore = result.hasMore; cursor = result.nextCursor;
      if (!result.read) break;
      // `promoteFromStaging` is idempotent via LegacyMapping. Replaying a crashed
      // last chunk will skip mapped records rather than overwrite local changes.
      sequence++;
      await db.legacyImportChunkCheckpoint.create({ data: { id: crypto.randomUUID(), batchId, phase: 'TRANSFORM', sequence, sourceTable: table, rowCount: result.read, cursor, status: 'COMPLETED' } });
      await db.legacyImportBatch.updateMany({ where: { id: batchId, importWorkerToken: token }, data: { message: `Transformacao: ${table}, ${read} linhas confirmadas nesta passagem.`, currentImportTable: table, importHeartbeat: new Date(), completedImportChunks: { increment: 1 } } });
      if (read % 5000 === 0) await summarizeTable(table);
      await registrarEvento('TRANSFORM', `${read} registros examinados na tabela ${table}.`);
    }
    const { failed: remaining } = await summarizeTable(table);
    await registrarEvento('TRANSFORM', remaining
      ? `Tabela ${table}: ${remaining} pendencias restantes (dados preservados).`
      : `Tabela ${table}: conversao sem pendencias.`, remaining ? 'WARNING' : 'SUCCESS', true);
  }
  const failed = await db.legacyImportRecordResult.count({ where: { batchId, status: 'FAILED' } });
  await db.legacyImportBatch.updateMany({ where: { id: batchId, importWorkerToken: token }, data: { status: 'PROMOTED_PARTIAL', stagingPhase: 'REPORT', finishedAt: new Date(), message: failed ? `Transformacao encerrada com ${failed} pendencias por registro; dados originais preservados.` : 'Sete transformadores processados. Outras tabelas permanecem no staging.' } });
  await registrarEvento('TRANSFORM', failed ? `Conversao concluida com ${failed} pendencias.` : 'Conversao dos cadastros mapeados concluida.', failed ? 'WARNING' : 'SUCCESS', true);
}
main().catch(async e => {
  if (e instanceof Stop) {
    if (e.reason !== 'TOKEN_CHANGED') await db.legacyImportBatch.updateMany({ where: { id: batchId, importWorkerToken: token }, data: { status: e.reason === 'PAUSED' ? 'PAUSED' : 'CANCELLED', stagingPhase: 'TRANSFORM', message: e.reason === 'PAUSED' ? 'Transformacao pausada apos bloco confirmado.' : 'Transformacao cancelada sem descartar progresso.' } }).catch(() => { });
  } else {
    await db.legacyImportBatch.updateMany({ where: { id: batchId, importWorkerToken: token }, data: { status: 'FAILED', stagingPhase: 'TRANSFORM', message: `Transformacao interrompida em ${active || 'preparacao'}. Ultimo bloco confirmado preservado.` } }).catch(() => { });
    await registrarEvento('TRANSFORM', 'Transformacao interrompida; blocos anteriores preservados.', 'ERROR', true).catch(() => { });
    console.error('Promocao interrompida; a fonte no staging permanece preservada.'); process.exitCode = 1;
  }
}).finally(async () => {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (lockHeld && lockClient) await lockClient.query('SELECT pg_advisory_unlock(9177,34)').catch(() => { });
  if (lockClient) lockClient.release();
  await lockPool.end().catch(() => { });
  await db.$disconnect();
});
