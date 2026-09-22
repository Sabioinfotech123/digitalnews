from sqlalchemy.orm import Session

from app.repositories.settings_repository import SiteSettingsRepository
from app.schemas.settings import SiteSettingsResponse, SiteSettingsUpdate


class SiteSettingsService:
    def __init__(self, db: Session) -> None:
        self.repo = SiteSettingsRepository(db)

    def get(self) -> SiteSettingsResponse:
        return SiteSettingsResponse.model_validate(self.repo.get_or_create())

    def update(self, payload: SiteSettingsUpdate) -> SiteSettingsResponse:
        item = self.repo.get_or_create()
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(item, key, value)
        return SiteSettingsResponse.model_validate(self.repo.save(item))
