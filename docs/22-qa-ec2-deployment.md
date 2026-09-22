# AK News — Manual QA deployment on AWS EC2

This runbook deploys **AK News** (`digitalnews`) next to an existing AI Framework stack on the same EC2 instance. It is QA only, SSH-based, and isolated.

**Do not** use the root `docker-compose.yml` on this host. That file is local development Postgres on host port **5433**.

**Do not** stop, remove, rebuild, restart, reconfigure, or otherwise modify the existing AI Framework containers, network, database, images, or volumes.

---

## Architecture

```
Internet
  → existing reverse proxy (host :80 / :443 — unchanged)
      → 127.0.0.1:8088
          → aknews-web (nginx :80)
              ├─ static SPA
              └─ /api/*  →  aknews-api :8000   (not published)
                            → aknews-db :5432  (not published)
                            → AWS S3 bucket digitalnews-media (us-east-1)
```

| Item | Value |
|------|--------|
| Compose project | `aknews-qa` |
| Compose file | `docker-compose.qa.yml` |
| Network | `aknews_qa_net` (do not attach AI Framework services) |
| Volume | `aknews_qa_pgdata` |
| Host bind | `127.0.0.1:8088` → web `:80` only |
| Unused / forbidden ports | 80, 443, 5000, 5432, 5433 |

| Service | Container | Image role | Internal port | Host publish |
|---------|-----------|------------|---------------|--------------|
| `db` | `aknews-db` | Postgres 16 Alpine | 5432 | none |
| `api` | `aknews-api` | FastAPI / Uvicorn | 8000 | none |
| `web` | `aknews-web` | nginx:alpine + SPA | 80 | `127.0.0.1:8088` |

Resource caps (host is ~2 vCPU / ~1.9 GB and already runs another app):

| Service | `mem_limit` |
|---------|-------------|
| db | 256m |
| api | 384m |
| web | 64m |

Restart policy: `unless-stopped`.

Frontend QA API path is **`/api/v1`** (baked at image build). nginx proxies `/api/` to `aknews-api:8000` and **preserves** `/api/v1`.

Alembic does **not** run when the API container starts. Migrations are an explicit deploy step.

---

## Prerequisites

