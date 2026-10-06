from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.verified_news import VerifiedLocalNews
from app.schemas.local_news import LocalNewsArticle
from app.schemas.verified_news import PaginatedVerifiedLocalNews, VerifiedLocalNewsResponse
from app.services.ai_verify_service import AiVerifyService


class VerifiedLocalNewsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.ai = AiVerifyService()

    def list(
        self,
        *,
        search: str | None = None,
        verdict: str | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> PaginatedVerifiedLocalNews:
        page = max(1, page)
        page_size = min(max(1, page_size), 50)
        stmt = select(VerifiedLocalNews)
        count_stmt = select(func.count()).select_from(VerifiedLocalNews)
        if search:
            like = f"%{search.strip()}%"
            filt = or_(
                VerifiedLocalNews.title.ilike(like),
                VerifiedLocalNews.source_name.ilike(like),
                VerifiedLocalNews.url.ilike(like),
            )
            stmt = stmt.where(filt)
            count_stmt = count_stmt.where(filt)
        if verdict:
            stmt = stmt.where(VerifiedLocalNews.verdict == verdict)
            count_stmt = count_stmt.where(VerifiedLocalNews.verdict == verdict)
        total = int(self.db.scalar(count_stmt) or 0)
        items = self.db.scalars(
            stmt.order_by(VerifiedLocalNews.verified_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return PaginatedVerifiedLocalNews(
            items=[VerifiedLocalNewsResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get(self, item_id: str) -> VerifiedLocalNewsResponse:
        item = self.db.get(VerifiedLocalNews, item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verified news not found")
        return VerifiedLocalNewsResponse.model_validate(item)

    def get_by_external_id(self, external_id: str) -> VerifiedLocalNews | None:
        return self.db.scalar(
            select(VerifiedLocalNews).where(VerifiedLocalNews.external_id == external_id)
        )

    def map_by_external_ids(self, external_ids: list[str]) -> dict[str, VerifiedLocalNews]:
        ids = [eid for eid in external_ids if eid]
        if not ids:
            return {}
        rows = self.db.scalars(
            select(VerifiedLocalNews).where(VerifiedLocalNews.external_id.in_(ids))
        ).all()
        return {row.external_id: row for row in rows}

    def attach_verify_status(self, articles: list[LocalNewsArticle]) -> list[LocalNewsArticle]:
        verified_map = self.map_by_external_ids([a.id for a in articles])
        enriched: list[LocalNewsArticle] = []
        for article in articles:
            row = verified_map.get(article.id)
            if row:
                enriched.append(
                    article.model_copy(
                        update={
                            "is_verified": True,
                            "verified_id": row.id,
                            "verdict": row.verdict,
                        }
                    )
                )
            else:
                enriched.append(article)
        return enriched

    def verify_from_article(self, article: LocalNewsArticle) -> VerifiedLocalNewsResponse:
        result = self.ai.verify_article(
            title=article.title,
            description=article.description,
            source_name=article.source_name,
            url=article.url,
            published_at=article.published_at,
        )
        now = datetime.now(timezone.utc)
        existing = self.get_by_external_id(article.id)
        if existing:
            existing.title = article.title[:500]
            existing.description = article.description
            existing.url = article.url[:1000]
            existing.image_url = (article.image_url or None)
            existing.source_name = article.source_name
            existing.published_at = article.published_at
            existing.country = article.country
            existing.verdict = result["verdict"]
            existing.confidence = int(result["confidence"])
            existing.ai_summary = result["summary"]
            existing.ai_provider = result["provider"]
            existing.raw_response = str(result.get("raw") or "")[:8000]
            existing.verified_at = now
            item = existing
        else:
            item = VerifiedLocalNews(
                external_id=article.id,
                title=article.title[:500],
                description=article.description,
                url=article.url[:1000],
                image_url=article.image_url,
                source_name=article.source_name,
                published_at=article.published_at,
                country=article.country,
                verdict=result["verdict"],
                confidence=int(result["confidence"]),
                ai_summary=result["summary"],
                ai_provider=result["provider"],
                raw_response=str(result.get("raw") or "")[:8000],
                verified_at=now,
            )
            self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return VerifiedLocalNewsResponse.model_validate(item)
