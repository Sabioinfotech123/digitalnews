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

┌────────────────┐
│ breaking_news  │  (standalone ticker headlines)
└────────────────┘

┌────────────────┐
│ site_settings  │  (logo + favicon + primary color — one row)
└────────────────┘
```

**In plain words:**
- **Users** write news and blogs (author).
- **Categories** group content (Sports, Tech…).
- **Tags** can be attached to many news/blogs.
- **News** and **Blogs** are the main articles.
- **Breaking news** is a separate ticker list (header bar), not the same as `news.is_breaking`.
- **Site settings** stores the website logo, favicon, and primary color.

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
| `is_breaking` | Breaking badge on the article (not the header ticker) |
| `is_local` | Added from **Local news** import |
| `sort_order` | Display order within type (lower = first on public site) |
| `image_url` | Cover image URL (**required** when creating) |
| `seo_title` / `seo_description` / `seo_keywords` | SEO fields |
| `published_at` | When published |
| `view_count` | How many times opened on public site |
| `created_at` / `updated_at` / `deleted_at` | Timestamps + soft delete |

**Rule:** Same slug can exist once in English and once in Telugu (`UNIQUE(language, slug)`).

`is_local` added in migration `0006_news_is_local.py`.  
`sort_order` added in migration `0008_news_sort_order.py`. Lists (admin + public) order by `sort_order ASC`, then `created_at DESC`.

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

### 8) `breaking_news` — header ticker headlines

Standalone ticker items (not full articles). Managed in Admin → **Breaking news**.

| Column | Simple meaning |
|--------|----------------|
| `id` | UUID |
| `title` | Headline text shown in the red ticker |
| `language` | `en` / `te` |
| `link_url` | Optional link (internal path or full URL) |
| `is_active` | Only active items appear on the public site |
| `sort_order` | Lower numbers first |
| `created_at` / `updated_at` | Timestamps |

**Note:** `news.is_breaking` is a badge on an article. The header bar uses this table.

Migration: `0003_breaking_news.py`

---

### 9) `site_settings` — logo, favicon + primary color

One row for the whole site (Admin → **Settings**).

| Column | Simple meaning |
|--------|----------------|
| `id` | Fixed singleton UUID |
| `logo_url` | Uploaded logo URL (optional — default app logo if empty) |
| `favicon_url` | Browser tab icon URL (optional — default `/assets/favicon.png` if empty) |
| `primary_color` | Hex color like `#D71920` |
| `created_at` / `updated_at` | Timestamps |

Migrations: `0004_site_settings.py`, `0005_site_settings_favicon.py`

---

### 10) `verified_local_news` — AI credibility checks

Saved when admin runs **Verify** on a Local feed article.

| Column | Simple meaning |
|--------|----------------|
| `id` | Unique ID |
| `external_id` | Local-feed article id (unique) |
| `title` / `description` / `url` / `image_url` | Snapshot of the article |
| `source_name` / `published_at` / `country` | Source metadata |
| `verdict` | `likely_real` / `likely_fake` / `uncertain` |
| `confidence` | 0–100 |
| `ai_summary` | Short AI explanation |
| `ai_provider` | `gemini` or `openai` |
| `verified_at` | When checked |

Migration: `0007_verified_local_news.py`

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
