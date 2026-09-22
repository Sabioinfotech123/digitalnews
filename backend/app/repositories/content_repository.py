from __future__ import annotations

from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, selectinload

from app.models.content import Blog, BreakingNews, Category, ContentLanguage, ContentStatus, News, NewsType, Tag


class CategoryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, search: str | None = None) -> list[Category]:
        stmt = select(Category).order_by(Category.name.asc())
        if search:
            like = f"%{search}%"
            stmt = stmt.where(or_(Category.name.ilike(like), Category.slug.ilike(like)))
        return list(self.db.scalars(stmt).all())

    def get(self, category_id: str) -> Category | None:
        return self.db.get(Category, category_id)

    def get_by_slug(self, slug: str) -> Category | None:
        return self.db.scalar(select(Category).where(Category.slug == slug))

    def create(self, **kwargs) -> Category:
        item = Category(**kwargs)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def save(self, item: Category) -> Category:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: Category) -> None:
        self.db.delete(item)
        self.db.commit()


class TagRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, search: str | None = None) -> list[Tag]:
        stmt = select(Tag).order_by(Tag.name.asc())
        if search:
            like = f"%{search}%"
            stmt = stmt.where(or_(Tag.name.ilike(like), Tag.slug.ilike(like)))
        return list(self.db.scalars(stmt).all())

    def get(self, tag_id: str) -> Tag | None:
        return self.db.get(Tag, tag_id)

    def get_many(self, ids: list[str]) -> list[Tag]:
        if not ids:
            return []
        return list(self.db.scalars(select(Tag).where(Tag.id.in_(ids))).all())

    def get_by_slug(self, slug: str) -> Tag | None:
        return self.db.scalar(select(Tag).where(Tag.slug == slug))

    def create(self, **kwargs) -> Tag:
        item = Tag(**kwargs)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def save(self, item: Tag) -> Tag:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: Tag) -> None:
        self.db.delete(item)
        self.db.commit()


class NewsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _base(self):
        return select(News).where(News.deleted_at.is_(None)).options(
            selectinload(News.tags),
            selectinload(News.category),
            selectinload(News.author),
        )

    def list(
        self,
        *,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        language: ContentLanguage | None = None,
        status: ContentStatus | None = None,
        category_id: str | None = None,
        news_type: NewsType | None = None,
        published_only: bool = False,
        is_breaking: bool | None = None,
    ) -> tuple[list[News], int]:
        stmt = self._base()
        count_stmt = select(func.count()).select_from(News).where(News.deleted_at.is_(None))

        if published_only:
            stmt = stmt.where(News.status == ContentStatus.published)
            count_stmt = count_stmt.where(News.status == ContentStatus.published)
        if language:
            stmt = stmt.where(News.language == language)
            count_stmt = count_stmt.where(News.language == language)
        if status:
            stmt = stmt.where(News.status == status)
            count_stmt = count_stmt.where(News.status == status)
        if category_id:
            stmt = stmt.where(News.category_id == category_id)
            count_stmt = count_stmt.where(News.category_id == category_id)
        if news_type:
            stmt = stmt.where(News.news_type == news_type)
            count_stmt = count_stmt.where(News.news_type == news_type)
        if is_breaking is not None:
            stmt = stmt.where(News.is_breaking.is_(is_breaking))
            count_stmt = count_stmt.where(News.is_breaking.is_(is_breaking))
        if search:
            like = f"%{search}%"
            filter_expr = or_(News.title.ilike(like), News.slug.ilike(like), News.short_description.ilike(like))
            stmt = stmt.where(filter_expr)
            count_stmt = count_stmt.where(filter_expr)

        total = int(self.db.scalar(count_stmt) or 0)
        stmt = stmt.order_by(News.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        return list(self.db.scalars(stmt).all()), total

    def get(self, news_id: str) -> News | None:
        return self.db.scalar(self._base().where(News.id == news_id))

    def get_by_slug(self, slug: str, language: ContentLanguage | None = None) -> News | None:
        stmt = self._base().where(News.slug == slug)
        if language:
            stmt = stmt.where(News.language == language)
        return self.db.scalar(stmt)

    def increment_view(self, news_id: str) -> None:
        self.db.execute(
            update(News)
            .where(News.id == news_id, News.deleted_at.is_(None))
            .values(view_count=News.view_count + 1)
        )
        self.db.commit()

    def create(self, news: News) -> News:
        self.db.add(news)
        self.db.commit()
        self.db.refresh(news)
        return self.get(news.id) or news

    def save(self, news: News) -> News:
        self.db.add(news)
        self.db.commit()
        self.db.refresh(news)
        return self.get(news.id) or news


class BlogRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _base(self):
        return select(Blog).where(Blog.deleted_at.is_(None)).options(
            selectinload(Blog.tags),
            selectinload(Blog.category),
            selectinload(Blog.author),
        )

    def list(
        self,
        *,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        language: ContentLanguage | None = None,
        status: ContentStatus | None = None,
        category_id: str | None = None,
        published_only: bool = False,
    ) -> tuple[list[Blog], int]:
        stmt = self._base()
        count_stmt = select(func.count()).select_from(Blog).where(Blog.deleted_at.is_(None))

        if published_only:
            stmt = stmt.where(Blog.status == ContentStatus.published)
            count_stmt = count_stmt.where(Blog.status == ContentStatus.published)
        if language:
            stmt = stmt.where(Blog.language == language)
            count_stmt = count_stmt.where(Blog.language == language)
        if status:
            stmt = stmt.where(Blog.status == status)
            count_stmt = count_stmt.where(Blog.status == status)
        if category_id:
            stmt = stmt.where(Blog.category_id == category_id)
            count_stmt = count_stmt.where(Blog.category_id == category_id)
        if search:
            like = f"%{search}%"
            filter_expr = or_(Blog.title.ilike(like), Blog.slug.ilike(like), Blog.short_description.ilike(like))
            stmt = stmt.where(filter_expr)
            count_stmt = count_stmt.where(filter_expr)

        total = int(self.db.scalar(count_stmt) or 0)
        stmt = stmt.order_by(Blog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        return list(self.db.scalars(stmt).all()), total

    def get(self, blog_id: str) -> Blog | None:
        return self.db.scalar(self._base().where(Blog.id == blog_id))

    def get_by_slug(self, slug: str, language: ContentLanguage | None = None) -> Blog | None:
        stmt = self._base().where(Blog.slug == slug)
        if language:
            stmt = stmt.where(Blog.language == language)
        return self.db.scalar(stmt)

    def create(self, blog: Blog) -> Blog:
        self.db.add(blog)
        self.db.commit()
        self.db.refresh(blog)
        return self.get(blog.id) or blog

    def save(self, blog: Blog) -> Blog:
        self.db.add(blog)
        self.db.commit()
        self.db.refresh(blog)
        return self.get(blog.id) or blog

    def count_all(self) -> int:
        return int(
            self.db.scalar(select(func.count()).select_from(Blog).where(Blog.deleted_at.is_(None))) or 0
        )


class BreakingNewsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(
        self,
        *,
        search: str | None = None,
        language: ContentLanguage | None = None,
        active_only: bool = False,
    ) -> list[BreakingNews]:
        stmt = select(BreakingNews).order_by(BreakingNews.sort_order.asc(), BreakingNews.created_at.desc())
        if language:
            stmt = stmt.where(BreakingNews.language == language)
        if active_only:
            stmt = stmt.where(BreakingNews.is_active.is_(True))
        if search:
            like = f"%{search}%"
            stmt = stmt.where(BreakingNews.title.ilike(like))
        return list(self.db.scalars(stmt).all())

    def get(self, item_id: str) -> BreakingNews | None:
        return self.db.get(BreakingNews, item_id)

    def create(self, **kwargs) -> BreakingNews:
        item = BreakingNews(**kwargs)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def save(self, item: BreakingNews) -> BreakingNews:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: BreakingNews) -> None:
        self.db.delete(item)
        self.db.commit()
