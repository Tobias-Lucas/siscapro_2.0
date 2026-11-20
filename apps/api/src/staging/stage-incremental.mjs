/** Staging-only ETL. Checkpoint and source records commit in the same PG transaction. */
import crypto from 'node:crypto';
import mysql from 'mysql2';
import mysqlPromise from 'mysql2/promise';

const CHUNK_ROWS = 250;
const forbiddenTable = /^(?:user_sistema|_+sanitizer_.*|sanitizer_.*)$/i;
const forbiddenColumns = /(senha|password|token|secret|api.?key|chave_privada|private_key|passwd|salt)/i;
const forbiddenFiles = /(pdf|anexos?|documentos?|arquivos?_documentos?|modelos?_documentos?)/i;
const mapped = { alunos: 'people', empresas: 'companies', curso_appa: 'courses', curso: 'groups', disciplinas: 'disciplines', montar_turma: 'enrollments', frequencia_master: 'attendance' };
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const identifier = s => { if (!/^[A-Za-z0-9_]+$/.test(s)) throw new Error('INVALID_TABLE_IDENTIFIER'); return '`' + s + '`'; };
function safeJson(row) { return JSON.stringify(row, (_key, value) => typeof value === 'bigint' ? value.toString() : Buffer.isBuffer(value) ? '[BINARIO_OMITIDO]' : value); }
function makeSource(dbOpts) { return mysql.createConnection({ ...dbOpts, database: 'siscapro_import', multipleStatements: false, dateStrings: true }); }

