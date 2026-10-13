"""Add video_url and youtube_url to news; create videos catalog table.

Revision ID: 0009_news_and_videos_media
Revises: 0008_news_sort_order
Create Date: 2026-09-23
"""

from alembic import op
import sqlalchemy as sa

revision = "0009_news_and_videos_media"
down_revision = "0008_news_sort_order"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("news", sa.Column("video_url", sa.String(length=500), nullable=True))
    op.add_column("news", sa.Column("youtube_url", sa.String(length=500), nullable=True))

    op.create_table(
        "videos",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("slug", sa.String(length=320), nullable=False, index=True),
        sa.Column("language", sa.String(length=8), nullable=False, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("video_url", sa.String(length=500), nullable=True),
        sa.Column("youtube_url", sa.String(length=500), nullable=True),
        sa.Column("thumbnail_url", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft", index=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("language", "slug", name="uq_videos_language_slug"),
    )


def downgrade() -> None:
    op.drop_table("videos")
    op.drop_column("news", "youtube_url")
    op.drop_column("news", "video_url")
