from fastapi import APIRouter, status

from app.core.dependencies import AdminUser, DbSession
from app.schemas.content import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    TagCreate,
    TagResponse,
    TagUpdate,
)
from app.services.content_service import CategoryService, TagService

router = APIRouter(tags=["taxonomy"])


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: DbSession, search: str | None = None) -> list[CategoryResponse]:
    return CategoryService(db).list(search)


@router.post("/admin/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, _admin: AdminUser, db: DbSession) -> CategoryResponse:
    return CategoryService(db).create(payload)


@router.patch("/admin/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: str, payload: CategoryUpdate, _admin: AdminUser, db: DbSession
) -> CategoryResponse:
    return CategoryService(db).update(category_id, payload)


@router.delete("/admin/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: str, _admin: AdminUser, db: DbSession) -> None:
    CategoryService(db).delete(category_id)


@router.get("/tags", response_model=list[TagResponse])
def list_tags(db: DbSession, search: str | None = None) -> list[TagResponse]:
    return TagService(db).list(search)


@router.post("/admin/tags", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(payload: TagCreate, _admin: AdminUser, db: DbSession) -> TagResponse:
    return TagService(db).create(payload)


@router.patch("/admin/tags/{tag_id}", response_model=TagResponse)
def update_tag(tag_id: str, payload: TagUpdate, _admin: AdminUser, db: DbSession) -> TagResponse:
    return TagService(db).update(tag_id, payload)


@router.delete("/admin/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(tag_id: str, _admin: AdminUser, db: DbSession) -> None:
    TagService(db).delete(tag_id)
