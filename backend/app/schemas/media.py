from pydantic import BaseModel


class MediaUploadResponse(BaseModel):
    key: str
    url: str
    content_type: str
    size_bytes: int
    original_filename: str
    media_kind: str
