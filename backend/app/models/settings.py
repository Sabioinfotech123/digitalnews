import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

DEFAULT_PRIMARY_COLOR = "#D71920"
SITE_SETTINGS_ID = "00000000-0000-4000-8000-000000000001"


class SiteSettings(Base):
    """Singleton site branding (logo + primary color)."""

    __tablename__ = "site_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    primary_color: Mapped[str] = mapped_column(
        String(7), nullable=False, default=DEFAULT_PRIMARY_COLOR
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
