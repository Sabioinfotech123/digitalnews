# File Upload Architecture

## Flow (S3 only)

```
Admin picks file
  → FE sends binary (multipart FormData)
  → BE validates MIME + size
  → Upload to AWS S3
  → BE returns { url, key, ... }
  → FE stores url on news.image_url (or video thumbnail later)
  → Save news
```

AWS keys stay in `backend/.env` only — never in the frontend.

## News vs video

| Content | Media field | Required |
|---------|-------------|----------|
| News (featured / latest / trending / more) | `image_url` | Yes (admin form) |
| Video | `thumbnail_url` | Optional (`kind=thumbnail`) |

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

## Allowed types

- Images / thumbnails: jpeg, png, webp, gif (max `MAX_IMAGE_SIZE_MB`)
- Videos: mp4, webm (max `MAX_VIDEO_SIZE_MB`)
