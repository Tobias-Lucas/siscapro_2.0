/** Safe offline smoke verification for incremental import; never opens a database. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {sqlStatements,describeSqlStatement} from '../apps/api/src/staging/sql-statement-stream.mjs';

const root=process.cwd(),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'proativa-import-smoke-'));
let passed=0;
function check(name,condition){assert.ok(condition,name);console.log('PASS',name);passed++;}
async function parse(file){const out=[];for await(const x of sqlStatements(file))out.push(x);return out;}
try{
 const sql=`-- CREATE TESTE\nCREATE TABLE \`alunos\` (id INT PRIMARY KEY, nome TEXT) ENGINE=InnoDB;\nINSERT INTO \`alunos\` VALUES (1,'Linha com ; ponto e virgula'),(2,'Valor \\' escapado');\n/* comentario; */ INSERT INTO \`alunos\` VALUES (3,'Texto');\n`;
 const file=path.join(tmp,'sample.sql');fs.writeFileSync(file,sql);
 const plain=await parse(file);
 check('Leitura SQL com comentarios, aspas e ;',plain.length===3&&plain.map(x=>describeSqlStatement(x.sql).kind).join(',')==='DDL,DML,DML');
 check('Offsets continuos em bytes',plain.at(-1).end<=Buffer.byteLength(sql)&&plain[1].start===plain[0].end);
 const gz=path.join(tmp,'sample.sql.gz');fs.writeFileSync(gz,zlib.gzipSync(sql));
 const compressed=await parse(gz);
 check('SQL gzip e offsets descompactados',compressed.length===plain.length&&compressed.at(-1).end===plain.at(-1).end);
 const routine=path.join(tmp,'routine.sql');fs.writeFileSync(routine,'DELIMITER $$\nCREATE PROCEDURE p() BEGIN SELECT 1; END $$\nDELIMITER ;\n');
 const skipped=await parse(routine);
 check('Rotinas DELIMITER reconhecidas e ignoradas sem executar no MariaDB',skipped.length===0);
 const m=fs.readFileSync('apps/api/prisma/migrations/202611180001_incremental_original_import/migration.sql','utf8');
 check('Migracao aditiva com checkpoints',m.includes('CREATE TABLE "LegacyImportChunkCheckpoint"')&&m.includes('ADD COLUMN "importControl"')&&!m.includes('DROP TABLE'));
 const worker=fs.readFileSync('apps/api/src/staging/original-import.worker.mjs','utf8');
 check('Restauracao com commit e checkpoint no MariaDB',worker.includes('INSERT INTO `__proativa_import_commits`')&&worker.includes("await db.query('COMMIT')")&&worker.includes('pg_try_advisory_lock'));
 const stage=fs.readFileSync('apps/api/src/staging/stage-incremental.mjs','utf8');
 check('Staging com transacao PostgreSQL',stage.includes("await client.query('BEGIN')")&&stage.includes("await client.query('COMMIT')"));
 const controller=fs.readFileSync('apps/api/src/staging/staging.controller.ts','utf8');
 check('API contem pausas, cancelamento e recuperacao',controller.includes("@Post('pause/:id')")&&controller.includes("@Post('cancel/:id')")&&controller.includes("@Post('recover/:id')"));
 const ui=fs.readFileSync('apps/web/src/modules/imports/ImportCenterPage.tsx','utf8');
 check('Interface acompanha os blocos e historico',ui.includes('Blocos de processamento')&&ui.includes('Histórico de atividade')&&ui.includes('Pausar após bloco')); 
 console.log(`IMPORTACAO INCREMENTAL: ${passed}/${passed} VERIFICACOES ESTATICAS APROVADAS.`);
}catch(e){console.error('Falha:',e.code||e.message);process.exitCode=1;}
finally{fs.rmSync(tmp,{recursive:true,force:true});}
