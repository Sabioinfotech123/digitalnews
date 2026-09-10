# AWS S3 setup (Digital News)

Bucket: `digitalnews-media`  
Region: `us-east-1`

## Fix AccessDenied (do this in AWS Console)

1. Open **IAM → Users**
2. Open the user whose access key is in `backend/.env`  
   (error showed: `prasannalakshmi.saili@sabioinfotech.com`)  
   **Better:** create user `digitalnews-s3-uploader` and use that key instead
3. **Add permissions → Create inline policy → JSON**
4. Paste contents of `docs/aws-s3-iam-policy.json`
5. Name it `DigitalNewsS3Access` → Create
6. If you created a new user: create **Access key** → put in `backend/.env`
7. Restart backend
8. Upload image again in admin

## Public images (so website can show them)

1. Open **S3 → digitalnews-media → Permissions**
2. Add **Bucket policy** (public read for objects only):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadNewsMedia",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::digitalnews-media/*"
    }
  ]
}
```

3. If Block Public Access blocks this, allow public policies for this bucket only (or use CloudFront later)

## App env (already set)

```env
STORAGE_BACKEND=s3
AWS_REGION=us-east-1
AWS_S3_BUCKET=digitalnews-media
AWS_S3_PUBLIC_BASE_URL=https://digitalnews-media.s3.us-east-1.amazonaws.com
```
