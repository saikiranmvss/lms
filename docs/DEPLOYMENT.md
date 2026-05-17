# LMS — Deployment (GitHub Actions only)

Same server as chatex. Global stack is already provisioned.

## GitHub Secrets (this repo)

| Secret | Value |
|--------|--------|
| `SERVER_HOST` | Droplet IP |
| `SERVER_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | Same key as chatex |
| `DB_PASSWORD` | MySQL password for user `lms` |
| `ENV_FILE` | See below |

**ENV_FILE example:**

```env
NODE_ENV=production
PORT=3101
DB_HOST=127.0.0.1
DB_USER=lms
DB_PASSWORD=SAME_AS_DB_PASSWORD_SECRET
DB_NAME=lms
JWT_SECRET=64-char-random
JWT_REFRESH_SECRET=64-char-random
FRONTEND_URL=http://YOUR_IP/lms/
```

## Deploy

1. Add secrets in the **LMS** GitHub repo.
2. Push to `main` or run **Actions → Deploy**.

## Verify

```text
http://YOUR_IP/lms/
http://YOUR_IP/lms/api/health
```

## Migrations (destructive)

Default: `MIGRATE_ON_DEPLOY=false` (safe).

To initialize tables **once**, set `MIGRATE_ON_DEPLOY=true` and `MIGRATE_FORCE=true`, deploy once, then remove both secrets.

## Aligned with chatex/Ravyu

- Artifact tarball uses shell `ARTIFACT=` before `tar` (not `GITHUB_ENV` in same step)
- Systemd `User=${DEPLOY_USER}` (no `envsubst` bash-default bug)
- `sync_deploy_scripts`, CI log mirroring, deploy failure log tail
- npm install in `backend/` on server (not pnpm)
