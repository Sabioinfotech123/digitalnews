"""Add sort_order to news for admin-controlled homepage ordering.

Revision ID: 0008_news_sort_order
Revises: 0007_verified_local_news
Create Date: 2026-09-22
"""

from alembic import op
import sqlalchemy as sa

revision = "0008_news_sort_order"
down_revision = "0007_verified_local_news"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "news",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_news_sort_order", "news", ["sort_order"])


def downgrade() -> None:
    op.drop_index("ix_news_sort_order", table_name="news")
    op.drop_column("news", "sort_order")
