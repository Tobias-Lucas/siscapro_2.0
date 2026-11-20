# PROATIVA 2.0 V3.3.1 — Importação prioritária para demonstração

**Referência:** 18/11/2026. **Demonstração prevista:** 19/11/2026.

## Objetivo e alcance

Esta atualização contém uma melhoria **específica do importador do SISCAPRO e de sua interface de acompanhamento**. O sistema existente é preservado; não são adicionados nesta entrega os 41 itens críticos de paridade de outros módulos nem os geradores completos de contratos/documentos. Esses requisitos permanecem no parecer e na matriz de pendências.

### O que muda

1. **Importação prioritária (recomendada para a reunião):** seleciona a restauração de `alunos`, `empresas`, `curso_appa`, `curso`, `disciplinas`, `montar_turma` e `frequencia_master`, tabelas com transformadores já existentes. As demais instruções SQL são **lidas e descartadas desta execução prioritária**, sem escrever os respectivos dados no MariaDB temporário. O arquivo original continua guardado. Não se trata de migração integral.
2. **Importação completa:** preserva a possibilidade anterior de restaurar e copiar todas as tabelas elegíveis, incluindo tabelas que ainda não têm transformador operacional.
3. **Uma varredura do dump na restauração:** a validação sintática acontece enquanto o arquivo é lido e restaurado. Foi removida a primeira passagem integral obrigatória de preflight. Isso reduz trabalho de I/O, mas erros de formato podem ser detectados após blocos anteriores já terem sido concluídos.
4. **Barra de leitura:** exibe bytes efetivamente percorridos do SQL e porcentagem para arquivos `.sql`; para `.sql.gz` mostra volume lido, sem uma porcentagem potencialmente enganosa.
5. **Logs persistentes:** evento, horário, fase, tabela e nível; atualização automática da interface a cada 2,5 segundos. Não contêm valores de pessoas, documentos ou instruções SQL.
6. **Retomada:** conserva checkpoints do importador anterior e pedidos de pausa/cancelamento entre blocos. A mudança de escopo de um lote com checkpoints é impedida.
7. **Reutilização do arquivo privado:** é possível criar um lote novo prioritário ou completo a partir de um lote anterior que não esteja em execução, sem novo upload de aproximadamente 988 MiB. Primeiro é tentado um hard link local; se indisponível, o arquivo é copiado de forma assíncrona.
8. **Status honesto:** `STAGED_PRIORITY` identifica preparo das sete entidades, diferente de `STAGED` completo. A transformação continua precisando de confirmação explícita de backup.

## Instalação rápida na pasta atual

**Não reinicie nem substitua arquivos com um worker ativo.** A pausa da versão anterior pode não ser cooperativa. Aguarde o encerramento ou verifique o processo antes de interrompê-lo. Não apague SQL, PostgreSQL nem volumes Docker.

### 1. Backup

Faça um backup verificável do PostgreSQL de desenvolvimento e uma cópia dos arquivos que serão substituídos. A restauração anterior do MariaDB temporário pode ser descartada somente por um novo lote; o banco operacional não deve ser resetado.

### 2. Arquivos

Aplique o ZIP de hotfix **sobre a pasta atual** `D:\SISCAPRO\Siscapro\PROATIVA_SISCAPRO_V3_3_0`. Ele inclui somente componentes de importação, esquema Prisma, migration, testes e esta documentação. Não substitui o arquivo `.env.development`, o SQL privado nem as credenciais. Não é necessário copiar o ZIP completo do projeto se a instalação atual está funcionando.

### 3. Migration obrigatória

No PowerShell, a partir da pasta raiz:

```powershell
cd D:\SISCAPRO\Siscapro\PROATIVA_SISCAPRO_V3_3_0

Test-Path .\apps\api\prisma\migrations\202611180001_incremental_original_import\migration.sql
Test-Path .\apps\api\prisma\migrations\202611180002_express_import_events\migration.sql

npm run db:migrate:dev
npm run db:generate
```

Os dois `Test-Path` devem retornar `True`. A migration `202611180001` cria os checkpoints e corrige os erros **P2021/P2022**. A migration `202611180002` acrescenta escopo, contador de leitura e eventos. Ambas são aditivas. **Não execute `prisma migrate reset`**.

### 4. Verificações e inicialização

```powershell
node scripts/verify-import-incremental.mjs
node qa/import-express.test.mjs
node scripts/verify-v3-3.mjs

npm run build -w @proativa/api
npm run build -w @proativa/web

npm run dev:api
```

Deixe a API aberta. Em outro terminal:

```powershell
npm run dev:web
```

