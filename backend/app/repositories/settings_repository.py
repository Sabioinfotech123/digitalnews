from sqlalchemy.orm import Session

from app.models.settings import DEFAULT_PRIMARY_COLOR, SITE_SETTINGS_ID, SiteSettings


class SiteSettingsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_or_create(self) -> SiteSettings:
        item = self.db.get(SiteSettings, SITE_SETTINGS_ID)
        if item:
            return item
        item = SiteSettings(
            id=SITE_SETTINGS_ID,
            logo_url=None,
            primary_color=DEFAULT_PRIMARY_COLOR,
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def save(self, item: SiteSettings) -> SiteSettings:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item
