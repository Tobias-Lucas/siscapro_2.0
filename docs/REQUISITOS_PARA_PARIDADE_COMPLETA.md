# Insumos pendentes para paridade funcional completa — atualização V1.2

**O código PHP original já foi recebido e parcialmente analisado** e não precisa ser enviado novamente. O inventário das 2.202 fontes está em `legacy/inventario_fonte_php_v1_2.csv`. O PHP, sozinho, não comprova a operação e a equivalência do novo sistema.

## O que permanece necessário

1. Banco MariaDB **de homologação**, preferencialmente com dados anonimizados, para testar importação, vínculos, estados e relatórios (nunca escrever no banco oficial).
2. Acesso demonstrativo com contas de teste representativas dos cinco portais (incluindo níveis e permissões reais) ou gravações dos fluxos completos.
3. Modelos e exemplos anonimizados de documentos, PDFs, calendários, cobrança/nota fiscal, requerimentos, relatórios e processos de matrícula.
4. Avaliação por responsável da Secretaria, Contratos, Financeiro, Facilitadores, Empresas e Supervisores para validar **equivalência** com o PHP atual.
5. Homologação da portabilidade de arquivos anexos, banco, logs e dados históricos; validação de LGPD, perfis de acesso, backups e contingência.
6. Servidor de CI ou homologação com npm/Docker/PostgreSQL para `npm install`, `prisma generate`, migrations, build e testes e2e.

**Próxima decisão:** concluir fluxos e dados de `contrato_aluno`/`contrato_empresa` e portais antes de ativar uma migração contratual em produção.
