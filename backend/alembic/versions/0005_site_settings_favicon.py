"""Add favicon_url to site_settings.

Revision ID: 0005_site_settings_favicon
Revises: 0004_site_settings
Create Date: 2026-09-21
"""

from alembic import op
import sqlalchemy as sa

revision = "0005_site_settings_favicon"
down_revision = "0004_site_settings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "site_settings",
        sa.Column("favicon_url", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("site_settings", "favicon_url")
