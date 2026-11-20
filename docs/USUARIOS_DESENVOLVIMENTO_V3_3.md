# Contas e templates de desenvolvimento — V3.3.0

O script `apps/api/scripts/seed-dev-accounts.ts` cria **25 templates e 25 contas** com papéis existentes ou equivalentes e permissões específicas do catálogo. A criação ocorre **somente após comando explícito** em PostgreSQL local de desenvolvimento.

| Login | Template / Setor |
|---|---|
| `admin.aitinet` | Superadministrador |
| `administracao.aitinet` | Administração |
| `diretoria.aitinet` | Diretoria (somente leitura) |
| `juridico.aitinet` | Jurídico |
| `secretaria.aitinet` | Secretaria |
| `financeiro.aitinet` | Financeiro |
| `triagem.aitinet` | Triagem |
| `contratos.aitinet` | Contratos |
| `servicosocial.aitinet` | Serviço Social |
| `recepcao.aitinet` | Recepção |
| `comercial.aitinet` | Comercial |
| `dp.aitinet` | Departamento Pessoal |
| `marketing.aitinet` | Marketing |
| `atendimento.aitinet` | Atendimento |
| `demandas.aitinet` | Demandas |
| `documentos.aitinet` | Documentos |
| `estagio.aitinet` | Estágio |
| `relatorios.aitinet` | Relatórios (somente leitura) |
| `aluno.aitinet` | Portal do Aluno |
| `aprendiz.aitinet` | Portal do Aprendiz |
| `candidato.aitinet` | Portal do Candidato |
| `responsavel.aitinet` | Portal do Responsável Legal (vínculo ainda não implementado) |
| `professor.aitinet` | Portal do Professor |
| `empresa.aitinet` | Portal da Empresa |
| `supervisor.aitinet` | Portal do Supervisor de Estágio |

## Como ativar

```powershell
cd D:\SISCAPRO\Siscapro\PROATIVA_SISCAPRO_V3_3_0
npm run dev:sql:prepare
npm run dev:users:seed
```

Após a criação, consultar as senhas no arquivo privado **`.local-dev-users-credentials.md`**, produzido na raiz do projeto. Esse arquivo não integra o ZIP de distribuição nem o Git. Para reutilizar as senhas planejadas no documento separado fornecido anteriormente, incluir a opção `--credentials-file` no comando de provisionamento **antes da primeira criação**.

Os templates aparecerão em **Equipe e acessos → Usuários e permissões**. Somente o perfil Superadministrador tem acesso irrestrito; outros privilégios dependem dos grants registrados. Os papéis jurídicos/administrativos que ainda não possuem um `UserRole` dedicado usam papéis técnicos compatíveis **com `accessMode=CUSTOM`** e permissões restritas ao template.

**Observação:** provisionamento de contas não significa homologação das funcionalidades de cada setor; não publicar tais contas nem as senhas em produção.
