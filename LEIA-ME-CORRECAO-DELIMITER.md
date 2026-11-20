# PROATIVA 2.0 V3.3.1 - Correcao de rotinas SQL com DELIMITER

## Problema corrigido

O leitor anterior interrompia a importacao com `UNSUPPORTED_DELIMITER`, comum em exports MariaDB que incluem procedimentos, gatilhos, funcoes e eventos.

## Comportamento

- Reconhece os separadores `DELIMITER $$`, `DELIMITER ;;`, `DELIMITER //` e o retorno a `DELIMITER ;`.
- Pula somente definicoes de rotinas legadas e comandos de sessao dentro dos blocos com separador especial; preserva as instrucoes de tabelas e registros.
- Rejeita comandos de insercao indevidamente encapsulados num separador personalizado para evitar perda silenciosa de dados.
- Mantem os checkpoints e os arquivos privados existentes. Nao possui migration.
- Registra em evento a quantidade de definicoes de rotinas ignoradas quando a restauracao chega ao fim.

## Instalar

1. Encerre a API da V3.3.1 usando Ctrl+C. Nao interrompa um worker ativo; este hotfix se destina ao lote com estado FAILED.
2. Faca backup dos dois arquivos de codigo que serao substituidos:

```powershell
cd D:\SISCAPRO\Siscapro\PROATIVA_SISCAPRO_V3_3_1
Copy-Item .\apps\api\src\staging\sql-statement-stream.mjs .\apps\api\src\staging\sql-statement-stream.mjs.bak -Force
Copy-Item .\apps\api\src\staging\original-import.worker.mjs .\apps\api\src\staging\original-import.worker.mjs.bak -Force
```

3. Extraia o ZIP deste hotfix dentro da pasta `PROATIVA_SISCAPRO_V3_3_1`, substituindo os arquivos homonimos.
4. Verifique:

```powershell
node qa\import-express.test.mjs
node scripts\verify-import-incremental.mjs
node --test qa\import-incremental-lexer.test.mjs
```

5. Reinicie a API:

```powershell
npm run dev:api
```

6. Na tela Importacao de dados, selecione o mesmo lote interrompido, clique **Retomar importacao** e acompanhe os blocos.

## Limites da verificacao

A correcao foi testada com SQL sintetico, inclusive definicoes condicionais de gatilhos. Nao foi executada no arquivo original de aproximadamente 988 MB nem no seu MariaDB local. Se outro erro ocorrer, registre apenas seu codigo e etapa, sem enviar dados pessoais.
