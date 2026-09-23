from __future__ import annotations

import mimetypes
import time
import uuid
from dataclasses import dataclass, field
from threading import Lock

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

# S3 requires every part except the last to be at least 5 MiB.
S3_MULTIPART_MIN_PART = 5 * 1024 * 1024
MULTIPART_SESSION_TTL_SEC = 60 * 60


@dataclass
class StoredMedia:
    key: str
    url: str
    content_type: str
    size_bytes: int
    original_filename: str
    media_kind: str  # image | video


@dataclass
class MultipartSession:
    session_id: str
    s3_upload_id: str
    key: str
    content_type: str
    size_bytes: int
    original_filename: str
    media_kind: str
    parts: list[dict[str, str | int]] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)


_MULTIPART_LOCK = Lock()
_MULTIPART_SESSIONS: dict[str, MultipartSession] = {}


def _purge_stale_sessions() -> None:
    now = time.time()
    stale = [sid for sid, s in _MULTIPART_SESSIONS.items() if now - s.created_at > MULTIPART_SESSION_TTL_SEC]
    for sid in stale:
        _MULTIPART_SESSIONS.pop(sid, None)


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

    def public_url(self, key: str) -> str:
        if self.settings.aws_s3_public_base_url:
            return f"{self.settings.aws_s3_public_base_url.rstrip('/')}/{key}"
        return f"https://{self.bucket}.s3.{self.settings.aws_region}.amazonaws.com/{key}"

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
        return self.public_url(key)

    def create_multipart(self, *, key: str, content_type: str) -> str:
        try:
            resp = self.client.create_multipart_upload(
                Bucket=self.bucket,
                Key=key,
                ContentType=content_type,
            )
        except (BotoCoreError, ClientError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"S3 multipart start failed: {exc}",
            ) from exc
        return str(resp["UploadId"])

    def upload_part(self, *, key: str, upload_id: str, part_number: int, data: bytes) -> str:
        try:
            resp = self.client.upload_part(
                Bucket=self.bucket,
                Key=key,
                UploadId=upload_id,
                PartNumber=part_number,
                Body=data,
            )
        except (BotoCoreError, ClientError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"S3 part upload failed: {exc}",
            ) from exc
        return str(resp["ETag"])

    def complete_multipart(self, *, key: str, upload_id: str, parts: list[dict[str, str | int]]) -> str:
        try:
            self.client.complete_multipart_upload(
                Bucket=self.bucket,
                Key=key,
                UploadId=upload_id,
                MultipartUpload={
                    "Parts": [
                        {"ETag": p["ETag"], "PartNumber": int(p["PartNumber"])}
                        for p in sorted(parts, key=lambda row: int(row["PartNumber"]))
                    ]
                },
            )
        except (BotoCoreError, ClientError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"S3 multipart complete failed: {exc}",
            ) from exc
        return self.public_url(key)

    def abort_multipart(self, *, key: str, upload_id: str) -> None:
        try:
            self.client.abort_multipart_upload(Bucket=self.bucket, Key=key, UploadId=upload_id)
        except (BotoCoreError, ClientError):
            pass


def get_storage_backend(settings: Settings | None = None) -> S3StorageBackend:
    return S3StorageBackend(settings or get_settings())