export async function stageIncremental({ pg, batchId, dbOpts, checkControl, report, scope, logEvent }) {
  const meta = await mysqlPromise.createConnection({ ...dbOpts, database: 'siscapro_import' });
  let tables;
  try {
    const [rows] = await meta.query("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA='siscapro_import' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME");
    tables = rows.map(r => String(r.name)).filter(t => !t.startsWith('__proativa_import_'));
  } finally { await meta.end(); }
  const existing = (await pg.query(`SELECT (SELECT COUNT(*)::integer FROM "LegacyRawRow" WHERE "batchId"=$1) AS rows,(SELECT COUNT(*)::integer FROM "LegacyImportChunkCheckpoint" WHERE "batchId"=$1 AND "phase"='STAGING') AS chunks`, [batchId])).rows[0];
  if (existing.rows > 0 && existing.chunks === 0) throw new Error('OLD_STAGING_WITHOUT_CHECKPOINTS');
  for (let index = 0; index < tables.length; index++) {
    const table = tables[index];
    await checkControl();
    await report('STAGING', table, `Staging: tabela ${index + 1} de ${tables.length} (${table}).`);
    if (forbiddenTable.test(table) || forbiddenFiles.test(table)) {
      await upsertTableStatus(pg, batchId, table, null, 0, 'EXCLUDED', 'SECURITY_EXCLUSION', 'Tabela excluida por conter credenciais, documentos ou conteudo protegido.');
      continue;
    }
    const db = await mysqlPromise.createConnection({ ...dbOpts, database: 'siscapro_import' });
    let columns, pks;
    try {
      [columns] = await db.query('SELECT COLUMN_NAME AS name, DATA_TYPE AS datatype FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY ORDINAL_POSITION', [table]);
      const [keys] = await db.query("SELECT COLUMN_NAME AS name FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND CONSTRAINT_NAME='PRIMARY' ORDER BY ORDINAL_POSITION", [table]);
      pks = keys.map(x => String(x.name));
    } finally { await db.end(); }
    const allowed = columns.filter(c => !forbiddenColumns.test(c.name) && !['binary', 'varbinary', 'blob', 'tinyblob', 'mediumblob', 'longblob'].includes(String(c.datatype)));
    if (!allowed.length) { await upsertTableStatus(pg, batchId, table, mapped[table] || null, 0, 'EXCLUDED', 'NO_ELIGIBLE_COLUMNS', 'Tabela sem colunas elegiveis apos exclusoes de seguranca.'); continue; }
    const fields = allowed.map(c => identifier(c.name));
    const order = pks.length ? ` ORDER BY ${pks.map(identifier).join(',')}` : ` ORDER BY ${fields.slice(0, Math.min(fields.length, 4)).join(',')}`;
    const sequenceBase = (await pg.query(`SELECT COALESCE(MAX("sequence"),0)::integer AS n FROM "LegacyImportChunkCheckpoint" WHERE "batchId"=$1 AND "phase"='STAGING'`, [batchId])).rows[0].n;
    // All completed chunks of this table form a contiguous prefix. Both records and checkpoint commit atomically.
    const completed = (await pg.query(`SELECT COALESCE(SUM("rowCount"),0)::integer AS n FROM "LegacyImportChunkCheckpoint" WHERE "batchId"=$1 AND "phase"='STAGING' AND "sourceTable"=$2 AND "status"='COMPLETED'`, [batchId, table])).rows[0].n;
    let scanned = 0, committed = completed, sequence = sequenceBase, buffer = [];
    const occurrence = new Map();
    const source = makeSource(dbOpts);
    try {
      const stream = source.query(`SELECT ${fields.join(',')} FROM ${identifier(table)}${order}`).stream({ highWaterMark: CHUNK_ROWS });
      for await (const row of stream) {
        const raw = safeJson(row), fp = hash(raw);
        const nth = (occurrence.get(fp) || 0) + 1; occurrence.set(fp, nth);
        scanned++;
        if (scanned <= completed) continue;
        const key = pks.length && pks.every(k => row[k] != null) ? pks.length === 1 ? String(row[pks[0]]) : hash(JSON.stringify(pks.map(k => row[k]))) : `hash:${fp}:${nth}`;
        buffer.push({ key, method: pks.length ? (pks.length === 1 ? 'PRIMARY_KEY' : 'COMPOSITE_PRIMARY_KEY') : 'SNAPSHOT_HASH_UNSTABLE', row: JSON.parse(raw), fp });
        if (buffer.length >= CHUNK_ROWS) {
          await checkControl(); sequence++;
          await commitChunk(pg, batchId, table, mapped[table] || null, sequence, buffer, committed);
          committed += buffer.length; buffer = [];
          await report('STAGING', table, `Staging: tabela ${index + 1}/${tables.length} (${table}), ${committed.toLocaleString('pt-BR')} linhas confirmadas.`);
        }
      }
      if (buffer.length) { await checkControl(); sequence++; await commitChunk(pg, batchId, table, mapped[table] || null, sequence, buffer, committed); committed += buffer.length; }
      await upsertTableStatus(pg, batchId, table, mapped[table] || null, committed, committed === 0 ? 'EMPTY_OR_EXCLUDED' : mapped[table] ? 'READY_TO_TRANSFORM' : 'NO_TRANSFORMER', committed === 0 ? 'NO_STAGED_ROWS' : mapped[table] ? null : 'TRANSFORMER_NOT_AVAILABLE', committed === 0 ? 'Nenhuma linha elegivel nesta tabela.' : mapped[table] ? null : 'Registros preservados no staging. A V3.3 ainda nao possui transformador para esta tabela.');
      await report('STAGING', table, `Tabela ${index + 1}/${tables.length} concluida (${table}): ${committed.toLocaleString('pt-BR')} linhas no staging.`);
    } catch (e) {
      // Never label a partially staged table as complete; retain checkpoints for retry.
      if (e?.code === 'IMPORT_PAUSED' || e?.code === 'IMPORT_CANCELLED' || e?.code === 'IMPORT_TOKEN_LOST') throw e;
      await upsertTableStatus(pg, batchId, table, mapped[table] || null, committed, 'FAILED', 'STAGING_TABLE_ERROR', 'Falha tecnicamente isolada nesta tabela. Checkpoints anteriores foram mantidos; tente retomar apos diagnostico.');
      await report('STAGING', table, `Tabela ${index + 1}/${tables.length} com falha (${table}); proxima tabela sera processada.`);
    } finally { source.destroy(); }
  }
  const failed = (await pg.query(`SELECT COUNT(*)::integer AS n FROM "LegacyImportTableStatus" WHERE "batchId"=$1 AND "status"='FAILED'`, [batchId])).rows[0].n;
  const status = failed ? 'FAILED' : scope === 'PRIORITY_SEVEN' ? 'STAGED_PRIORITY' : 'STAGED';
  const message = failed
    ? `Staging com ${failed} tabela(s) com falha. Os checkpoints foram preservados; retome apos corrigir.`
    : scope === 'PRIORITY_SEVEN'
      ? 'Etapa prioritaria concluida. Sete entidades foram consideradas; demais tabelas aguardam importacao completa.'
      : 'Staging completo concluido. As tabelas sem transformador permanecem preservadas.';
  await pg.query(`UPDATE "LegacyImportBatch" SET "status"=$2,"stagingPhase"='WAITING_APPROVAL',"importControl"='RUN',"finishedAt"=NOW(),"message"=$3 WHERE "id"=$1`, [batchId, status, message]);
  await logEvent('STAGING', null, message, failed ? 'ERROR' : 'SUCCESS', true);
}

