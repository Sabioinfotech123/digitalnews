"""Link verified local news to CMS news after import.

Revision ID: 0018_verified_imported_news
Revises: 0017_news_all_news_rank
"""

from alembic import op
import sqlalchemy as sa

revision = "0018_verified_imported_news"
down_revision = "0017_news_all_news_rank"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "verified_local_news",
        sa.Column("imported_news_id", sa.String(length=36), nullable=True),
    )
    op.create_foreign_key(
        "fk_verified_local_news_imported_news_id",
        "verified_local_news",
        "news",
        ["imported_news_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_verified_local_news_imported_news_id", "verified_local_news", ["imported_news_id"])


def downgrade() -> None:
    op.drop_index("ix_verified_local_news_imported_news_id", table_name="verified_local_news")
    op.drop_constraint("fk_verified_local_news_imported_news_id", "verified_local_news", type_="foreignkey")
    op.drop_column("verified_local_news", "imported_news_id")