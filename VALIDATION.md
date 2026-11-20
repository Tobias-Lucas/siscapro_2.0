# Estado da validação - PROATIVA 2.0 V3.3

## Conferido neste pacote

- `npm run verify:v3.3` — **22/22 verificações estáticas** aprovadas.
- Parser do TypeScript global aplicado aos **110 arquivos `.ts`/`.tsx`** — nenhum erro sintático.
- `node --check` para scripts `.mjs` modificados e testes de integridade do arquivo ZIP.
- Migração V3.3 criada de forma aditiva para canais de Demandas, novos papéis externos, controle por lote e resultado da transformação.
- Scripts anteriores de geração do Prisma Client, compilação com metadata do NestJS, correções de TypeScript e menu foram incorporados à base.

## Ainda não verificado neste ambiente

- `npm install` não completou em ambiente restrito (sem dependências instaladas); **não foi possível fazer build real** (`tsc`, `vite build`) ou `prisma validate` da V3.3.
- Docker e PostgreSQL não estão disponíveis aqui; **não foi possível executar migrations ou importar SQL real**.
- Não foram executados smoke tests de API/web nem testes de desempenho e segurança sobre dumps reais.
- Os 25 usuários e templates **não foram criados no banco do usuário**: o comando de provisionamento deve ser executado localmente.
- Migração não cobre todas as tabelas do legado. Sete transformadores exigem homologação com dados reais autorizados; os demais permanecem staging/pendentes.
- Paridade funcional de 199 itens ainda não foi homologada.

## Verificações obrigatórias em Windows

```powershell
cd D:\SISCAPRO\Siscapro\PROATIVA_SISCAPRO_V3_3_0
npm install --workspaces --include-workspace-root
npm run verify:v3.3
npm run db:validate
npm run build -w @proativa/api
npm run build -w @proativa/web
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\validate-v3-3.ps1 -SkipInstall -SkipFormat
```

Atenção: se usar `npm run db:migrate:dev`, confirmar previamente backup, conexão e migração aditiva. Não publicar essa aplicação com dados reais antes de passar por revisão formal de proteção de dados e controles de acesso.
