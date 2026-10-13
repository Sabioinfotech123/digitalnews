"""Add category, SEO, and tags to videos (like blogs/news).

Revision ID: 0011_videos_catalog_fields
Revises: 0010_videos_content
Create Date: 2026-09-23
"""

from alembic import op
import sqlalchemy as sa

revision = "0011_videos_catalog_fields"
down_revision = "0010_videos_content"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("videos", sa.Column("category_id", sa.String(length=36), nullable=True))
    op.add_column("videos", sa.Column("seo_title", sa.String(length=300), nullable=True))
    op.add_column("videos", sa.Column("seo_description", sa.Text(), nullable=True))
    op.add_column("videos", sa.Column("seo_keywords", sa.String(length=500), nullable=True))
    op.create_foreign_key(
        "fk_videos_category_id_categories",
        "videos",
        "categories",
        ["category_id"],
        ["id"],
    )
    op.create_table(
        "video_tags",
        sa.Column("video_id", sa.String(length=36), sa.ForeignKey("videos.id"), primary_key=True),
        sa.Column("tag_id", sa.String(length=36), sa.ForeignKey("tags.id"), primary_key=True),
    )


def downgrade() -> None:
    op.drop_table("video_tags")
    op.drop_constraint("fk_videos_category_id_categories", "videos", type_="foreignkey")
    op.drop_column("videos", "seo_keywords")
    op.drop_column("videos", "seo_description")
    op.drop_column("videos", "seo_title")
    op.drop_column("videos", "category_id")
