from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.models import User  # noqa: F401
from app.models.content import Category, News, Tag  # noqa: F401
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


def ensure_sqlite_news_columns() -> None:
    """Add newer news columns to existing SQLite DBs."""
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.begin() as conn:
        tables = {row[0] for row in conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).fetchall()}
        if "news" not in tables:
            return
        cols = {row[1] for row in conn.execute(text("PRAGMA table_info(news)")).fetchall()}
        if "news_type" not in cols:
            conn.execute(text("ALTER TABLE news ADD COLUMN news_type VARCHAR(20) DEFAULT 'latest' NOT NULL"))
            conn.execute(text("UPDATE news SET news_type = 'featured' WHERE is_featured = 1"))
        if "image_url" not in cols:
            conn.execute(text("ALTER TABLE news ADD COLUMN image_url VARCHAR(500)"))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_sqlite_news_columns()
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
