# Environment Variables

## Frontend (`frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:8000/api/v1`) |

## Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL SQLAlchemy URL (Docker default in `.env.example`) |
| `JWT_SECRET_KEY` | Signing secret |
| `JWT_ALGORITHM` | e.g. `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh TTL |
| `CORS_ORIGINS` | Comma-separated origins |
| `STORAGE_BACKEND` | `s3` (S3 only) |
| `MAX_IMAGE_SIZE_MB` / `MAX_VIDEO_SIZE_MB` | Upload limits |
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_S3_BUCKET` | e.g. `digitalnews-media-prod` |
| `AWS_S3_PUBLIC_BASE_URL` | Public object URL base |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional bootstrap (dev only) |

Never commit `.env`. See [21-database.md](./21-database.md) for Postgres + Docker.
