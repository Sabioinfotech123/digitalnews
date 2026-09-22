from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import AdminUser, DbSession
from app.models.content import ContentLanguage, ContentStatus, NewsType
from app.schemas.content import NewsCreate, NewsResponse, NewsUpdate, PaginatedNews
from app.services.content_service import NewsService

router = APIRouter(tags=["news"])


@router.get("/news", response_model=PaginatedNews)
def list_public_news(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    language: ContentLanguage | None = None,
    category_id: str | None = None,
    news_type: NewsType | None = None,
    is_breaking: bool | None = None,
) -> PaginatedNews:
    return NewsService(db).list(
        page=page,
        page_size=page_size,
        search=search,
        language=language,
        category_id=category_id,
        news_type=news_type,
        is_breaking=is_breaking,
        published_only=True,
    )


@router.get("/news/by-id/{news_id}", response_model=NewsResponse)
def get_public_news_by_id(news_id: str, db: DbSession) -> NewsResponse:
    service = NewsService(db)
    item = service.repo.get(news_id)
    if not item or item.status != ContentStatus.published:
        raise HTTPException(status_code=404, detail="News not found")
    return service.get(item.id, increment_view=True)


@router.get("/news/{slug}", response_model=NewsResponse)
def get_public_news(slug: str, db: DbSession, language: ContentLanguage | None = None) -> NewsResponse:
    service = NewsService(db)
    item = service.repo.get_by_slug(slug, language)
    if not item or item.status != ContentStatus.published:
        # Allow UUID in /news/:param as id fallback
        by_id = service.repo.get(slug)
        if by_id and by_id.status == ContentStatus.published:
            return service.get(by_id.id, increment_view=True)
        raise HTTPException(status_code=404, detail="News not found")
    return service.get(item.id, increment_view=True)


@router.get("/admin/news", response_model=PaginatedNews)
def list_admin_news(
    _admin: AdminUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    language: ContentLanguage | None = None,
    status_filter: ContentStatus | None = Query(default=None, alias="status"),
    category_id: str | None = None,
    news_type: NewsType | None = None,
) -> PaginatedNews:
    return NewsService(db).list(
        page=page,
        page_size=page_size,
        search=search,
        language=language,
        status=status_filter,
        category_id=category_id,
        news_type=news_type,
        published_only=False,
    )


@router.post("/admin/news", response_model=NewsResponse, status_code=status.HTTP_201_CREATED)
def create_news(payload: NewsCreate, admin: AdminUser, db: DbSession) -> NewsResponse:
    return NewsService(db).create(payload, author_id=admin.id)


@router.get("/admin/news/{news_id}", response_model=NewsResponse)
def get_admin_news(news_id: str, _admin: AdminUser, db: DbSession) -> NewsResponse:
    return NewsService(db).get(news_id)


@router.patch("/admin/news/{news_id}", response_model=NewsResponse)
def update_news(news_id: str, payload: NewsUpdate, _admin: AdminUser, db: DbSession) -> NewsResponse:
    return NewsService(db).update(news_id, payload)


@router.delete("/admin/news/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_news(news_id: str, _admin: AdminUser, db: DbSession) -> None:
    NewsService(db).delete(news_id)
