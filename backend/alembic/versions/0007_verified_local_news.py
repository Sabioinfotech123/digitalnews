"""Add verified_local_news table for AI news verification.

Revision ID: 0007_verified_local_news
Revises: 0006_news_is_local
Create Date: 2026-09-22
"""

from alembic import op
import sqlalchemy as sa

revision = "0007_verified_local_news"
down_revision = "0006_news_is_local"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "verified_local_news",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("external_id", sa.String(length=64), nullable=False, unique=True, index=True),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("url", sa.String(length=1000), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("source_name", sa.String(length=255), nullable=True),
        sa.Column("published_at", sa.String(length=64), nullable=True),
        sa.Column("country", sa.String(length=120), nullable=True),
        sa.Column(
            "verdict",
            sa.String(length=32),
            nullable=False,
            server_default="uncertain",
        ),
        sa.Column("confidence", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ai_summary", sa.Text(), nullable=True),
        sa.Column("ai_provider", sa.String(length=40), nullable=False, server_default="gemini"),
        sa.Column("raw_response", sa.Text(), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("verified_local_news")
