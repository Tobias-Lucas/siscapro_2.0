# Arquitetura V2.0

- **Web:** React 19 + TypeScript + Vite, com Nginx fazendo proxy HTTP para `/api`.
- **API:** NestJS 12 + TypeScript, autenticação por cookie HttpOnly com JWT, validação de origem para escritas, autorização por domínio, auditoria.
- **Banco oficial da nova plataforma:** PostgreSQL 17, Prisma 7, migrations versionadas (24 modelos V1.2 + 36 modelos E1).
- **Redis:** instância privada para filas e processamento futuro; não usada para declarar automações ainda inexistentes.
- **Documentos:** metadados no PostgreSQL e arquivos em volume Docker privado (`proativa_documents`).
- **MariaDB legado:** conector isolado (`LEGACY_ENABLED=false` por padrão), sem APIs de gravação. IDs legados armazenados em `LegacyMapping`.

## Núcleos de dados

Identidade; Pessoas; Empresas; Acadêmico; Contratos; Estágio; Financeiro; Recrutamento; Atendimento; Documentos; Integração; Comunicação e auditoria. O catálogo de 36 novas entidades está em `docs/E1_CATALOG.json`. O banco não espelha a estrutura de 167 tabelas antigas; utiliza vínculos explícitos.

## Semântica de curso/turma

Legado `curso_appa` = curso; `curso` = turma; `montar_turma` = vínculo de aluno à turma. A V2 separa Curso, ClassGroup, Enrollment, CurriculumMatrix, CurriculumModule e AcademicLesson. E2 adicionará o planejamento e o gerador automático — não implementados agora.

## Limites declarados

Esta versão fornece arquitetura local e ações operacionais úteis para teste; paridade com as 199 funções requer homologação. Não foi conectada à produção, nem recebeu dados reais.
