# Transferência técnica - PROATIVA 2.0 V3.3

Consulte `README.md` e `ARCHITECTURE.md`. A primeira entrega (E1) deve reproduzir **todas** as funcionalidades existentes no SISCAPRO; nenhuma paridade funcional integral foi homologada ainda. O backlog original está em `qa/MATRIZ_PARIDADE_E1.csv`, com 199 registros, e há um complemento de Demandas em `qa/MATRIZ_PENDENCIAS_SUPLEMENTAR_DEMANDAS.csv`.

## Decisões já definidas

- Frontend React/Vite TypeScript, API NestJS/Node e Prisma 7/PostgreSQL principal. Legado MariaDB 10.11 permanece independente.
- A aplicação se chama **Proativa 2.0**, interface em português. Não inserir slogans de implantação nem **Ficha 360** nos nomes dos menus.
- Demandas são **multicanal**, com origem manual/WhatsApp/e-mail/portal/telefone/presencial/API. A automação de leitura de mensagens ainda será feita.
- Upload do banco **original com dados reais**, exclusivamente em laboratório local, sem credenciais/PDFs legados. `docker-compose.import.yml` é ambiente isolado; nunca gravar na origem SISCAPRO.
- Staging preserva registros e inconsistências. Somente **sete** transformadores operacionais estão disponíveis; não relatar outras tabelas como migradas. Manter lotes independentes por chave de origem. Dados pessoais continuam sensíveis também no staging.
- 25 perfis `*.aitinet` são **criados sob comando explícito** por `apps/api/scripts/seed-dev-accounts.ts`; senhas não estão neste repositório e ficam em arquivo local ignorado.
- Templates setoriais respeitam o catálogo de permissões e o versionamento. Não escalar privilégios nem associar responsáveis a menores sem validação.
- Não apagar arquivos PDF originais, mas tampouco importá-los nesta etapa; nada de MD5 para autenticar.
- Não executar `docker compose down -v`, `prisma migrate reset`, uploads públicos de dumps ou migrations no banco de produção.

## Instalação, testes e limitações

Leia `README.md` para sequência segura; `npm run verify:v3.3` é **teste estrutural**, não comprova builds, importação nem aderência funcional. Execute `npm run db:validate`, build de API/frontend e `scripts/validate-v3-3.ps1` no Windows com dependências. Antes de qualquer promoção, faça backup do PostgreSQL. Preserve o histórico de migrations e teste o novo fluxo com dados autorizados em ambiente restrito.
