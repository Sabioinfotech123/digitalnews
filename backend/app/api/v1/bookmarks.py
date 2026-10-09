from fastapi import APIRouter, Query, status

from app.core.dependencies import CurrentUser, DbSession
from app.models.bookmark import BookmarkContentType
from app.schemas.bookmark import (
    BookmarkCreate,
    BookmarkIdsResponse,
    BookmarkItemResponse,
    PaginatedBookmarks,
)
from app.services.bookmark_service import BookmarkService

router = APIRouter(tags=["bookmarks"])


@router.get("/bookmarks/ids", response_model=BookmarkIdsResponse)
def list_bookmark_ids(user: CurrentUser, db: DbSession) -> BookmarkIdsResponse:
    return BookmarkService(db).list_ids(user)


@router.get("/bookmarks", response_model=PaginatedBookmarks)
def list_bookmarks(
    user: CurrentUser,
    db: DbSession,
    content_type: BookmarkContentType | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=50),
) -> PaginatedBookmarks:
    return BookmarkService(db).list(user, content_type=content_type, page=page, page_size=page_size)


@router.post("/bookmarks", response_model=BookmarkItemResponse, status_code=status.HTTP_201_CREATED)
def add_bookmark(payload: BookmarkCreate, user: CurrentUser, db: DbSession) -> BookmarkItemResponse:
    return BookmarkService(db).add(user, payload)


@router.delete("/bookmarks/{content_type}/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_bookmark(
    content_type: BookmarkContentType,
    content_id: str,
    user: CurrentUser,
    db: DbSession,
) -> None:
    BookmarkService(db).remove(user, content_type, content_id)
