/**
 * Offline importer for local restored MariaDB snapshots. Never connects to production by default.
 * Runs as an opt-in command. Credentials must come from environment, not the repository.
 * Preserves all anomalies and raw row history in staging; never creates live users.
 */
import 'dotenv/config';
import mysql from 'mysql2';
import { Pool as PgPool } from 'pg';
import crypto from 'node:crypto';

const params = new Set(process.argv.slice(2));
const all = params.has('--all');
const preview = params.has('--dry-run');
const selected = process.argv.find(x => x.startsWith('--tables='))?.slice('--tables='.length)
  .split(',').map(x=>x.trim()).filter(Boolean);
const defaultTables = [
 'alunos','empresas','curso_appa','curso','contrato_empresa','contrato_aluno','montar_turma',
 'data_aula','frequencia_master','frequencia','notas','disciplinas','historico_pgto_contrato',
 'calendario_10_porcento','vaga_site','vaga_site_candidatos_participantes',
 'estagio_atividades','estagio_ra','estagio_tre','cbo_familia','cbo_ocupacao','cbo_perfil_ocupacional',
 'aluno_contrato','dia_aula_ead',
];
const forbiddenTable = /^(?:user_sistema|_+sanitizer_.*|sanitizer_.*)$/i;
const forbiddenColumns = /(senha|password|token|secret|api.?key|chave_privada|private_key|passwd|salt)/i;
const forbiddenFileTable = /(pdf|anexos?|documentos?|arquivos?_documentos?|modelos?_documentos?)/i;
const source = process.env.LEGACY_DB_NAME || '';
const batchParam=process.argv.find(x=>x.startsWith('--batch-id='))?.slice('--batch-id='.length);
const localOriginal = process.env.STAGING_IMPORT_CONFIRM === 'ORIGINAL_LOCAL_APPROVED';
if (!['ANONYMIZED_ONLY','ORIGINAL_LOCAL_APPROVED'].includes(process.env.STAGING_IMPORT_CONFIRM||'')) {
  throw new Error('Confirmacao explicita de staging obrigatoria.');
}
if (localOriginal && !(process.env.NODE_ENV === 'development' && process.env.LOCAL_SQL_IMPORT_ENABLED === 'true'
   && source === 'siscapro_import' && ['localhost','127.0.0.1'].includes(process.env.LEGACY_DB_HOST || ''))) {
   throw new Error('Importacao de dados originais permitida somente no banco local siscapro_import.');
}

if (!localOriginal && !source.toLowerCase().includes('anon') && !source.toLowerCase().includes('dev')) {
  throw new Error('Nome do banco fonte deve indicar ambiente anonimo/dev; producao nao e aceita.');
}
const db = mysql.createConnection({
 host: process.env.LEGACY_DB_HOST, port: Number(process.env.LEGACY_DB_PORT || 3306),
 database: source, user: process.env.LEGACY_DB_USER, password: process.env.LEGACY_DB_PASSWORD,
 ssl: process.env.LEGACY_DB_SSL === 'true' ? {} : undefined,
 connectTimeout: 15000, multipleStatements:false, dateStrings:true,
});
const pg = new PgPool({connectionString:process.env.DATABASE_URL,max:2});
const hash = (o:string) => crypto.createHash('sha256').update(o).digest('hex');
const safeJson = (x:any) => JSON.stringify(x, (_k,v) =>
  typeof v === 'bigint' ? v.toString() : Buffer.isBuffer(v) ? '[BINARIO_OMITIDO]' : v,
);
const query = (sql:string, vals:any[]=[]) => new Promise<any[]>((resolve,reject)=>
  db.query(sql,vals,(err,rows:any)=>err?reject(err):resolve(rows)));
