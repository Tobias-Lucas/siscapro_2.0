# Leitura do código original do SISCAPRO — referência de paridade

## Material inspecionado

O pacote `Siscapro.zip` recebido contém **6.333 entradas**, das quais **2.202 são arquivos `.php`** e **795 são arquivos `.pdf`**. O dump estrutural MariaDB incluído na base modernizada possui **167 tabelas físicas e uma view** (`vw_meses`, com `CREATE TABLE` provisório de view no dump).

O inventário está em `legacy/inventario_fonte_php_v1_2.csv`: cada registro contém portal, caminho relativo, categoria heurística, indícios de operações de banco, tabelas mencionadas e checksum. **Não é uma certificação de paridade**. Não copia o PHP original nem documentos/credenciais.

| Portal / área | Arquivos PHP no pacote (inclui bibliotecas e includes) | Evidências de fluxo identificadas |
|---|---:|---|
| Administrativo (`proativa/`, exceto aluno e supervisor) | 1.036 | Cadastro, matrícula, grade, contratos, financeiro, relatórios, atendimento, AVA |
| Aluno (`proativa/aluno/`) | 340 | Área do aluno, solicitações, dados, documentos, AVA |
| Supervisor de Estágio (`proativa/supervisor/`) | 269 | Gestão de supervisão, estágios e documentos |
| Empresa (`empresa/`) | 229 | Aprendizes, estagiários, faturas, vagas, relatórios e supervisão |
| Facilitador (`instrutor/`) | 202 | Turmas, frequência, relatórios de aluno, notas e atendimento |
| Bibliotecas compartilhadas / raiz | 126 | Infraestrutura e bibliotecas |

## Fluxos confirmados no código (não suposições)

### Turmas, matrículas e cursos
- `proativa/painel/turmas/cadastro_turma.php` consulta `curso_appa` para construir o cadastro de turmas (`curso`).
- `proativa/mt-5.php` cadastra a enturmação em `montar_turma`, associando aluno, turma, curso, empresa, retorno e períodos. A mesma tabela contém `freq_id_contrato` e `freq_dt_listar_nome_ini/fim`, relevantes para a chamada.
- `proativa/painel/cursos/cadHorarios.php` trabalha com `curso_horarios` (turnos e horários do curso).
- O esquema também possui `curso_dias_aulas` e `curso_dia_hora_aula`; estas **não podem ser tratadas como tabelas idênticas**.

### Disciplinas e facilitadores
- `proativa/pedagogico/gradeCurricularCurso.php` administra `disciplinas` com `disc_parte` (`MB`, `MI10`, `ME2`), `disc_id_curso`, `disc_mod_curso`, `disc_ch` e período.
- `proativa/pedagogico/vincularDisciplinaAoProfessor.php` consulta disciplinas específicas e cursos.
- `disciplinas_vinculos_prof` liga professor, curso e disciplina.
- `facilitador_turma` liga o facilitador à turma, independentemente do vínculo com uma disciplina.

### Frequência
- `instrutor/app/turmasLancarFrequencia.php` usa `montar_turma`, `contrato_aluno` e `alunos` para definir o conjunto de nomes disponíveis para chamada.
- A filtragem da chamada considera a janela `freq_dt_listar_nome_ini/fim`, `ctt_alu_canc_motivo = 0` e `ctt_alu_cobranca = 1`, entre outras condições. O novo sistema **não deve equivaler isso apenas a matrícula ativa**.
- `frequencia_master` armazena a data, aluno, turma, curso, empresa, `freq_pf`, justificativa e responsável; o código apresenta valores `P`, `F` e `FJ`.
- A V1.2 importa estes registros, mas não reproduz ainda todos os relatórios, estornos, retificações e regras de elegibilidade do original.

### Contratos e Financeiro
- `contrato_aluno` possui dados de contratação, suspensão, cancelamento, jornada, estágio, férias, documentos, cobrança e desligamento. A nova tabela `Contract` não reproduz ainda seus 87 campos.
- Os diretórios `proativa/emissaoContrato/` e `proativa/financeiro/` contêm dezenas de páginas e rotinas, com emissão de documentos e cobrança individual/empresarial que ainda exigem mapeamento tela a tela.

## Decisões técnicas

1. O sistema original continua como referência para fluxo, permissões, validações, consultas, arquivos e geração de PDFs.
2. Não implantar diretamente o código PHP original no mesmo contêiner da nova aplicação. Há muitas chamadas `mysql_*` antigas, bibliotecas e configurações históricas; uma execução não auditada pode introduzir falhas e exposição de dados.
3. Não incluir o ZIP original nem PDFs, logs ou configurações reais no novo artefato. Conectividade permitida apenas a réplica/usuário MariaDB de leitura.
4. Cadastros e relacionamentos portados precisam passar por comparação operacional com a versão em uso antes de declarar equivalência.
5. As regras `MI10` / `calendario_10_porcento` representam implementação existente; a eventual mudança para 15% faz parte das novas automações e exigirá validação específica, não deve ser aplicada à cópia.

## Próximos fluxos de maior prioridade

A) Contratos e calendário do aprendiz (`contrato_aluno`, `calendario_10_porcento`, emissões e aditivos).

B) Matrículas e elegibilidade da frequência (regras de cobrança, cancelamento e período de turma) + importação relacional histórica completa.

C) Financeiro do Preparatório e faturamento empresarial (boletos, notas, cobranças, conciliação).

D) Portais Aluno, Empresa, Facilitador e Supervisor, incluindo relatórios, atendimentos, avaliações, anexos e permissões originais.

A prioridade é **equivalência funcional antes da automatização do cronograma**.
