/**
 * Incremental restore -> resumable staging. Only the isolated local MariaDB is reset,
 * and only for a first-run batch after preflight. Real SQL never enters logs.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { Pool } from 'pg';
import mysql from 'mysql2/promise';
import { sqlStatements, describeSqlStatement } from './sql-statement-stream.mjs';
import { stageIncremental } from './stage-incremental.mjs';
import { createImportTelemetry } from './import-telemetry.mjs';
import { deveExecutarNoEscopo } from './import-scope.mjs';

const batchId = process.argv[2], workerToken = process.argv[3];
if (!/^[0-9a-f-]{36}$/.test(batchId || '') || !workerToken || workerToken.length < 20) throw new Error('INVALID_IMPORT_JOB');
const project = path.resolve(process.cwd(), '../..');
const directory = path.join(project, '.local-private-imports');
const password = process.env.IMPORT_DB_PASSWORD || '';
const port = Number(process.env.IMPORT_DB_PORT || 3310);
const dbUrl = new URL(process.env.DATABASE_URL || 'postgres://invalid@invalid');
if (process.env.NODE_ENV !== 'development' || process.env.LOCAL_SQL_IMPORT_ENABLED !== 'true' ||
  !['localhost', '127.0.0.1'].includes(dbUrl.hostname) || !Number.isInteger(port) || port < 1 || port > 65535 || password.length < 20)
  throw new Error('LOCAL_ORIGINAL_IMPORT_DISABLED');
const pg = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
const logEvent = createImportTelemetry(pg, batchId);
const dbOpts = { host: '127.0.0.1', port, user: 'root', password, connectTimeout: 8000, charset: 'UTF8MB4', multipleStatements: false };
const compose = ['compose', '-f', 'docker-compose.import.yml', '--env-file', '.env.development'];
const CHUNK_BYTES = 8 * 1024 * 1024;
const safeSqlCode = e => /^[A-Z][A-Z_0-9]{2,50}$/.test(String(e?.code || '')) ? e.code : 'IMPORT_EXECUTION_ERROR';
const digest = s => crypto.createHash('sha256').update(s).digest('hex');
let heartbeatTimer, lockClient, locked = false, activePhase = 'PREFLIGHT';
class StopRequested extends Error { constructor(code) { super(code); this.code = code; } }
async function save(status, phase, message, additional = {}) {
  const keys = Object.keys(additional), v = [batchId, status, phase, message];
  const set = keys.map((k, i) => { v.push(additional[k]); return `"${k}"=$${i + 5}`; });
  // Dynamic column names are from fixed in-code keys, never an HTTP input.
  await pg.query(`UPDATE "LegacyImportBatch" SET "status"=$2,"stagingPhase"=$3,"message"=$4${set.length ? ',' + set.join(',') : ''} WHERE "id"=$1 AND "importWorkerToken"=$${v.length + 1}`, [...v, workerToken]);
  await logEvent(phase, null, message, status === 'FAILED' ? 'ERROR' : 'WARNING', true).catch(() => { });
}
async function report(phase, table, message, bytes) {
  activePhase = phase;
  const args = [batchId, phase, table, message, workerToken];
  const bytePart = bytes === undefined ? '' : ',"restoreProcessedBytes"=$6';
  if (bytes !== undefined) args.push(BigInt(bytes));
  await pg.query(`UPDATE "LegacyImportBatch" SET "status"='RUNNING',"stagingPhase"=$2,"currentImportTable"=$3,"message"=$4,"importHeartbeat"=NOW()${bytePart} WHERE "id"=$1 AND "importWorkerToken"=$5`, args);
  await logEvent(phase, table, message);
}
async function checkControl() {
  const { rows } = await pg.query(`SELECT "importControl","importWorkerToken" FROM "LegacyImportBatch" WHERE "id"=$1`, [batchId]);
  if (!rows.length || rows[0].importWorkerToken !== workerToken) throw new StopRequested('IMPORT_TOKEN_LOST');
  if (rows[0].importControl === 'PAUSE_REQUESTED') throw new StopRequested('IMPORT_PAUSED');
  if (rows[0].importControl === 'CANCEL_REQUESTED') throw new StopRequested('IMPORT_CANCELLED');
}
async function runDocker() {
  await new Promise((resolve, reject) => {
    const child = spawn('docker', [...compose, 'up', '-d', 'mariadb-import', 'mariadb-loopback'], { cwd: project, windowsHide: true, stdio: 'ignore' });
    child.on('error', reject); child.on('close', c => c === 0 ? resolve() : reject(new Error('DOCKER_IMPORT_UNAVAILABLE')));
  });
  let connection;
  for (let i = 0; i < 50; i++) {
    try { connection = await mysql.createConnection(dbOpts); break; }
    catch { await new Promise(r => setTimeout(r, 1500)); await checkControl(); }
  }
  if (!connection) throw new Error('IMPORT_MARIADB_UNREACHABLE');
  return connection;
}
async function ensureRestoreDatabase(db, hash, hasPgProgress) {
  const [schemas] = await db.query('SELECT SCHEMA_NAME AS name FROM information_schema.schemata WHERE SCHEMA_NAME=?', ['siscapro_import']);
  let exists = false, owner = null;
  if (schemas.length) {
    const [meta] = await db.query("SELECT TABLE_NAME AS name FROM information_schema.tables WHERE TABLE_SCHEMA='siscapro_import' AND TABLE_NAME='__proativa_import_meta'");
    exists = meta.length > 0;
    if (exists) { const [rows] = await db.query('SELECT batch_id AS id,file_hash AS hash FROM `siscapro_import`.`__proativa_import_meta` LIMIT 1'); owner = rows[0] || null; }
  }
  if (hasPgProgress && (!owner || owner.id !== batchId || owner.hash !== hash)) throw new Error('RESTORE_CHECKPOINT_DATABASE_MISSING');
  if (!owner || owner.id !== batchId || owner.hash !== hash) {
    // Fresh batch only: reset the dedicated disposable MariaDB. Prior PostgreSQL
    // staging from other batches remains available for review and transformation.
    await db.query('DROP DATABASE IF EXISTS `siscapro_import`');
    await db.query('CREATE DATABASE `siscapro_import` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await db.query('CREATE TABLE `siscapro_import`.`__proativa_import_meta` (`batch_id` CHAR(36) NOT NULL PRIMARY KEY,`file_hash` CHAR(64) NOT NULL) ENGINE=InnoDB');
    await db.query('CREATE TABLE `siscapro_import`.`__proativa_import_commits` (`sequence` INTEGER NOT NULL PRIMARY KEY,`checksum` CHAR(64) NOT NULL,`source_table` VARCHAR(190) NOT NULL,`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    await db.query('INSERT INTO `siscapro_import`.`__proativa_import_meta` VALUES(?,?)', [batchId, hash]);
  }
  await db.query('USE `siscapro_import`');
}
async function markPgChunk(chunk, checksum) {
  const sql = `INSERT INTO "LegacyImportChunkCheckpoint"("id","batchId","phase","sequence","sourceTable","startOffset","endOffset","statementCount","checksum","status")
 VALUES($1,$2,'RESTORE',$3,$4,$5,$6,$7,$8,'COMPLETED') ON CONFLICT("batchId","phase","sequence") DO UPDATE SET "status"='COMPLETED',"checksum"=EXCLUDED."checksum","endOffset"=EXCLUDED."endOffset"`;
  await pg.query(sql, [crypto.randomUUID(), batchId, chunk.sequence, chunk.table, BigInt(chunk.start), BigInt(chunk.end), chunk.statements.length, checksum]);
  await pg.query('UPDATE "LegacyImportBatch" SET "restoreProcessedBytes"=$2,"currentImportTable"=$3,"completedImportChunks"=(SELECT COUNT(*)::integer FROM "LegacyImportChunkCheckpoint" WHERE "batchId"=$1 AND "status"=\'COMPLETED\') WHERE "id"=$1', [batchId, BigInt(chunk.end), chunk.table]);
}
async function restore(filename, fileHash, totalBytes, db, scope) {
  const stats = (await pg.query(`SELECT COUNT(*) FILTER(WHERE "status"='COMPLETED')::integer AS n,COALESCE(MAX("endOffset") FILTER(WHERE "status"='COMPLETED'),0)::bigint AS position FROM "LegacyImportChunkCheckpoint" WHERE "batchId"=$1 AND "phase"='RESTORE'`, [batchId])).rows[0];
  await report('RESTORE', '', scope === 'PRIORITY_SEVEN' ? 'Importacao prioritaria: restaurando sete tabelas com transformacao disponivel.' : 'Restaurando todas as tabelas elegiveis por blocos.', Number(stats.position));
  await ensureRestoreDatabase(db, fileHash, stats.n > 0);
  let sequence = 0, queue = [], queueBytes = 0, kind = '', table = '', start = 0, end = 0;
  async function flush() {
    if (!queue.length) return;
    const chunk = { sequence: ++sequence, table, start, end, statements: queue, kind };
    queue = []; queueBytes = 0; kind = ''; table = '';
    await checkControl();
    const checksum = digest(chunk.statements.map(s => s.sql).join(''));
    const [applied] = await db.query('SELECT checksum FROM `__proativa_import_commits` WHERE sequence=?', [chunk.sequence]);
    if (applied.length) {
      if (applied[0].checksum !== checksum) throw new Error('RESTORE_CHUNK_CHECKSUM_MISMATCH');
      await markPgChunk(chunk, checksum);
      return;
    }
    try {
      if (chunk.kind === 'DML') {
        const [engine] = await db.query('SELECT ENGINE AS engine FROM information_schema.tables WHERE TABLE_SCHEMA=? AND TABLE_NAME=?', ['siscapro_import', chunk.table]);
        if (!engine.length) throw new Error('IMPORT_TABLE_NOT_FOUND');
        // Normalize only the disposable, isolated import copy. This allows atomic
        // data chunks even when a legacy table uses MyISAM/Aria/MEMORY.
        if (engine[0].engine !== 'InnoDB') {
          if (!/^[A-Za-z0-9_]+$/.test(chunk.table)) throw new Error('INVALID_TABLE_IDENTIFIER');
          try { await db.query(`ALTER TABLE \`${chunk.table}\` ENGINE=InnoDB`); } catch { throw new Error('TEMP_ENGINE_NORMALIZATION_FAILED'); }
        }
        await db.query('START TRANSACTION');
        try {
          for (const statement of chunk.statements) await db.query(statement.sql);
          await db.query('INSERT INTO `__proativa_import_commits`(sequence,checksum,source_table) VALUES(?,?,?)', [chunk.sequence, checksum, chunk.table]);
          await db.query('COMMIT');
        } catch (e) { await db.query('ROLLBACK').catch(() => { }); throw e; }
      } else {
        // MariaDB DDL auto-commits; restore statements are deterministic and individually marked.
        for (const statement of chunk.statements) await db.query(statement.sql);
        await db.query('INSERT INTO `__proativa_import_commits`(sequence,checksum,source_table) VALUES(?,?,?)', [chunk.sequence, checksum, chunk.table]);
      }
      await markPgChunk(chunk, checksum);
    } catch (e) {
      const reason = safeSqlCode(e);
      await pg.query(`INSERT INTO "LegacyImportChunkCheckpoint"("id","batchId","phase","sequence","sourceTable","startOffset","endOffset","statementCount","checksum","status","reasonCode") VALUES($1,$2,'RESTORE',$3,$4,$5,$6,$7,$8,'FAILED',$9) ON CONFLICT("batchId","phase","sequence") DO UPDATE SET "status"='FAILED',"reasonCode"=EXCLUDED."reasonCode"`, [crypto.randomUUID(), batchId, chunk.sequence, chunk.table, BigInt(chunk.start), BigInt(chunk.end), chunk.statements.length, checksum, reason]).catch(() => { });
      throw e;
    }
    const volume = totalBytes > 0 ? ` de ${(totalBytes / 1048576).toFixed(0)} MiB` : '';
    await report('RESTORE', chunk.table, `Bloco ${chunk.sequence} confirmado (${chunk.table}). ${(chunk.end / 1048576).toFixed(1)}${volume} MiB de SQL lidos.`, chunk.end);
  }
  let skippedStatements = 0;
  let rotinasIgnoradas = 0;
  let ultimoByteLido = 0;
  const omittedTables = new Set();
  const marcarLeitura = async (bytes) => {
    await pg.query(
      'UPDATE "LegacyImportBatch" SET "restoreScannedBytes"=GREATEST("restoreScannedBytes",$2),"importHeartbeat"=NOW() WHERE "id"=$1 AND "importWorkerToken"=$3',
      [batchId, BigInt(bytes), workerToken]
    );
    await logEvent('RESTORE', null, `Lidos ${(bytes / 1048576).toFixed(1)} MiB do SQL; ${omittedTables.size} tabelas adiadas no escopo prioritario.`);
  };
  for await (const statement of sqlStatements(filename, {
    onProgress: marcarLeitura,
    onRoutineSkipped: async () => { rotinasIgnoradas++; }
  })) {
    ultimoByteLido = statement.end;
    let d;
    try {
      d = describeSqlStatement(statement.sql, { sourceSchema: 'sisc1207_siscapro' });
    } catch (error) {
      // Nunca registra SQL original nem conteudo das linhas do legado.
      const motivo = safeSqlCode(error);
      await logEvent('RESTORE', null,
        `Leitura interrompida no byte ${statement.start} (${motivo}). SQL original preservado.`,
        'ERROR', true).catch(() => { });
      throw error;
    }
    const executavel = d.normalizedSql ? { ...statement, sql: d.normalizedSql } : statement;
    if (!deveExecutarNoEscopo(d, scope)) {
      if (d.table && /^[a-zA-Z0-9_]+$/.test(d.table)) omittedTables.add(d.table);
      skippedStatements++;
      continue;
    }
    if (['COMMENT', 'SKIP_SCHEMA_SELECTOR', 'SKIP_LOCK', 'SKIP_TRANSACTION', 'SKIP_VIEW', 'SKIP_ROUTINE'].includes(d.kind)) continue;
    if (d.kind === 'SESSION') {
      await flush();
      await db.query(statement.sql);
      continue;
    }
    if (queue.length && (queueBytes + statement.bytes > CHUNK_BYTES || kind !== d.kind || table !== d.table)) await flush();
    if (!queue.length) { start = statement.start; kind = d.kind; table = d.table; }
    queue.push(executavel); queueBytes += statement.bytes; end = statement.end;
    if (d.kind === 'DDL' || queueBytes >= CHUNK_BYTES) await flush();
  }
  await flush();
  if (rotinasIgnoradas) {
    await logEvent(
      'RESTORE', null,
      `${rotinasIgnoradas} definicoes de rotinas legadas ignoradas no MariaDB temporario. Os dados das tabelas continuam no escopo da importacao.`,
      'INFO', true
    );
  }
  if (ultimoByteLido > 0) await marcarLeitura(ultimoByteLido);
  await logEvent('RESTORE', null, scope === 'PRIORITY_SEVEN' ? `Leitura prioritaria concluida. ${omittedTables.size} tabelas adiadas; ${skippedStatements} instrucoes nao restauradas.` : 'Leitura integral do SQL concluida.', 'SUCCESS', true);
  await report('STAGING', '', 'Restauracao confirmada. Iniciando staging por tabela.', totalBytes || undefined);
}
async function run() {
  // A single session-scoped advisory lock serializes import workers.
  lockClient = await pg.connect();
  const lock = await lockClient.query('SELECT pg_try_advisory_lock(9177,34) AS ok');
  if (!lock.rows[0]?.ok) throw new Error('IMPORT_WORKER_ALREADY_RUNNING');
  locked = true;
  heartbeatTimer = setInterval(() => pg.query('UPDATE "LegacyImportBatch" SET "importHeartbeat"=NOW() WHERE "id"=$1 AND "importWorkerToken"=$2', [batchId, workerToken]).catch(() => { }), 5000);
  heartbeatTimer.unref();
  await checkControl();
  const result2 = await pg.query('SELECT "fileHash","fileBytes","restoreTotalBytes","importScope" FROM "LegacyImportBatch" WHERE "id"=$1', [batchId]);
  const b = result2.rows[0]; if (!b?.fileHash) throw new Error('BATCH_FILE_HASH_MISSING');
  const oldStage = (await pg.query(`SELECT (SELECT COUNT(*)::integer FROM "LegacyRawRow" WHERE "batchId"=$1) AS rows,(SELECT COUNT(*)::integer FROM "LegacyImportChunkCheckpoint" WHERE "batchId"=$1 AND "phase"='STAGING') AS chunks`, [batchId])).rows[0];
  if (oldStage.rows > 0 && oldStage.chunks === 0) throw new Error('OLD_STAGING_WITHOUT_CHECKPOINTS');
  const filename = ['.sql', '.sql.gz'].map(e => path.join(directory, `${batchId}${e}`)).find(f => fs.existsSync(f));
  if (!filename) throw new Error('PRIVATE_SQL_FILE_MISSING');
  const info = fs.statSync(filename); if (info.size !== Number(b.fileBytes)) throw new Error('SOURCE_FILE_SIZE_CHANGED');
  // O SQL e validado durante a restauracao; nao ha primeira leitura redundante.
  const total = filename.endsWith('.gz') ? 0 : info.size;
  if (total && Number(b.restoreTotalBytes || 0) !== total) {
    await pg.query('UPDATE "LegacyImportBatch" SET "restoreTotalBytes"=$2 WHERE "id"=$1', [batchId, BigInt(total)]);
  }
  const scope = b.importScope === 'PRIORITY_SEVEN' ? 'PRIORITY_SEVEN' : 'FULL';
  await logEvent('RESTORE', null, scope === 'PRIORITY_SEVEN' ? 'Escopo prioritario iniciado: sete tabelas operacionais.' : 'Escopo completo iniciado.', 'INFO', true);
  await checkControl();
  const db = await runDocker();
  try { await restore(filename, b.fileHash, total, db, scope); } finally { await db.end().catch(() => { }); }
  await stageIncremental({ pg, batchId, dbOpts, checkControl, report, scope, logEvent });
  console.log(`Importacao incremental concluida no staging, lote ${batchId}. Arquivo SQL original preservado na area privada.`);
}
try { await run(); }
catch (e) {
  const code = String(e?.code || e?.message || 'IMPORT_EXECUTION_ERROR');
  if (['IMPORT_PAUSED', 'IMPORT_CANCELLED'].includes(code)) {
    await save(code === 'IMPORT_PAUSED' ? 'PAUSED' : 'CANCELLED', activePhase, code === 'IMPORT_PAUSED' ? 'Pausado no ultimo bloco confirmado.' : 'Cancelado sem descartar checkpoints ou arquivo original.').catch(() => { });
  } else if (code !== 'IMPORT_TOKEN_LOST') {
    const known = /^(?:[A-Z][A-Z_0-9]{2,60})$/.test(code) ? code : safeSqlCode(e);
    await save('FAILED', activePhase, `Etapa interrompida (${known}); progresso confirmado preservado. Revise a tabela atual e retome o lote.`).catch(() => { });
    console.error(`Importacao lote ${batchId}: ${known}`);
    process.exitCode = 1;
  }
} finally {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (locked && lockClient) await lockClient.query('SELECT pg_advisory_unlock(9177,34)').catch(() => { });
  if (lockClient) lockClient.release();
  await pg.end();
}
