# Subir localmente no Docker

Windows PowerShell (Docker Desktop ativo):

```powershell
.\scripts\setup.ps1
.\scripts\start.ps1
```

Linux/macOS:

```bash
sh scripts/setup.sh
sh scripts/start.sh
```

O servidor local ficará em `http://localhost:8080` (ou a porta configurada em `.env`). Se houver falhas: `docker compose logs -f api`, `docker compose logs -f web`. Para reconstruir após alterações no código: `docker compose up --build -d`.

**Não iniciar com credenciais padrão nem expor a aplicação na internet.**
