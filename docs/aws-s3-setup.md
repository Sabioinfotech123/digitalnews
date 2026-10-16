# AWS S3 setup (Digital News)

**Production bucket:** `digitalnews-media-prod`  
**Dev / QA bucket (if separate):** `digitalnews-media`  
Region: `us-east-1`

## Black news cards / browser shows `AllAccessDisabled`

The site stores **direct S3 URLs** in `image_url`. The browser loads them **without** your AWS keys.

If the bucket blocks anonymous read, images fail and cards look **solid black** (failed `background-image` / broken `<img>`).

Opening a URL like  
`https://digitalnews-media-prod.s3.us-east-1.amazonaws.com/news/….webp`  
may show XML: **`AllAccessDisabled`** or **`AccessDenied`**.

**Fix:** on bucket **`digitalnews-media-prod`** (not only the dev bucket), apply the steps in [Fix — public read](#fix-aws-console--public-read-for-media-objects) using `docs/aws-s3-public-read-policy.json` (ARNs use `-prod`).

No re-upload needed after the policy is saved — hard-refresh the site.

## Upload works but image URL shows AccessDenied

Upload uses your IAM key (`s3:PutObject`).  
Opening the URL in a browser uses **anonymous** `s3:GetObject`.  
If public read is missing for that prefix → **AccessDenied**.

This often happens for **logo / `brand/`** or **videos / `videos/`** when the bucket policy only allows `news/*`.

### Fix (AWS Console) — public read for media objects

1. Open **S3 → Buckets → `digitalnews-media-prod` → Permissions**  
   (for local/dev only, use `digitalnews-media` if that is what `.env` points at)
2. **Block public access** → Edit  
   - Turn **off** “Block all public access”  
   - Or at least allow public bucket policies  
   - Save (confirm)
3. **Bucket policy** → Edit → paste (or merge) this — also in `docs/aws-s3-public-read-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadNewsMedia",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::digitalnews-media-prod/news/*",
        "arn:aws:s3:::digitalnews-media-prod/brand/*",
        "arn:aws:s3:::digitalnews-media-prod/videos/*",
        "arn:aws:s3:::digitalnews-media-prod/thumbnails/*",
        "arn:aws:s3:::digitalnews-media-prod/blogs/*"
      ]
    }
  ]
}
```

4. Save  
5. Open the video / logo URL again (hard refresh). No re-upload needed.

If your existing policy already has `"Resource": "arn:aws:s3:::digitalnews-media/*"`, videos should work — then check Block public access instead.

### Prefixes the app uses

| Folder / prefix | Used for |
|-----------------|----------|
| `news/` | News + blog cover images |
| `brand/` | Logo + favicon (Settings) |
| `videos/` | Videos admin uploads (`folder=videos`) |
| `thumbnails/` | Optional video thumbnails (`kind=thumbnail`) |
| `blogs/` | Legacy blog covers (prefer `news/` for new uploads) |

### IAM user (upload permission)

Attach `docs/aws-s3-iam-policy.json` to the IAM user in `.env` so Put/Get/Delete work on this bucket (including `brand/` and `videos/`).  
If that policy already uses `arn:aws:s3:::YOUR-BUCKET/*`, uploads to `videos/` already work — you only need the **public GetObject** line above so browsers can play the file.

## App env

```env
STORAGE_BACKEND=s3
AWS_REGION=us-east-1
AWS_S3_BUCKET=digitalnews-media-prod
AWS_S3_PUBLIC_BASE_URL=https://digitalnews-media-prod.s3.us-east-1.amazonaws.com
```

Restart backend after env changes.
