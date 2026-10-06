from __future__ import annotations

import mimetypes
import uuid
from dataclasses import dataclass

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, UploadFile, status

from app.core.config import Settings, get_settings

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
}


@dataclass
class StoredMedia:
    key: str
    url: str
    content_type: str
    size_bytes: int
    original_filename: str
    media_kind: str  # image | video


class S3StorageBackend:
    def __init__(self, settings: Settings) -> None:
        if not settings.aws_access_key_id or not settings.aws_secret_access_key or not settings.aws_s3_bucket:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET.",
            )
        self.settings = settings
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
        self.bucket = settings.aws_s3_bucket

    def upload(self, *, key: str, data: bytes, content_type: str) -> str:
        try:
            self.client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
            )
        except (BotoCoreError, ClientError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"S3 upload failed: {exc}",
            ) from exc

        if self.settings.aws_s3_public_base_url:
            return f"{self.settings.aws_s3_public_base_url.rstrip('/')}/{key}"
        return f"https://{self.bucket}.s3.{self.settings.aws_region}.amazonaws.com/{key}"


def get_storage_backend(settings: Settings | None = None) -> S3StorageBackend:
    return S3StorageBackend(settings or get_settings())


class MediaService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.storage = get_storage_backend(self.settings)

    def _validate(self, file: UploadFile, kind: str) -> tuple[str, str]:
        content_type = (file.content_type or "").lower()
        if kind == "image":
            allowed = ALLOWED_IMAGE_TYPES
        elif kind == "video":
            allowed = ALLOWED_VIDEO_TYPES
        elif kind == "thumbnail":
            allowed = ALLOWED_IMAGE_TYPES
        else:
            raise HTTPException(status_code=400, detail="Invalid media kind")

        if content_type not in allowed:
            guessed, _ = mimetypes.guess_type(file.filename or "")
            content_type = (guessed or "").lower()
            if content_type not in allowed:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type. Allowed: {', '.join(sorted(allowed))}",
                )

        return content_type, allowed[content_type]

    async def upload(self, file: UploadFile, *, kind: str = "image", folder: str = "news") -> StoredMedia:
        content_type, extension = self._validate(file, kind)
        data = await file.read()
        max_bytes = (
            self.settings.max_video_size_mb * 1024 * 1024
            if kind == "video"
            else self.settings.max_image_size_mb * 1024 * 1024
        )
        if len(data) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        if len(data) > max_bytes:
            raise HTTPException(status_code=400, detail="File exceeds size limit")

        safe_name = f"{uuid.uuid4().hex}{extension}"
        prefix = "thumbnails" if kind == "thumbnail" else folder
        key = f"{prefix}/{safe_name}"
        url = self.storage.upload(key=key, data=data, content_type=content_type)
        return StoredMedia(
            key=key,
            url=url,
            content_type=content_type,
            size_bytes=len(data),
            original_filename=file.filename or safe_name,
            media_kind="video" if kind == "video" else "image",
        )
