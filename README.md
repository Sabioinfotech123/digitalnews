# Digital News Platform

Production-oriented multilingual news platform (English + Telugu) with a public website and admin CMS.

Temporary brand: **NEWS** (centralized — final name/logo TBD). Theme: **Red + White + Black**.

## Tech stack

| Area | Stack |
|------|-------|
| Frontend | React, TypeScript, Vite, Ant Design, Tailwind CSS, React Router, Axios, Font Awesome, SCSS |
| Backend | Python, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic, JWT |
| Database | **PostgreSQL 16** (Docker for local/QA) |
| Media | AWS S3 |

## Repository layout

```
digitalnews/
├── docker-compose.yml   # PostgreSQL
├── docs/
├── frontend/
├── backend/
└── README.md
```

## Prerequisites

- Node.js 20+
- Python 3.10+
- Docker Desktop (for PostgreSQL)

## Quick start

### 1) Start database (Docker)

From repo root:

```bash
docker compose up -d
```

Check: `docker compose ps` → `digitalnews-db` should be healthy.

### 2) Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env
```

Default DB URL in `.env`:

```env
DATABASE_URL=postgresql+psycopg2://digitalnews:digitalnews@localhost:5432/digitalnews
```

Run migrations, then API:

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs  
- Health: http://localhost:8000/api/v1/health  

Admin is auto-created from `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) on first boot.

### 3) Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

App: http://localhost:5173

`frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Admin login (local)

- URL: http://localhost:5173/admin/login
- Email: `admin@example.com`
- Password: `Admin@12345`

Change via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`.

## S3 (images)

Fill in `backend/.env`:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_S3_PUBLIC_BASE_URL`

Bucket needs upload permission + public read for images (see `docs/aws-s3-setup.md`).

## Useful Docker commands

```bash
docker compose up -d          # start Postgres
docker compose down           # stop (keep data)
docker compose down -v        # stop + wipe DB volume
docker compose logs -f db     # DB logs
```

## Documentation

Start with [docs/01-project-architecture.md](docs/01-project-architecture.md) and [docs/13-development-setup.md](docs/13-development-setup.md).
