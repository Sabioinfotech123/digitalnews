# AWS S3 setup (Digital News)

Bucket: `digitalnews-media`  
Region: `us-east-1`

## Upload works but image URL shows AccessDenied

Upload uses your IAM key (`s3:PutObject`).  
Opening the URL in a browser uses **anonymous** `s3:GetObject`.  
If public read is missing for that prefix → **AccessDenied**.

This often happens for **logo / `brand/`** or **videos / `videos/`** when the bucket policy only allows `news/*`.

### Fix (AWS Console) — public read for media objects

1. Open **S3 → Buckets → digitalnews-media → Permissions**  
   (use your real bucket name if different, e.g. `digitalnews-media-prod`)
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
        "arn:aws:s3:::digitalnews-media/news/*",
        "arn:aws:s3:::digitalnews-media/brand/*",
        "arn:aws:s3:::digitalnews-media/videos/*",
        "arn:aws:s3:::digitalnews-media/thumbnails/*"
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
| `news/` | News cover images + news article video files |
| `brand/` | Logo + favicon (Settings) |
| `videos/` | Videos admin uploads (`folder=videos`) |
| `thumbnails/` | Optional video thumbnails (`kind=thumbnail`) |

### IAM user (upload permission)

Attach `docs/aws-s3-iam-policy.json` to the IAM user in `.env` so Put/Get/Delete work on this bucket (including `brand/` and `videos/`).  
If that policy already uses `arn:aws:s3:::YOUR-BUCKET/*`, uploads to `videos/` already work — you only need the **public GetObject** line above so browsers can play the file.

## App env

```env
STORAGE_BACKEND=s3
AWS_REGION=us-east-1
AWS_S3_BUCKET=digitalnews-media
AWS_S3_PUBLIC_BASE_URL=https://digitalnews-media.s3.us-east-1.amazonaws.com
```

Restart backend after env changes.
