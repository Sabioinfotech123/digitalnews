from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

CommentReactionKind = Literal["like", "dislike"]


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
    like_count: int = 0
    dislike_count: int = 0
    viewer_reaction: CommentReactionKind | None = None


class VideoCommentReactionPayload(BaseModel):
    visitor_key: str = Field(min_length=8, max_length=64)
    reaction: CommentReactionKind


class VideoCommentListResponse(BaseModel):
    items: list[VideoCommentResponse]
    total: int
