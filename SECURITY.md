# Segurança da V2.0 (desenvolvimento local)

- Login com hash Argon2id; JWT em cookie HttpOnly com SameSite=Lax; controles básicos de origem em operações escritas.
- Papéis internos controlados na API, com catálogo de cadastros específico por departamento.
- Contas externas (Aluno, Empresa, Facilitador, Supervisor) acessam endpoints próprios; o supervisor é limitado aos estágios atribuídos pelo nome ou e-mail e empresa.
- Arquivos locais são armazenados em volume privado, com UUID e checksum SHA-256, não publicados no diretório de arquivos estáticos.
- Setup gera credenciais aleatórias, não sobrescreve `.env` e a versão ZIP não distribui dados reais.
- MariaDB de origem é configurado apenas por opt-in, com recomendação de credencial somente leitura.

**Pendente antes de qualquer produção:** testar acesso por unidade, implementar controles de rate limiting/MFA quando aplicável, validar emissão de documentos e permissões individuais, revisar criptografia de dados sensíveis em repouso, logs e retenção LGPD, rotação de segredos, HTTPS, backup-restauração, auditoria de dependências e testes de invasão. O sistema de demonstração não é adequado para exposição pública.
