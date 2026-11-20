# PROATIVA 2.0 — Importação incremental do SQL original (V3.3, atualização focalizada)

## Escopo entregue

Esta atualização modifica SOMENTE o importador da V3.3 e seus controles no painel **Administração > Importação de dados**. API, React, PostgreSQL de desenvolvimento e Docker existentes permanecem como antes. A migration `202611180001_incremental_original_import` é **aditiva** e não elimina contas ou registros existentes.

- Pré-validação de SQL original `.sql`/`.sql.gz` em streaming, com quantidade de bytes examinados e rejeição de instruções sem suporte; nenhum SQL sensível é mostrado em logs.
- Restauração incremental em blocos de até aproximadamente 8 MiB **sem fragmentar instruções SQL**. Instruções maiores são executadas como uma única unidade (limite de segurança de 192 MiB por instrução).
- Checkpoint de cada bloco confirmado no MariaDB isolado (`__proativa_import_commits`) e espelhado no PostgreSQL (`LegacyImportChunkCheckpoint`). Para dados InnoDB, o checkpoint MariaDB é gravado na mesma transação dos INSERTs.
- Retomada que verifica checksum dos blocos já confirmados; não reenfileira `INSERTs` bem-sucedidos. Blocos DDL não são transacionais no MariaDB; se houver interrupção entre a execução do DDL e seu checkpoint, uma intervenção pode ser necessária.
- Tabelas legadas com engine não transacional são convertidas **somente na cópia MariaDB descartável de importação** para InnoDB, antes da carga das linhas, a fim de oferecer blocos transacionais. O banco original do SISCAPRO não é conectado nem modificado.
- Staging em grupos de 250 linhas com `LegacyRawRow` e checkpoint no mesmo commit PostgreSQL, por tabela. Tabelas sem transformador recebem resultado explícito `NO_TRANSFORMER`; falhas ficam registradas por tabela.
- Botões Pausar, Cancelar, Retomar e Recuperar execução interrompida; heartbeat, identificação da tabela e histórico dos blocos na interface. Pausar/cancelar encerra **depois do bloco atual**, não instantaneamente.
- Promoção opcional e controlada dos mesmos sete transformadores já implementados (Alunos, Empresas, Cursos, Turmas, Disciplinas, Matrículas, Frequências) em grupos de 50 registros com checkpoints e retomada.
- O SQL ORIGINAL continua armazenado em `.local-private-imports` após o staging, para permitir retomada. Proteja, faça backup e limpe-o apenas por decisão administrativa após homologação.

## Limitações e restrições importantes

1. **Não foi testado com o SQL original de ~988 MB**: execute testes primeiro com uma amostra autorizada em máquina local protegida. Um banco real e o Docker com PostgreSQL/MariaDB são necessários para homologação.
2. A validação de sintaxe suporta dumps simples do MariaDB/`mysqldump`/phpMyAdmin. `DELIMITER`, procedures, triggers, SQL entre múltiplos schemas e instruções desconhecidas são bloqueadas no preflight com códigos de erro, **sem executar parcialmente o SQL**. VIEWS são ignoradas porque não contêm as linhas das tabelas físicas. Um dump que utilize instruções não suportadas precisará de adaptador específico.
3. Não é uma conversão integral das 167 tabelas legadas para entidades de negócio: somente sete possuem transformadores operacionais. Os demais dados são preservados no staging e relacionados em relatório com o motivo `TRANSFORMER_NOT_AVAILABLE`.
4. NÃO são importados usuários/senhas/hashes antigos, PDFs ou documentos binários removidos do pacote legado. Nunca habilite isso por atalho.
5. A importação é **somente local** e exige Super Admin, `LOCAL_SQL_IMPORT_ENABLED=true`, PostgreSQL em loopback e MariaDB isolado. Não exponha portas, `.env` ou dumps à internet.
6. Quando um lote antigo já tenha registros parciais no staging **sem checkpoints**, o novo worker o bloqueará (`OLD_STAGING_WITHOUT_CHECKPOINTS`) para evitar contagem dupla ou sobrescrita silenciosa. Preserve esse lote e inicie outro com os mesmos dados, sem excluir o anterior.
7. Um worker antigo V3.3 que já estiver executando não recebe comandos cooperativos de pausa retroativamente. Finalize-o antes de instalar a atualização. Nunca mate processos indiscriminadamente e nunca execute `docker compose down -v`.

