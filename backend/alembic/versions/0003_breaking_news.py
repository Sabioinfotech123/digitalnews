"""Add breaking_news ticker table.

Revision ID: 0003_breaking_news
Revises: 0002_blogs
Create Date: 2026-09-17
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_breaking_news"
down_revision = "0002_blogs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "breaking_news",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("link_url", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_breaking_news_language", "breaking_news", ["language"])
    op.create_index("ix_breaking_news_is_active", "breaking_news", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_breaking_news_is_active", table_name="breaking_news")
    op.drop_index("ix_breaking_news_language", table_name="breaking_news")
    op.drop_table("breaking_news")
