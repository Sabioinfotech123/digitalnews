"""Short engagement: per-video toggles, likes, comments.

Revision ID: 0015_video_short_engagement
Revises: 0014_videos_is_short
"""

from alembic import op
import sqlalchemy as sa

revision = "0015_video_short_engagement"
down_revision = "0014_videos_is_short"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "videos",
        sa.Column("short_allow_likes", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "videos",
        sa.Column("short_allow_comments", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        "videos",
        sa.Column("short_allow_share", sa.Boolean(), nullable=False, server_default=sa.true()),
    )

    op.create_table(
        "video_likes",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("video_id", sa.String(length=36), nullable=False),
        sa.Column("visitor_key", sa.String(length=64), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["video_id"], ["videos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("video_id", "visitor_key", name="uq_video_likes_video_visitor"),
    )
    op.create_index("ix_video_likes_video_id", "video_likes", ["video_id"])

    op.create_table(
        "video_comments",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("video_id", sa.String(length=36), nullable=False),
        sa.Column("visitor_key", sa.String(length=64), nullable=False),
        sa.Column("author_name", sa.String(length=120), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("is_visible", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["video_id"], ["videos.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_video_comments_video_id", "video_comments", ["video_id"])


def downgrade() -> None:
    op.drop_index("ix_video_comments_video_id", table_name="video_comments")
    op.drop_table("video_comments")
    op.drop_index("ix_video_likes_video_id", table_name="video_likes")
    op.drop_table("video_likes")
    op.drop_column("videos", "short_allow_share")
    op.drop_column("videos", "short_allow_comments")
    op.drop_column("videos", "short_allow_likes")
