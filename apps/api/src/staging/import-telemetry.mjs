import crypto from 'node:crypto';

const MAX_MESSAGE_LENGTH = 280;

function safeTable(table) {
  const name = String(table || '');
  return /^[a-zA-Z0-9_]{1,190}$/.test(name) ? name : null;
}

export function createImportTelemetry(pg, batchId) {
  let lastEventTime = 0;
  let previousPhase = '';
  let previousTable = '';

  return async function publish(phase, table, message, level = 'INFO', force = false) {
    const now = Date.now();
    const currentTable = safeTable(table);
    const newContext = phase !== previousPhase || currentTable !== previousTable;

    if (!force && !newContext && now - lastEventTime < 3500) {
      return;
    }

    const safeMessage = String(message || '').slice(0, MAX_MESSAGE_LENGTH);
    const safePhase = /^[A-Z_]{3,24}$/.test(phase) ? phase : 'SYSTEM';
    const safeLevel = ['INFO', 'SUCCESS', 'WARNING', 'ERROR'].includes(level)
      ? level
      : 'INFO';

    await pg.query(
      `INSERT INTO "LegacyImportEvent"
         ("id", "batchId", "phase", "level", "sourceTable", "message")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), batchId, safePhase, safeLevel, currentTable, safeMessage],
    );

    lastEventTime = now;
    previousPhase = phase;
    previousTable = currentTable;
  };
}