## Como atualizar a pasta existente no Windows (PowerShell 5.1)

1. Se há importação antiga ativa, aguarde seu término ou identifique e interrompa **somente o worker antigo**, confirmando que não há processo de importação em andamento. Verifique processos antes:

   ```powershell
   Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'original-import\.worker\.mjs' } | Select-Object ProcessId, Name
   ```

   Se `import-worker.lock` permanecer de uma execução antiga, só remova após verificar que nenhum worker antigo permanece ativo. O novo worker usa trava advisory no PostgreSQL.

2. Interrompa API e frontend com `Ctrl+C`. Faça backup do PostgreSQL de desenvolvimento e dos arquivos que serão substituídos (incluindo `apps/api/prisma/schema.prisma` e `staging.controller.ts`). **Não substitua a pasta completa nem copie `.env` de outro ambiente**.

3. Extraia o ZIP do HOTFIX diretamente na raiz `D:\SISCAPRO\Siscapro\PROATIVA_SISCAPRO_V3_3_0` (preservar estrutura de pastas). Nenhum arquivo de credencial acompanha o ZIP.

4. Na pasta do projeto, execute:

   ```powershell
   node .\scripts\verify-import-incremental.mjs
   npm run db:generate
   npm run db:validate
   npm run build -w @proativa/api
   npm run build -w @proativa/web
   npm run db:migrate:dev
   ```

   A migration altera o schema do PostgreSQL; garanta backup **antes** de `db:migrate:dev`. Os comandos de build não testam a restauração.

5. Verifique a rede e os limites do banco isolado e inicie API/frontend:

   ```powershell
   docker compose -f docker-compose.import.yml --env-file .env.development up -d mariadb-import mariadb-loopback
   npm run dev:api
   ```

   Em outro terminal: `npm run dev:web`.

6. Acesse **Administração > Importação de dados**, escolha o lote SQL e clique em **Analisar e preservar no staging**. Para lotes antigos `RUNNING` abandonados e sem heartbeat, use **Recuperar worker interrompido** após confirmar que não existe processo antigo. Observe o progresso; para interromper, clique em **Pausar após bloco** e só depois use **Retomar pelos checkpoints**.

7. Após status **STAGED**, confira tabelas sem transformador, falhas e exporte o CSV. Só clique em **Transformar dados mapeados** depois de confirmar backup e os sete mapeamentos disponíveis.

## Verificação sem dados reais

`node scripts/verify-import-incremental.mjs` executa testes estáticos e um parser com SQL sintético. `node scripts/verify-v3-3.mjs` preserva as verificações da versão. Estes testes **não substituem** o teste real com Docker e importação de amostra, nem a homologação da equivalência com o SISCAPRO.

## Códigos operacionais de proteção

- `UNSUPPORTED_DELIMITER`, `UNSUPPORTED_SQL_ROUTINE`, `CROSS_SCHEMA_REFERENCE`: o SQL contém construções não suportadas pelo importador seguro.
- `SQL_NOT_UTF8`, `OVERSIZE_SQL_STATEMENT`: a codificação ou o tamanho do comando ultrapassou o limite de segurança.
- `OLD_STAGING_WITHOUT_CHECKPOINTS`: lote antigo com linhas parciais sem ponto seguro de retomada; preservar lote e usar novo.
- `RESTORE_CHECKPOINT_DATABASE_MISSING`: a base MariaDB temporária foi removida/substituída e não corresponde aos checkpoints preservados.
- `RESTORE_CHUNK_CHECKSUM_MISMATCH`: a sequência do SQL não corresponde aos blocos previamente confirmados.
- `TEMP_ENGINE_NORMALIZATION_FAILED`: a tabela temporária não pôde ser convertida para InnoDB para restauração transacional.
- `IMPORT_WORKER_ALREADY_RUNNING`: outro worker já detém a trava; aguarde e confira heartbeat.

Logs não incluem texto SQL nem valores pessoais. Consulte a tabela atual, código do erro, checkpoints e tabela de resultados da interface.
