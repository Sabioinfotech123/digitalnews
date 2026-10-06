from fastapi import APIRouter, HTTPException, Query, status

from app.core.config import get_settings
from app.core.dependencies import AdminUser, DbSession
from app.models.content import NewsType
from app.schemas.content import NewsCreate, NewsResponse
from app.schemas.local_news import LocalNewsImportRequest, LocalNewsImportResponse
from app.schemas.verified_news import (
    LocalNewsVerifyResponse,
    PaginatedVerifiedLocalNews,
    VerifiedLocalNewsResponse,
)
from app.services.content_service import NewsService
from app.services.local_news_service import LocalNewsService, slugify_title
from app.services.verified_news_service import VerifiedLocalNewsService

router = APIRouter(tags=["verified-news"])


def _escape_html(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _escape_attr(value: str) -> str:
    return _escape_html(value).replace("'", "&#39;")


@router.get("/admin/verified-news", response_model=PaginatedVerifiedLocalNews)
def list_verified_news(
    _admin: AdminUser,
    db: DbSession,
    search: str | None = None,
    verdict: str | None = Query(default=None, description="likely_real | likely_fake | uncertain"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
) -> PaginatedVerifiedLocalNews:
    return VerifiedLocalNewsService(db).list(
        search=search,
        verdict=verdict,
        page=page,
        page_size=page_size,
    )


@router.get("/admin/verified-news/{item_id}", response_model=VerifiedLocalNewsResponse)
def get_verified_news(_admin: AdminUser, db: DbSession, item_id: str) -> VerifiedLocalNewsResponse:
    return VerifiedLocalNewsService(db).get(item_id)


@router.post(
    "/admin/verified-news/{item_id}/import",
    response_model=LocalNewsImportResponse,
    status_code=status.HTTP_201_CREATED,
)
def import_verified_news(
    item_id: str,
    payload: LocalNewsImportRequest,
    admin: AdminUser,
    db: DbSession,
) -> LocalNewsImportResponse:
    """Add a verified local-feed item into CMS news (Local flag on)."""
    item = VerifiedLocalNewsService(db).get(item_id)
    title = (payload.title or item.title).strip()[:300]
    if len(title) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")

    short = (
        payload.short_description
        if payload.short_description is not None
        else (item.description or item.title)
    )
    short = (short or title).strip()[:500]

    source = item.source_name or "source"
    default_content = "\n".join(
        [
            f"<p>{_escape_html(short)}</p>",
            f'<p><a href="{_escape_attr(item.url)}" target="_blank" rel="noopener noreferrer">'
            f"Read original article</a></p>",
            f"<p><em>Imported from verified local news · {_escape_html(source)}</em></p>",
        ]
    )
    content = (payload.content or "").strip() or default_content

    image_url = (payload.image_url if payload.image_url is not None else item.image_url) or ""
    image_url = image_url.strip() or get_settings().local_news_placeholder_image
    if not image_url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image is required — upload one or keep the source image",
        )

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


@router.post(
    "/admin/local-news/{article_id}/verify",
    response_model=LocalNewsVerifyResponse,
    status_code=status.HTTP_201_CREATED,
)
def verify_local_news_article(
    article_id: str,
    _admin: AdminUser,
    db: DbSession,
) -> LocalNewsVerifyResponse:
    """Run AI credibility check and save into Verified news."""
    article = LocalNewsService().get_article(article_id)
    item = VerifiedLocalNewsService(db).verify_from_article(article)
    return LocalNewsVerifyResponse(item=item)
