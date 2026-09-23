# API Documentation (Simple Guide)

Base URL (local):

```text
http://localhost:8000/api/v1
```

Interactive docs (best for testing):

```text
http://localhost:8000/docs
```

> Tip: **Public** = website visitors. **Admin** = CMS (needs login token).

---

## How auth works (simple)

1. Login (or register) → API gives **access token** + **refresh token**
2. For admin APIs, send header:

```http
Authorization: Bearer <access_token>
```

3. Access token expires (default ~30 min). Use `/auth/refresh` to get new tokens.
4. Only users with role **`ADMIN`** can call `/admin/...` write APIs.

---

## Response styles you’ll see

| Type | Example |
|------|---------|
| One item | `{ "id": "...", "title": "..." }` |
| List + pages | `{ "items": [...], "total": 20, "page": 1, "page_size": 10 }` |
| Empty success | HTTP `204` (no body) — used on delete |
| Error | `{ "detail": "News not found" }` |

---

## 1) Health

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| GET | `/health` | Anyone | Checks API is running |

---

## 2) Auth

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| POST | `/auth/register` | Anyone | Create account (role = USER) |
| POST | `/auth/login` | Anyone | Login → tokens |
| POST | `/auth/refresh` | Anyone | New tokens from refresh token |
| GET | `/auth/me` | Logged-in user | My profile |

### Login body example

```json
{
  "email": "admin@example.com",
  "password": "Admin@12345"
}
```

### Login response (shape)

```json
{
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "full_name": "Site Admin",
    "role": "ADMIN",
    "is_active": true
  },
  "tokens": {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "bearer"
  }
}
```

---

## 3) News (public website)

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| GET | `/news` | Anyone | List **published** news |
| GET | `/news/{slug}` | Anyone | Open one news by slug (counts a view) |
| GET | `/news/by-id/{id}` | Anyone | Open one news by ID (counts a view) |

### Useful query params for list

| Param | Example | Meaning |
|-------|---------|---------|
| `page` | `1` | Page number |
| `page_size` | `10` | Items per page |
| `search` | `sports` | Search title/slug/summary |
| `language` | `en` or `te` | Filter language |
| `category_id` | UUID | Filter category |
| `news_type` | `featured` | Homepage section |
| `is_breaking` | `true` | Breaking only |

Example:

```text
GET /api/v1/news?language=en&news_type=latest&page=1
```

List order: `sort_order` ascending (lower first), then newest `created_at`. Set `sort_order` on create/update (`PATCH /admin/news/{id}`). If the new order is already used by another news with the **same `news_type` + `language`**, those two rows **swap** orders.
---

## 4) News (admin CMS)

Need **ADMIN** token.

| Method | Path | What it does |
|--------|------|--------------|
| GET | `/admin/news` | List all news (draft + published + …) |
| POST | `/admin/news` | Create news (**image required**) |
| GET | `/admin/news/{id}` | Get one news |
| PATCH | `/admin/news/{id}` | Update news |
| DELETE | `/admin/news/{id}` | Soft delete |

### Create news — important fields

| Field | Required? | Notes |
|-------|-----------|-------|
| `title` | Yes | Min 3 chars |
| `slug` | Yes | Unique per language |
| `language` | Yes | `en` / `te` |
| `content` | Yes | Article body |
| `image_url` | **Yes** | Upload first, then paste URL |
| `news_type` | Yes | featured / latest / trending / more |
| `status` | Optional | default `draft` |
| `category_id` | Optional | |
| `tag_ids` | Optional | array of tag IDs |
| `is_breaking` | Optional | true/false |
| SEO fields | Optional | |

Admin list also supports filters: `search`, `language`, `status`, `category_id`, `news_type`.

---

## 5) Blogs (public)

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| GET | `/blogs` | Anyone | List published blogs |
| GET | `/blogs/{slug}` | Anyone | Blog detail |
| GET | `/blogs/by-id/{id}` | Anyone | Blog by ID |

Query params similar to news (`page`, `search`, `language`, `category_id`).

---

## 6) Blogs (admin)

Need **ADMIN** token.

| Method | Path | What it does |
|--------|------|--------------|
| GET | `/admin/blogs` | List all blogs |
| POST | `/admin/blogs` | Create |
| GET | `/admin/blogs/{id}` | Get one |
| PATCH | `/admin/blogs/{id}` | Update |
| DELETE | `/admin/blogs/{id}` | Soft delete |

Blogs have no `news_type` / breaking flags.

---

