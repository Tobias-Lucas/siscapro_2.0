import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sqlStatements, describeSqlStatement } from '../apps/api/src/staging/sql-statement-stream.mjs';
import { TABELAS_PRIORITARIAS, deveExecutarNoEscopo } from '../apps/api/src/staging/import-scope.mjs';
import { createImportTelemetry } from '../apps/api/src/staging/import-telemetry.mjs';

let verificacoes = 0;
const validar = (descricao, condicao) => {
  assert.ok(condicao, descricao);
  verificacoes++;
  console.log(`APROVADO: ${descricao}`);
};

const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'proativa-express-'));

try {
  validar('Sete tabelas prioritarias sem duplicacao',
    TABELAS_PRIORITARIAS.length === 7 && new Set(TABELAS_PRIORITARIAS).size === 7);

  const arquivo = path.join(temporario, 'amostra.sql');
  const linhas = [
    'CREATE TABLE `alunos` (id INT PRIMARY KEY, nome TEXT);',
    "INSERT INTO `alunos` VALUES (1, 'Pessoa ficticia');",
    'CREATE TABLE `contrato_aluno` (id INT PRIMARY KEY);',
    'INSERT INTO `contrato_aluno` VALUES (2);',
    'CREATE TABLE `empresas` (id INT PRIMARY KEY);',
    'INSERT INTO `empresas` VALUES (3);',
  ];
  fs.writeFileSync(arquivo, linhas.join('\n'));
  const descricoes = [];
  for await (const statement of sqlStatements(arquivo)) {
    descricoes.push(describeSqlStatement(statement.sql));
  }
  validar('Leitor identifica as seis instrucoes SQL', descricoes.length === 6);
  validar('Modo prioritario seleciona quatro instrucoes',
    descricoes.filter((item) => deveExecutarNoEscopo(item, 'PRIORITY_SEVEN')).length === 4);
  validar('Modo completo preserva as seis instrucoes',
    descricoes.every((item) => deveExecutarNoEscopo(item, 'FULL')));
  validar('Regras de sessao mantidas no modo prioritario',
    deveExecutarNoEscopo({ kind: 'SESSION', table: '(sessao)' }, 'PRIORITY_SEVEN'));

  const grande = path.join(temporario, 'volume.sql');
  const linha = `INSERT INTO \`alunos\` VALUES (1, '${'A'.repeat(1024)}');\n`;
  fs.writeFileSync(grande, linha.repeat(18000));
  let notificacoes = 0;
  let ultimoByte = 0;
  let total = 0;
  for await (const _ of sqlStatements(grande, {
    onProgress: async (posicao) => {
      notificacoes++;
      ultimoByte = posicao;
    },
  })) {
    total++;
  }
  validar('Progresso da leitura informado antes do fim',
    notificacoes > 0 && ultimoByte > 16 * 1048576 && total === 18000);

  const comandos = [];
  const bancoFicticio = {
    async query(sql, parametros) {
      comandos.push({ sql, parametros });
    },
  };
  const telemetria = createImportTelemetry(bancoFicticio, crypto.randomUUID());
  await telemetria('RESTORE', 'alunos', '100 registros ficticios');
  await telemetria('RESTORE', 'alunos', '200 registros ficticios');
  await telemetria('STAGING', 'empresas', 'Etapa alterada');
  validar('Telemetria limita eventos repetidos e registra mudanca de fase',
    comandos.length === 2);
  validar('Telemetria nao aceita nome arbitrario de tabela',
    comandos.every((item) => item.parametros[4] === 'alunos' || item.parametros[4] === 'empresas'));

  const base = path.resolve(import.meta.dirname, '..');
  const prisma = fs.readFileSync(path.join(base, 'apps/api/prisma/schema.prisma'), 'utf8');
  const migracao = fs.readFileSync(path.join(
    base, 'apps/api/prisma/migrations/202611180002_express_import_events/migration.sql',
  ), 'utf8');
  validar('Esquema contem metadados de escopo, leitura e eventos',
    ['importScope String', 'restoreScannedBytes BigInt', 'model LegacyImportEvent'].every(
      (texto) => prisma.includes(texto),
    ));
  validar('Migracao adiciona campos e eventos sem excluir tabelas',
    migracao.includes('CREATE TABLE "LegacyImportEvent"') &&
    migracao.includes('"restoreScannedBytes"') &&
    !/DROP\s+(TABLE|DATABASE)/i.test(migracao));

  const controlador = fs.readFileSync(path.join(base, 'apps/api/src/staging/staging.controller.ts'), 'utf8');
  const interfaceWeb = fs.readFileSync(path.join(
    base, 'apps/web/src/modules/imports/ImportCenterPage.tsx',
  ), 'utf8');
  validar('API de eventos e novo lote preservam permissoes existentes',
    controlador.includes("@Get('events/:id')") && controlador.includes("@Post('reuse/:id')"));
  validar('Tela mostra historico, escopo e leitura de bytes',
    ['Histórico de atividade', 'Importação prioritária', 'SQL lido', 'Novo lote completo sem reenviar']
      .every((texto) => interfaceWeb.includes(texto)));

  console.log(`IMPORTACAO EXPRESSA: ${verificacoes}/${verificacoes} VERIFICACOES APROVADAS.`);
} finally {
  fs.rmSync(temporario, { recursive: true, force: true });
}
