/** V3.3 structural test. This is not a runtime integration or migration test. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
let passed = 0;
function check(name, fn) {fn();passed++;console.log(`PASS ${name}`);}
const packageJson = JSON.parse(read('package.json'));
const schema = read('apps/api/prisma/schema.prisma');
const migration = read('apps/api/prisma/migrations/202611170001_v3_3_multichannel_original_import/migration.sql');
check('Versão 3.3.x',()=>assert.match(packageJson.version,/^3\.3\.(?:0|1)$/));
check('Cliente Prisma atualizado antes de executar a API',()=>assert.match(read('apps/api/package.json'),/dev-with-tsc\.mjs/));
check('Importação segura e modelos de rastreabilidade',()=>['LegacyImportBatch','LegacyImportTableStatus','LegacyImportRecordResult'].forEach(x=>assert.ok(schema.includes(`model ${x} {`))));
check('Histórico de lotes independentes',()=>{assert.ok(schema.includes('@@unique([batchId, sourceTable, sourceKey])'));assert.match(migration,/LegacyRawRow_batchId_sourceTable_sourceKey_key/);});
check('Três novos papéis externos',()=>['APPRENTICE','CANDIDATE','LEGAL_GUARDIAN'].forEach(x=>assert.match(schema,new RegExp(`\\b${x}\\b`))));
check('Demanda registra canal e referência externa',()=>{assert.match(schema,/originChannel String @default\("MANUAL"\)/);assert.match(schema,/externalReference String\?/);});
check('Demandas próprias no menu, sem Ficha 360',()=>{const nav=read('apps/web/src/modules/navigation/nav.ts');assert.match(nav,/group:'Demandas'/);assert.ok(!nav.includes('Ficha 360'));assert.ok(!nav.includes('Demandas por e-mail'));});
check('Interface de demandas multicanal',()=>{const ui=read('apps/web/src/modules/demands/DemandsPage.tsx');assert.match(ui,/WHATSAPP/);assert.match(ui,/originChannel/);});
check('Recebimento de SQL original e auditoria',()=>{const api=read('apps/api/src/staging/staging.controller.ts');['upload','capabilities','tables/:id','results/:id','export/:id'].forEach(x=>assert.ok(api.includes(`'${x}'`)));});
check('Upload autorizado só em ambiente local',()=>assert.match(read('apps/api/src/staging/staging.controller.ts'),/NODE_ENV\s*!==\s*['"]development['"]/ ));
check('MariaDB de importação isolado',()=>{const compose=read('docker-compose.import.yml');assert.match(compose,/127\.0\.0\.1/);assert.match(compose,/internal: true/);});
check('Armazenamento temporário de SQL ignorado pelo Git',()=>assert.match(read('.gitignore'),/\.local-private-imports/));
check('Restauração e staging protegidos',()=>{const job=read('apps/api/src/staging/original-import.worker.mjs');assert.match(job,/LOCAL_SQL_IMPORT_ENABLED/);assert.match(job,/siscapro_import/);});
check('Sete transformadores indicados, sem promessa de migração completa',()=>{const cli=read('apps/api/scripts/promote-batch.ts');assert.equal((cli.match(/\[\s*['"](?:people|companies|courses|groups|disciplines|enrollments|attendance)['"]/g)||[]).length,7);});
check('Logs individuais de inseridos e falhas',()=>{const service=read('apps/api/src/legacy/legacy.service.ts');const rules=read('apps/api/src/legacy/legacy-normalization.ts');assert.match(service,/SKIPPED_EXISTING/);assert.match(service,/classifyPromotionFailure/);assert.match(rules,/TRANSFORMATION_FAILED/);});
check('Templates com versionamento presentes',()=>{const iam=read('apps/api/src/iam/access.service.ts');assert.ok(schema.includes('model AccessTemplateRevision {'));assert.ok(iam.includes('accessTemplateRevision'));});
check('25 perfis em seed local',()=>{const seed=read('apps/api/scripts/seed-dev-accounts.ts');assert.equal((seed.match(/\{login:'/g)||[]).length,25);assert.match(seed,/DEV_USERS_PROVISIONING/);});
check('Script de seed sem senhas em texto claro',()=>{const seed=read('apps/api/scripts/seed-dev-accounts.ts');assert.match(seed,/argon2\.hash/);assert.match(seed,/randomBytes/);});
check('Usuários externos não recebem permissões internas',()=>assert.match(read('apps/api/src/iam/access.service.ts'),/Perfis externos nao acessam modulos internos/));
check('Credenciais não distribuídas no código',()=>assert.ok(!fs.existsSync(path.join(root,'.local-dev-users-credentials.md'))));
check('Validação técnica PS5.1 atualizada',()=>{const ps=read('scripts/validate-v3-3.ps1');assert.match(ps,/verify-v3-3\.mjs/);assert.match(ps,/SkipFormat/);});
check('Autenticação legada insegura permanece bloqueada',()=>assert.match(read('apps/api/src/auth/auth.service.ts'),/Legacy MD5 credentials are intentionally not accepted/));
console.log(`V3.3 STATIC CHECKS: ${passed}/${passed} PASSED`);
