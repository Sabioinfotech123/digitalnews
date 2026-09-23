from pydantic import BaseModel, Field


class MediaUploadResponse(BaseModel):
    key: str
    url: str
    content_type: str
    size_bytes: int
    original_filename: str
    media_kind: str


class MediaMultipartStartRequest(BaseModel):
    kind: str = Field(default="video", description="image | thumbnail | video")
    folder: str = Field(default="videos")
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=3, max_length=120)
    size_bytes: int = Field(gt=0)


class MediaMultipartStartResponse(BaseModel):
    session_id: str
    key: str
    part_size: int
    size_bytes: int


class MediaMultipartPartResponse(BaseModel):
    etag: str
    part_number: int
    size: int


class MediaMultipartCompleteRequest(BaseModel):
    session_id: str = Field(min_length=8, max_length=64)
