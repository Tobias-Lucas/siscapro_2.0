# Preparação do cronograma semanal

## Escopo da V2.2.0

A V2.2.0 **não gera, valida nem publica cronogramas automaticamente**. Ela organiza a navegação e acrescenta a fundação de dados para que a automação futura não precise ser improvisada sobre campos livres.

## Referências analisadas

A imagem do quadro atual mostra uma leitura semanal por ambiente/sala, com turnos Manhã e Tarde, dias da semana e células com atividades, turmas/módulos e facilitadores.

A planilha `CRONOGRAMA 2° SEMESTRE 2026.ods` contém abas de Cursos, Ementas e Facilitadores e quadros separados por dia e turno. Ela apresenta matrizes de 16 e 24 meses e regras específicas de retorno em semanas do mês, incluindo cursos de 23 meses com retorno na 1ª e 5ª semana, padrões 1ª/3ª/5ª, 2ª/4ª e regras próprias por curso. Há também atividades especiais, como semanas temáticas. Portanto, o modelo futuro precisa permitir leitura por ambiente e por turma, além de regras recorrentes que não sejam simplesmente “toda semana”.

## Insumos que o sistema precisa suportar

- Curso e matriz curricular vigente, com duração em meses, versão, vigência e carga horária total.
- Ementas e módulos em sequência, com carga horária, quantidade de aulas e classificação básica/profissionalizante.
- Turmas, unidade, sala/ambiente, turno e período.
- Facilitadores, formação, disciplinas habilitadas e disponibilidade por dia da semana, turno e faixa horária.
- Regras recorrentes por dia/horário, com padrões como toda semana, 23 meses com retorno na 1ª/5ª semana, 1ª/3ª/5ª, 2ª/4ª e semanas personalizadas.
- Feriados institucionais ou por unidade, atividades especiais, substituições e reposições.

## Estruturas modeladas na V2.2.0

- `CurriculumMatrix.durationMonths` e `totalWorkload`: duração e carga horária da matriz; `CurriculumModule`: sequência, carga horária e quantidade de aulas por módulo.
- `ClassGroup` e `Classroom`: turma, unidade, sala, capacidade e período. Os campos de sala em texto livre do legado continuam preservados para compatibilidade.
- `Discipline`, `DisciplineTeacher` e `TeacherAssignment`: disciplinas e vínculos de facilitadores.
- `TeacherAvailability`: disponibilidade por dia da semana, turno e faixa horária.
- `CourseHours` e `CourseTeachingDays`: horários e dias configurados por curso.
- `ScheduleTemplate`: modelo de planejamento para um período/semestre.
- `ScheduleRule`: turma, módulo/atividade, facilitador, sala, dia, faixa horária e padrão de semanas. `weekNumbers` permite registrar semanas específicas.
- `Holiday`: feriados.
- `AcademicLesson`: aula individual planejada, com data, turno, sala, facilitador, módulo, disciplina e situação.
- `ScheduleGenerationRun` e `ScheduleConflict`: trilha futura de execução, conflitos identificados e resolução manual.

## Fases futuras

1. Configurar o planejamento semestral a partir de cursos, matrizes, ementas, módulos e carga horária.
2. Registrar recursos e disponibilidades: facilitadores, disciplinas, salas, unidades, turnos e horários.
3. Expandir regras recorrentes para aulas individuais, respeitando padrões de semanas, feriados e exceções por curso.
4. Validar conflitos de turma, facilitador e sala; permitir correção/substituição manual.
5. Publicar o cronograma por turma e por ambiente, mantendo versões e histórico auditável.

A página Planejamento do cronograma é informativa nesta versão. Não existem ações fictícias de geração/publicação, e nenhuma regra automática é executada.
