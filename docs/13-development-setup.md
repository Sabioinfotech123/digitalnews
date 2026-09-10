# Development Setup

## Prerequisites

- Node.js 20+
- Python 3.10+
- PostgreSQL 14+

## Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Create DB, then:
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

## Verify

- Frontend: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`
- Health: `GET /api/v1/health`
