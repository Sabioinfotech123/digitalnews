# Production Deployment (outline)

## Frontend

- `npm run build` → static assets
- Serve via CDN / Nginx / hosting provider
- Set `VITE_API_URL` to production API

## Backend

- Run with Gunicorn/Uvicorn workers behind reverse proxy
- TLS termination at proxy
- Managed PostgreSQL
- Object storage for media in production
- Rotate `JWT_SECRET_KEY`; never use example secrets

## Checklist

- Migrations applied
- Admin created via secure CLI/env one-time bootstrap
- CORS restricted to real origins
- Rate limiting / WAF as needed
- Health checks + logging
- robots.txt / sitemap generation

Details will expand during Phase 10.
