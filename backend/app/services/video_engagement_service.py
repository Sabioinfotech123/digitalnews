import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.content import (
    ContentLanguage,
    ContentStatus,
    Video,
    VideoComment,
    VideoCommentReaction,
    VideoLike,
)
from app.schemas.video_engagement import (
    CommentReactionKind,
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

    def _comment_stats(
        self, comment_ids: list[str], visitor_key: str | None
    ) -> dict[str, dict[str, int | str | None]]:
        if not comment_ids:
            return {}
        like_rows = self.db.execute(
            select(VideoCommentReaction.comment_id, func.count())
            .where(
                VideoCommentReaction.comment_id.in_(comment_ids),
                VideoCommentReaction.reaction == "like",
            )
            .group_by(VideoCommentReaction.comment_id)
        ).all()
        dislike_rows = self.db.execute(
            select(VideoCommentReaction.comment_id, func.count())
            .where(
                VideoCommentReaction.comment_id.in_(comment_ids),
                VideoCommentReaction.reaction == "dislike",
            )
            .group_by(VideoCommentReaction.comment_id)
        ).all()
        viewer: dict[str, str] = {}
        if visitor_key:
            viewer_rows = self.db.scalars(
                select(VideoCommentReaction).where(
                    VideoCommentReaction.comment_id.in_(comment_ids),
                    VideoCommentReaction.visitor_key == visitor_key,
                )
            ).all()
            viewer = {row.comment_id: row.reaction for row in viewer_rows}
        out: dict[str, dict[str, int | str | None]] = {
            cid: {"like_count": 0, "dislike_count": 0, "viewer_reaction": None} for cid in comment_ids
        }
        for cid, cnt in like_rows:
            if cid in out:
                out[cid]["like_count"] = int(cnt)
        for cid, cnt in dislike_rows:
            if cid in out:
                out[cid]["dislike_count"] = int(cnt)
        for cid, reaction in viewer.items():
            if cid in out:
                out[cid]["viewer_reaction"] = reaction
        return out

    def _serialize_comment(
        self, row: VideoComment, stats: dict[str, dict[str, int | str | None]]
    ) -> VideoCommentResponse:
        s = stats.get(row.id, {})
        reaction = s.get("viewer_reaction")
        return VideoCommentResponse(
            id=row.id,
            author_name=row.author_name,
            body=row.body,
            created_at=row.created_at,
            like_count=int(s.get("like_count") or 0),
            dislike_count=int(s.get("dislike_count") or 0),
            viewer_reaction=reaction if reaction in ("like", "dislike") else None,
        )

    def list_comments(
        self,
        slug: str,
        *,
        language: ContentLanguage | None,
        limit: int = 50,
        visitor_key: str | None = None,
    ) -> VideoCommentListResponse:
        video = self._published_video(slug, language)
        rows = self.db.scalars(
            select(VideoComment)
            .where(VideoComment.video_id == video.id, VideoComment.is_visible.is_(True))
            .order_by(VideoComment.created_at.desc())
            .limit(limit)
        ).all()
        stats = self._comment_stats([row.id for row in rows], visitor_key)
        items = [self._serialize_comment(row, stats) for row in rows]
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
        stats = self._comment_stats([row.id], payload.visitor_key)
        return self._serialize_comment(row, stats)

    def react_to_comment(
        self, comment_id: str, visitor_key: str, reaction: CommentReactionKind
    ) -> VideoCommentResponse:
        row = self.db.get(VideoComment, comment_id)
        if not row or not row.is_visible:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
        video = self.db.get(Video, row.video_id)
        if not video or video.deleted_at is not None or video.status != ContentStatus.published:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
        if not video.short_allow_comments:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Comments disabled for this short")
        existing = self.db.scalars(
            select(VideoCommentReaction).where(
                VideoCommentReaction.comment_id == comment_id,
                VideoCommentReaction.visitor_key == visitor_key,
            )
        ).first()
        if existing:
            if existing.reaction == reaction:
                self.db.delete(existing)
            else:
                existing.reaction = reaction
        else:
            self.db.add(
                VideoCommentReaction(
                    id=str(uuid.uuid4()),
                    comment_id=comment_id,
                    visitor_key=visitor_key,
                    reaction=reaction,
                )
            )
        self.db.commit()
        stats = self._comment_stats([comment_id], visitor_key)
        return self._serialize_comment(row, stats)

    def admin_list_comments(self, video_id: str) -> VideoCommentListResponse:
        rows = self.db.scalars(
            select(VideoComment)
            .where(VideoComment.video_id == video_id)
            .order_by(VideoComment.created_at.desc())
        ).all()
        stats = self._comment_stats([row.id for row in rows], None)
        items = [self._serialize_comment(row, stats) for row in rows]
        return VideoCommentListResponse(items=items, total=len(items))

    def admin_delete_comment(self, comment_id: str) -> None:
        row = self.db.get(VideoComment, comment_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
        self.db.delete(row)
        self.db.commit()
