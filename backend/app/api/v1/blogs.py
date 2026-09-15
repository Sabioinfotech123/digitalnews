from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import AdminUser, DbSession
from app.models.content import ContentLanguage, ContentStatus
from app.schemas.content import BlogCreate, BlogResponse, BlogUpdate, PaginatedBlogs
from app.services.content_service import BlogService

router = APIRouter(tags=["blogs"])


@router.get("/blogs", response_model=PaginatedBlogs)
def list_public_blogs(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    language: ContentLanguage | None = None,
    category_id: str | None = None,
) -> PaginatedBlogs:
    return BlogService(db).list(
        page=page,
        page_size=page_size,
        search=search,
        language=language,
        category_id=category_id,
        published_only=True,
    )


@router.get("/blogs/by-id/{blog_id}", response_model=BlogResponse)
def get_public_blog_by_id(blog_id: str, db: DbSession) -> BlogResponse:
    service = BlogService(db)
    item = service.repo.get(blog_id)
    if not item or item.status != ContentStatus.published:
        raise HTTPException(status_code=404, detail="Blog not found")
    return service.get(item.id)


@router.get("/blogs/{slug}", response_model=BlogResponse)
def get_public_blog(slug: str, db: DbSession, language: ContentLanguage | None = None) -> BlogResponse:
    service = BlogService(db)
    item = service.repo.get_by_slug(slug, language)
    if not item or item.status != ContentStatus.published:
        by_id = service.repo.get(slug)
        if by_id and by_id.status == ContentStatus.published:
            return service.get(by_id.id)
        raise HTTPException(status_code=404, detail="Blog not found")
    return service.get(item.id)


@router.get("/admin/blogs", response_model=PaginatedBlogs)
def list_admin_blogs(
    _admin: AdminUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    language: ContentLanguage | None = None,
    status_filter: ContentStatus | None = Query(default=None, alias="status"),
    category_id: str | None = None,
) -> PaginatedBlogs:
    return BlogService(db).list(
        page=page,
        page_size=page_size,
        search=search,
        language=language,
        status=status_filter,
        category_id=category_id,
        published_only=False,
    )


@router.post("/admin/blogs", response_model=BlogResponse, status_code=status.HTTP_201_CREATED)
def create_blog(payload: BlogCreate, admin: AdminUser, db: DbSession) -> BlogResponse:
    return BlogService(db).create(payload, author_id=admin.id)


@router.get("/admin/blogs/{blog_id}", response_model=BlogResponse)
def get_admin_blog(blog_id: str, _admin: AdminUser, db: DbSession) -> BlogResponse:
    return BlogService(db).get(blog_id)


@router.patch("/admin/blogs/{blog_id}", response_model=BlogResponse)
def update_blog(blog_id: str, payload: BlogUpdate, _admin: AdminUser, db: DbSession) -> BlogResponse:
    return BlogService(db).update(blog_id, payload)


@router.delete("/admin/blogs/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blog(blog_id: str, _admin: AdminUser, db: DbSession) -> None:
    BlogService(db).delete(blog_id)
