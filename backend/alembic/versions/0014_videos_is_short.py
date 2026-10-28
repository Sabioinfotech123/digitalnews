"""Add is_short and duration_seconds to videos.

Revision ID: 0014_videos_is_short
Revises: 0013_user_bookmarks
"""

from alembic import op
import sqlalchemy as sa

revision = "0014_videos_is_short"
down_revision = "0013_user_bookmarks"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "videos",
        sa.Column("is_short", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "videos",
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
    )
    op.create_index("ix_videos_is_short", "videos", ["is_short"])


def downgrade() -> None:
    op.drop_index("ix_videos_is_short", table_name="videos")
    op.drop_column("videos", "duration_seconds")
    op.drop_column("videos", "is_short")
