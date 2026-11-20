"""Add all_news_rank for public All news page ordering.

Revision ID: 0017_news_all_news_rank
Revises: 0016_video_comment_reactions
"""

from alembic import op
import sqlalchemy as sa

revision = "0017_news_all_news_rank"
down_revision = "0016_video_comment_reactions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("news", sa.Column("all_news_rank", sa.Integer(), nullable=True))
    op.create_index("ix_news_all_news_rank", "news", ["all_news_rank"])


def downgrade() -> None:
    op.drop_index("ix_news_all_news_rank", table_name="news")
    op.drop_column("news", "all_news_rank")