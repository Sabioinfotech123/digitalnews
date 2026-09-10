# Security

## Implemented / planned controls

- Password hashing (bcrypt/argon2)
- JWT access + refresh with revocation
- Role-based authorization on admin APIs
- Pydantic input validation
- ORM parameterized queries (SQL injection protection)
- CORS allowlist
- Secrets via environment variables
- Rich-text sanitization (server + careful client render)
- Secure upload validation (MIME, extension, size, safe names)
- Rate limiting architecture for auth/search/upload
- Soft delete for recovery / audit

## Rules

- Frontend never holds DB credentials or JWT signing secrets
- Public registration cannot create ADMIN
- Do not expose internal exception traces in production
