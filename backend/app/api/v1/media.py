from fastapi import APIRouter, File, Form, UploadFile

from app.core.dependencies import AdminUser
from app.schemas.media import MediaUploadResponse
from app.services.media_service import MediaService

router = APIRouter(tags=["media"])


@router.post("/admin/media/upload", response_model=MediaUploadResponse)
async def upload_media(
    _admin: AdminUser,
    file: UploadFile = File(...),
    kind: str = Form(default="image"),
    folder: str = Form(default="news"),
) -> MediaUploadResponse:
    """
    Upload binary file (image or optional video thumbnail).

    kind: image | thumbnail | video
    - news images → kind=image, folder=news
    - video thumbnails (optional) → kind=thumbnail, folder=videos
    """
    stored = await MediaService().upload(file, kind=kind, folder=folder)
    return MediaUploadResponse(
        key=stored.key,
        url=stored.url,
        content_type=stored.content_type,
        size_bytes=stored.size_bytes,
        original_filename=stored.original_filename,
        media_kind=stored.media_kind,
    )
