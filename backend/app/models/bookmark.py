import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BookmarkContentType(str, enum.Enum):
    news = "news"
    blog = "blog"
    video = "video"


class UserBookmark(Base):
    """Saved news / blog / video for a logged-in user (read later)."""

    __tablename__ = "user_bookmarks"
    __table_args__ = (
        UniqueConstraint("user_id", "content_type", "content_id", name="uq_user_bookmark_item"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content_type: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    content_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
