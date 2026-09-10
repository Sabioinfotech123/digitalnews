# Project Architecture

## Overview

Production multilingual Digital News Platform with two surfaces:

| Surface | Purpose |
|---------|---------|
| **Public website** | News, blogs, videos for audiences from YouTube, Facebook, Instagram, and the official site |
| **Admin CMS** | Content publishing, taxonomy, media, users, settings |

**Content mix (home / editorial):** ~75–80% image + text news; ~20–25% video (uploads, YouTube, TV). Video remains a first-class section but is not the primary homepage weight.

Temporary brand placeholder: **NEWS** (centralized in `frontend/src/config/brand.ts`). Final name/logo TBD.

## Confirmed stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, Ant Design, React Router, Axios, Font Awesome, SCSS variables |
| Backend | Python, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic, JWT |
| Database | PostgreSQL |
| API | REST `/api/v1` |

**Theme:** Red + White + Black only (`#D71920`, `#111111`, `#FFFFFF`). No yellow accent.

**Languages:** English (`en`) + Telugu (`te`). UI language and content language are separate concepts.

## High-level system diagram

```
┌─────────────────┐     ┌─────────────────┐
│  Public React   │     │  Admin React    │
│  (Vite SPA)     │     │  (same SPA)     │
└────────┬────────┘     └────────┬────────┘
         │  Axios / JWT          │
         └───────────┬───────────┘
                     ▼
            ┌────────────────┐
            │  FastAPI API   │
            │  /api/v1/*     │
            └────────┬───────┘
                     │ Router → Service → Repository
                     ▼
            ┌────────────────┐     ┌────────────────┐
            │  PostgreSQL    │     │  Object storage │
            │  (SQLAlchemy)  │     │  (abstracted)  │
            └────────────────┘     └────────────────┘
```

## Monorepo layout

```
digitalnews/
├── docs/                 # Architecture & ops documentation
├── frontend/             # React + Vite SPA (public + admin)
├── backend/              # FastAPI application
├── README.md
└── .gitignore
```

## Core principles

1. **Clean layers** — thin routes, business logic in services, DB access in repositories.
2. **Reuse** — shared UI primitives (`App*`), feature modules, no duplicated language-specific components.
3. **Centralize** — brand, theme tokens, typography, API base URL, locale catalogs.
4. **Security boundary** — backend RBAC is authoritative; frontend guards are UX only.
5. **Mobile-first** — primary traffic from social mobile clients.
6. **Phase delivery** — architecture first, then Phase 1 → 10 (see roadmap).

## Related docs

- [02 Frontend architecture](./02-frontend-architecture.md)
- [03 Backend architecture](./03-backend-architecture.md)
- [04 Database](./04-database.md)
- [05 API](./05-api-documentation.md)
- [06 Authentication](./06-authentication.md)
- [19 Implementation roadmap](./19-implementation-roadmap.md)
