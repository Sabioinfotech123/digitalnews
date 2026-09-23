from fastapi import APIRouter

from app.api.v1 import (
    admin,
    auth,
    blogs,
    breaking_news,
    health,
    local_news,
    media,
    news,
    site_settings,
    taxonomy,
    verified_news,
    videos,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(news.router)
api_router.include_router(blogs.router)
api_router.include_router(breaking_news.router)
api_router.include_router(local_news.router)
api_router.include_router(verified_news.router)
api_router.include_router(site_settings.router)
api_router.include_router(taxonomy.router)
api_router.include_router(media.router)
api_router.include_router(videos.router)
