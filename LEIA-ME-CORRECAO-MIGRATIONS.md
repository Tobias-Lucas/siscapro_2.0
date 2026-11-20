# Correção de instalação — PROATIVA 2.0 V3.3.1

Este complemento restaura as **15 migrations PostgreSQL** que foram omitidas por engano do ZIP completo da V3.3.1.
Não altera código de negócio, não executa comandos no banco e não contém dados de produção, senhas ou configurações privadas.

## Antes de começar

- Confirme que a V3.3.1 foi extraída em `D:\SISCAPRO\Siscapro\PROATIVA_SISCAPRO_V3_3_1`.
- Não exclua volumes nem reinicialize o PostgreSQL. Faça backup do banco antes de executar migrations.
- A `.env.development` é propositalmente excluída do ZIP por segurança: copie a configuração da V3.3.0 em funcionamento **somente se desejar usar o mesmo banco de desenvolvimento**.
- As dependências `node_modules` também são excluídas: instale-as com `npm install` na nova pasta.

## Recuperar a instalação já extraída (Windows PowerShell 5.1)

Copie `PROATIVA_2_0_V3_3_1_CORRECAO_MIGRATIONS.zip` para sua pasta Downloads e ajuste o caminho do ZIP, se necessário:

```powershell
$novo = 'D:\SISCAPRO\Siscapro\PROATIVA_SISCAPRO_V3_3_1'
$antigo = 'D:\SISCAPRO\Siscapro\PROATIVA_SISCAPRO_V3_3_0'
$patch = Join-Path $env:USERPROFILE 'Downloads\PROATIVA_2_0_V3_3_1_CORRECAO_MIGRATIONS.zip'

Expand-Archive -LiteralPath $patch -DestinationPath $novo -Force
Copy-Item -LiteralPath (Join-Path $antigo '.env.development') -Destination (Join-Path $novo '.env.development') -ErrorAction Stop
Set-Location $novo
npm install
node .\qa\import-express.test.mjs
```

Só prossiga se os testes forem aprovados, a conexão de destino estiver correta e existir backup atualizado do banco:

```powershell
npm run db:migrate:dev
npm run db:generate
npm run build -w @proativa/api
npm run build -w @proativa/web
```

Não execute `prisma migrate reset`, não execute `docker compose down -v` e não crie um segundo banco sem necessidade.
O nome correto do workspace web é `@proativa/web`; um `.sha256` é apenas um arquivo de verificação de integridade, não um workspace npm.

## Verificação de conteúdo

A pasta `apps/api/prisma/migrations` deve ter 15 arquivos `migration.sql` e o arquivo `migration_lock.toml`.
