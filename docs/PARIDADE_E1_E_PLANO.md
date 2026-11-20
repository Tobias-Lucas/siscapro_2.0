# Paridade E1 — plano de desenvolvimento e homologação

## Entradas consideradas

1. `PROATIVA - Mapeamento Funcional.pdf` — 199 funcionalidades codificadas, 5 áreas de acesso, categorias preservar/reorganizar/simplificar.
2. `PROATIVA - Estrutura Banco de Dados.pdf` — PostgreSQL independente, dados normalizados, 167 tabelas físicas e uma view no legado, estruturas E1 preparadas para E2–E7.
3. `Proativa - Backlog Historias Detalhadas(1).pdf` — 213 histórias, inventário, PoC de sincronização, transição com fonte de verdade controlada e homologação por jornada.
4. `sisc1207_siscapro(2).sql` — DDL MariaDB 10.11 sem dados de produção.
5. `Siscapro.zip` — fonte PHP original disponível na conversa, **não redistribuída neste pacote**.

## Equivalência não significa reprodução de nomes de tabelas

`curso_appa` no legado é curso, `curso` representa a turma, `montar_turma` representa enturmação; o novo modelo separa cursos, turmas, matrícula e vínculos. A frequência preserva `P`, `F`, `FJ` quando importada do PHP, mas falta auditar exceções específicas por modalidade.

As novas tabelas usam integridade referencial e chaves internas. `LegacyMapping` associa cada registro importado ao seu identificador de origem. A sincronização atual cobre apenas um subconjunto do legado; **não está validada para transferência integral**.

## Critérios de saída para uma E1 realmente completa

- Cada uma das 199 funcionalidades mapeadas tem procedimento acessível por perfil, regra técnica correspondente e teste executado; operações não mapeadas descobertas no PHP são adicionadas à matriz.
- Documentos originais, cálculos financeiros, datas e históricos são comparados em bases fictícias e representativas.
- PoC demonstra carga inicial, reprocessamento idempotente, alterações incrementais, marcação de exclusões/inativações, checkpoints e reconciliação.
- Bloqueios de acesso são testados diretamente na API, não apenas escondendo menus.
- Aceite formal por Secretaria, Contratos, Financeiro, Empresa, Aluno, Facilitador e Supervisores nos fluxos aplicáveis.
- Docker sobe e passa nos testes de saúde, acesso, cadastros e portais; backups, rollback e corte são ensaiados fora da produção.

## Limites da V2.0 local

- As 36 novas entidades e operações fornecem uma camada para prototipação e testes de usabilidade: **não equivalem** à implementação de todas as rotinas de negócio dos arquivos PHP.
- RA e TRE são registros de conteúdo, não modelos oficiais emitidos em PDF.
- `Invoice` é o registro interno de fatura; não há emissão fiscal/bancária.
- O sistema não gera automaticamente calendários semanais nem substitui o planejamento acadêmico atual.
- Documentos legados com caminho original somente podem ser baixados depois da transferência física/reconciliação dos arquivos.

## Próximos blocos de desenvolvimento — E1

1. Reproduzir relatórios, documentos e templates condicionais originais, com PDFs de referência anonimizados.
2. Concluir fluxos transversais e regras de transição de contrato, matrícula, estágio, preparação e cancelamento.
3. Completar serviços específicos da Secretaria e dos quatro portais, respeitando papéis individuais.
4. Homologar regras de cobrança, mensalidades e comprovantes, sem alterar valores ou condições durante o porte.
5. Completar ETL e sincronização dos registros históricos e anexos com reconciliação verificável.

**A V2.0 é uma base de desenvolvimento local consistente, não uma declaração de paridade integral.**
