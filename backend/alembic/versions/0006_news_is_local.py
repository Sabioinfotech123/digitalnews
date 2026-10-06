"""Add is_local flag to news (imported from Local news).

Revision ID: 0006_news_is_local
Revises: 0005_site_settings_favicon
Create Date: 2026-09-22
"""

from alembic import op
import sqlalchemy as sa

revision = "0006_news_is_local"
down_revision = "0005_site_settings_favicon"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "news",
        sa.Column("is_local", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("news", "is_local")
