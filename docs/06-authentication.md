# Authentication Architecture

## Roles

| Role | Access |
|------|--------|
| `USER` | Public features, profile, bookmarks, reading history |
| `ADMIN` | Full CMS; never granted by public registration |

Backend RBAC is the security boundary. Frontend route guards only improve UX.

## Token model

- **Access token (JWT):** short-lived; claims include `sub` (user id), `role`, `exp`
- **Refresh token:** longer-lived; stored hashed in `refresh_tokens`; rotatable
- Password hashing: bcrypt or argon2 via passlib / pwdlib
- Never expose secrets to the frontend

## Flows

1. **Register** → create `USER` → optional auto-login
2. **Login** → validate credentials → issue access + refresh
3. **Refresh** → validate refresh → new access (+ rotate refresh)
4. **Logout** → revoke refresh token
5. **Forgot / reset password** → tokenized email flow (architecture ready; email provider configurable)
6. **Admin login** → same auth endpoints; frontend `/admin/*` requires `role === ADMIN`

## Frontend

- Axios interceptor attaches `Authorization` header
- On 401, attempt refresh once; else clear session and redirect
- `AuthProvider` holds user + tokens (memory + secure storage strategy for refresh)
- Protected routes: `RequireAuth`, `RequireAdmin`

## Admin bootstrap

Do **not** hard-code production credentials.

Use either:

- Env-driven initial admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) on first boot, or
- CLI: `python -m scripts.create_admin`

## Password reset (planned)

Store one-time hashed reset tokens with expiry. Rate-limit request endpoints.
