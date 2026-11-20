'use strict';

// Ferramenta pontual para diagnosticar lotes de importacao sem alterar dados operacionais.
// Uso: node --env-file=../../.env.development diagnosticar_liberar_fila_proativa_v331.cjs [--liberar]
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');

const liberar = process.argv.includes('--liberar');
const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL nao configurada.');
  process.exit(1);
}

let origem;
try {
  origem = new URL(url);
} catch {
  console.error('DATABASE_URL invalida.');
  process.exit(1);
}

if (
  process.env.NODE_ENV !== 'development' ||
  !['localhost', '127.0.0.1'].includes(origem.hostname)
) {
  console.error('Operacao permitida somente no banco de desenvolvimento local.');
  process.exit(1);
}

const conexao = new Client({
  connectionString: url,
  connectionTimeoutMillis: 7000,
  query_timeout: 15000,
  application_name: 'diagnostico_fila_proativa_v331',
});

async function executar() {
  await conexao.connect();
  let bloqueioAdquirido = false;
  try {
    const { rows } = await conexao.query(`
      SELECT
        "id",
        "source" AS "origem",
        "status",
        "stagingPhase" AS "etapa",
        "importHeartbeat" AS "ultimo_contato",
        CASE
          WHEN "importHeartbeat" IS NULL THEN NULL
          ELSE FLOOR(EXTRACT(EPOCH FROM (NOW() - "importHeartbeat")))::integer
        END AS "segundos_sem_contato"
      FROM "LegacyImportBatch"
      WHERE "status" IN ('RUNNING', 'PROMOTING')
      ORDER BY "importHeartbeat" DESC NULLS LAST
      LIMIT 50;
    `);

    console.log('\nLOTES MARCADOS COMO EM EXECUCAO:');
    if (rows.length) {
      console.table(rows);
    } else {
      console.log('Nenhum. O bloqueio da fila tem outra causa.');
    }

    if (!liberar) {
      console.log('\nSomente consulta: nenhum dado foi alterado.');
      console.log('Para liberar apenas lotes locais com contato vencido, use --liberar.');
      return;
    }

    const trava = await conexao.query(
      'SELECT pg_try_advisory_lock(9177, 34) AS livre;'
    );
    if (!trava.rows[0]?.livre) {
      throw new Error(
        'Existe um worker detendo a trava do banco. Nenhum lote foi modificado.'
      );
    }
    bloqueioAdquirido = true;

    await conexao.query('BEGIN;');
    try {
      const { rows: alterados } = await conexao.query(`
        UPDATE "LegacyImportBatch"
        SET
          "status" = 'PAUSED',
          "importControl" = 'PAUSE_REQUESTED',
          "message" = 'Execucao anterior interrompida; fila liberada sem excluir checkpoints.'
        WHERE "source" = 'SISCAPRO_ORIGINAL_LOCAL'
          AND "status" IN ('RUNNING', 'PROMOTING')
          AND (
            "importHeartbeat" IS NULL
            OR "importHeartbeat" < NOW() - INTERVAL '120 seconds'
          )
        RETURNING "id", "stagingPhase" AS "etapa";
      `);

      for (const lote of alterados) {
        await conexao.query(`
          INSERT INTO "LegacyImportEvent" (
            "id", "batchId", "phase", "level", "message"
          ) VALUES ($1, $2, 'SYSTEM', 'WARNING', $3);
        `, [
          randomUUID(),
          lote.id,
          'Lote sem contato recente marcado como pausado para liberar a fila.',
        ]);
      }
      await conexao.query('COMMIT;');
      console.log(`\nLotes locais liberados com seguranca: ${alterados.length}.`);
      for (const lote of alterados) {
        console.log(`Lote pausado: ${lote.id} (etapa: ${lote.etapa})`);
      }
      console.log('Arquivos SQL, dados operacionais e checkpoints preservados.');
    } catch (erro) {
      await conexao.query('ROLLBACK;').catch(() => undefined);
      throw erro;
    }
  } finally {
    if (bloqueioAdquirido) {
      await conexao.query('SELECT pg_advisory_unlock(9177, 34);')
        .catch(() => undefined);
    }
    await conexao.end();
  }
}

executar().catch((erro) => {
  console.error(`Falha: ${erro.code || erro.message}`);
  process.exitCode = 1;
});
