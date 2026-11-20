# Mapeamento legado inicial

| Legado MariaDB | Domínio novo | Observação |
|---|---|---|
| `user_sistema` | `User` | usuários administrativos; senha legado com 32 chars indica MD5 |
| `alunos` | `Person` + `User`/vínculos | cadastro de aluno e credenciais do portal |
| `empresas` | `Company` | empresa e credenciais empresariais existentes |
| `curso_appa` | `Course` | catálogo de cursos |
| `curso` | `ClassGroup` | cadastro operacional de turmas |
| `montar_turma` | `Enrollment` | vínculo aluno ↔ turma/curso/contrato/empresa |
| `frequencia_master` | `Attendance` | frequência por aula/aluno |
| `notas` | `Grade` | avaliações/notas |
| `contrato_aluno` | `Contract` | contratos de aprendizagem/estágio |
| `facilitador` | `User` + pessoa docente | portal Facilitador/Professor |
| `estagio_supervisores` | `User` + supervisor | portal Supervisor |
| `vaga_site` | `Vacancy` | vagas publicadas |
| `requerimento` | `ServiceRequest` | solicitações/requerimentos |
| `boletos_alunos` / `boletos_nfs_empresas` | `FinancialTitle` | títulos financeiros |
| `historico_pgto_*` | `Payment` | histórico de pagamentos |

A camada `legacy` deve isolar SQL legado e converter os registros para DTOs de domínio. Não espalhar nomes de colunas PHP/MariaDB nos outros módulos.
