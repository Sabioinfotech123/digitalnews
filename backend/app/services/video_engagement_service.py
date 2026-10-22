import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.content import ContentLanguage, ContentStatus, Video, VideoComment, VideoLike
from app.schemas.video_engagement import (
    VideoCommentCreate,
    VideoCommentListResponse,
    VideoCommentResponse,
    VideoEngagementResponse,
)


class VideoEngagementService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def bulk_counts(self, video_ids: list[str]) -> dict[str, dict[str, int]]:
        if not video_ids:
            return {}
        like_rows = self.db.execute(
            select(VideoLike.video_id, func.count())
            .where(VideoLike.video_id.in_(video_ids))
            .group_by(VideoLike.video_id)
        ).all()
        comment_rows = self.db.execute(
            select(VideoComment.video_id, func.count())
            .where(VideoComment.video_id.in_(video_ids))
            .group_by(VideoComment.video_id)
        ).all()
        out: dict[str, dict[str, int]] = {vid: {"like_count": 0, "comment_count": 0} for vid in video_ids}
        for vid, cnt in like_rows:
            if vid in out:
                out[vid]["like_count"] = int(cnt)
        for vid, cnt in comment_rows:
            if vid in out:
                out[vid]["comment_count"] = int(cnt)
        return out

    def _published_video(self, slug: str, language: ContentLanguage | None) -> Video:
        stmt = select(Video).where(Video.slug == slug, Video.deleted_at.is_(None))
        if language is not None:
            stmt = stmt.where(Video.language == language)
        item = self.db.scalars(stmt).first()
        if not item or item.status != ContentStatus.published:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
        return item

    def engagement(
        self, slug: str, *, visitor_key: str | None, language: ContentLanguage | None
    ) -> VideoEngagementResponse:
        video = self._published_video(slug, language)
        like_count = int(
            self.db.scalar(select(func.count()).select_from(VideoLike).where(VideoLike.video_id == video.id))
            or 0
        )
        comment_count = int(
            self.db.scalar(
                select(func.count())
                .select_from(VideoComment)
                .where(VideoComment.video_id == video.id, VideoComment.is_visible.is_(True))
            )
            or 0
        )
        liked = False
        if visitor_key:
            liked = (
                self.db.scalar(
                    select(VideoLike.id).where(
                        VideoLike.video_id == video.id,
                        VideoLike.visitor_key == visitor_key,
                    )
                )
                is not None
            )
        return VideoEngagementResponse(
            like_count=like_count,
            comment_count=comment_count,
            liked_by_visitor=liked,
            allow_likes=bool(video.short_allow_likes),
            allow_comments=bool(video.short_allow_comments),
            allow_share=bool(video.short_allow_share),
        )

    def toggle_like(self, slug: str, visitor_key: str, language: ContentLanguage | None) -> VideoEngagementResponse:
        video = self._published_video(slug, language)
        if not video.short_allow_likes:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Likes disabled for this short")
        existing = self.db.scalars(
            select(VideoLike).where(VideoLike.video_id == video.id, VideoLike.visitor_key == visitor_key)
        ).first()
        if existing:
            self.db.delete(existing)
        else:
            self.db.add(VideoLike(id=str(uuid.uuid4()), video_id=video.id, visitor_key=visitor_key))
        self.db.commit()
        return self.engagement(slug, visitor_key=visitor_key, language=language)

    def list_comments(
        self, slug: str, *, language: ContentLanguage | None, limit: int = 50
    ) -> VideoCommentListResponse:
        video = self._published_video(slug, language)
        rows = self.db.scalars(
            select(VideoComment)
            .where(VideoComment.video_id == video.id, VideoComment.is_visible.is_(True))
            .order_by(VideoComment.created_at.desc())
            .limit(limit)
        ).all()
        items = [VideoCommentResponse.model_validate(row) for row in rows]
        return VideoCommentListResponse(items=items, total=len(items))

    def add_comment(
        self, slug: str, payload: VideoCommentCreate, language: ContentLanguage | None
    ) -> VideoCommentResponse:
        video = self._published_video(slug, language)
        if not video.short_allow_comments:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Comments disabled for this short")
        row = VideoComment(
            id=str(uuid.uuid4()),
            video_id=video.id,
            visitor_key=payload.visitor_key,
            author_name=payload.author_name.strip(),
            body=payload.body.strip(),
            is_visible=True,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return VideoCommentResponse.model_validate(row)

    def admin_list_comments(self, video_id: str) -> VideoCommentListResponse:
        rows = self.db.scalars(
            select(VideoComment)
            .where(VideoComment.video_id == video_id)
            .order_by(VideoComment.created_at.desc())
        ).all()
        items = [VideoCommentResponse.model_validate(row) for row in rows]
        return VideoCommentListResponse(items=items, total=len(items))

    def admin_delete_comment(self, comment_id: str) -> None:
        row = self.db.get(VideoComment, comment_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
        self.db.delete(row)
        self.db.commit()
