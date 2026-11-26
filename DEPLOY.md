# TSL Smart Asset — Production Deployment

## Prerequisites

- Node.js 20+
- MariaDB with database `tsl_asset` (utf8mb4)
- Network access to DB host (e.g. `192.168.1.252`)
- Strong `AUTH_SECRET` (32+ random chars)

## Deploy steps

1. Copy `.env.example` → `.env` and fill real values (never commit `.env`).
2. Install and migrate:

```bash
npm ci
npx prisma migrate deploy
npx prisma generate
npm run db:seed
npm run build
npm run start
```

3. Verify health:

```bash
curl http://localhost:3000/api/health
npm run smoke
```

4. Backup before major changes:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backup.ps1
```

## Security checklist

- [ ] `AUTH_SECRET` is unique and strong
- [ ] DB user is least-privilege (no DROP DATABASE)
- [ ] App runs behind HTTPS reverse proxy in production
- [ ] `/q/*` public pages expose only needed asset fields
- [ ] File uploads stay under `STORAGE_ROOT`
- [ ] Regular backups of DB + storage
- [ ] Do **not** hard-delete registry data; use soft flags / lifecycle docs

## Notes

- Timezone: `Asia/Bangkok`
- KPI/Dashboard values must come from live DB queries only
- Optional: set `OPENAI_API_KEY` for LLM-backed assistant answers
