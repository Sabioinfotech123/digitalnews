# Environment Variables

## Frontend (`frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:8000/api/v1`, or the QA server `http://<ip>:8088/api/v1`) |

## Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL SQLAlchemy URL (Docker default in `.env.example`) |
| `JWT_SECRET_KEY` | Signing secret |
| `JWT_ALGORITHM` | e.g. `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh TTL |
| `CORS_ORIGINS` | Comma-separated origins |
| `CORS_ALLOW_LOCALHOST` | `true` (default) — any `localhost` / `127.0.0.1` port may call the API, so `npm run dev` works against QA. Set `false` in production |
| `STORAGE_BACKEND` | `s3` (S3 only) |
| `MAX_IMAGE_SIZE_MB` / `MAX_VIDEO_SIZE_MB` | Upload limits |
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |
| `AWS_REGION` | e.g. `us-east-1` |
| `AWS_S3_BUCKET` | e.g. `digitalnews-media-prod` |
| `AWS_S3_PUBLIC_BASE_URL` | Public object URL base |
| `READ_ALOUD_POLLY_ENABLED` | `true` (default) — use Amazon Polly for “Listen to this article” when AWS keys are set |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional bootstrap (dev only) |
| `NEWS_API_KEY` | Optional. If set, Local news uses NewsAPI.org; otherwise Google News RSS |
| `LOCAL_NEWS_PLACEHOLDER_IMAGE` | Optional image URL when imported local news has no photo |
| `OPENROUTER_API_KEY` | **Agent**, **CMS** Enhance/Regenerate, and **Local feed → Verify** (one OpenRouter key) |
| `OPENROUTER_MODELS` | Comma-separated model IDs to try in order when one hits quota/errors |
| `OPENROUTER_BASE_URL` | Default `https://openrouter.ai/api/v1` |
| `AGENT_REFETCH_MINUTES` | Auto-refetch headlines while agent is **running** (default 15) |
| `AGENT_LLM_TIMEOUT_SEC` | Per OpenRouter attempt timeout on the server (default 120). Agent chat and editor AI use this. Agent chat in the UI waits up to 5 minutes. |

Never commit `.env`. See [21-database.md](./21-database.md) for Postgres + Docker.
