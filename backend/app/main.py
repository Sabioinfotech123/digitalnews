from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models import Category, News, Tag, User  # noqa: F401 — model registry
from app.services.auth_service import AuthService

settings = get_settings()


def bootstrap_admin() -> None:
    db = SessionLocal()
    try:
        AuthService(db).ensure_admin(
            email=settings.admin_email,
            password=settings.admin_password,
            full_name=settings.admin_full_name,
        )
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Schema is managed by Alembic (`alembic upgrade head`).
    # Admin is created from env on first boot if missing.
    bootstrap_admin()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    # Local Vite ports (any) while DEBUG=true — fixes FE on 5173/5174 calling remote/local API
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?" if settings.debug else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
