# Implementation Roadmap

## Architecture (this milestone) — DONE when docs + scaffolds land

- Project / FE / BE / DB / API / auth / design / i18n docs
- Folder structures
- Design token + brand config stubs
- Phase 1 runnable skeleton

## Phase 1 — Project setup

React + TS + Vite + Ant Design · FastAPI + PostgreSQL + SQLAlchemy + Alembic · env config · base architecture · health check

## Phase 2 — Design system

Tokens, fonts, buttons, cards, forms, layout shells, responsive foundation  
**Added:** Tailwind CSS v4 (utilities), Font Awesome via `AppIcon`, `AppButton`, `cn()` helper — see [20-styling-stack.md](./20-styling-stack.md)

## Phase 3 — Authentication

Register / login / logout / JWT / roles / protected routes / admin auth

## Phase 4 — News CMS

CRUD, editor, images, categories, tags, language, draft/publish, breaking, featured

## Phase 5 — Blogs

CRUD, editor, language, SEO fields

## Phase 6 — Videos

Upload, thumbnail, player, CRUD, language

## Phase 7 — Public website

Home, listings, detail pages, search, categories, language switcher

## Phase 8 — User features

Bookmarks, profile, sharing, reading history

## Phase 9 — Admin dashboard

Stats, tables, media library, users

## Phase 10 — Finalization

SEO, performance, a11y, security hardening, tests, full documentation polish

## Process gates (every phase)

1. TypeScript check  
2. Lint  
3. Backend check / tests  
4. API contract sanity  
5. Responsive + reuse review  
6. Fix before next phase  

**Do not** generate the entire application in one pass.
