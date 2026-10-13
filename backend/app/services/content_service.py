from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.content import Blog, ContentLanguage, ContentStatus, News, NewsType, Video
from app.repositories.content_repository import (
    BlogRepository,
    BreakingNewsRepository,
    CategoryRepository,
    NewsRepository,
    TagRepository,
    VideoRepository,
)
from app.schemas.content import (
    BlogCreate,
    BlogResponse,
    BlogUpdate,
    BreakingNewsCreate,
    BreakingNewsResponse,
    BreakingNewsUpdate,
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    NewsCreate,
    NewsResponse,
    NewsUpdate,
    PaginatedBlogs,
    PaginatedNews,
    PaginatedVideos,
    TagCreate,
    TagResponse,
    TagUpdate,
    VideoCreate,
    VideoResponse,
    VideoUpdate,
)


def _news_response(item: News) -> NewsResponse:
    return NewsResponse(
        id=item.id,
        title=item.title,
        slug=item.slug,
        language=item.language,
        short_description=item.short_description,
        content=item.content,
        category_id=item.category_id,
        category_name=item.category.name if item.category else None,
        author_id=item.author_id,
        author_name=item.author.full_name if item.author else None,
        status=item.status,
        news_type=item.news_type,
        is_featured=item.is_featured,
        is_breaking=item.is_breaking,
        is_local=bool(getattr(item, "is_local", False)),
        sort_order=int(getattr(item, "sort_order", 0) or 0),
        image_url=item.image_url,
        video_url=getattr(item, "video_url", None),
        youtube_url=getattr(item, "youtube_url", None),
        seo_title=item.seo_title,
        seo_description=item.seo_description,
        seo_keywords=item.seo_keywords,
        published_at=item.published_at,
        view_count=item.view_count,
        created_at=item.created_at,
        updated_at=item.updated_at,
        tags=[TagResponse.model_validate(tag) for tag in item.tags],
    )


