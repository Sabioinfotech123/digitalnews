# Digital News Platform

Production-oriented multilingual news platform (English + Telugu) with a public website and admin CMS.

Temporary brand: **NEWS** (centralized — final name/logo TBD). Theme: **Red + White + Black**.

## Tech stack

| Area | Stack |
|------|-------|
| Frontend | React, TypeScript, Vite, Ant Design, Tailwind CSS, React Router, Axios, Font Awesome, SCSS |
| Backend | Python, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic, JWT |
| Database | PostgreSQL |

## Repository layout

```
digitalnews/
├── docs/          # Architecture & guides
├── frontend/      # Public + Admin SPA
├── backend/       # FastAPI API
└── README.md
```

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs  
Health: http://localhost:8000/api/v1/health

PostgreSQL is required for migrations/models (Phase 3+). Health check runs without a live DB connection.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

App: http://localhost:5173

## Documentation

Start with [docs/01-project-architecture.md](docs/01-project-architecture.md) and [docs/19-implementation-roadmap.md](docs/19-implementation-roadmap.md).

## Current status

- Architecture documentation complete
- Phase 1–2: design system, public video UI, Tailwind + FA
- Phase 3 admin: JWT auth, `/admin/login`, CMS layout, dashboard

### Admin login (local)

- URL: http://localhost:5173/admin/login (or your Vite port)
- Email: `admin@example.com`
- Password: `Admin@12345`

Change via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`.

Next: **Phase 4 — News CMS CRUD**
