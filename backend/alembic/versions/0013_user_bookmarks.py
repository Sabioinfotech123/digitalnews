"""Add user_bookmarks table (read later).

Revision ID: 0013_user_bookmarks
Revises: 0012_feedback
Create Date: 2026-10-09
"""

from alembic import op
import sqlalchemy as sa

revision = "0013_user_bookmarks"
down_revision = "0012_feedback"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_bookmarks",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(length=36),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("content_type", sa.String(length=16), nullable=False, index=True),
        sa.Column("content_id", sa.String(length=36), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "content_type", "content_id", name="uq_user_bookmark_item"),
    )


def downgrade() -> None:
    op.drop_table("user_bookmarks")
