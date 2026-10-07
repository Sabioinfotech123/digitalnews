from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.feedback import Feedback, FeedbackStatus
from app.models.user import User
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackSubmitResponse,
    FeedbackUpdate,
    PaginatedFeedback,
)


class FeedbackService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def submit(self, payload: FeedbackCreate, user: User | None) -> FeedbackSubmitResponse:
        if payload.website:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid submission")

        if user:
            name = user.full_name
            email = user.email
        else:
            name = (payload.name or "").strip()
            email = (payload.email or "").strip()
            if len(name) < 2:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Please enter your name",
                )
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Please enter your email",
                )

        message = payload.message.strip()
        if len(message) < 10:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Message must be at least 10 characters",
            )

        item = Feedback(
            user_id=user.id if user else None,
            name=name,
            email=email.lower(),
            category=payload.category.value,
            rating=payload.rating,
            message=message,
            page_url=(payload.page_url or "").strip() or None,
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return FeedbackSubmitResponse(id=item.id)

    def list(
        self,
        *,
        search: str | None = None,
        status_filter: str | None = None,
        category: str | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> PaginatedFeedback:
        page = max(1, page)
        page_size = min(max(1, page_size), 50)
        stmt = select(Feedback)
        count_stmt = select(func.count()).select_from(Feedback)
        if search:
            like = f"%{search.strip()}%"
            filt = or_(
                Feedback.name.ilike(like),
                Feedback.email.ilike(like),
                Feedback.message.ilike(like),
            )
            stmt = stmt.where(filt)
            count_stmt = count_stmt.where(filt)
        if status_filter:
            stmt = stmt.where(Feedback.status == status_filter)
            count_stmt = count_stmt.where(Feedback.status == status_filter)
        if category:
            stmt = stmt.where(Feedback.category == category)
            count_stmt = count_stmt.where(Feedback.category == category)
        total = int(self.db.scalar(count_stmt) or 0)
        new_count = int(
            self.db.scalar(
                select(func.count())
                .select_from(Feedback)
                .where(Feedback.status == FeedbackStatus.new.value)
            )
            or 0
        )
        items = self.db.scalars(
            stmt.order_by(Feedback.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return PaginatedFeedback(
            items=[FeedbackResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            new_count=new_count,
        )

    def _get_or_404(self, item_id: str) -> Feedback:
        item = self.db.get(Feedback, item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
        return item

    def get(self, item_id: str) -> FeedbackResponse:
        return FeedbackResponse.model_validate(self._get_or_404(item_id))

    def update(self, item_id: str, payload: FeedbackUpdate) -> FeedbackResponse:
        item = self._get_or_404(item_id)
        data = payload.model_dump(exclude_unset=True)
        if "status" in data and data["status"] is not None:
            item.status = data["status"].value
        if "admin_note" in data:
            note = (data["admin_note"] or "").strip()
            item.admin_note = note or None
        self.db.commit()
        self.db.refresh(item)
        return FeedbackResponse.model_validate(item)

    def delete(self, item_id: str) -> None:
        item = self._get_or_404(item_id)
        self.db.delete(item)
        self.db.commit()
