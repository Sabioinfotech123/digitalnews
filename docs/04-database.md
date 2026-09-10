# Database Design (ER)

## Conventions

- Primary keys: UUID (`uuid`) where appropriate
- Timestamps: `created_at`, `updated_at`; content has `published_at`
- Soft delete: `deleted_at` nullable on content/media/users as needed
- Language: single `language` column (`en` | `te`) on content tables — **not** separate EN/TE tables
- Content rows are independent (not assumed translations of each other)
- Optional future: `translation_group_id` nullable for linking translations later

## Entity relationship (conceptual)

```
users ─┬─< bookmarks >─┬─ news
       │               ├─ blogs
       │               └─ videos
       └─< reading_history >─┬─ news / blogs / videos

categories ─< news / blogs / videos
tags ─< content_tags (M2M) >─ news / blogs / videos
media ─ referenced by featured images / thumbnails / video files
users ─ author_id on news / blogs / videos
refresh_tokens >─ users
```

## Core tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | VARCHAR UNIQUE | |
| password_hash | VARCHAR | bcrypt/argon2 |
| full_name | VARCHAR | |
| role | ENUM | `USER`, `ADMIN` |
| is_active | BOOLEAN | |
| created_at / updated_at / deleted_at | TIMESTAMP | |

### news
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| title | VARCHAR | |
| slug | VARCHAR | unique per language |
| language | VARCHAR(2) | `en` \| `te`, indexed |
| short_description | TEXT | |
| content | TEXT | sanitized HTML |
| category_id | UUID FK | |
| author_id | UUID FK → users | |
| featured_image_id | UUID FK → media | nullable |
| status | ENUM | draft / published / unpublished / scheduled |
| is_featured | BOOLEAN | |
| is_breaking | BOOLEAN | |
| seo_title / seo_description / seo_keywords | VARCHAR/TEXT | |
| published_at | TIMESTAMP | nullable |
| view_count | INT | default 0 |
| created_at / updated_at / deleted_at | TIMESTAMP | |

**Indexes:** `(language)`, `(language, status)`, `(language, published_at DESC)`, `(language, category_id)`, unique `(language, slug)` where not deleted.

### blogs
Same pattern as news without `is_breaking`; cover image instead of featured image naming.

### videos
Same pattern as news; fields for `video_media_id`, `thumbnail_id`, optional `duration_seconds`.

### categories
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| slug | VARCHAR UNIQUE | |
| name | VARCHAR | expandable later for i18n |
| description | TEXT | |
| image_id | UUID FK | nullable |
| is_active | BOOLEAN | |
| created_at / updated_at | TIMESTAMP | |

### tags
id, name, slug (unique), timestamps.

### media
id, storage_key, original_filename, mime_type, size_bytes, media_type (image/video), url/path, uploaded_by, timestamps, deleted_at.

### bookmarks
id, user_id, content_type (news/blog/video), content_id, created_at. Unique `(user_id, content_type, content_id)`.

### reading_history
id, user_id, content_type, content_id, viewed_at. Configurable / disableable later.

### refresh_tokens (optional but planned)
id, user_id, token_hash, expires_at, revoked_at, created_at.

### audit_logs (optional)
id, actor_id, action, entity_type, entity_id, metadata JSON, created_at.

## M2M: content_tags

Polymorphic or separate `news_tags` / `blog_tags` / `video_tags`. Prefer explicit join tables for clarity and FK integrity.
