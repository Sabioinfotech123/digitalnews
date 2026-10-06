from datetime import datetime

from pydantic import BaseModel, Field


class VerifiedLocalNewsResponse(BaseModel):
    id: str
    external_id: str
    title: str
    description: str | None
    url: str
    image_url: str | None
    source_name: str | None
    published_at: str | None
    country: str | None
    verdict: str
    confidence: int
    ai_summary: str | None
    ai_provider: str
    verified_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedVerifiedLocalNews(BaseModel):
    items: list[VerifiedLocalNewsResponse]
    total: int
    page: int
    page_size: int


class LocalNewsVerifyResponse(BaseModel):
    item: VerifiedLocalNewsResponse
    message: str = "Verification complete"
