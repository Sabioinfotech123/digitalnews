# Development Setup

## Prerequisites

- Node.js 20+
- Python 3.10+
- Docker Desktop (PostgreSQL)

## Database (PostgreSQL via Docker)

From repo root:

```bash
docker compose up -d
```

Defaults:

| Setting | Value |
|---------|--------|
| Host | `localhost` |
| Port | `5432` |
| User | `digitalnews` |
| Password | `digitalnews` |
| Database | `digitalnews` |
| URL | `postgresql+psycopg2://digitalnews:digitalnews@localhost:5432/digitalnews` |

Data is stored in Docker volume `digitalnews_pgdata`.

## Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # or: copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Schema changes: create a new Alembic revision, then `alembic upgrade head`.

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Verify

- Frontend: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`
- Health: `GET /api/v1/health`
- Admin: `http://localhost:5173/admin/login`

## QA note

Use the same PostgreSQL style in QA (managed Postgres or Docker on the QA host). Do **not** use SQLite for shared QA/prod.
