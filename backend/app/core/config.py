from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Digital News Platform API"
    app_version: str = "0.1.0"
    debug: bool = True

    database_url: str = "postgresql+psycopg2://digitalnews:digitalnews@localhost:5432/digitalnews"

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    cors_origins: str = "http://localhost:5173,http://localhost:5174"

    # S3-only media storage
    storage_backend: str = "s3"
    max_image_size_mb: int = 5
    max_video_size_mb: int = 100

    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    aws_s3_bucket: str = "digitalnews-media-prod"
    aws_s3_public_base_url: str = "https://digitalnews-media-prod.s3.us-east-1.amazonaws.com"

    admin_email: str = "admin@example.com"
    admin_password: str = "Admin@12345"
    admin_full_name: str = "Site Admin"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
