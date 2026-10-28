"""Comment like/dislike reactions.

Revision ID: 0016_video_comment_reactions
Revises: 0015_video_short_engagement
"""

from alembic import op
import sqlalchemy as sa

revision = "0016_video_comment_reactions"
down_revision = "0015_video_short_engagement"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "video_comment_reactions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("comment_id", sa.String(length=36), nullable=False),
        sa.Column("visitor_key", sa.String(length=64), nullable=False),
        sa.Column("reaction", sa.String(length=16), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["comment_id"], ["video_comments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("comment_id", "visitor_key", name="uq_video_comment_reactions_comment_visitor"),
    )
    op.create_index("ix_video_comment_reactions_comment_id", "video_comment_reactions", ["comment_id"])


def downgrade() -> None:
    op.drop_index("ix_video_comment_reactions_comment_id", table_name="video_comment_reactions")
    op.drop_table("video_comment_reactions")
