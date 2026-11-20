import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import {sqlStatements,describeSqlStatement} from '../apps/api/src/staging/sql-statement-stream.mjs';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'proativa-sql-test-'));
async function collect(text,gz=false){const file=path.join(dir,gz?'test.sql.gz':'test.sql');fs.writeFileSync(file,gz?zlib.gzipSync(text):text);const a=[];for await(const stmt of sqlStatements(file))a.push(stmt);return a;}
test('command boundaries, quoted semicolon and escaped values', async()=>{
 const statements=await collect("-- initial header\nCREATE TABLE `alunos` (id int);\nINSERT INTO `alunos` VALUES (1,'a; b'),(2,'escaped \\' quote');\n/* comment; */ INSERT INTO `alunos` VALUES (3,'a\\\\;');");
 assert.equal(statements.length,3);
 assert.equal(describeSqlStatement(statements[0].sql).kind,'DDL');
 assert.equal(describeSqlStatement(statements[1].sql).kind,'DML');
 assert.equal(describeSqlStatement(statements[2].sql).kind,'DML');
 assert.ok(statements.every((s,i)=>i===0||s.start===statements[i-1].end));
});
test('gzip records decompressed offsets',async()=>{
 const sql="CREATE TABLE `t` (id int);INSERT INTO `t` VALUES (2);";
 const statements=await collect(sql,true);
 assert.equal(statements.length,2);assert.equal(statements[1].end,Buffer.byteLength(sql));
});
test('rotina com DELIMITER alternativo nao bloqueia dados',async()=>{
 const amostra = [
  'CREATE TABLE `alunos` (id int);',
  'INSERT INTO `alunos` VALUES (1);',
  'DELIMITER $$',
  'CREATE PROCEDURE `p`() BEGIN SELECT 1; SELECT 2; END $$',
  'DELIMITER ;',
  'INSERT INTO `alunos` VALUES (2);'
 ].join('\n');
 const a=await collect(amostra);
 assert.equal(a.length,3);
 assert.equal(describeSqlStatement(a[2].sql).table,'alunos');
 assert.equal(a[2].end,Buffer.byteLength(amostra));
});
test('rotinas com delimitador duplo e comentarios versionados sao ignoradas',async()=>{
 const texto=[
  'DELIMITER ;;',
  '/*!50003 SET SESSION SQL_MODE="" */;;',
  '/*!50003 CREATE*/ /*!50017 DEFINER=`usuario`@`localhost`*/ /*!50003 TRIGGER `t` BEFORE INSERT ON `alunos` FOR EACH ROW BEGIN SET @a=1; SET @b=2; END */;;',
  'DELIMITER ;',
  'INSERT INTO `alunos` VALUES (4);'
 ].join('\n');
 const a=await collect(texto);
 assert.equal(a.length,1);
 assert.equal(describeSqlStatement(a[0].sql).kind,'DML');
});
test('DELIMITER dentro de valor nao e comando',async()=>{
 const texto="INSERT INTO `alunos` VALUES ('texto\nDELIMITER $$\nnao e comando');";
 const a=await collect(texto);
 assert.equal(a.length,1);
});
test('comando de dados com delimitador especial nao pode ser descartado',async()=>{
 await assert.rejects(()=>collect('DELIMITER $$\nINSERT INTO `alunos` VALUES (1)$$\nDELIMITER ;'),{code:'SQL_WITH_CUSTOM_DELIMITER_NOT_A_ROUTINE'});
});
test('cross-schema rejects',()=>assert.throws(()=>describeSqlStatement('INSERT INTO `prod`.`users` VALUES(1);'),{code:'CROSS_SCHEMA_REFERENCE'}));
test('USE and schema switches skipped',()=>assert.equal(describeSqlStatement('USE siscapro;').kind,'SKIP_SCHEMA_SELECTOR'));
test('stream boundary: large multiline literal and semicolon',async()=>{
 const s='z'.repeat(290000);
 const sql=`CREATE TABLE \`t\` (id int, note longtext);\nINSERT INTO \`t\` VALUES (1,'${s};after');\nINSERT INTO \`t\` VALUES (2,'ok');`;
 const a=await collect(sql);
 assert.equal(a.length,3);
 assert.equal(a.at(-1).end,Buffer.byteLength(sql));
 assert.equal(describeSqlStatement(a[1].sql).table,'t');
});
test('multiline user text DELIMITER is not a directive',async()=>{
 const sql="INSERT INTO `t` VALUES('hello\\nDELIMITER $$\\nworld');".replaceAll('\\n','\n');
 const a=await collect(sql);assert.equal(a.length,1);
});
test('phpMyAdmin SQL transaction markers and views are skipped safely',()=>{
 assert.equal(describeSqlStatement('START TRANSACTION;').kind,'SKIP_TRANSACTION');
 assert.equal(describeSqlStatement('COMMIT;').kind,'SKIP_TRANSACTION');
 assert.equal(describeSqlStatement('CREATE ALGORITHM=UNDEFINED DEFINER=`user`@`localhost` SQL SECURITY DEFINER VIEW `v` AS SELECT 1;').kind,'SKIP_VIEW');
});
