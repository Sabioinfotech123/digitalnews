from pydantic import BaseModel, Field, field_validator
import re

HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


class SiteSettingsUpdate(BaseModel):
    logo_url: str | None = Field(default=None, max_length=500)
    favicon_url: str | None = Field(default=None, max_length=500)
    primary_color: str | None = Field(default=None, min_length=7, max_length=7)

    @field_validator("primary_color")
    @classmethod
    def validate_hex_color(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not HEX_COLOR_RE.match(value):
            raise ValueError("primary_color must be a hex color like #D71920")
        return value.upper()


class SiteSettingsResponse(BaseModel):
    id: str
    logo_url: str | None
    favicon_url: str | None
    primary_color: str

    model_config = {"from_attributes": True}