class CategoryService:
    def __init__(self, db: Session) -> None:
        self.repo = CategoryRepository(db)

    def list(self, search: str | None = None) -> list[CategoryResponse]:
        return [CategoryResponse.model_validate(item) for item in self.repo.list(search)]

    def create(self, payload: CategoryCreate) -> CategoryResponse:
        if self.repo.get_by_slug(payload.slug):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category slug already exists")
        item = self.repo.create(**payload.model_dump())
        return CategoryResponse.model_validate(item)

    def update(self, category_id: str, payload: CategoryUpdate) -> CategoryResponse:
        item = self.repo.get(category_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        data = payload.model_dump(exclude_unset=True)
        if "slug" in data and data["slug"] != item.slug and self.repo.get_by_slug(data["slug"]):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category slug already exists")
        for key, value in data.items():
            setattr(item, key, value)
        return CategoryResponse.model_validate(self.repo.save(item))

    def delete(self, category_id: str) -> None:
        item = self.repo.get(category_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        self.repo.delete(item)


class TagService:
    def __init__(self, db: Session) -> None:
        self.repo = TagRepository(db)

    def list(self, search: str | None = None) -> list[TagResponse]:
        return [TagResponse.model_validate(item) for item in self.repo.list(search)]

    def create(self, payload: TagCreate) -> TagResponse:
        if self.repo.get_by_slug(payload.slug):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tag slug already exists")
        item = self.repo.create(**payload.model_dump())
        return TagResponse.model_validate(item)

    def update(self, tag_id: str, payload: TagUpdate) -> TagResponse:
        item = self.repo.get(tag_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
        data = payload.model_dump(exclude_unset=True)
        if "slug" in data and data["slug"] != item.slug and self.repo.get_by_slug(data["slug"]):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tag slug already exists")
        for key, value in data.items():
            setattr(item, key, value)
        return TagResponse.model_validate(self.repo.save(item))

    def delete(self, tag_id: str) -> None:
        item = self.repo.get(tag_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
        self.repo.delete(item)


class NewsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = NewsRepository(db)
        self.tags = TagRepository(db)

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
    ) -> PaginatedNews:
        items, total = self.repo.list(
            page=page,
            page_size=page_size,
            search=search,
            language=language,
            status=status,
            category_id=category_id,
            news_type=news_type,
            published_only=published_only,
            is_breaking=is_breaking,
        )
        return PaginatedNews(
            items=[_news_response(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get(self, news_id: str, *, increment_view: bool = False) -> NewsResponse:
        item = self.repo.get(news_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News not found")
        if increment_view:
            self.repo.increment_view(news_id)
            item = self.repo.get(news_id) or item
        return _news_response(item)

    def create(self, payload: NewsCreate, author_id: str) -> NewsResponse:
        existing = self.repo.get_by_slug(payload.slug, payload.language)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already used for this language")
        tags = self.tags.get_many(payload.tag_ids)
        news_type = payload.news_type
        is_featured = payload.is_featured or news_type == NewsType.featured
        news = News(
            title=payload.title,
            slug=payload.slug,
            language=payload.language,
            short_description=payload.short_description,
            content=payload.content,
            category_id=payload.category_id,
            author_id=author_id,
            status=payload.status,
            news_type=news_type,
            is_featured=is_featured,
            is_breaking=payload.is_breaking,
            is_local=payload.is_local,
            sort_order=max(0, int(payload.sort_order or 0)),
            image_url=payload.image_url,
            video_url=payload.video_url,
            youtube_url=payload.youtube_url,
            seo_title=payload.seo_title,
            seo_description=payload.seo_description,
            seo_keywords=payload.seo_keywords,
            published_at=payload.published_at
            or (datetime.now(timezone.utc) if payload.status == ContentStatus.published else None),
            tags=tags,
        )
        return _news_response(self.repo.create(news))

    def update(self, news_id: str, payload: NewsUpdate) -> NewsResponse:
        item = self.repo.get(news_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News not found")
        data = payload.model_dump(exclude_unset=True)
        tag_ids = data.pop("tag_ids", None)
        next_slug = data.get("slug", item.slug)
        next_language = data.get("language", item.language)
        if next_slug != item.slug or next_language != item.language:
            clash = self.repo.get_by_slug(next_slug, next_language)
            if clash and clash.id != item.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already used for this language")

        # Swap display order within same type + language when target slot is taken.
        if "sort_order" in data:
            new_order = max(0, int(data["sort_order"] or 0))
            old_order = int(getattr(item, "sort_order", 0) or 0)
            data["sort_order"] = new_order
            if new_order != old_order:
                target_type = data.get("news_type", item.news_type)
                target_lang = data.get("language", item.language)
                other = self.repo.get_by_sort_order(
                    news_type=target_type,
                    language=target_lang,
                    sort_order=new_order,
                    exclude_id=item.id,
                )
                if other:
                    other.sort_order = old_order
                    self.repo.db.add(other)

        for key, value in data.items():
            setattr(item, key, value)
        if "news_type" in data:
            item.is_featured = item.news_type == NewsType.featured or bool(item.is_featured)
            if item.news_type == NewsType.featured:
                item.is_featured = True
        if tag_ids is not None:
            item.tags = self.tags.get_many(tag_ids)
        if item.status == ContentStatus.published and item.published_at is None:
            item.published_at = datetime.now(timezone.utc)
        return _news_response(self.repo.save(item))

    def delete(self, news_id: str) -> None:
        item = self.repo.get(news_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="News not found")
        item.deleted_at = datetime.now(timezone.utc)
        self.repo.save(item)


def _blog_response(item: Blog) -> BlogResponse:
    return BlogResponse(
        id=item.id,
        title=item.title,
        slug=item.slug,
        language=item.language,
        short_description=item.short_description,
        content=item.content,
        category_id=item.category_id,
        category_name=item.category.name if item.category else None,
        author_id=item.author_id,
        author_name=item.author.full_name if item.author else None,
        status=item.status,
        image_url=item.image_url,
        seo_title=item.seo_title,
        seo_description=item.seo_description,
        seo_keywords=item.seo_keywords,
        published_at=item.published_at,
        view_count=item.view_count,
        created_at=item.created_at,
        updated_at=item.updated_at,
        tags=[TagResponse.model_validate(tag) for tag in item.tags],
    )


class BlogService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = BlogRepository(db)
        self.tags = TagRepository(db)

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
    ) -> PaginatedBlogs:
        items, total = self.repo.list(
            page=page,
            page_size=page_size,
            search=search,
            language=language,
            status=status,
            category_id=category_id,
            published_only=published_only,
        )
        return PaginatedBlogs(
            items=[_blog_response(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get(self, blog_id: str) -> BlogResponse:
        item = self.repo.get(blog_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
        return _blog_response(item)

    def create(self, payload: BlogCreate, author_id: str) -> BlogResponse:
        existing = self.repo.get_by_slug(payload.slug, payload.language)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already used for this language")
        tags = self.tags.get_many(payload.tag_ids)
        blog = Blog(
            title=payload.title,
            slug=payload.slug,
            language=payload.language,
            short_description=payload.short_description,
            content=payload.content,
            category_id=payload.category_id,
            author_id=author_id,
            status=payload.status,
            image_url=payload.image_url,
            seo_title=payload.seo_title,
            seo_description=payload.seo_description,
            seo_keywords=payload.seo_keywords,
            published_at=payload.published_at
            or (datetime.now(timezone.utc) if payload.status == ContentStatus.published else None),
            tags=tags,
        )
        return _blog_response(self.repo.create(blog))

    def update(self, blog_id: str, payload: BlogUpdate) -> BlogResponse:
        item = self.repo.get(blog_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
        data = payload.model_dump(exclude_unset=True)
        tag_ids = data.pop("tag_ids", None)
        next_slug = data.get("slug", item.slug)
        next_language = data.get("language", item.language)
        if next_slug != item.slug or next_language != item.language:
            clash = self.repo.get_by_slug(next_slug, next_language)
            if clash and clash.id != item.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already used for this language")
        for key, value in data.items():
            setattr(item, key, value)
        if tag_ids is not None:
            item.tags = self.tags.get_many(tag_ids)
        if item.status == ContentStatus.published and item.published_at is None:
            item.published_at = datetime.now(timezone.utc)
        return _blog_response(self.repo.save(item))

    def delete(self, blog_id: str) -> None:
        item = self.repo.get(blog_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found")
        item.deleted_at = datetime.now(timezone.utc)
        self.repo.save(item)


class BreakingNewsService:
    def __init__(self, db: Session) -> None:
        self.repo = BreakingNewsRepository(db)

    def list(
        self,
        *,
        search: str | None = None,
        language: ContentLanguage | None = None,
        active_only: bool = False,
    ) -> list[BreakingNewsResponse]:
        return [
            BreakingNewsResponse.model_validate(item)
            for item in self.repo.list(search=search, language=language, active_only=active_only)
        ]

    def create(self, payload: BreakingNewsCreate) -> BreakingNewsResponse:
        item = self.repo.create(**payload.model_dump())
        return BreakingNewsResponse.model_validate(item)

    def update(self, item_id: str, payload: BreakingNewsUpdate) -> BreakingNewsResponse:
        item = self.repo.get(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Breaking news not found")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, key, value)
        return BreakingNewsResponse.model_validate(self.repo.save(item))

    def delete(self, item_id: str) -> None:
        item = self.repo.get(item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Breaking news not found")
        self.repo.delete(item)


def _require_video_source(
    *,
    video_url: str | None,
    youtube_url: str | None,
    thumbnail_url: str | None = None,
) -> None:
    has_file = bool((video_url or "").strip())
    has_yt = bool((youtube_url or "").strip())
    if not has_file and not has_yt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a video file or add a YouTube URL (or both)",
        )
    if has_file and not (thumbnail_url or "").strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Thumbnail is required when uploading a video file",
        )


def _video_response(item: Video) -> VideoResponse:
    return VideoResponse(
        id=item.id,
        title=item.title,
        slug=item.slug,
        language=item.language,
        description=item.description,
        content=item.content or "",
        category_id=item.category_id,
        category_name=item.category.name if item.category else None,
        video_url=item.video_url,
        youtube_url=item.youtube_url,
        thumbnail_url=item.thumbnail_url,
        status=item.status,
        sort_order=int(item.sort_order or 0),
        seo_title=item.seo_title,
        seo_description=item.seo_description,
        seo_keywords=item.seo_keywords,
        view_count=item.view_count,
        published_at=item.published_at,
        created_at=item.created_at,
        updated_at=item.updated_at,
        tags=[TagResponse.model_validate(tag) for tag in item.tags],
    )


class VideoService:
    def __init__(self, db: Session) -> None:
        self.repo = VideoRepository(db)
        self.tags = TagRepository(db)

    def list(
        self,
        *,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        language: ContentLanguage | None = None,
        status: ContentStatus | None = None,
        published_only: bool = False,
    ) -> PaginatedVideos:
        items, total = self.repo.list(
            page=page,
            page_size=page_size,
            search=search,
            language=language,
            status=status,
            published_only=published_only,
        )
        return PaginatedVideos(
            items=[_video_response(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get(self, video_id: str, *, increment_view: bool = False) -> VideoResponse:
        item = self.repo.get(video_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
        if increment_view:
            self.repo.increment_view(video_id)
            item = self.repo.get(video_id) or item
        return _video_response(item)

    def create(self, payload: VideoCreate) -> VideoResponse:
        _require_video_source(
            video_url=payload.video_url,
            youtube_url=payload.youtube_url,
            thumbnail_url=payload.thumbnail_url,
        )
        if self.repo.get_by_slug(payload.slug, payload.language):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already used for this language")
        tags = self.tags.get_many(payload.tag_ids)
        video = Video(
            title=payload.title,
            slug=payload.slug,
            language=payload.language,
            description=payload.description,
            content=payload.content or "",
            category_id=payload.category_id,
            video_url=payload.video_url,
            youtube_url=payload.youtube_url,
            thumbnail_url=payload.thumbnail_url,
            status=payload.status,
            sort_order=max(0, int(payload.sort_order or 0)),
            seo_title=payload.seo_title,
            seo_description=payload.seo_description,
            seo_keywords=payload.seo_keywords,
            published_at=payload.published_at
            or (datetime.now(timezone.utc) if payload.status == ContentStatus.published else None),
            tags=tags,
        )
        return _video_response(self.repo.create(video))

    def update(self, video_id: str, payload: VideoUpdate) -> VideoResponse:
        item = self.repo.get(video_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
        data = payload.model_dump(exclude_unset=True)
        tag_ids = data.pop("tag_ids", None)
        next_slug = data.get("slug", item.slug)
        next_language = data.get("language", item.language)
        if next_slug != item.slug or next_language != item.language:
            clash = self.repo.get_by_slug(next_slug, next_language)
            if clash and clash.id != item.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already used for this language")
        for key, value in data.items():
            setattr(item, key, value)
        if tag_ids is not None:
            item.tags = self.tags.get_many(tag_ids)
        _require_video_source(
            video_url=item.video_url,
            youtube_url=item.youtube_url,
            thumbnail_url=item.thumbnail_url,
        )
        if item.status == ContentStatus.published and item.published_at is None:
            item.published_at = datetime.now(timezone.utc)
        return _video_response(self.repo.save(item))

    def delete(self, video_id: str) -> None:
        item = self.repo.get(video_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
        item.deleted_at = datetime.now(timezone.utc)
        self.repo.save(item)
