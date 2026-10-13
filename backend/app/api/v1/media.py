from fastapi import APIRouter, File, Form, UploadFile

from app.core.dependencies import AdminUser
from app.schemas.media import (
    MediaMultipartCompleteRequest,
    MediaMultipartPartResponse,
    MediaMultipartStartRequest,
    MediaMultipartStartResponse,
    MediaUploadResponse,
)
from app.services.media_service import S3_MULTIPART_MIN_PART, MediaService

router = APIRouter(tags=["media"])


@router.post("/admin/media/upload", response_model=MediaUploadResponse)
async def upload_media(
    _admin: AdminUser,
    file: UploadFile = File(...),
    kind: str = Form(default="image"),
    folder: str = Form(default="news"),
) -> MediaUploadResponse:
    """
    Upload binary file through the API (images / thumbnails; small files).

    kind: image | thumbnail | video
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


@router.post("/admin/media/multipart/start", response_model=MediaMultipartStartResponse)
def start_multipart_upload(
    _admin: AdminUser,
    body: MediaMultipartStartRequest,
) -> MediaMultipartStartResponse:
    """Start a chunked video upload (S3 multipart). Progress advances per part."""
    session = MediaService().start_multipart(
        kind=body.kind,
        folder=body.folder,
        filename=body.filename,
        content_type=body.content_type,
        size_bytes=body.size_bytes,
    )
    return MediaMultipartStartResponse(
        session_id=session.session_id,
        key=session.key,
        part_size=S3_MULTIPART_MIN_PART,
        size_bytes=session.size_bytes,
    )


@router.post(
    "/admin/media/multipart/{session_id}/parts/{part_number}",
    response_model=MediaMultipartPartResponse,
)
async def upload_multipart_part(
    _admin: AdminUser,
    session_id: str,
    part_number: int,
    file: UploadFile = File(...),
) -> MediaMultipartPartResponse:
    data = await file.read()
    part = MediaService().upload_multipart_part(
        session_id=session_id,
        part_number=part_number,
        data=data,
    )
    return MediaMultipartPartResponse(
        etag=str(part["ETag"]),
        part_number=int(part["PartNumber"]),
        size=int(part["Size"]),
    )


@router.post("/admin/media/multipart/complete", response_model=MediaUploadResponse)
def complete_multipart_upload(
    _admin: AdminUser,
    body: MediaMultipartCompleteRequest,
) -> MediaUploadResponse:
    stored = MediaService().complete_multipart(session_id=body.session_id)
    return MediaUploadResponse(
        key=stored.key,
        url=stored.url,
        content_type=stored.content_type,
        size_bytes=stored.size_bytes,
        original_filename=stored.original_filename,
        media_kind=stored.media_kind,
    )


@router.post("/admin/media/multipart/{session_id}/abort")
def abort_multipart_upload(_admin: AdminUser, session_id: str) -> dict[str, str]:
    MediaService().abort_multipart(session_id=session_id)
    return {"status": "aborted"}
