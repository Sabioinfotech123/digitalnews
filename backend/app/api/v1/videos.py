from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import AdminUser, DbSession
from app.models.content import ContentLanguage, ContentStatus
from app.schemas.content import PaginatedVideos, VideoCreate, VideoResponse, VideoUpdate
from app.schemas.video_engagement import (
    VideoCommentCreate,
    VideoCommentListResponse,
    VideoCommentResponse,
    VideoEngagementResponse,
    VideoLikePayload,
)
from app.services.content_service import VideoService
from app.services.video_engagement_service import VideoEngagementService

router = APIRouter(tags=["videos"])


@router.get("/videos", response_model=PaginatedVideos)
def list_public_videos(
    db: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    search: str | None = None,
    language: ContentLanguage | None = None,
    is_short: bool | None = Query(default=None),
) -> PaginatedVideos:
    # Default public /videos = long-form only; /shorts passes is_short=true
    short_filter = is_short if is_short is not None else False
    return VideoService(db).list(
        page=page,
        page_size=page_size,
        search=search,
        language=language,
        published_only=True,
        is_short=short_filter,
    )


@router.get("/videos/{slug}/engagement", response_model=VideoEngagementResponse)
def get_video_engagement(
    slug: str,
    db: DbSession,
    language: ContentLanguage | None = None,
    visitor_key: str | None = Query(default=None, max_length=64),
) -> VideoEngagementResponse:
    return VideoEngagementService(db).engagement(slug, visitor_key=visitor_key, language=language)


@router.post("/videos/{slug}/like", response_model=VideoEngagementResponse)
def toggle_video_like(
    slug: str,
    payload: VideoLikePayload,
    db: DbSession,
    language: ContentLanguage | None = None,
) -> VideoEngagementResponse:
    return VideoEngagementService(db).toggle_like(slug, payload.visitor_key, language)


@router.get("/videos/{slug}/comments", response_model=VideoCommentListResponse)
def list_video_comments(
    slug: str,
    db: DbSession,
    language: ContentLanguage | None = None,
    limit: int = Query(default=50, ge=1, le=100),
) -> VideoCommentListResponse:
    return VideoEngagementService(db).list_comments(slug, language=language, limit=limit)


@router.post("/videos/{slug}/comments", response_model=VideoCommentResponse, status_code=status.HTTP_201_CREATED)
def create_video_comment(
    slug: str,
    payload: VideoCommentCreate,
    db: DbSession,
    language: ContentLanguage | None = None,
) -> VideoCommentResponse:
    return VideoEngagementService(db).add_comment(slug, payload, language)


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
    is_short: bool | None = None,
) -> PaginatedVideos:
    return VideoService(db).list(
        page=page,
        page_size=page_size,
        search=search,
        language=language,
        status=status,
        published_only=False,
        is_short=is_short,
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


@router.get("/admin/videos/{video_id}/comments", response_model=VideoCommentListResponse)
def admin_list_video_comments(video_id: str, _admin: AdminUser, db: DbSession) -> VideoCommentListResponse:
    return VideoEngagementService(db).admin_list_comments(video_id)


@router.delete("/admin/video-comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_video_comment(comment_id: str, _admin: AdminUser, db: DbSession) -> None:
    VideoEngagementService(db).admin_delete_comment(comment_id)
