# Regras de negócio confirmadas / estruturais

1. `curso_appa` no legado representa o cadastro de cursos; `curso` é operacionalmente uma turma.
2. `montar_turma` vincula aluno, turma, curso, contrato e empresa.
3. `frequencia_master` registra frequência por aula/aluno/turma e deve preservar justificativas/rastreabilidade.
4. Uma pessoa pode possuir múltiplos vínculos/matrículas sem duplicação de identidade.
5. A migração do legado não deve substituir IDs internos do novo sistema; use `LegacyMapping`.
6. Enquanto o legado for fonte oficial de uma entidade, o novo sistema não deve sobrescrever silenciosamente o dado de origem.
7. Usuários importados com hash MD5 devem migrar para Argon2id no primeiro login válido.
8. A conta inicial Aitinet é local e não possui `legacyId`.
9. Operações sensíveis devem registrar autor, data e contexto em auditoria.
10. Regras descobertas no legado somente entram como confirmadas quando houver evidência em código, banco ou homologação.


## V1.2 — regras extraídas do PHP original

- `proativa/mt-5.php` relaciona aluno, curso e turma por meio de `montar_turma`; períodos da lista de presença não devem ser confundidos com o período contratual.
- `instrutor/app/turmasLancarFrequencia.php` compara enturmação, período vigente, cancelamento (`ctt_alu_canc_motivo`) e cobrança (`ctt_alu_cobranca`). É necessário validar a regra completa antes de tornar registros importados ativos na chamada.
- `frequencia_master` usa os códigos `P`, `F`, `FJ` e uma referência à data de aula, preservados na V1.2.
- `disciplinas` e `disciplinas_vinculos_prof` são cadastros efetivos do sistema; não implementar automaticamente uma grade semestral nova como substituta destes registros.
- A tabela `calendario_10_porcento` e o código curricular `MI10` comprovam que o legado contém lógica de 10%. Não aplicar automaticamente 15% como se fosse a mesma regra.
