from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.bookmark import BookmarkContentType, UserBookmark
from app.models.content import Blog, ContentStatus, News, Video
from app.models.user import User
from app.schemas.bookmark import (
    BookmarkCreate,
    BookmarkIdsResponse,
    BookmarkItemResponse,
    BookmarkKey,
    PaginatedBookmarks,
)


class BookmarkService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _published_news(self, content_id: str) -> News | None:
        item = self.db.get(News, content_id)
        if not item or item.deleted_at or item.status != ContentStatus.published:
            return None
        return item

    def _published_blog(self, content_id: str) -> Blog | None:
        item = self.db.get(Blog, content_id)
        if not item or item.deleted_at or item.status != ContentStatus.published:
            return None
        return item

    def _published_video(self, content_id: str) -> Video | None:
        item = self.db.get(Video, content_id)
        if not item or item.deleted_at or item.status != ContentStatus.published:
            return None
        return item

    def _resolve_published(self, content_type: BookmarkContentType, content_id: str):
        if content_type == BookmarkContentType.news:
            return self._published_news(content_id)
        if content_type == BookmarkContentType.blog:
            return self._published_blog(content_id)
        return self._published_video(content_id)

    def add(self, user: User, payload: BookmarkCreate) -> BookmarkItemResponse:
        if not self._resolve_published(payload.content_type, payload.content_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")

        existing = self.db.scalar(
            select(UserBookmark).where(
                UserBookmark.user_id == user.id,
                UserBookmark.content_type == payload.content_type.value,
                UserBookmark.content_id == payload.content_id,
            )
        )
        if existing:
            return self._to_response(existing)

        row = UserBookmark(
            user_id=user.id,
            content_type=payload.content_type.value,
            content_id=payload.content_id,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return self._to_response(row)

    def remove(self, user: User, content_type: BookmarkContentType, content_id: str) -> None:
        row = self.db.scalar(
            select(UserBookmark).where(
                UserBookmark.user_id == user.id,
                UserBookmark.content_type == content_type.value,
                UserBookmark.content_id == content_id,
            )
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found")
        self.db.delete(row)
        self.db.commit()

    def list_ids(self, user: User) -> BookmarkIdsResponse:
        rows = self.db.scalars(
            select(UserBookmark)
            .where(UserBookmark.user_id == user.id)
            .order_by(UserBookmark.created_at.desc())
        ).all()
        return BookmarkIdsResponse(
            items=[
                BookmarkKey(content_type=BookmarkContentType(row.content_type), content_id=row.content_id)
                for row in rows
            ]
        )

    def list(
        self,
        user: User,
        *,
        content_type: BookmarkContentType | None = None,
        page: int = 1,
        page_size: int = 12,
    ) -> PaginatedBookmarks:
        page = max(1, page)
        page_size = min(max(1, page_size), 50)
        stmt = select(UserBookmark).where(UserBookmark.user_id == user.id)
        count_stmt = select(func.count()).select_from(UserBookmark).where(UserBookmark.user_id == user.id)
        if content_type:
            stmt = stmt.where(UserBookmark.content_type == content_type.value)
            count_stmt = count_stmt.where(UserBookmark.content_type == content_type.value)
        total = int(self.db.scalar(count_stmt) or 0)
        rows = self.db.scalars(
            stmt.order_by(UserBookmark.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return PaginatedBookmarks(
            items=[self._to_response(row) for row in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    def _to_response(self, row: UserBookmark) -> BookmarkItemResponse:
        ctype = BookmarkContentType(row.content_type)
        item = self._resolve_published(ctype, row.content_id)
        if item is None:
            # Still show saved row so user can remove it
            stale = self.db.get(
                News if ctype == BookmarkContentType.news else Blog if ctype == BookmarkContentType.blog else Video,
                row.content_id,
            )
            title = getattr(stale, "title", "Unavailable") if stale else "Unavailable"
            slug = getattr(stale, "slug", row.content_id) if stale else row.content_id
            language = getattr(stale, "language", "en")
            lang_val = language.value if hasattr(language, "value") else str(language)
            return BookmarkItemResponse(
                id=row.id,
                content_type=ctype,
                content_id=row.content_id,
                title=title,
                slug=slug,
                language=lang_val,
                image_url=None,
                category_name=None,
                saved_at=row.created_at,
                is_available=False,
            )

        category_name = item.category.name if getattr(item, "category", None) else None
        if ctype == BookmarkContentType.video:
            image_url = item.thumbnail_url
        else:
            image_url = item.image_url

        return BookmarkItemResponse(
            id=row.id,
            content_type=ctype,
            content_id=row.content_id,
            title=item.title,
            slug=item.slug,
            language=item.language.value,
            image_url=image_url,
            category_name=category_name,
            saved_at=row.created_at,
            is_available=True,
        )
