from datetime import datetime

from pydantic import BaseModel, Field

from app.models.content import ContentLanguage, ContentStatus, NewsType


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=160)
    description: str | None = None
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    slug: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = None
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    slug: str = Field(min_length=1, max_length=160)


class TagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    slug: str | None = Field(default=None, min_length=1, max_length=160)


class TagResponse(BaseModel):
    id: str
    name: str
    slug: str
    created_at: datetime

    model_config = {"from_attributes": True}


class NewsCreate(BaseModel):
    title: str = Field(min_length=3, max_length=300)
    slug: str = Field(min_length=3, max_length=320)
    language: ContentLanguage
    short_description: str | None = None
    content: str = ""
    category_id: str | None = None
    tag_ids: list[str] = Field(default_factory=list)
    status: ContentStatus = ContentStatus.draft
    news_type: NewsType = NewsType.latest
    is_featured: bool = False
    is_breaking: bool = False
    image_url: str = Field(min_length=1, max_length=500)
    seo_title: str | None = None
    seo_description: str | None = None
    seo_keywords: str | None = None
    published_at: datetime | None = None


class NewsUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=300)
    slug: str | None = Field(default=None, min_length=3, max_length=320)
    language: ContentLanguage | None = None
    short_description: str | None = None
    content: str | None = None
    category_id: str | None = None
    tag_ids: list[str] | None = None
    status: ContentStatus | None = None
    news_type: NewsType | None = None
    is_featured: bool | None = None
    is_breaking: bool | None = None
    image_url: str | None = Field(default=None, min_length=1, max_length=500)
    seo_title: str | None = None
    seo_description: str | None = None
    seo_keywords: str | None = None
    published_at: datetime | None = None


class NewsResponse(BaseModel):
    id: str
    title: str
    slug: str
    language: ContentLanguage
    short_description: str | None
    content: str
    category_id: str | None
    category_name: str | None = None
    author_id: str | None
    author_name: str | None = None
    status: ContentStatus
    news_type: NewsType
    is_featured: bool
    is_breaking: bool
    image_url: str | None = None
    seo_title: str | None
    seo_description: str | None
    seo_keywords: str | None
    published_at: datetime | None
    view_count: int
    created_at: datetime
    updated_at: datetime
    tags: list[TagResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class PaginatedNews(BaseModel):
    items: list[NewsResponse]
    total: int
    page: int
    page_size: int


class BlogCreate(BaseModel):
    title: str = Field(min_length=3, max_length=300)
    slug: str = Field(min_length=3, max_length=320)
    language: ContentLanguage
    short_description: str | None = None
    content: str = ""
    category_id: str | None = None
    tag_ids: list[str] = Field(default_factory=list)
    status: ContentStatus = ContentStatus.draft
    image_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    seo_keywords: str | None = None
    published_at: datetime | None = None


class BlogUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=300)
    slug: str | None = Field(default=None, min_length=3, max_length=320)
    language: ContentLanguage | None = None
    short_description: str | None = None
    content: str | None = None
    category_id: str | None = None
    tag_ids: list[str] | None = None
    status: ContentStatus | None = None
    image_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    seo_keywords: str | None = None
    published_at: datetime | None = None


class BlogResponse(BaseModel):
    id: str
    title: str
    slug: str
    language: ContentLanguage
    short_description: str | None
    content: str
    category_id: str | None
    category_name: str | None = None
    author_id: str | None
    author_name: str | None = None
    status: ContentStatus
    image_url: str | None = None
    seo_title: str | None
    seo_description: str | None
    seo_keywords: str | None
    published_at: datetime | None
    view_count: int
    created_at: datetime
    updated_at: datetime
    tags: list[TagResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class PaginatedBlogs(BaseModel):
    items: list[BlogResponse]
    total: int
    page: int
    page_size: int
