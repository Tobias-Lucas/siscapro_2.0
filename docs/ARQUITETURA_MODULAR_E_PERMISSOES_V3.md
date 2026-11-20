# Arquitetura modular e política de autorização — V3

## Padrão arquitetural

Monólito modular: *apps/api/src* agrupa módulos NestJS `people`, `academic`, `contracts`, `finance`, `recruitment`, `service`, `internships`, `documents`, `users`, `legacy`, `staging`, `iam` e demais domínios. `operations/domains` contém os catálogos em arquivos separados por unidade funcional. *apps/web/src/modules* contém navegação, configuração de recursos, acesso, importação e vínculos de cursos; outros componentes da V2 seguem em transição para pastas de domínio. Prisma e autenticação são serviços transversais. **Este arranjo reduz dependência entre módulos, mas não garante isolamento total de deploy**, pois API e web ainda são dois artefatos compilados.

## Modelo de autorização

* `User.role`: papel legado para compatibilidade;
* `User.accessMode`: `LEGACY` ou `CUSTOM`;
* `AccessTemplate`: identificador, nome, descrição, ativo, número da versão;
* `AccessGrant`: código `modulo.recurso.acao`, escopo e eventual lista de campos;
* `AccessOverride`: concessão ou negação individual;
* autorização pela API `AuthGuard` seguida de `RolesGuard` e verificações por domínio.

Regras: SUPER_ADMIN bypass explícito; contas legadas continuam no fluxo de compatibilidade; modo CUSTOM começa sem direito algum; negação de exceção substitui concessão do template; recurso não mapeado é negado. Os escopos `UNIT` e `OWN` **existem apenas como valores de configuração**, mas ficam bloqueados até os filtros de dados serem implementados. A UI oculta criação/edição/arquivamento quando não concedidos; a API continua sendo a proteção definitiva. Os relatórios de pessoas exigem permissão separada de visualizar informações pessoais.

### Exemplos de concessões (sujeitos a validação de fluxos)

`alunos.cadastro.listar`, `alunos.cadastro.visualizar`, `alunos.cadastro.criar`, `alunos.cadastro.editar`, `secretaria.turmas.listar`, `secretaria.turmas_cursos.editar`, `financeiro.pagamentos.baixar`, `usuarios.templates.editar`, `cadastros.referencias.visualizar` e `relatorios.academicos.visualizar`.

### Atenção a perfis dos portais externos

As contas `STUDENT`, `PROFESSOR`, `COMPANY` e `INTERNSHIP_SUPERVISOR` continuam isoladas em controllers próprios que validam titularidade/associação. Não converter automaticamente perfis externos em funções internas. Nunca conceder direitos internos a um portal externo sem revisão expressa.

## Templates reutilizáveis

O superadministrador pode criar, alterar, desativar logicamente via campo `active`, duplicar pela interface e atribuir templates. A edição aumenta `version` e afeta imediatamente usuários associados. As alterações geram `AuditLog`. O sistema **não cria snapshot imutável por versão**: `version` é revisionamento incremental para auditoria, não rollback histórico completo. Recuperação de versões anteriores depende de backup/auditoria adicional.

## Limitação de campos

`allowedFields` restringe envio de propriedades em ações de escrita e faz filtragem seletiva da resposta; dados pessoais são mascarados separadamente por padrão. Regras dependentes de contexto, campos aninhados, histórico multissetorial e escopo por unidade ainda requerem testes de autorização específicos antes de uso em produção.

## Desenvolvimento de um módulo novo

1. Definir pasta própria e DTOs na API; persistência Prisma com migration aditiva.
2. Criar códigos da permissão no catálogo de IAM e correspondência explícita na função `requestPermission`.
3. Aplicar checagem de escopo na consulta, caso diferente de GLOBAL; até lá a operação será negada.
4. Criar telas e controles visuais separados sob `apps/web/src/modules/<dominio>`.
5. Criar testes de permissão positiva/negativa, campos sensíveis, auditoria e regressão de outros módulos.
