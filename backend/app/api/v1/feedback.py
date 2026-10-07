from fastapi import APIRouter, Query, status

from app.core.dependencies import AdminUser, DbSession, OptionalUser
from app.models.feedback import FeedbackCategory, FeedbackStatus
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackSubmitResponse,
    FeedbackUpdate,
    PaginatedFeedback,
)
from app.services.feedback_service import FeedbackService

router = APIRouter(tags=["feedback"])


@router.post(
    "/feedback",
    response_model=FeedbackSubmitResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_feedback(payload: FeedbackCreate, user: OptionalUser, db: DbSession) -> FeedbackSubmitResponse:
    """Public: guests send name + email; logged-in users are linked to their account."""
    return FeedbackService(db).submit(payload, user)


@router.get("/admin/feedback", response_model=PaginatedFeedback)
def list_feedback(
    _admin: AdminUser,
    db: DbSession,
    search: str | None = None,
    status_filter: FeedbackStatus | None = Query(default=None, alias="status"),
    category: FeedbackCategory | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
) -> PaginatedFeedback:
    return FeedbackService(db).list(
        search=search,
        status_filter=status_filter.value if status_filter else None,
        category=category.value if category else None,
        page=page,
        page_size=page_size,
    )


@router.get("/admin/feedback/{item_id}", response_model=FeedbackResponse)
def get_feedback(item_id: str, _admin: AdminUser, db: DbSession) -> FeedbackResponse:
    return FeedbackService(db).get(item_id)


@router.patch("/admin/feedback/{item_id}", response_model=FeedbackResponse)
def update_feedback(
    item_id: str, payload: FeedbackUpdate, _admin: AdminUser, db: DbSession
) -> FeedbackResponse:
    return FeedbackService(db).update(item_id, payload)


@router.delete("/admin/feedback/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback(item_id: str, _admin: AdminUser, db: DbSession) -> None:
    FeedbackService(db).delete(item_id)
