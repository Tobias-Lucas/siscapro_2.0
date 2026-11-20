# PROATIVA 2.0 — V3.3.0

Sistema de desenvolvimento para modernização do SISCAPRO. Código completo (API NestJS/Prisma, frontend React/Vite, PostgreSQL/Redis em Docker), em português. **Não homologado para produção**.

## Atualização segura da V3.2

1. Faça **backup** do PostgreSQL e dos arquivos `.env.development` da V3.2 antes de atualizar. Extraia a V3.3 em **nova pasta**. Não execute `docker compose down -v`, `prisma migrate reset` ou `prisma db push --force-reset`.
2. Copie a configuração `.env.development` da instalação anterior (somente na sua máquina; nunca a compartilhe). Mantenha `DATABASE_URL` apontando para o PostgreSQL local desejado. O `docker-compose.infra.yml` mantém os volumes da V3.2 de desenvolvimento.
3. No PowerShell na raiz deste projeto:

```powershell
npm install --workspaces --include-workspace-root
npm run dev:infra:up
npm run db:generate
npm run db:validate
npm run db:migrate:dev
npm run build -w @proativa/api
npm run build -w @proativa/web
npm run dev:api
```

Em outro terminal:

```powershell
npm run dev:web
```

**Importante:** `db:migrate:dev` aplica alterações aditivas. Verifique backup, endereço do banco e alterações pendentes antes da execução.

## 25 usuários e templates de acesso

Execute **uma única vez**, com API parada, no banco **local** de desenvolvimento. Sem confirmação em `.env.development`, o script bloqueia a operação.

```powershell
npm run dev:sql:prepare
npm run dev:users:seed
```

Cria 25 contas de desenvolvimento (formato `admin.aitinet`, `juridico.aitinet`, etc.) e seus templates em **Equipe e acessos → Usuários e permissões**. Senhas aleatórias individuais são gravadas somente em `.local-dev-users-credentials.md` (NÃO está no ZIP e é ignorado no Git). Para reutilizar senhas do documento separado já fornecido, utilize:

```powershell
npm run dev:users:seed -- --credentials-file "C:\caminho\credenciais-planejadas.md"
```

**Nunca inclua credenciais de teste, dados originais ou dumps SQL em repositórios, backups públicos ou produção.** Contas existentes não têm senhas sobrescritas automaticamente.

## Importação de SQL original com dados pessoais reais

A opção fica em **Administração → Importação de dados**. É intencionalmente bloqueada fora do ambiente local de desenvolvimento.

1. Execute `npm run dev:sql:prepare` e reinicie a API para ler as variáveis; Docker Desktop deve estar ativo.
2. Use o campo de upload `.sql`/`.sql.gz` (máx. 4 GiB). O arquivo vai para `.local-private-imports`, que não é distribuída nem versionada.
3. Autorize o processamento; o servidor restaura o dump em um **MariaDB 10.11 dedicado**, em Docker (`docker-compose.import.yml`, endereço `127.0.0.1:3310`), e lê tabelas para **staging** no PostgreSQL. A rede isolada não oferece acesso externo ao container de importação.
4. Verifique totais por tabela. O staging registra registros originais permitidos, sem colunas de senhas/tokens nem tabelas PDF/documentos; tabelas não processadas são mostradas com motivo.
5. Faça **backup do PostgreSQL** e clique em *Transformar dados mapeados*. Apenas sete entidades têm transformadores nesta versão: alunos, empresas, cursos, turmas, disciplinas, matrículas e frequências. A execução é incremental/idempotente por vínculo legado, evitando atualizar registros existentes inadvertidamente.
6. Consulte o relatório de resultados (`INSERTED`, `FAILED`, `SKIPPED_EXISTING`, `NO_TRANSFORMER`, etc.) por tabela e por chave de origem; exporte CSV.

Não há importação integral dos 167 tipos de tabela legados. **Contrato, financeiro, notas, documentos, demandas históricas e outros setores precisam de transformadores específicos.** Nenhum registro sem mapeamento deve ser apresentado como convertido. Original e staging são dados pessoais reais, e o PostgreSQL local de homologação passa a ser sensível. Restrinja acesso à máquina, criptografe disco, controle backups, não exponha API e Vite na internet, e elimine cópias somente de acordo com o processo aprovado da organização.

O SQL deve ser um dump **de banco único**, compatível com MariaDB 10.11, sem comandos que redirecionem a restauração para bancos externos. O processo não é um interpretador SQL de confiança universal. Arquivos arbitrários não devem ser usados. Dumps com `CREATE DATABASE` / `USE` referentes a outros bancos devem ser normalizados em ambiente isolado antes de tentar restaurá-los.

## Demandas multicanal

O menu **Demandas → Gestão de demandas** possui origem selecionável: manual, WhatsApp, e-mail, portal, telefone, presencial ou API. A integração automática com WhatsApp/e-mail é uma **etapa futura**; o cadastro atual apenas registra a origem para rastreabilidade.

## Verificações

```powershell
npm run verify:v3.3
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\validate-v3-3.ps1 -SkipInstall -SkipFormat
npm run smoke:dev
```

Validação técnica não substitui homologação funcional nem comparação de cada rotina com o PHP do SISCAPRO. Nunca execute migrations de produção sem ambiente e backups verificados.

## Organização do pacote

- `apps/api/` — NestJS + Prisma, serviços, staging, migration, seed de perfis
- `apps/web/` — React, menus, demandas, painel de importação
- `scripts/` — instalação, validação, geração dos perfis e preparo local
- `docs/` — decisões arquiteturais e mapeamentos de paridade relevantes
- `qa/` — matrizes de homologação e inventário
- `.env*.example` — modelos sem segredos

Changelogs antigos, hotfixes e backups de trabalho foram removidos do pacote. Histórico de migrations, mapeamentos, scripts de operação e código foram preservados.
