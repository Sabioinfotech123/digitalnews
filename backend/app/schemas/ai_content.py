from typing import Literal

from pydantic import BaseModel, Field

from app.models.content import ContentLanguage

AiContentMode = Literal["enhance", "regenerate"]


class AiContentRequest(BaseModel):
    mode: AiContentMode
    title: str = Field(min_length=3, max_length=500)
    short_description: str | None = Field(default=None, max_length=2000)
    content: str = Field(default="", max_length=100_000)
    language: ContentLanguage = ContentLanguage.en


class AiContentResponse(BaseModel):
    content: str
    provider: str
