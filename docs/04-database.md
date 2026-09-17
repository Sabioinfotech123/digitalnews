# Database Schema (Simple Guide)

This document explains **what data we store** and **how tables connect**.  
Database: **PostgreSQL** · Migrations: **Alembic** (`backend/alembic/versions/`)

> Tip: Think of tables like Excel sheets. Rows = records. Columns = fields.

---

## Big picture

```
┌──────────┐       ┌────────────┐       ┌──────────┐
│  users   │───────│   news     │───────│categories│
└──────────┘       └─────┬──────┘       └────┬─────┘
                         │                   │
                         │  news_tags        │
                         ▼                   │
                    ┌─────────┐              │
                    │  tags   │◄─────────────┤
                    └────┬────┘              │
                         │  blog_tags        │
                         ▼                   │
┌──────────┐       ┌────────────┐            │
│  users   │───────│   blogs    │────────────┘
└──────────┘       └────────────┘
```

**In plain words:**
- **Users** write news and blogs (author).
- **Categories** group content (Sports, Tech…).
- **Tags** can be attached to many news/blogs.
- **News** and **Blogs** are the main articles.

---

## Status & language values (enums)

These are fixed options used in several tables:

| Name | Allowed values | Meaning |
|------|----------------|---------|
| Role | `USER`, `ADMIN` | Who can use CMS |
| Status | `draft`, `published`, `unpublished`, `scheduled` | Visibility |
| Language | `en`, `te` | English / Telugu |
| News type | `featured`, `latest`, `trending`, `more` | Homepage section |

---

## Tables

### 1) `users` — people who log in

| Column | Simple meaning |
|--------|----------------|
| `id` | Unique ID |
| `email` | Login email (unique) |
| `password_hash` | Encrypted password (never store plain password) |
| `full_name` | Display name |
| `role` | `USER` or `ADMIN` |
| `is_active` | Can login? |
| `created_at` / `updated_at` | When created / last changed |
| `deleted_at` | Soft delete (null = still active) |

---

### 2) `categories` — folders for content

| Column | Simple meaning |
|--------|----------------|
| `id` | Unique ID |
| `name` | e.g. Sports |
| `slug` | URL-friendly name (unique) |
| `description` | Optional text |
| `is_active` | Show in app? |
| `created_at` / `updated_at` | Timestamps |

---

### 3) `tags` — labels

| Column | Simple meaning |
|--------|----------------|
| `id` | Unique ID |
| `name` | e.g. Cricket |
| `slug` | URL-friendly (unique) |
| `created_at` | When created |

---

### 4) `news` — news articles

| Column | Simple meaning |
|--------|----------------|
| `id` | Unique ID |
| `title` | Headline |
| `slug` | URL path (unique **per language**) |
| `language` | `en` or `te` |
| `short_description` | Short summary |
| `content` | Full article HTML |
| `category_id` | Which category (optional) |
| `author_id` | Who wrote it |
| `status` | draft / published / … |
| `news_type` | featured / latest / trending / more |
| `is_featured` | Featured flag |
| `is_breaking` | Breaking news flag |
| `image_url` | Cover image URL (**required** when creating) |
| `seo_title` / `seo_description` / `seo_keywords` | SEO fields |
| `published_at` | When published |
| `view_count` | How many times opened on public site |
| `created_at` / `updated_at` / `deleted_at` | Timestamps + soft delete |

**Rule:** Same slug can exist once in English and once in Telugu (`UNIQUE(language, slug)`).

---

### 5) `news_tags` — links news ↔ tags

| Column | Simple meaning |
|--------|----------------|
| `news_id` | News ID |
| `tag_id` | Tag ID |

One news can have many tags. One tag can be on many news.

---

### 6) `blogs` — blog posts

Almost like news, **without** `news_type`, `is_featured`, `is_breaking`.

| Column | Simple meaning |
|--------|----------------|
| `id`, `title`, `slug`, `language` | Same idea as news |
| `short_description`, `content` | Body |
| `category_id`, `author_id` | Links |
| `status`, `image_url` | Status + cover (optional for blogs) |
| SEO fields | Same as news |
| `published_at`, `view_count` | Publish time + views |
| `created_at` / `updated_at` / `deleted_at` | Timestamps |

**Rule:** `UNIQUE(language, slug)` like news.

---

### 7) `blog_tags` — links blogs ↔ tags

| Column | Simple meaning |
|--------|----------------|
| `blog_id` | Blog ID |
| `tag_id` | Tag ID |

---

## Soft delete (important)

For `users`, `news`, `blogs`:
- We usually **don’t hard-delete** rows.
- We set `deleted_at` to a date/time.
- APIs ignore rows that are soft-deleted.

---

## How to apply schema locally

```bash
# start Postgres
docker compose up -d

cd backend
alembic upgrade head
```

Connection (Docker default):

```text
Host: localhost
Port: 5433
User: digitalnews
Password: digitalnews
Database: digitalnews
```

More ops detail: [21-database.md](./21-database.md)

---

## Quick FAQ

**Q: Why slug + language unique together?**  
A: Same title/slug can exist in English and Telugu as separate posts.

**Q: Why `view_count`?**  
A: Public article open increments it. Admin tables show Views.

**Q: Are videos in DB?**  
A: Not yet as a full table in current backend (dashboard shows videos = 0 for now).