- QA host: **Amazon Linux 2023**
- SSH access to that EC2 instance
- **Docker** installed
- **Docker Compose v2.40.3** available as the standalone binary **`docker-compose`**
- Do **not** require the `docker compose` CLI plugin. All commands in this runbook use `docker-compose`.
- This repository copied onto the host (git clone or rsync)
- Free RAM: check `free -h` before starting. Do not start AK News if the host is already near OOM
- Port **8088** free on localhost (`ss -lnt | grep 8088` or `netstat -lnt`)
- QA env file on the host (see [Environment variable setup](#environment-variable-setup))
- AWS IAM credentials for the application to upload to bucket `digitalnews-media` (see [S3 configuration](#s3-configuration))
- Existing reverse proxy left **untouched** until AK News is healthy on `127.0.0.1:8088`

All commands below assume the working directory is the `digitalnews/` repo root (the directory that contains `docker-compose.qa.yml`).

Use this wrapper so you never accidentally operate on another compose project:

```bash
export COMPOSE="docker-compose -p aknews-qa -f docker-compose.qa.yml"
```

Equivalent long form (used wherever a command is written out in full):

```text
docker-compose -p aknews-qa -f docker-compose.qa.yml
```

`deploy/.env.qa` is injected into `db` and `api` via Compose `env_file`. It does not need to be passed as a CLI `--env-file` unless you add interpolated `${...}` values to the compose file later.

---

## Environment variable setup

1. On the **server**, copy the template:

   ```bash
   cp deploy/qa.env.example deploy/.env.qa
   chmod 600 deploy/.env.qa
   ```

2. Edit `deploy/.env.qa` and replace every `change-me-*` / empty AWS field / `YOUR_QA_HOSTNAME`.

3. Keep `DATABASE_URL` on host **`aknews-db`** port **5432**. Do not use `localhost` or `5433`.

4. `deploy/.env.qa` matches `.env.*` in `.gitignore`. **Never commit it.** Never bake it into an image.

Required variables are listed in `deploy/qa.env.example`. Notable QA values:

| Variable | QA |
|----------|----|
| `DEBUG` | `false` |
| `MAX_VIDEO_SIZE_MB` | `20` (API buffers uploads in memory) |
| `AWS_REGION` | `us-east-1` |
| `AWS_S3_BUCKET` | `digitalnews-media` |
| `AWS_S3_PUBLIC_BASE_URL` | `https://digitalnews-media.s3.us-east-1.amazonaws.com` |
| `CORS_ORIGINS` | `https://<qa-hostname>` |
| `VITE_API_URL` | `/api/v1` (Dockerfile; not this env file) |

The API creates an admin user on **first boot** only if `ADMIN_EMAIL` does not already exist. Changing `ADMIN_PASSWORD` later does not update that user.

---

## S3 configuration

The current application uploads objects with `put_object` and returns **direct S3 object URLs** (not presigned URLs). The browser then fetches images and other media **directly from S3**, not through AK News nginx.

Whether those URLs load in the browser depends on the **S3 bucket/object access model** for `digitalnews-media`. Possible models include public-read objects, a CDN such as CloudFront, or other arrangements decided outside this deploy.

**This repository does not change AWS S3 bucket settings.** Do not assume public access must be enabled as part of this QA compose rollout. The access model for `digitalnews-media` will be handled separately.

Application-side env (fill on the server only; never commit real keys):

- Bucket: `digitalnews-media`
- Region: `us-east-1`
- `AWS_S3_PUBLIC_BASE_URL=https://digitalnews-media.s3.us-east-1.amazonaws.com`
- IAM user in `deploy/.env.qa` needs object write/read as required by the upload path (`s3:PutObject` and related object actions on that bucket). Exact IAM is an AWS-side decision.

Leave `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` empty in Git. Fill them only in `deploy/.env.qa` on the server.

---

## Build

```bash
$COMPOSE build
```

- Backend image: `python:3.12-slim`, Uvicorn **without** `--reload`, 1 worker
- Frontend image: Node 20 build with `VITE_API_URL=/api/v1`, then `nginx:alpine`. Local `frontend/.env` is dockerignored and stripped so it cannot override the QA API path

Do not pass host AWS keys as build args.

---

## First-deployment warning

**Do not** start every service at once on a fresh host:

```bash
docker-compose -p aknews-qa -f docker-compose.qa.yml up -d
```

That command starts the API before Alembic has created tables. First deploy **must** follow this order:

1. Start **DB**
2. Wait until Postgres is **healthy**
3. Run the **explicit** Alembic migration
4. Start **API**
5. Start **web**

---

## Starting DB

```bash
$COMPOSE up -d db
$COMPOSE ps
```

Wait until `aknews-db` is **healthy** (`pg_isready`). Expand `POSTGRES_USER` and `POSTGRES_DB` **inside** the Postgres container (do not expand them on the EC2 host):

```bash
docker-compose -p aknews-qa -f docker-compose.qa.yml exec db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Or:

```bash
docker inspect --format='{{.State.Health.Status}}' aknews-db
```

Do not start the API before this is `healthy`.

---

## Running migrations

Explicit, one-shot, **after** Postgres is healthy and **before** the API:

```bash
docker-compose -p aknews-qa -f docker-compose.qa.yml run --rm --no-deps --name aknews-migrate api alembic upgrade head
```

`--no-deps` avoids recreating `db`. `--name aknews-migrate` avoids clashing with the long-running `aknews-api` container name. The API image command is **not** Alembic; this `run` overrides it for one shot and then removes the helper container.

If this fails with `relation ... does not exist` later, you started the API too early — stop API, run this command, start API again.

---

## Starting API

```bash
$COMPOSE up -d api
```

Startup command inside the image:

```text
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 --proxy-headers --forwarded-allow-ips=*
```

The API listens on Docker network port 8000 only. It is **not** published on the EC2 host.

Health: `GET /api/v1/health` from inside the API container (liveness only; it does not probe S3).

---

## Starting web

```bash
$COMPOSE up -d web
```

Web binds **`127.0.0.1:8088:80`**. It never binds 80, 443, 5000, 5432, or 5433.

Confirm from the EC2 host:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8088/
curl -sS http://127.0.0.1:8088/api/v1/health
```

Only after that is green should the **existing** reverse proxy gain a vhost that `proxy_pass`es to `http://127.0.0.1:8088`. That proxy edit is a later ops step and is **not** part of this compose file.

---

## Checking health

| Check | How |
|-------|-----|
| Compose | `$COMPOSE ps` — all three `healthy` / `running` |
| DB | `docker-compose -p aknews-qa -f docker-compose.qa.yml exec db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'` |
| API (internal) | `$COMPOSE exec api python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health').read())"` |
| Web + API via nginx | `curl http://127.0.0.1:8088/api/v1/health` |
| SPA | `curl -I http://127.0.0.1:8088/` |
| Host isolation | `ss -lnt` — AK News should show `127.0.0.1:8088` only |

Expected health JSON: `{"status":"ok","service":"...","version":"..."}`.

---

## Logs

```bash
$COMPOSE logs -f db
$COMPOSE logs -f api
$COMPOSE logs -f web
$COMPOSE logs -f --tail=200
```

JSON logs are rotated (`10m` × 3 files) so they do not fill a small disk.

---

## Stopping AK News safely

Stop **only** this project. Do not run bare `docker-compose down` in another directory. Do not `docker stop` / `docker rm` / rebuild / restart AI Framework containers.

```bash
# Stop AK News containers; keep the QA database volume
$COMPOSE down
```

Do **not** add `-v` unless you intend to wipe QA data.

Verify AI Framework containers are still running (`docker ps`) after AK News is down.

---

## Updating AK News safely

1. Copy the new source onto the host (keep `deploy/.env.qa` as-is).
2. `$COMPOSE build`
3. `$COMPOSE up -d db` and wait until healthy.
4. `docker-compose -p aknews-qa -f docker-compose.qa.yml run --rm --no-deps --name aknews-migrate api alembic upgrade head`
5. `$COMPOSE up -d api web`
6. Recheck health as above.

Do not rebuild in a way that uses local `frontend/.env`. The frontend Dockerfile forces `VITE_API_URL=/api/v1`.

---

## Resource monitoring

```bash
free -h
docker stats aknews-db aknews-api aknews-web --no-stream
```

Watch for:

- Host memory pressure / OOM killer (`dmesg | grep -i oom`)
- API RSS climbing during video uploads (`MAX_VIDEO_SIZE_MB=20` is the QA cap)
- Postgres using more than its 256m limit (it will be killed; lower work, do not raise limits without RAM to spare)

Do not add workers, Redis, or extra containers to “fix” memory.

---

## Rollback procedure

Images are built locally (no registry in this setup). Rollback is “previous code + rebuild”, **keeping** `aknews_qa_pgdata`.

1. `$COMPOSE down` (no `-v`)
2. Check out or restore the previous application revision on the host
3. `$COMPOSE build`
4. `$COMPOSE up -d db` → wait healthy
5. `docker-compose -p aknews-qa -f docker-compose.qa.yml run --rm --no-deps --name aknews-migrate api alembic upgrade head`  
   If the rollback target is an **older** schema, only downgrade if you have a tested Alembic downgrade path. Prefer restoring a volume snapshot if you took one.
6. `$COMPOSE up -d api web`
7. Health-check `http://127.0.0.1:8088/api/v1/health`

Volume snapshot before a risky migrate (optional):

```bash
docker run --rm -v aknews_qa_pgdata:/var/lib/postgresql/data -v "$(pwd)":/backup alpine \
  tar czf /backup/aknews_qa_pgdata-$(date +%Y%m%d).tar.gz -C /var/lib/postgresql/data .
```

Never run `docker volume rm` on volumes you do not recognize. Never delete AI Framework volumes.

---

## Warnings

### Do not use root `docker-compose.yml` on QA

`docker-compose.yml` starts **local** Postgres as `digitalnews-db`, publishes **`0.0.0.0:5433:5432`**, and uses volume `digitalnews_pgdata`. On EC2 that can:

- Expose a database on the public interface
- Collide with operational expectations around 5432/5433
- Create a second, wrong database unrelated to `aknews_qa_pgdata`

Always `docker-compose -p aknews-qa -f docker-compose.qa.yml`.

### Do not stop or modify AI Framework containers

The host already uses:

- ports **80** and **443** (existing reverse proxy)
- internal **5000** (existing backend)
- internal **5432** (existing PostgreSQL)

AK News uses a **separate** network (`aknews_qa_net`) and its own internal 5432/8000. Those ports do not conflict because they are not on the host and not on the AI Framework network.

Forbidden:

- `docker stop` / `rm` / rebuild / restart of AI Framework containers
- attaching AK News services to the AI Framework network
- binding AK News web to 80 or 443
- `docker-compose down` without `-p aknews-qa -f docker-compose.qa.yml`
- `docker-compose -p aknews-qa -f docker-compose.qa.yml down -v` unless you intend to destroy **AK News** QA data only

---

## First-deploy sequence (copy/paste)

Do **not** run `docker-compose -p aknews-qa -f docker-compose.qa.yml up -d` (all services) before the migration.

```bash
cd /path/to/digitalnews
cp deploy/qa.env.example deploy/.env.qa
# edit deploy/.env.qa — real secrets, CORS hostname, AWS keys

export COMPOSE="docker-compose -p aknews-qa -f docker-compose.qa.yml"

$COMPOSE build
$COMPOSE up -d db
# wait until aknews-db is healthy
docker-compose -p aknews-qa -f docker-compose.qa.yml exec db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
docker-compose -p aknews-qa -f docker-compose.qa.yml run --rm --no-deps --name aknews-migrate api alembic upgrade head
$COMPOSE up -d api
$COMPOSE up -d web

curl -sS http://127.0.0.1:8088/api/v1/health
$COMPOSE ps
```

Then point the existing reverse proxy at `http://127.0.0.1:8088` when that hostname change is approved.
