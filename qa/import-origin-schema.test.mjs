import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sqlStatements, describeSqlStatement } from '../apps/api/src/staging/sql-statement-stream.mjs';

const opcoes = { sourceSchema: 'sisc1207_siscapro' };
const classificar = (sql) => describeSqlStatement(sql, opcoes);

test('INSERT original qualificado fica na base isolada', () => {
  const sql = "INSERT INTO `sisc1207_siscapro`.`alunos` VALUES (1, 'ficticio');";
  const d = classificar(sql);
  assert.equal(d.kind, 'DML');
  assert.equal(d.table, 'alunos');
  assert.equal(d.normalizedSql, "INSERT INTO `alunos` VALUES (1, 'ficticio');");
});
test('DDL original qualificado e preservado sem prefixo original', () => {
  const d = classificar('CREATE TABLE IF NOT EXISTS `sisc1207_siscapro`.`alunos` (id INT);');
  assert.equal(d.kind, 'DDL');
  assert.equal(d.table, 'alunos');
  assert.equal(d.normalizedSql, 'CREATE TABLE IF NOT EXISTS `alunos` (id INT);');
});
test('DROP TABLE, UPDATE e DELETE do proprio banco remapeados', () => {
  for (const [source, expected] of [
    ['DROP TABLE IF EXISTS `sisc1207_siscapro`.`alunos`;', 'DROP TABLE IF EXISTS `alunos`;'],
    ['UPDATE `sisc1207_siscapro`.`alunos` SET a=1;', 'UPDATE `alunos` SET a=1;'],
    ['DELETE FROM `sisc1207_siscapro`.`alunos` WHERE id=1;', 'DELETE FROM `alunos` WHERE id=1;'],
  ]) assert.equal(classificar(source).normalizedSql, expected);
});
test('bancos externos sao sempre recusados', () => {
  for (const sql of [
    'INSERT INTO `mysql`.`user` VALUES(1);',
    'CREATE TABLE `outro_db`.`alunos` (id INT);',
    'UPDATE `outro_db`.`alunos` SET a=1;',
    'USE `outro_db`;',
  ]) assert.throws(() => classificar(sql), { code: 'CROSS_SCHEMA_REFERENCE' });
});
test('USE do banco original e ignorado sem alterar o banco temporario', () => {
  assert.equal(classificar('USE `sisc1207_siscapro`;').kind, 'SKIP_SCHEMA_SELECTOR');
});
test('referencias pontuadas em dados e definicoes nao geram falso erro', () => {
  for (const sql of [
    "INSERT INTO `alunos` VALUES(1, 'www.portal.exemplo.br');",
    'CREATE TABLE `alunos` (`endereco` varchar(255) COMMENT \'url.site\', `valor` decimal(10,2));',
    "UPDATE `alunos` SET email='usuario@dominio.com.br';",
  ]) {
    const d=classificar(sql);
    assert.equal(d.normalizedSql, undefined);
    assert.equal(d.table, 'alunos');
  }
});
test('comentarios no inicio e valores originais preservados', () => {
  const sql = "-- export original\nINSERT INTO `sisc1207_siscapro`.`alunos` VALUES(1, 'a.b');";
  const d=classificar(sql);
  assert.equal(d.normalizedSql, "-- export original\nINSERT INTO `alunos` VALUES(1, 'a.b');");
});
test('sem permissao explicita continua proibido remapear bancos', () => {
  assert.throws(() => describeSqlStatement('INSERT INTO `sisc1207_siscapro`.`alunos` VALUES(1);'), { code: 'CROSS_SCHEMA_REFERENCE' });
});
test('leitura streaming com DELIMITER e alvo qualificado funciona', async () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'proativa-schema-'));
  try {
    const conteudo=[
      'USE `sisc1207_siscapro`;',
      'CREATE TABLE `sisc1207_siscapro`.`alunos` (id INT);',
      'DELIMITER $$',
      'CREATE PROCEDURE `p`() BEGIN SELECT 1; END $$',
      'DELIMITER ;',
      'INSERT INTO `sisc1207_siscapro`.`alunos` VALUES(1);',
    ].join('\n').replaceAll('\\n','\n');
    const file=path.join(dir,'fixture.sql');fs.writeFileSync(file,conteudo);
    const a=[];
    for await (const s of sqlStatements(file)) a.push({ ...s, ...classificar(s.sql) });
    assert.equal(a.length,3);
    assert.equal(a[2].normalizedSql, 'INSERT INTO `alunos` VALUES(1);');
    assert.equal(a[2].end, Buffer.byteLength(conteudo));
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('checkpoint de SQL nao qualificado fica identico', () => {
  const sql='INSERT INTO `alunos` VALUES(1);';
  const d=classificar(sql);
  assert.equal(d.normalizedSql || sql, sql);
});
