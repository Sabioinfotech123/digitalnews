from fastapi import APIRouter, status

from app.core.dependencies import AdminUser, DbSession
from app.models.content import ContentLanguage
from app.schemas.content import BreakingNewsCreate, BreakingNewsResponse, BreakingNewsUpdate
from app.services.content_service import BreakingNewsService

router = APIRouter(tags=["breaking-news"])


@router.get("/breaking-news", response_model=list[BreakingNewsResponse])
def list_public_breaking_news(
    db: DbSession,
    language: ContentLanguage | None = None,
) -> list[BreakingNewsResponse]:
    """Active ticker items for the public site."""
    return BreakingNewsService(db).list(language=language, active_only=True)


@router.get("/admin/breaking-news", response_model=list[BreakingNewsResponse])
def list_admin_breaking_news(
    _admin: AdminUser,
    db: DbSession,
    search: str | None = None,
    language: ContentLanguage | None = None,
) -> list[BreakingNewsResponse]:
    return BreakingNewsService(db).list(search=search, language=language, active_only=False)


@router.post(
    "/admin/breaking-news",
    response_model=BreakingNewsResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_breaking_news(
    payload: BreakingNewsCreate, _admin: AdminUser, db: DbSession
) -> BreakingNewsResponse:
    return BreakingNewsService(db).create(payload)


@router.patch("/admin/breaking-news/{item_id}", response_model=BreakingNewsResponse)
def update_breaking_news(
    item_id: str, payload: BreakingNewsUpdate, _admin: AdminUser, db: DbSession
) -> BreakingNewsResponse:
    return BreakingNewsService(db).update(item_id, payload)


@router.delete("/admin/breaking-news/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_breaking_news(item_id: str, _admin: AdminUser, db: DbSession) -> None:
    BreakingNewsService(db).delete(item_id)
