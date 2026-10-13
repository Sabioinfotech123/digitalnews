from pydantic import BaseModel, Field

from app.models.content import ContentLanguage, ContentStatus, NewsType

# Common Indian states / UT / cities for the Local news filter (keyword-based).
INDIA_STATES: list[str] = [
    "Telangana",
    "Hyderabad",
    "Andhra Pradesh",
    "Karnataka",
    "Maharashtra",
    "Tamil Nadu",
    "Kerala",
    "Delhi",
    "West Bengal",
    "Gujarat",
    "Rajasthan",
    "Uttar Pradesh",
    "Madhya Pradesh",
    "Odisha",
    "Punjab",
    "Haryana",
    "Bihar",
    "Jharkhand",
    "Assam",
    "Goa",
    "India",
]


class LocalNewsStateOption(BaseModel):
    value: str
    label: str


class LocalNewsArticle(BaseModel):
    id: str
    title: str
    description: str | None = None
    content: str | None = None
    url: str
    image_url: str | None = None
    source_name: str | None = None
    published_at: str | None = None
    language: str | None = None
    country: str | None = None
    is_verified: bool = False
    verified_id: str | None = None
    verdict: str | None = None


class LocalNewsListResponse(BaseModel):
    items: list[LocalNewsArticle]
    total: int
    page: int
    page_size: int
    state: str
    query: str
    provider: str = "gdelt"


class LocalNewsImportRequest(BaseModel):
    news_type: NewsType = NewsType.latest
    language: ContentLanguage = ContentLanguage.en
    status: ContentStatus = ContentStatus.published
    category_id: str | None = None
    tag_ids: list[str] = Field(default_factory=list)
    is_breaking: bool = False
    title: str | None = Field(default=None, min_length=3, max_length=300)
    slug: str | None = Field(default=None, min_length=3, max_length=320)
    short_description: str | None = None
    content: str | None = None
    image_url: str | None = Field(default=None, max_length=500)
    seo_title: str | None = None
    seo_description: str | None = None
    seo_keywords: str | None = None


class LocalNewsImportResponse(BaseModel):
    news_id: str
    slug: str
    news_type: NewsType
    status: ContentStatus
    title: str
    message: str = "Imported into CMS news"
