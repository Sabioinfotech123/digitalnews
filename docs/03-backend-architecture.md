# Backend Architecture

## Layered design

```
HTTP Request
    → api/v1/* (thin routers)
        → services/* (business rules)
            → repositories/* (SQLAlchemy queries)
                → PostgreSQL
```

Dependency injection via FastAPI `Depends`.

## Directory structure

```
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── dependencies.py
│   ├── api/
│   │   ├── router.py
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── users.py
│   │       ├── news.py
│   │       ├── blogs.py
│   │       ├── videos.py
│   │       ├── categories.py
│   │       ├── tags.py
│   │       ├── media.py
│   │       ├── search.py
│   │       ├── bookmarks.py
│   │       └── admin.py
│   ├── models/
│   ├── schemas/
│   ├── repositories/
│   ├── services/
│   ├── middleware/
│   ├── exceptions/
│   └── utils/
├── alembic/
├── tests/
├── scripts/                # seed, create-admin CLI
├── requirements.txt
└── .env.example
```

## Responsibilities

| Layer | Responsibility |
|-------|----------------|
| Router | Parse request, call service, map HTTP status |
| Service | Authz checks, validation rules, orchestration |
| Repository | CRUD queries, filters, pagination |
| Schema | Pydantic request/response contracts |
| Model | ORM table mapping |

## Cross-cutting

- Settings from environment (`pydantic-settings`)
- JWT access + refresh tokens
- CORS from `CORS_ORIGINS`
- Consistent error envelopes
- Soft delete where appropriate
- Storage abstraction for uploads (local now, S3/Cloudinary later)

## Public vs admin

- Public endpoints return **published** content only; support `?language=en|te`.
- Admin mutations require authenticated **ADMIN** role.
