"""Add site_settings table for logo + primary color.

Revision ID: 0004_site_settings
Revises: 0003_breaking_news
Create Date: 2026-09-21
"""

from alembic import op
import sqlalchemy as sa

revision = "0004_site_settings"
down_revision = "0003_breaking_news"
branch_labels = None
depends_on = None

DEFAULT_ID = "00000000-0000-4000-8000-000000000001"
DEFAULT_COLOR = "#D71920"


def upgrade() -> None:
    op.create_table(
        "site_settings",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column("primary_color", sa.String(length=7), nullable=False, server_default=DEFAULT_COLOR),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.execute(
        sa.text(
            "INSERT INTO site_settings (id, logo_url, primary_color, created_at, updated_at) "
            "VALUES ('00000000-0000-4000-8000-000000000001', NULL, '#D71920', NOW(), NOW())"
        )
    )


def downgrade() -> None:
    op.drop_table("site_settings")
