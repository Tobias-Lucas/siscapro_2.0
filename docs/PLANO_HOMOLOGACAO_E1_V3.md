# Homologação obrigatória E1 — Proativa 2.0 V3

**Meta:** equivalência funcional com o PHP SISCAPRO de produção, mantida a modernização de arquitetura. **Status atual:** não comprovada. A matriz original tem 199 itens pendentes de homologação; telas e endpoints não substituem teste de regra de negócio.

## Fases

1. **Build e estrutura:** `docker compose config -q`, build de API/Web, migração, inicialização e health. Executar `npx prisma validate` no ambiente de build e `npx tsc -p tsconfig.build.json` da API; `npm run build` do web.
2. **IAM:** criar conta com template de somente consulta, confirmar bloqueio de POST/PATCH/DELETE diretamente na API; testar negação individual, template desativado, desativação de usuário, tentativa de elevação de privilégio, e bloqueio UNIT/OWN.
3. **Integridade relacional:** carga local anonimizada, relatório de 13 relações, comparação com a matriz da validação; 539 matrículas sem contrato e demais pendências históricas devem permanecer preservadas.
4. **Cinco portais:** autenticar separadamente, criar cenários básicos e confirmar que a autorização de um usuário não permite dados de outro.
5. **Secretaria:** aluno -> matrícula -> turma -> curso compartilhado, frequência, notas, calendário e professores; validar casos com curso ausente/associação opcional.
6. **Contratos e financeiro:** contratos ativos/suspensos/encerrados, aditivos, parcelas, baixas parciais, inadimplência e relatórios; confirmar fórmulas com PHP original.
7. **Triagem, estágio e atendimento:** fluxos completos de seleção, supervisão, requerimentos e históricos com evidências do código legado.
8. **Documentos/PDFs:** somente metadados e telas permitidos; **arquivos originais fora do escopo desta versão**.
9. **Regressão e volume:** testar mais de uma turma por curso e várias modalidades por aluno; paginar >100 registros; medir memória, CPU, consulta e volume de staging.

## Critério de aceite

Não declarar E1 concluído até que **cada requisito** em `qa/MATRIZ_PARIDADE_E1.csv` tenha teste, evidência de execução, resultado e aprovação do responsável. Registros com divergência devem ter regra de transformação definida, não correção silenciosa. Modificações na V3 mantêm responsabilidade de regressão em todos os módulos integrados.
