"""Add content HTML body to videos (like news).

Revision ID: 0010_videos_content
Revises: 0009_news_and_videos_media
Create Date: 2026-09-23
"""

from alembic import op
import sqlalchemy as sa

revision = "0010_videos_content"
down_revision = "0009_news_and_videos_media"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "videos",
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
    )
    op.alter_column("videos", "content", server_default=None)


def downgrade() -> None:
    op.drop_column("videos", "content")
