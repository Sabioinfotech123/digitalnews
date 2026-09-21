from fastapi import APIRouter

from app.core.dependencies import AdminUser, DbSession
from app.schemas.settings import SiteSettingsResponse, SiteSettingsUpdate
from app.services.settings_service import SiteSettingsService

router = APIRouter(tags=["site-settings"])


@router.get("/site-settings", response_model=SiteSettingsResponse)
def get_public_site_settings(db: DbSession) -> SiteSettingsResponse:
    """Public branding used by the website (logo, favicon + primary color)."""
    return SiteSettingsService(db).get()


@router.get("/admin/site-settings", response_model=SiteSettingsResponse)
def get_admin_site_settings(_admin: AdminUser, db: DbSession) -> SiteSettingsResponse:
    return SiteSettingsService(db).get()


@router.patch("/admin/site-settings", response_model=SiteSettingsResponse)
def update_site_settings(
    payload: SiteSettingsUpdate, _admin: AdminUser, db: DbSession
) -> SiteSettingsResponse:
    return SiteSettingsService(db).update(payload)
