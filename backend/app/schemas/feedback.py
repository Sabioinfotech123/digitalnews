from datetime import datetime

from pydantic import BaseModel, Field

from app.models.feedback import FeedbackCategory, FeedbackStatus

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class FeedbackCreate(BaseModel):
    """Public submit. Name/email are ignored for logged-in users (taken from the account)."""

    name: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, max_length=255, pattern=EMAIL_PATTERN)
    category: FeedbackCategory = FeedbackCategory.general
    rating: int = Field(ge=1, le=5)
    message: str = Field(min_length=10, max_length=2000)
    page_url: str | None = Field(default=None, max_length=500)
    # Honeypot: real users never see this field; bots that fill it are rejected.
    website: str | None = Field(default=None, max_length=200)


class FeedbackUpdate(BaseModel):
    status: FeedbackStatus | None = None
    admin_note: str | None = Field(default=None, max_length=2000)


class FeedbackResponse(BaseModel):
    id: str
    user_id: str | None
    name: str
    email: str
    category: str
    rating: int | None
    message: str
    page_url: str | None
    status: str
    admin_note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FeedbackSubmitResponse(BaseModel):
    id: str
    message: str = "Thanks for your feedback"


class PaginatedFeedback(BaseModel):
    items: list[FeedbackResponse]
    total: int
    page: int
    page_size: int
    new_count: int
