# AWS S3 setup (Digital News)

Bucket: `digitalnews-media-prod`  
Region: `us-east-1`

## Upload works but image URL shows AccessDenied

Upload uses your IAM key (`s3:PutObject`).  
Opening the URL in a browser uses **anonymous** `s3:GetObject`.  
If the bucket is private → **AccessDenied**.

### Fix (AWS Console) — public read for media objects

1. Open **S3 → Buckets → digitalnews-media-prod → Permissions**
2. **Block public access** → Edit  
   - Turn **off** “Block all public access”  
   - Or at least allow public bucket policies  
   - Save (confirm)
3. **Bucket policy** → Edit → paste `docs/aws-s3-public-read-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadNewsMedia",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::digitalnews-media-prod/*"
    }
  ]
}
```

4. Save  
5. Open the image URL again (hard refresh). Already-uploaded keys work once the policy is on.

### IAM user (upload permission)

Attach `docs/aws-s3-iam-policy.json` to the IAM user in `.env` so Put/Get/Delete work on this bucket.

## App env

```env
STORAGE_BACKEND=s3
AWS_REGION=us-east-1
AWS_S3_BUCKET=digitalnews-media-prod
AWS_S3_PUBLIC_BASE_URL=https://digitalnews-media-prod.s3.us-east-1.amazonaws.com
```

Restart backend after env changes.
