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

Push to `main` or run **Actions → Deploy**.

Each deploy runs **`ensure-schema.js`** (default `MIGRATE_ON_DEPLOY=true`):

- Creates all tables if missing
- Seeds demo users if the database is empty

## Demo logins (after first deploy)

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@learnhub.com` | `admin123` |
| Instructor | `instructor@learnhub.com` | `instructor123` |
| Student | `student@learnhub.com` | `student123` |

## Verify

```text
http://YOUR_IP/lms/
http://YOUR_IP/lms/api/health
```

## Full database reset (destructive)

Only if you need to wipe all LMS data: set secrets `MIGRATE_ON_DEPLOY=true` and `MIGRATE_FORCE=true`, deploy once, then remove `MIGRATE_FORCE`.