async function commitChunk(pg, batchId, table, entity, seq, items, alreadyDone) {
  const client = await pg.connect();
  try {
    await client.query('BEGIN');
    const vals = [], parts = [];
    items.forEach((x, i) => { const n = i * 8; vals.push(crypto.randomUUID(), table, x.key, x.method, JSON.stringify(x.row), x.fp, batchId, new Date()); parts.push(`($${n + 1},$${n + 2},$${n + 3},$${n + 4},$${n + 5}::jsonb,$${n + 6},$${n + 7},$${n + 8})`); });
    await client.query(`INSERT INTO "LegacyRawRow"("id","sourceTable","sourceKey","identityMethod","rowData","contentHash","batchId","importedAt") VALUES ${parts.join(',')} ON CONFLICT("batchId","sourceTable","sourceKey") DO UPDATE SET "rowData"=EXCLUDED."rowData","contentHash"=EXCLUDED."contentHash","importedAt"=EXCLUDED."importedAt"`, vals);
    await client.query(`INSERT INTO "LegacyImportChunkCheckpoint"("id","batchId","phase","sequence","sourceTable","rowCount","status","cursor") VALUES($1,$2,'STAGING',$3,$4,$5,'COMPLETED',$6) ON CONFLICT("batchId","phase","sequence") DO NOTHING`, [crypto.randomUUID(), batchId, seq, table, items.length, String(alreadyDone + items.length)]);
    await client.query(`UPDATE "LegacyImportBatch" SET "rowCount"="rowCount"+$3,"completedImportChunks"="completedImportChunks"+1,"currentImportTable"=$2 WHERE "id"=$1`, [batchId, table, items.length]);
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK').catch(() => { }); throw e; } finally { client.release(); }
}
async function upsertTableStatus(pg, batchId, table, entity, total, status, reasonCode, reason) {
  await pg.query(`INSERT INTO "LegacyImportTableStatus"("id","batchId","sourceTable","targetEntity","recordCount","status","reasonCode","reason","updatedAt") VALUES($1,$2,$3,$4,$5,$6,$7,$8,NOW()) ON CONFLICT("batchId","sourceTable") DO UPDATE SET "targetEntity"=EXCLUDED."targetEntity","recordCount"=EXCLUDED."recordCount","status"=EXCLUDED."status","reasonCode"=EXCLUDED."reasonCode","reason"=EXCLUDED."reason","updatedAt"=NOW()`, [crypto.randomUUID(), batchId, table, entity, total, status, reasonCode, reason]);
}
