from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import AdminUser, DbSession
from app.models.content import NewsType
from app.schemas.content import NewsCreate, NewsResponse
from app.schemas.local_news import (
    LocalNewsArticle,
    LocalNewsImportRequest,
    LocalNewsImportResponse,
    LocalNewsListResponse,
    LocalNewsStateOption,
)
from app.services.content_service import NewsService
from app.services.local_news_service import LocalNewsService, list_state_options, slugify_title
from app.services.verified_news_service import VerifiedLocalNewsService

router = APIRouter(tags=["local-news"])


@router.get("/admin/local-news/states", response_model=list[LocalNewsStateOption])
def list_local_news_states(_admin: AdminUser) -> list[LocalNewsStateOption]:
    return list_state_options()


@router.get("/admin/local-news", response_model=LocalNewsListResponse)
def list_local_news(
    _admin: AdminUser,
    db: DbSession,
    state: str = Query(default="Telangana"),
    q: str | None = Query(default=None, description="Extra keyword (city, topic)"),
    from_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    to_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
) -> LocalNewsListResponse:
    """Browse open local/regional headlines. Default state: Telangana (Hyderabad)."""
    data = LocalNewsService().list_articles(
        state=state,
        q=q,
        from_date=from_date,
        to_date=to_date,
        page=page,
        page_size=page_size,
    )
    items = VerifiedLocalNewsService(db).attach_verify_status(data.items)
    return data.model_copy(update={"items": items})


@router.get("/admin/local-news/{article_id}", response_model=LocalNewsArticle)
def get_local_news_article(_admin: AdminUser, db: DbSession, article_id: str) -> LocalNewsArticle:
    article = LocalNewsService().get_article(article_id)
    return VerifiedLocalNewsService(db).attach_verify_status([article])[0]


@router.post(
    "/admin/local-news/{article_id}/import",
    response_model=LocalNewsImportResponse,
    status_code=status.HTTP_201_CREATED,
)
def import_local_news_article(
    article_id: str,
    payload: LocalNewsImportRequest,
    admin: AdminUser,
    db: DbSession,
) -> LocalNewsImportResponse:
    """Add external article into CMS news (featured / latest / trending / more)."""
    service = LocalNewsService()
    article = service.get_article(article_id)
    title, short, default_content, image_url = service.build_import_content(
        article,
        title=payload.title,
        short_description=payload.short_description,
        image_url=payload.image_url,
    )
    if len(title) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")
    if not image_url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image is required — upload one or keep the source image",
        )

    content = (payload.content or "").strip() or default_content
    base_slug = slugify_title(payload.slug.strip() if payload.slug else title)
    news_service = NewsService(db)

    created: NewsResponse | None = None
    for i in range(0, 6):
        slug = base_slug[:320] if i == 0 else f"{base_slug[:300]}-{i}"
        try:
            created = news_service.create(
                NewsCreate(
                    title=title,
                    slug=slug[:320],
                    language=payload.language,
                    short_description=short,
                    content=content,
                    category_id=payload.category_id,
                    tag_ids=payload.tag_ids,
                    status=payload.status,
                    news_type=payload.news_type,
                    is_featured=payload.news_type == NewsType.featured,
                    is_breaking=payload.is_breaking,
                    is_local=True,
                    image_url=image_url[:500],
                    seo_title=(payload.seo_title or title)[:300],
                    seo_description=(payload.seo_description or short)[:500] if short else None,
                    seo_keywords=payload.seo_keywords,
                    published_at=None,
                ),
                author_id=str(admin.id),
            )
            break
        except HTTPException as exc:
            if exc.status_code == status.HTTP_409_CONFLICT:
                continue
            raise

    if created is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not create a unique slug for this article",
        )

    return LocalNewsImportResponse(
        news_id=created.id,
        slug=created.slug,
        news_type=created.news_type,
        status=created.status,
        title=created.title,
    )
