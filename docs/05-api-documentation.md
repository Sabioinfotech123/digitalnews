# API Structure

Base path: `/api/v1`

## Conventions

- JSON request/response
- Pagination: `page`, `page_size` (or `limit`/`offset`) — documented once chosen in Phase 1 schemas
- Public list/detail: published only + optional `language=en|te`
- Admin write endpoints: `Authorization: Bearer <access_token>` + role `ADMIN`
- Consistent error body: `{ "detail": "...", "code": "..." }` (FastAPI-compatible)

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Create USER |
| POST | `/auth/login` | Public | Access + refresh tokens |
| POST | `/auth/refresh` | Public | Rotate tokens |
| POST | `/auth/logout` | Auth | Revoke refresh |
| POST | `/auth/forgot-password` | Public | Request reset |
| POST | `/auth/reset-password` | Public | Complete reset |
| GET | `/auth/me` | Auth | Current user |

## News

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/news` | Public | List (language, category, featured, breaking, search) |
| GET | `/news/{slug}` | Public | Detail by slug (+ language) |
| POST | `/news` | Admin | Create |
| PATCH | `/news/{id}` | Admin | Update |
| DELETE | `/news/{id}` | Admin | Soft delete |
| GET | `/admin/news` | Admin | Full list with filters |

## Blogs / Videos

Mirror news patterns:

- `GET/POST /blogs`, `GET /blogs/{slug}`, `PATCH/DELETE /blogs/{id}`
- `GET/POST /videos`, `GET /videos/{slug}`, `PATCH/DELETE /videos/{id}`
- Admin list variants under `/admin/...`

## Taxonomy & media

| Method | Path | Auth |
|--------|------|------|
| GET/POST | `/categories` | Public GET / Admin POST |
| PATCH/DELETE | `/categories/{id}` | Admin |
| GET/POST | `/tags` | Public GET / Admin POST |
| PATCH/DELETE | `/tags/{id}` | Admin |
| POST | `/media/upload` | Admin |
| GET | `/media` | Admin |
| DELETE | `/media/{id}` | Admin |

## Search, bookmarks, users, admin

| Method | Path | Auth |
|--------|------|------|
| GET | `/search` | Public | `q`, `language`, `type`, `category` |
| GET/POST/DELETE | `/bookmarks` | Auth USER |
| GET/PATCH | `/users/me` | Auth |
| GET | `/admin/dashboard` | Admin | Counts / recent activity |
| GET | `/admin/users` | Admin | |

## Language filtering examples

```
GET /api/v1/news?language=en
GET /api/v1/news?language=te
GET /api/v1/blogs?language=en
GET /api/v1/videos?language=te
GET /api/v1/search?q=andhra&language=te&type=news
```