class MediaService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.storage = get_storage_backend(self.settings)

    def _allowed_map(self, kind: str) -> dict[str, str]:
        if kind == "image":
            return ALLOWED_IMAGE_TYPES
        if kind == "video":
            return ALLOWED_VIDEO_TYPES
        if kind == "thumbnail":
            return ALLOWED_IMAGE_TYPES
        raise HTTPException(status_code=400, detail="Invalid media kind")

    def _validate_kind_and_type(self, kind: str, content_type: str, filename: str) -> tuple[str, str]:
        content_type = (content_type or "").lower()
        allowed = self._allowed_map(kind)
        if content_type not in allowed:
            guessed, _ = mimetypes.guess_type(filename or "")
            content_type = (guessed or "").lower()
            if content_type not in allowed:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type. Allowed: {', '.join(sorted(allowed))}",
                )
        return content_type, allowed[content_type]

    def _max_bytes(self, kind: str) -> int:
        if kind == "video":
            return self.settings.max_video_size_mb * 1024 * 1024
        return self.settings.max_image_size_mb * 1024 * 1024

    def _object_key(self, *, kind: str, folder: str, extension: str) -> str:
        safe_name = f"{uuid.uuid4().hex}{extension}"
        prefix = "thumbnails" if kind == "thumbnail" else folder
        return f"{prefix}/{safe_name}"

    def _validate(self, file: UploadFile, kind: str) -> tuple[str, str]:
        return self._validate_kind_and_type(kind, file.content_type or "", file.filename or "")

    async def upload(self, file: UploadFile, *, kind: str = "image", folder: str = "news") -> StoredMedia:
        content_type, extension = self._validate(file, kind)
        data = await file.read()
        max_bytes = self._max_bytes(kind)
        if len(data) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        if len(data) > max_bytes:
            raise HTTPException(status_code=400, detail="File exceeds size limit")

        key = self._object_key(kind=kind, folder=folder, extension=extension)
        url = self.storage.upload(key=key, data=data, content_type=content_type)
        return StoredMedia(
            key=key,
            url=url,
            content_type=content_type,
            size_bytes=len(data),
            original_filename=file.filename or key.split("/")[-1],
            media_kind="video" if kind == "video" else "image",
        )

    def start_multipart(
        self,
        *,
        kind: str,
        folder: str,
        filename: str,
        content_type: str,
        size_bytes: int,
    ) -> MultipartSession:
        content_type, extension = self._validate_kind_and_type(kind, content_type, filename)
        max_bytes = self._max_bytes(kind)
        if size_bytes <= 0:
            raise HTTPException(status_code=400, detail="Empty file")
        if size_bytes > max_bytes:
            raise HTTPException(status_code=400, detail="File exceeds size limit")

        key = self._object_key(kind=kind, folder=folder, extension=extension)
        s3_upload_id = self.storage.create_multipart(key=key, content_type=content_type)
        session = MultipartSession(
            session_id=uuid.uuid4().hex,
            s3_upload_id=s3_upload_id,
            key=key,
            content_type=content_type,
            size_bytes=size_bytes,
            original_filename=filename,
            media_kind="video" if kind == "video" else "image",
        )
        with _MULTIPART_LOCK:
            _purge_stale_sessions()
            _MULTIPART_SESSIONS[session.session_id] = session
        return session

    def _get_session(self, session_id: str) -> MultipartSession:
        with _MULTIPART_LOCK:
            _purge_stale_sessions()
            session = _MULTIPART_SESSIONS.get(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Upload session expired or not found")
        return session

    def upload_multipart_part(self, *, session_id: str, part_number: int, data: bytes) -> dict[str, str | int]:
        if part_number < 1 or part_number > 10000:
            raise HTTPException(status_code=400, detail="Invalid part number")
        if not data:
            raise HTTPException(status_code=400, detail="Empty part")

        session = self._get_session(session_id)
        uploaded_before = sum(int(p.get("Size", 0)) for p in session.parts)
        remaining_after = session.size_bytes - uploaded_before - len(data)
        if remaining_after > 0 and len(data) < S3_MULTIPART_MIN_PART:
            raise HTTPException(
                status_code=400,
                detail=f"Each part except the last must be at least {S3_MULTIPART_MIN_PART} bytes",
            )

        etag = self.storage.upload_part(
            key=session.key,
            upload_id=session.s3_upload_id,
            part_number=part_number,
            data=data,
        )
        part = {"ETag": etag, "PartNumber": part_number, "Size": len(data)}
        with _MULTIPART_LOCK:
            session.parts = [p for p in session.parts if int(p["PartNumber"]) != part_number]
            session.parts.append(part)
        return {"ETag": etag, "PartNumber": part_number, "Size": len(data)}

    def complete_multipart(self, *, session_id: str) -> StoredMedia:
        session = self._get_session(session_id)
        if not session.parts:
            raise HTTPException(status_code=400, detail="No parts uploaded")

        url = self.storage.complete_multipart(
            key=session.key,
            upload_id=session.s3_upload_id,
            parts=[{"ETag": p["ETag"], "PartNumber": p["PartNumber"]} for p in session.parts],
        )
        with _MULTIPART_LOCK:
            _MULTIPART_SESSIONS.pop(session_id, None)

        return StoredMedia(
            key=session.key,
            url=url,
            content_type=session.content_type,
            size_bytes=session.size_bytes,
            original_filename=session.original_filename,
            media_kind=session.media_kind,
        )

    def abort_multipart(self, *, session_id: str) -> None:
        with _MULTIPART_LOCK:
            session = _MULTIPART_SESSIONS.pop(session_id, None)
        if not session:
            return
        self.storage.abort_multipart(key=session.key, upload_id=session.s3_upload_id)
