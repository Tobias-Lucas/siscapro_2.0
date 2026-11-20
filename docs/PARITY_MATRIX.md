# Matriz de paridade SISCAPRO V1.2 (ainda não homologada)

**Fonte:** código PHP original disponibilizado, dump estrutural MariaDB, código V1.1 e alterações V1.2. A inspeção de trechos específicos não representa teste de ponta a ponta ou paridade total. O inventário fonte completo está em `legacy/inventario_fonte_php_v1_2.csv`.

| Fluxo/tabelas do original | Estado V1.2 | Evidência de implementação | Pendências reais |
|---|---|---|---|
| Login interno `user_sistema` | Parcial | Login local, importação de hash em modo restrito | Níveis, permissões, permissões por tela, bloqueios e contas externas |
| Alunos `alunos` | Parcial | CRUD básico, sincronização por cursor | Campos completos, fotos e documentos, processos específicos |
| Empresas `empresas` | Parcial | CRUD básico, sincronização por cursor | Grupos, CNPJs, regras de contrato/faturamento, portal |
| Cursos `curso_appa` | Parcial | CRUD, carga teórica/prática original e códigos adicionais | Segmentos, módulos, CBO, ementas, parametrizações |
| Turmas `curso` | Parcial | CRUD, tipos e códigos, importação e relação com curso | Regras de mudança, localização, cronogramas reais |
| Disciplinas `disciplinas` | **Novo, parcial** | API, tela, sincronização por cursor, parte original e carga | Validações do cadastro PHP e relatórios |
| Facilitador/disciplina `disciplinas_vinculos_prof` | **Novo, parcial** | API, vínculo/desvínculo, sincronização | Permissões de associação, regras específicas |
| Horários `curso_horarios` | **Novo, parcial** | API, tela e importação | Interpretação dos campos `combo`, alterações e conflitos |
| Dias de aula `curso_dias_aulas` | **Novo, parcial** | API, tela e importação | Calendários alternativos `curso_dia_hora_aula`, `data_aula` |
| Facilitador/turma `facilitador_turma` | Parcial ampliado | API, tela, importação e restrição no portal docente | Escala de substituições, validação de data |
| Matrículas `montar_turma` | **Novo, parcial** | Importação com datas da lista e aprovação manual | Regras de ativação/cancelamento contratual e transferências |
| Frequência `frequencia_master` | **Novo, parcial** | Importação e preservação de P/F/FJ e histórico por linha | Relatórios, justificativas, retificações e fluxo completo |
| Contratos `contrato_aluno`, `contrato_empresa` | Base | Registros simplificados no novo banco | Emissão, aditivo, assinatura, suspensão, encerramento, calendário |
| Estágio/supervisão | Base | Entidade e portal de consulta simplificados | Férias/recesso, TCE, avaliação, documentos, supervisão |
| Seleção e vagas | Base | CRUD de vagas e candidaturas | Regras e jornadas específicas do sistema atual |
| Requerimentos/atendimento | Base | Solicitação e acompanhamento genéricos | Modelos, autorizações, documentos e emissão |
| Financeiro | Base | Títulos e pagamentos parciais | Emissão real, cobrança por empresa, boletos, NF, conciliação |
| AVA / portais externos | Base | Consultas resumidas no portal moderno | Formulários, materiais, notas, documentos e relatórios específicos |
| PDFs e documentos | Pendente | Metadados armazenáveis | Arquivos, templates, emissão oficial, assinatura, armazenamento |
| Calendário automático / WhatsApp | **Escopo futuro** | Ainda não implementado | Iniciar somente após a cópia funcional atual |

**Critério de aceite de paridade:** comparar cada rota e ação do PHP original, validar dados anonimizados, testar exceções, confirmar permissões com responsáveis, migrar arquivos históricos e obter homologação por área. Nenhuma linha desta matriz equivale à aprovação de produção.