async function pushBatch(table:string,batchId:string,items:{key:string;method:string;row:any;fingerprint:string}[]) {
 if(!items.length)return;
 const values:any[]=[];const placeholders=items.map((item,i)=>{
  const n=i*8;
  values.push(crypto.randomUUID(),table,item.key,item.method,JSON.stringify(item.row),item.fingerprint,batchId,new Date());
  return `($${n+1},$${n+2},$${n+3},$${n+4},$${n+5}::jsonb,$${n+6},$${n+7},$${n+8})`;
 });
 await pg.query(`INSERT INTO "LegacyRawRow" ("id","sourceTable","sourceKey","identityMethod","rowData","contentHash","batchId","importedAt") VALUES ${placeholders.join(',')}
  ON CONFLICT ("batchId","sourceTable","sourceKey") DO UPDATE SET "rowData"=EXCLUDED."rowData", "contentHash"=EXCLUDED."contentHash", "importedAt"=EXCLUDED."importedAt"`,values);
}
async function main() {
 const tables = await query(`SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME`);
 const known = tables.map(x=>String(x.name));
 const requested = selected?.length ? selected : all ? known : defaultTables;
 const list = requested.filter(x => known.includes(x) && /^[a-zA-Z0-9_]+$/.test(x) && !forbiddenTable.test(x) && !forbiddenFileTable.test(x));
 if(selected && list.length!==selected.length)throw new Error('Uma ou mais tabelas nao existem ou estao bloqueadas');
 if(preview){ console.log(JSON.stringify({dryRun:true,tables:list,excluded:known.length-list.length},null,2));return;}
 if(!list.length)throw new Error('Nenhuma tabela autorizada para importacao');
 const batchId=batchParam || crypto.randomUUID();
 if(batchParam){
  const result=await pg.query(`UPDATE "LegacyImportBatch" SET "status"='RUNNING',"stagingPhase"='STAGING' WHERE "id"=$1 RETURNING "id"`,[batchId]);
  if(!result.rowCount)throw new Error('Lote informado nao existe');
 }else{
  await pg.query(`INSERT INTO "LegacyImportBatch" ("id","source","status","startedAt","rowCount") VALUES ($1,$2,'RUNNING',NOW(),0)`,[batchId,'SISCAPRO_ANON']);
 }
 let total=0;
 // Progress is deliberately a row/table count, not a misleading percentage:
 // tables can vary from 0 to hundreds of thousands of records.
 let lastProgressAt=0;
 async function report(table:string,index:number,completedInTable:number,force=false){
  const now=Date.now();
  if(!force && now-lastProgressAt<3000)return;
  lastProgressAt=now;
  const cumulative=total+completedInTable;
  const message=`Preservando tabela ${index+1} de ${list.length}: ${table}. ${cumulative.toLocaleString('pt-BR')} registros gravados no staging.`;
  await pg.query(`UPDATE "LegacyImportBatch" SET "status"='RUNNING',"stagingPhase"='STAGING',"rowCount"=$2,"message"=$3 WHERE "id"=$1`,[batchId,cumulative,message]);
 }
 try {
  for(const [tableIndex,table] of list.entries()){
    await report(table,tableIndex,0,true);
    const pkRows=await query(`SELECT COLUMN_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND CONSTRAINT_NAME='PRIMARY' ORDER BY ORDINAL_POSITION`,[table]);
    const pks=pkRows.map(x=>String(x.name));
    const fields=await query(`SELECT COLUMN_NAME AS name, DATA_TYPE AS datatype FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? ORDER BY ORDINAL_POSITION`,[table]);
    const allowedCols=fields.filter(x=>!forbiddenColumns.test(x.name) && !['binary','varbinary','blob','tinyblob','mediumblob','longblob'].includes(String(x.datatype)));
    // Input identifiers are discovered from MariaDB metadata and validated against a strict whitelist.
    const selectCols=allowedCols.map(x=>`\`${x.name}\``).join(',');
    if(!selectCols) continue;
    const order=pks.length ? ` ORDER BY ${pks.map(x=>`\`${x}\``).join(',')}` : '';
    const stream=db.query(`SELECT ${selectCols} FROM \`${table}\`${order}`).stream({highWaterMark:100});
    let n=0, buffer: {key:string;method:string;row:any;fingerprint:string}[]=[];
    const occurrence=new Map<string,number>();
    for await(const row of stream) {
      const raw=safeJson(row),fingerprint=hash(raw);
      let key:string, method:string;
      if(pks.length && pks.every(col=>row[col]!==null && row[col]!==undefined)) {
        key=pks.length===1?String(row[pks[0]]):hash(JSON.stringify(pks.map(col=>row[col])));
        method=pks.length===1?'PRIMARY_KEY':'COMPOSITE_PRIMARY_KEY';
      } else {
        const times=(occurrence.get(fingerprint)||0)+1;occurrence.set(fingerprint,times);
        key=`hash:${fingerprint}:${times}`;method='SNAPSHOT_HASH_UNSTABLE';
      }
      buffer.push({key,method,row:JSON.parse(raw),fingerprint});n++;
      if(buffer.length>=100){await pushBatch(table,batchId,buffer);buffer=[];
       // Only count rows confirmed in PostgreSQL, never rows still buffered.
       await report(table,tableIndex,n);
      }
    }
    if(buffer.length)await pushBatch(table,batchId,buffer);
    await report(table,tableIndex,n,true);
    total+=n;
    await pg.query(`UPDATE "LegacyImportBatch" SET "rowCount"=$2 WHERE "id"=$1`,[batchId,total]);
    // No row values, names, CPFs or passwords in logs.
    console.log(`${table}: ${n} registros recebidos (acumulado ${total}).`);
  }
  await pg.query(`UPDATE "LegacyImportBatch" SET "status"='STAGED',"stagingPhase"='WAITING_APPROVAL',"finishedAt"=NOW(),"rowCount"=$2,"message"='Staging concluido. Pronto para revisar tabelas e converter os sete tipos mapeados.' WHERE "id"=$1`,[batchId,total]);
  console.log(`Importacao de staging finalizada. Lote ${batchId}; ${total} linhas. Nao houve migracao automatica para tabelas operacionais.`);
 } catch(e){
  await pg.query(`UPDATE "LegacyImportBatch" SET "status"='FAILED',"finishedAt"=NOW(),"message"=$2 WHERE "id"=$1`,[batchId,String((e as Error).message).slice(0,500)]);
  throw e;
 }
}
try { await main(); } catch(e){console.error(`Falha na importacao: ${String((e as Error).message).slice(0,200)}`);process.exitCode=1;}
finally{await pg.end();db.end();}
