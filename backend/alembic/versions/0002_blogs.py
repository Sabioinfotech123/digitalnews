"""Add blogs and blog_tags tables.

Revision ID: 0002_blogs
Revises: 0001_initial
Create Date: 2026-09-15
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_blogs"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "blogs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("slug", sa.String(length=320), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category_id", sa.String(length=36), sa.ForeignKey("categories.id"), nullable=True),
        sa.Column("author_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("seo_title", sa.String(length=300), nullable=True),
        sa.Column("seo_description", sa.Text(), nullable=True),
        sa.Column("seo_keywords", sa.String(length=500), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("language", "slug", name="uq_blogs_language_slug"),
    )
    op.create_index("ix_blogs_slug", "blogs", ["slug"])
    op.create_index("ix_blogs_language", "blogs", ["language"])
    op.create_index("ix_blogs_status", "blogs", ["status"])

    op.create_table(
        "blog_tags",
        sa.Column("blog_id", sa.String(length=36), sa.ForeignKey("blogs.id"), primary_key=True),
        sa.Column("tag_id", sa.String(length=36), sa.ForeignKey("tags.id"), primary_key=True),
    )


def downgrade() -> None:
    op.drop_table("blog_tags")
    op.drop_index("ix_blogs_status", table_name="blogs")
    op.drop_index("ix_blogs_language", table_name="blogs")
    op.drop_index("ix_blogs_slug", table_name="blogs")
    op.drop_table("blogs")
