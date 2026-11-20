/** Non-destructive smoke tests for the local V2.0 QA environment.
 * Run: node --env-file=.env scripts/smoke-test.mjs
 * These tests do not change academic or financial records.
 */
import assert from 'node:assert/strict';
const base=(process.env.WEB_ORIGIN||'http://localhost:8080').split(',')[0].replace(/\/$/,'');
const password=process.env.AITINET_ADMIN_PASSWORD;
const demo=process.env.DEMO_PASSWORD;
async function request(path,{method='GET',body,cookie}={}){
  const headers={origin:base,...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})};
  const res=await fetch(base+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});
  return {res,data:await res.json().catch(()=>({}))};
}
async function session(email,password){
 const r=await request('/api/auth/login',{method:'POST',body:{identifier:email,password}});
 assert.equal(r.res.status,201,`Login falhou (${email}): ${JSON.stringify(r.data)}`);
 const cookie=r.res.headers.get('set-cookie')?.split(';')[0];
 assert.ok(cookie?.startsWith('proativa_session='));
 return cookie;
}
let h=await request('/api/health');assert.equal(h.res.status,200,'API indisponivel');
assert.equal(h.data.status,'ok');
const admin=await session(process.env.AITINET_ADMIN_EMAIL||'admin@aitinet.local',password);
const summary=await request('/api/dashboard/summary',{cookie:admin});assert.equal(summary.res.status,200);
const options=await request('/api/operations/catalog',{cookie:admin});assert.equal(options.res.status,200);
// Consultas V2.1: endpoints paginados, fichas, relatórios e limites de acesso.
const peoplePage=await request('/api/people?paged=1&page=1&pageSize=10',{cookie:admin});
assert.equal(peoplePage.res.status,200,'Paginação de pessoas indisponível');
assert.ok(Array.isArray(peoplePage.data.items)&&Number.isInteger(peoplePage.data.total));
if(peoplePage.data.items.length){
 const dossier=await request(`/api/dossiers/people/${encodeURIComponent(peoplePage.data.items[0].id)}`,{cookie:admin});
 assert.equal(dossier.res.status,200,'Ficha de pessoa indisponível');
 assert.ok(Array.isArray(dossier.data.sections));
}
const reports=await request('/api/reports/catalog',{cookie:admin});
assert.equal(reports.res.status,200,'Relatórios indisponíveis');
assert.ok(Array.isArray(reports.data)&&reports.data.some(x=>x.key==='people'));
const reportPreview=await request('/api/reports/people/preview?page=1',{cookie:admin});
assert.equal(reportPreview.res.status,200,'Prévia do relatório indisponível');
assert.ok(Array.isArray(reportPreview.data.columns)&&Array.isArray(reportPreview.data.items));
const gradesPage=await request('/api/academic/grades?paged=1&page=1&pageSize=10',{cookie:admin});
assert.equal(gradesPage.res.status,200,'Consulta paginada de notas indisponível');
const attendancePage=await request('/api/academic/attendance?paged=1&page=1&pageSize=10',{cookie:admin});
assert.equal(attendancePage.res.status,200,'Consulta paginada de frequência indisponível');

assert.ok(Array.isArray(options.data)&&options.data.length>=30,'Catalogo de operacoes indisponivel');
const units=await request('/api/operations/unit?page=1',{cookie:admin});assert.equal(units.res.status,200);
assert.ok(Array.isArray(units.data.items));
const documents=await request('/api/documents',{cookie:admin});assert.equal(documents.res.status,200);
const users=await request('/api/users',{cookie:admin});assert.equal(users.res.status,200);
assert.ok(users.data.every(x=>!('passwordHash'in x)));
const legacy=await request('/api/legacy/status',{cookie:admin});assert.equal(legacy.res.status,200);
const denied=await request('/api/portal/student',{cookie:admin});assert.equal(denied.res.status,403,'Admin nao pode consultar a area individual do aluno pela rota externa');
if(process.env.DEMO_SEED_ENABLED==='true'){
 const portals=[['aluno@demo.local','student'],['empresa@demo.local','company'],['facilitador@demo.local','professor'],['supervisor@demo.local','supervisor']];
 for(const [mail,p] of portals){const cookie=await session(mail,demo);const result=await request('/api/portal/'+p,{cookie});assert.equal(result.res.status,200,`Portal ${p} falhou`);const block=await request('/api/operations/catalog',{cookie});assert.equal(block.res.status,403,'Portal externo acessou catalogo interno');}
}
const logout=await request('/api/auth/logout',{method:'POST',body:{},cookie:admin});assert.equal(logout.res.status,201);
console.log('PASSOU: health, sessao, paginacao, fichas, relatorios, academico, cadastros, documentos, perfis e limites de acesso.');
