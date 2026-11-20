/** Manually reset only the bootstrap administrator's Argon2id password. Never run at startup. */
import 'dotenv/config';
import { Pool } from 'pg';
import * as argon2 from 'argon2';
import crypto from 'node:crypto';
const email = String(process.env.ADMIN_RESET_EMAIL||'').trim().toLowerCase();
const password = process.env.ADMIN_RESET_PASSWORD||'';
if (process.env.ADMIN_RESET_CONFIRM !== 'I_AUTHORIZED_THIS_RESET' || !email || password.length < 14 || password.length > 200) {
  throw new Error('Use ADMIN_RESET_CONFIRM=I_AUTHORIZED_THIS_RESET, ADMIN_RESET_EMAIL e senha forte (14+ caracteres).');
}
const pool = new Pool({connectionString:process.env.DATABASE_URL});
try {
 const user=await pool.query('SELECT "id","role","active" FROM "User" WHERE "email"=$1 LIMIT 1',[email]);
 if(user.rowCount!==1 || user.rows[0].role!=='SUPER_ADMIN') throw new Error('Administrador nao encontrado ou perfil diferente');
 const digest=await argon2.hash(password,{type:argon2.argon2id});
 await pool.query('UPDATE "User" SET "passwordHash"=$1,"passwordAlgorithm"=$2,"updatedAt"=NOW() WHERE "id"=$3', [digest,'ARGON2ID',user.rows[0].id]);
 await pool.query('INSERT INTO "AuditLog" ("id","userId","action","entity","entityId","createdAt") VALUES ($1,$2,$3,$4,$5,NOW())',[crypto.randomUUID(),user.rows[0].id,'ADMIN_PASSWORD_RESET_LOCAL','User',user.rows[0].id]);
 console.log('Senha administrativa redefinida com sucesso. Credencial nao exibida.');
} finally {await pool.end();}
