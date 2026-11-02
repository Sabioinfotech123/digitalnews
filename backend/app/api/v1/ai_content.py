from fastapi import APIRouter

from app.core.dependencies import AdminUser
from app.schemas.ai_content import AiContentRequest, AiContentResponse
from app.services.ai_content_service import AiContentService

router = APIRouter(tags=["ai-content"])


@router.post("/admin/ai/content", response_model=AiContentResponse)
def admin_ai_content(payload: AiContentRequest, _admin: AdminUser) -> AiContentResponse:
    result = AiContentService().generate(payload)
    return AiContentResponse(content=result["content"], provider=result["provider"])