## 6b) Videos (public + admin)

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| GET | `/videos` | Anyone | List **published** videos |
| GET | `/videos/{slug}` | Anyone | Video detail (counts a view) |
| GET | `/admin/videos` | Admin | List all |
| POST | `/admin/videos` | Admin | Create (need file and/or YouTube URL) |
| GET | `/admin/videos/{id}` | Admin | Get one |
| PATCH | `/admin/videos/{id}` | Admin | Update |
| DELETE | `/admin/videos/{id}` | Admin | Soft delete |

### Create video — important fields

| Field | Required? | Notes |
|-------|-----------|-------|
| `title` / `slug` / `language` | Yes | Slug unique per language |
| `description` | Yes (admin form) | Short summary |
| `content` | Yes (admin form) | Full HTML body |
| `category_id` / `tag_ids` | Optional | Same idea as news/blogs |
| `video_url` | One of these | Uploaded file URL |
| `youtube_url` | One of these | Full YouTube URL |
| `thumbnail_url` | Required if `video_url` | Optional when YouTube-only |
| `status` | Optional | default `draft` |
| `sort_order` | Optional | lower first |
| SEO fields | Optional | `seo_title` / `seo_description` / `seo_keywords` |

At least one of `video_url` or `youtube_url` is required.

---

## 7) Breaking news ticker

Header ticker headlines (separate from `news.is_breaking`).

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| GET | `/breaking-news` | Anyone | List **active** ticker items |
| GET | `/admin/breaking-news` | Admin | List all (active + inactive) |
| POST | `/admin/breaking-news` | Admin | Create |
| PATCH | `/admin/breaking-news/{id}` | Admin | Update |
| DELETE | `/admin/breaking-news/{id}` | Admin | Hard delete |

### Query params

| Param | Example | Meaning |
|-------|---------|---------|
| `language` | `en` or `te` | Filter language |
| `search` | `india` | Admin list only — search title |

### Create / update fields

| Field | Required? | Notes |
|-------|-----------|-------|
| `title` | Yes | 3–300 chars |
| `language` | Yes | `en` / `te` |
| `link_url` | Optional | Path or URL |
| `is_active` | Optional | default `true` |
| `sort_order` | Optional | default `0` |

Example:

```text
GET /api/v1/breaking-news?language=en
```

---

## 8) Categories & tags

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| GET | `/categories` | Anyone | List categories |
| POST | `/admin/categories` | Admin | Create |
| PATCH | `/admin/categories/{id}` | Admin | Update |
| DELETE | `/admin/categories/{id}` | Admin | Delete |
| GET | `/tags` | Anyone | List tags |
| POST | `/admin/tags` | Admin | Create |
| PATCH | `/admin/tags/{id}` | Admin | Update |
| DELETE | `/admin/tags/{id}` | Admin | Delete |

Optional query: `?search=sports`

---

## 9) Media upload (admin)

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| POST | `/admin/media/upload` | Admin | Upload image/thumbnail (multipart) to S3, get public URL |
| POST | `/admin/media/multipart/start` | Admin | Start chunked **video** upload |
| POST | `/admin/media/multipart/{id}/parts/{n}` | Admin | Upload one video chunk |
| POST | `/admin/media/multipart/complete` | Admin | Finish chunked video upload → public URL |
| POST | `/admin/media/multipart/{id}/abort` | Admin | Cancel chunked upload |

Send as **multipart/form-data**:

| Field | Example |
|-------|---------|
| `file` | image file |
| `kind` | `image` (or thumbnail/video) |
| `folder` | `news` |

Response includes `url` — use that as `image_url` when creating news.

---

## 10) Admin dashboard & users

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| GET | `/admin/dashboard` | Admin | Counts (news, drafts, views, users…) |
| GET | `/admin/users` | Admin | List users (`?search=` optional) |
| POST | `/admin/users` | Admin | Create user |
| PATCH | `/admin/users/{id}` | Admin | Update user |
| DELETE | `/admin/users/{id}` | Admin | Soft delete user |

---

## 11) Site settings (logo + primary color)

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| GET | `/site-settings` | Anyone | Public branding (logo, favicon + primary color) |
| GET | `/admin/site-settings` | Admin | Same data for CMS form |
| PATCH | `/admin/site-settings` | Admin | Update logo, favicon and/or color |

### Update fields

| Field | Required? | Notes |
|-------|-----------|-------|
| `logo_url` | Optional | From `/admin/media/upload` with `folder=brand` (or `null` to clear) |
| `favicon_url` | Optional | From `/admin/media/upload` with `folder=brand` (PNG/ICO; or `null` to clear) |
| `primary_color` | Optional | Hex like `#D71920` |

Example:

```text
GET /api/v1/site-settings
PATCH /api/v1/admin/site-settings
{ "logo_url": "https://…", "favicon_url": "https://…", "primary_color": "#D71920" }
```

