# File Upload Architecture

## Flow (S3 only)

**Images / thumbnails** (small):

```
Admin picks file
  → FE multipart → API validates → API put_object → S3
  → FE stores returned url
```

**Videos** (chunked — size counter advances):

```
Admin picks video
  → FE POST /admin/media/multipart/start
  → FE sends 5MB parts → API upload_part → S3 (repeat)
  → FE POST /admin/media/multipart/complete
  → FE stores public url on videos.video_url
```

AWS keys stay in `backend/.env` only — never in the frontend.

## News vs video

| Content | Media field | Required |
|---------|-------------|----------|
| News | `image_url` | Yes (admin form) |
| Videos catalog | `video_url` and/or `youtube_url` | At least one; uploaded video must be **16:9** |
| Videos catalog | `thumbnail_url` | Required if `video_url` is set; any size **except 9:16**; optional for YouTube-only |

## Env (`backend/.env`)

```env
STORAGE_BACKEND=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=digitalnews-media
AWS_S3_PUBLIC_BASE_URL=https://digitalnews-media.s3.us-east-1.amazonaws.com
```

Bucket objects must be readable publicly (bucket policy `s3:GetObject`) so images show on the site.

## API

`POST /api/v1/admin/media/upload` (admin JWT)

- multipart: `file`, `kind` (`image` | `thumbnail` | `video`), `folder` (`news` | `videos`)
- response: `{ key, url, content_type, size_bytes, original_filename, media_kind }`

### Video chunked upload

| Method | Path | What |
|--------|------|------|
| POST | `/admin/media/multipart/start` | JSON `{ kind, folder, filename, content_type, size_bytes }` → `{ session_id, part_size }` |
| POST | `/admin/media/multipart/{session_id}/parts/{n}` | multipart `file` (one chunk) |
| POST | `/admin/media/multipart/complete` | JSON `{ session_id }` → same as upload response |
| POST | `/admin/media/multipart/{session_id}/abort` | Cancel |

Part size is **5MB** (S3 minimum for non-final parts). The UI shows **uploaded / total** while parts run.

## Allowed types

- Images / thumbnails: jpeg, png, webp, gif (max `MAX_IMAGE_SIZE_MB`)
- Videos: mp4, webm (max `MAX_VIDEO_SIZE_MB`)

## Timeouts (large videos)

| Layer | Limit |
|-------|--------|
| FE part / upload requests | image/thumbnail **2 min**; video **10 min** |
| nginx `/api/` (QA/prod) | `proxy_send_timeout` / `proxy_read_timeout` **600s** |
