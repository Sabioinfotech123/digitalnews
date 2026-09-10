from fastapi import APIRouter
from sqlalchemy import func, select

from app.core.dependencies import AdminUser, DbSession
from app.models.content import ContentStatus, News
from app.repositories.user_repository import UserRepository
from app.schemas.auth import DashboardStats

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(_admin: AdminUser, db: DbSession) -> DashboardStats:
    users = UserRepository(db).count_all()
    total_news = int(
        db.scalar(select(func.count()).select_from(News).where(News.deleted_at.is_(None))) or 0
    )
    published_news = int(
        db.scalar(
            select(func.count())
            .select_from(News)
            .where(News.deleted_at.is_(None), News.status == ContentStatus.published)
        )
        or 0
    )
    draft_news = int(
        db.scalar(
            select(func.count())
            .select_from(News)
            .where(News.deleted_at.is_(None), News.status == ContentStatus.draft)
        )
        or 0
    )
    total_views = int(
        db.scalar(select(func.coalesce(func.sum(News.view_count), 0)).where(News.deleted_at.is_(None))) or 0
    )
    return DashboardStats(
        total_news=total_news,
        published_news=published_news,
        draft_news=draft_news,
        total_blogs=0,
        total_videos=0,
        total_users=users,
        total_views=total_views,
    )
