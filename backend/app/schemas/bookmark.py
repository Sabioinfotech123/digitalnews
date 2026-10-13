from datetime import datetime

from pydantic import BaseModel, Field

from app.models.bookmark import BookmarkContentType


class BookmarkCreate(BaseModel):
    content_type: BookmarkContentType
    content_id: str = Field(min_length=36, max_length=36)


class BookmarkKey(BaseModel):
    content_type: BookmarkContentType
    content_id: str


class BookmarkIdsResponse(BaseModel):
    items: list[BookmarkKey]


class BookmarkItemResponse(BaseModel):
    id: str
    content_type: BookmarkContentType
    content_id: str
    title: str
    slug: str
    language: str
    image_url: str | None
    category_name: str | None
    saved_at: datetime
    is_available: bool


class PaginatedBookmarks(BaseModel):
    items: list[BookmarkItemResponse]
    total: int
    page: int
    page_size: int