---

## 12) Local news (open feed → CMS import)

Admin-only browse of regional headlines. Default provider: **Google News RSS** (fast, no API key). If `NEWS_API_KEY` is set, uses **NewsAPI.org** instead. Default focus: **Telangana / Hyderabad**. Import creates a normal CMS news row (`featured` / `latest` / `trending` / `more`).

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| GET | `/admin/local-news/states` | Admin | State/city filter options (includes **Hyderabad** plus common Indian states) |
| GET | `/admin/local-news` | Admin | List headlines (`state`, `q`, `from_date`, `to_date`, `page`, `page_size`). Each item includes `is_verified`, `verified_id`, `verdict` when already AI-checked |
| GET | `/admin/local-news/{id}` | Admin | Detail (must open from a recent list — cached ~1h) |
| POST | `/admin/local-news/{id}/import` | Admin | Create CMS news from that article |

### List query params

| Param | Default | Notes |
|-------|---------|-------|
| `state` | `Telangana` | Keyword boost for that state/city (e.g. `Telangana`, `Hyderabad`) |
| `q` | — | Extra city/topic keyword |
| `from_date` / `to_date` | — | `YYYY-MM-DD` inclusive. Sent to Google as `after:`/`before:` and also filtered server-side (RSS often ignores date operators). If omitted, feed returns recent items (~last days) |
| `page` / `page_size` | 1 / 10 | Pagination over fetched batch |

### Import body

```json
{
  "news_type": "trending",
  "language": "en",
  "status": "published",
  "is_breaking": false,
  "title": "Optional edited title",
  "short_description": "Optional edited summary",
  "image_url": "https://…",
  "category_id": null,
  "tag_ids": []
}
```

Imported rows set `is_local: true` (shown as a **Local** flag in admin news lists).

After import, the item appears under **All news**, the chosen type list, homepage section (if published), and public `/news`.

### AI verify + verified news

| Method | Path | Who | What it does |
|--------|------|-----|--------------|
| POST | `/admin/local-news/{id}/verify` | Admin | Run Gemini/OpenAI check; save into verified list |
| GET | `/admin/verified-news` | Admin | List verified items (`search`, `verdict`, page) |
| GET | `/admin/verified-news/{id}` | Admin | One verified item |
| POST | `/admin/verified-news/{id}/import` | Admin | Add into CMS news (`is_local: true`); same body as local-news import |

Verdict values: `likely_real`, `likely_fake`, `uncertain`.  
Env: `AI_VERIFY_PROVIDER=gemini|openai`, `GEMINI_API_KEY` / `OPENAI_API_KEY`.  
With `gemini` (default): if Gemini returns high-demand / 503 / similar and `OPENAI_API_KEY` is set, verify automatically falls back to OpenAI.

---

## Common workflows

### A) Publish a news article

1. Login → get token  
2. Upload image → `/admin/media/upload` → copy `url`  
3. Create news → `/admin/news` with `image_url` + `status: "published"`  
4. Public site shows it on `/news` and homepage sections by `news_type`

### B) Website search

Frontend calls:

```text
GET /news?search=keyword&language=en
GET /blogs?search=keyword&language=en
```

### C) Count views

Opening public detail (`/news/{slug}` or `/news/by-id/{id}`) increases `view_count`.  
Admin list shows that number in the Views column.

### D) Update the breaking news ticker

1. Login as admin  
2. `POST /admin/breaking-news` with `title`, `language`, `is_active: true`  
3. Public site calls `GET /breaking-news?language=en` (or `te`) and shows the ticker

### E) Change logo / primary color

1. Login as admin
2. Upload logo / favicon → `/admin/media/upload` (`folder=brand`) → copy `url`
3. `PATCH /admin/site-settings` with `logo_url`, `favicon_url`, and/or `primary_color`
4. Public site loads `GET /site-settings` and applies branding (including browser tab icon)

---

## Error cheat sheet

| HTTP | Meaning |
|------|---------|
| 400 | Bad request / validation |
| 401 | Missing/invalid token |
| 403 | Logged in but not ADMIN |
| 404 | Not found |
| 409 | Conflict (duplicate slug/email) |

---

## Related docs

- Database tables: [04-database.md](./04-database.md)
- Local Postgres setup: [21-database.md](./21-database.md)
- Auth concepts: [06-authentication.md](./06-authentication.md)
- Uploads / S3: [11-file-upload.md](./11-file-upload.md), [aws-s3-setup.md](./aws-s3-setup.md)

---

## Remember

- Always prefix paths with `/api/v1`
- Public lists only return **published** content
- Admin lists return **all statuses**
- News **image is required** on create
