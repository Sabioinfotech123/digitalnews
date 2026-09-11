# Database (PostgreSQL)

Final DB standard for this project: **PostgreSQL 16**.

SQLite is no longer the default (local file `backend/digitalnews.db` was for early local only).

## Local / QA with Docker

```bash
# from repo root — start Postgres
docker compose up -d

# backend
cd backend
# ensure .env has:
# DATABASE_URL=postgresql+psycopg2://digitalnews:digitalnews@localhost:5432/digitalnews
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

## Connection defaults (docker-compose)

| Key | Value |
|-----|--------|
| User | `digitalnews` |
| Password | `digitalnews` |
| DB name | `digitalnews` |
| Port | `5432` |

Change password for shared QA hosts.

## Migrations

- Source of truth: `backend/alembic/versions/`
- Apply: `alembic upgrade head`
- New change: `alembic revision --autogenerate -m "message"` then review + upgrade

## Wipe local DB volume

```bash
docker compose down -v
docker compose up -d
cd backend && alembic upgrade head
```
