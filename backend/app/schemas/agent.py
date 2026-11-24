from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field

from app.models.content import ContentLanguage, NewsType


class AgentRuntimeStatus(str, Enum):
    stopped = "stopped"
    running = "running"
    paused = "paused"


class AgentControlAction(str, Enum):
    start = "start"
    stop = "stop"
    pause = "pause"
    resume = "resume"
    refetch = "refetch"


class AgentSuggestion(BaseModel):
    id: str
    title: str
    description: str | None = None
    url: str
    image_url: str | None = None
    source_name: str | None = None
    published_at: str | None = None
    feed: Literal["trending", "latest", "viral"] = "latest"


class AgentStatusResponse(BaseModel):
    status: AgentRuntimeStatus
    suggestions_count: int = 0
    last_fetch_at: datetime | None = None
    next_fetch_at: datetime | None = None
    refetch_interval_minutes: int = 15
    fetch_language: ContentLanguage = ContentLanguage.en
    openrouter_configured: bool = False
    models: list[str] = Field(default_factory=list)


class AgentControlRequest(BaseModel):
    action: AgentControlAction
    language: ContentLanguage | None = None


class AgentCredibility(BaseModel):
    title: str
    real_percent: int = Field(ge=0, le=100)
    fake_percent: int = Field(ge=0, le=100)
    verdict: Literal["likely_real", "likely_fake", "uncertain"] = "uncertain"
    summary: str = ""


class AgentDraftFields(BaseModel):
    title: str
    slug: str
    short_description: str
    content: str
    news_type: NewsType = NewsType.latest
    language: ContentLanguage = ContentLanguage.en
    image_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    source_url: str | None = None
    source_name: str | None = None


class AgentChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    suggestion_id: str | None = None
    language: ContentLanguage = ContentLanguage.en


class AgentChatResponse(BaseModel):
    assistant_message: str
    credibility: AgentCredibility
    draft: AgentDraftFields
    model_used: str