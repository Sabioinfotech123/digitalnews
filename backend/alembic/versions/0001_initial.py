"""Initial schema (PostgreSQL).

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-11
"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.Enum("USER", "ADMIN", name="userrole", native_enum=False), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "categories",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_categories_slug"), "categories", ["slug"], unique=True)

    op.create_table(
        "tags",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tags_slug"), "tags", ["slug"], unique=True)

    op.create_table(
        "news",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("slug", sa.String(length=320), nullable=False),
        sa.Column("language", sa.Enum("en", "te", name="contentlanguage", native_enum=False), nullable=False),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category_id", sa.String(length=36), nullable=True),
        sa.Column("author_id", sa.String(length=36), nullable=True),
        sa.Column(
            "status",
            sa.Enum("draft", "published", "unpublished", "scheduled", name="contentstatus", native_enum=False),
            nullable=False,
        ),
        sa.Column(
            "news_type",
            sa.Enum("featured", "latest", "trending", "more", name="newstype", native_enum=False),
            nullable=False,
        ),
        sa.Column("is_featured", sa.Boolean(), nullable=False),
        sa.Column("is_breaking", sa.Boolean(), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("seo_title", sa.String(length=300), nullable=True),
        sa.Column("seo_description", sa.Text(), nullable=True),
        sa.Column("seo_keywords", sa.String(length=500), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("view_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("language", "slug", name="uq_news_language_slug"),
    )
    op.create_index(op.f("ix_news_language"), "news", ["language"], unique=False)
    op.create_index(op.f("ix_news_news_type"), "news", ["news_type"], unique=False)
    op.create_index(op.f("ix_news_slug"), "news", ["slug"], unique=False)
    op.create_index(op.f("ix_news_status"), "news", ["status"], unique=False)

    op.create_table(
        "news_tags",
        sa.Column("news_id", sa.String(length=36), nullable=False),
        sa.Column("tag_id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["news_id"], ["news.id"]),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"]),
        sa.PrimaryKeyConstraint("news_id", "tag_id"),
    )


def downgrade() -> None:
    op.drop_table("news_tags")
    op.drop_index(op.f("ix_news_status"), table_name="news")
    op.drop_index(op.f("ix_news_slug"), table_name="news")
    op.drop_index(op.f("ix_news_news_type"), table_name="news")
    op.drop_index(op.f("ix_news_language"), table_name="news")
    op.drop_table("news")
    op.drop_index(op.f("ix_tags_slug"), table_name="tags")
    op.drop_table("tags")
    op.drop_index(op.f("ix_categories_slug"), table_name="categories")
    op.drop_table("categories")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
