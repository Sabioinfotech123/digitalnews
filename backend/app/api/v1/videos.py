from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import AdminUser, DbSession
from app.models.content import ContentLanguage, ContentStatus
from app.schemas.content import PaginatedVideos, VideoCreate, VideoResponse, VideoUpdate
from app.services.content_service import VideoService

router = APIRouter(tags=["videos"])


@router.get("/videos", response_model=PaginatedVideos)
def list_public_videos(
    db: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    search: str | None = None,
    language: ContentLanguage | None = None,
) -> PaginatedVideos:
    return VideoService(db).list(
        page=page,
        page_size=page_size,
        search=search,
        language=language,
        published_only=True,
    )


@router.get("/videos/{slug}", response_model=VideoResponse)
def get_public_video(slug: str, db: DbSession, language: ContentLanguage | None = None) -> VideoResponse:
    service = VideoService(db)
    item = service.repo.get_by_slug(slug, language)
    if not item or item.status != ContentStatus.published:
        by_id = service.repo.get(slug)
        if by_id and by_id.status == ContentStatus.published:
            return service.get(by_id.id, increment_view=True)
        raise HTTPException(status_code=404, detail="Video not found")
    return service.get(item.id, increment_view=True)


@router.get("/admin/videos", response_model=PaginatedVideos)
def list_admin_videos(
    _admin: AdminUser,
    db: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    search: str | None = None,
    language: ContentLanguage | None = None,
    status: ContentStatus | None = None,
) -> PaginatedVideos:
    return VideoService(db).list(
        page=page,
        page_size=page_size,
        search=search,
        language=language,
        status=status,
        published_only=False,
    )


@router.post("/admin/videos", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
def create_video(payload: VideoCreate, _admin: AdminUser, db: DbSession) -> VideoResponse:
    return VideoService(db).create(payload)


@router.get("/admin/videos/{video_id}", response_model=VideoResponse)
def get_admin_video(video_id: str, _admin: AdminUser, db: DbSession) -> VideoResponse:
    return VideoService(db).get(video_id)


@router.patch("/admin/videos/{video_id}", response_model=VideoResponse)
def update_video(video_id: str, payload: VideoUpdate, _admin: AdminUser, db: DbSession) -> VideoResponse:
    return VideoService(db).update(video_id, payload)


@router.delete("/admin/videos/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(video_id: str, _admin: AdminUser, db: DbSession) -> None:
    VideoService(db).delete(video_id)
