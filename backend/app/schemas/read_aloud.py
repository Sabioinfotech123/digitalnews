from typing import Literal

from pydantic import BaseModel, Field

ReadAloudLang = Literal["en", "te"]


class ReadAloudCapabilities(BaseModel):
    polly: bool
    polly_reason: str | None = None


class ReadAloudRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2500)
    language: ReadAloudLang = "en"