Se a API acusar novamente `Origin not allowed`, confirme no `.env.development` a configuração das duas origens locais, separadas por vírgula: `http://localhost:5173,http://127.0.0.1:5173`. Não exponha a API na internet para resolver CORS.

Se os containers de importação ainda não estão ativos:

```powershell
docker compose -f docker-compose.import.yml --env-file .env.development up -d mariadb-import mariadb-loopback
```

Não use `down -v`. Antes de processar, confirme que os containers estão saudáveis.

### 5. Demonstração sem enviar o SQL novamente

1. Abra **Administração → Importação de dados** e selecione um lote antigo, desde que não esteja processando e que o SQL privado ainda exista.
2. Clique em **Novo lote prioritário sem reenviar**.
3. Selecione o lote novo, confirme **Importação prioritária** e clique em **Iniciar importação**.
4. Acompanhe **SQL lido**, **tabela atual**, **blocos confirmados**, **última atividade** e **histórico**.
5. Ao obter **Cadastros prioritários preparados**, revise o relatório de tabelas/pendências. Com backup conferido, clique em **Transformar cadastros** para alimentar os módulos operacionais.
6. **Conferência obrigatória:** valide contagens de origem, staging, registros transformados e vínculos de pessoa/empresa/curso/turma/matrícula/frequência. Se houver falhas, elas devem ser mostradas, não ocultadas.

Depois da reunião, crie **Novo lote completo sem reenviar** para preservar as demais tabelas elegíveis. A próxima fase deve adicionar transformadores para contratos, financeiro, documentos (metadados) e outras entidades, de acordo com a matriz de paridade.

## Limitações conhecidas e segurança

- O processamento prioritário precisa percorrer o arquivo completo para encontrar instruções relevantes; pode levar tempo, dependendo do disco, do tamanho dos `INSERTs` e do conteúdo real. **Não há garantia de duração.**
- Para `.sql.gz`, a porcentagem total da leitura fica indeterminada sem uma varredura prévia, justamente para evitar trabalho redundante.
- A restauração usa somente o MariaDB isolado do Docker. O PostgreSQL operacional só recebe dados quando a transformação é confirmada.
- Um `INSERT` individual não é dividido em vários SQLs; se exceder o limite de pacote ou de memória, o erro será identificado. O ambiente de destino deve manter `max_allowed_packet=256 MiB` no MariaDB e no cliente compatível.
- Instruções SQL não suportadas ou cenários de retomada com DDL não transacional ainda podem precisar de intervenção técnica. Nunca recomece apagando volumes.
- Não são importadas senhas históricas nem PDFs binários antigos, e o upload novo de documentos continua funcionando independentemente desse acervo.
- Os 25 perfis de teste existentes não são recriados por este hotfix. Verifique a presença das contas antes de qualquer novo provisionamento.
- **Ainda não houve execução do dump real de quase 1 GiB no ambiente deste pacote.** Os testes são sintáticos, de seleção de escopo, leitura, telemetria e verificações estáticas. A homologação precisa ocorrer no seu Docker.

## Falhas a investigar antes da reunião

| Sintoma | Diagnóstico objetivo |
| --- | --- |
| `P2021` ou `P2022` no terminal | Migrations de checkpoint não aplicadas ao PostgreSQL usado pela API. |
| Erro 500 ao listar lotes | Verificar migration da tabela `LegacyImportEvent` e da coluna `restoreScannedBytes`. |
| Lote sem SQL privado | Upload de 100% pode ter falhado no registro; selecionar lote preservado ou reenviar. |
| Erro SQL `2006` | Verificar tamanho da instrução, limite de pacote, MariaDB e recursos do Docker. |
| Barra progride e staging permanece zero | Ainda está lendo/restaurando; staging só começa após a restauração das tabelas selecionadas. |
| Fase sem progresso e heartbeat recente | Processo pode estar tratando uma instrução SQL muito longa; observar logs. |
| Heartbeat antigo por mais de 2 minutos | Worker possivelmente interrompido; confirmar que não existe processo ativo antes de solicitar recuperação. |

**Cuidado:** não faça demonstração com documentos ou dados pessoais expostos em uma tela pública sem autorização. Use dados fictícios para apresentações abertas.

### Instalador opcional com backup dos arquivos

Se preferir não substituir manualmente os arquivos, extraia o hotfix em uma **pasta temporária** e execute o script a partir dela:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\instalar-hotfix-v3-3-1.ps1 -Destino "D:\SISCAPRO\Siscapro\PROATIVA_SISCAPRO_V3_3_0"
```

Ele cria cópia dos arquivos substituídos em `.local-backups`, não modifica o PostgreSQL e não altera os arquivos privados. **A API antiga precisa estar parada.** Depois, faça as migrations e os builds manualmente seguindo as instruções acima.
