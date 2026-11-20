/**
 * PROATIVA 2.0 V3.3.0 -- backend development runner.
 * Compile with TypeScript (which emits NestJS constructor metadata) and restart
 * Node on changes in dist/. Does not alter databases or Docker volumes.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const apiDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = resolve(apiDir, '..', '..', '.env.development');
const entryFile = resolve(apiDir, 'dist', 'main.js');

if (!existsSync(envFile)) {
  console.error('[dev:api] Arquivo .env.development nao encontrado na raiz. Execute npm run dev:setup.');
  process.exit(1);
}

let typescriptCli;
try {
  typescriptCli = require.resolve('typescript/bin/tsc');
} catch {
  console.error('[dev:api] TypeScript nao encontrado. Execute npm install na raiz do projeto.');
  process.exit(1);
}

let compiler = null;
let backend = null;
let stopping = false;
let ready = false;
let stdoutTail = '';

function stop(exitCode) {
  if (stopping) return;
  stopping = true;
  if (backend && backend.exitCode === null) backend.kill();
  if (compiler && compiler.exitCode === null) compiler.kill();
  process.exitCode = exitCode;
}

process.on('SIGINT', () => stop(130));
process.on('SIGTERM', () => stop(143));

function startBackend() {
  if (backend || stopping) return;
  if (!existsSync(entryFile)) {
    console.error('[dev:api] TypeScript nao produziu dist/main.js. Confira os erros acima.');
    stop(1);
    return;
  }
  console.log('[dev:api] TypeScript compilado. Iniciando NestJS com metadados de injecao...');
  backend = spawn(process.execPath, [
    '--env-file=../../.env.development',
    '--watch',
    'dist/main.js',
  ], { cwd: apiDir, stdio: 'inherit', env: process.env, windowsHide: false });
  backend.on('error', (err) => {
    console.error('[dev:api] Falha ao iniciar Node:', err.message);
    stop(1);
  });
  backend.on('exit', (code, signal) => {
    if (stopping) return;
    console.error(`[dev:api] Processo Node encerrado (${signal || code}).`);
    stop(code || 1);
  });
}

console.log('[dev:api] Observando o backend com tsc --watch (emitDecoratorMetadata).');
compiler = spawn(process.execPath, [
  typescriptCli,
  '-p', 'tsconfig.build.json',
  '--watch',
  '--preserveWatchOutput',
  '--noEmitOnError',
], { cwd: apiDir, stdio: ['inherit', 'pipe', 'inherit'], env: { ...process.env, FORCE_COLOR: '0' }, windowsHide: false });

compiler.stdout.setEncoding('utf8');
compiler.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  stdoutTail = (stdoutTail + chunk).slice(-4096);
  // tsc, unlike tsx/esbuild, emits design:paramtypes for NestJS DI.
  if (!ready && /Found\s+0\s+errors?\.\s+Watching for file changes/i.test(stdoutTail)) {
    ready = true;
    startBackend();
  }
});
compiler.on('error', (err) => {
  console.error('[dev:api] Falha ao iniciar TypeScript:', err.message);
  stop(1);
});
compiler.on('exit', (code, signal) => {
  if (stopping) return;
  console.error(`[dev:api] Observador TypeScript encerrado (${signal || code}).`);
  stop(code || 1);
});
