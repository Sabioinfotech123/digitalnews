from datetime import datetime

from pydantic import BaseModel, Field


class VideoEngagementResponse(BaseModel):
    like_count: int
    comment_count: int
    liked_by_visitor: bool
    allow_likes: bool
    allow_comments: bool
    allow_share: bool


class VideoLikePayload(BaseModel):
    visitor_key: str = Field(min_length=8, max_length=64)


class VideoCommentCreate(BaseModel):
    visitor_key: str = Field(min_length=8, max_length=64)
    author_name: str = Field(min_length=2, max_length=120)
    body: str = Field(min_length=1, max_length=2000)


class VideoCommentResponse(BaseModel):
    id: str
    author_name: str
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}


class VideoCommentListResponse(BaseModel):
    items: list[VideoCommentResponse]
    total: int
