from fastapi import APIRouter

from app.core.dependencies import AdminUser
from app.schemas.agent import (
    AgentChatRequest,
    AgentChatResponse,
    AgentControlRequest,
    AgentStatusResponse,
    AgentSuggestion,
)
from app.services.agent_service import AgentService

router = APIRouter(tags=["agent"])


@router.get("/admin/agent/status", response_model=AgentStatusResponse)
def agent_status(_admin: AdminUser) -> AgentStatusResponse:
    return AgentService().status()


@router.get("/admin/agent/suggestions", response_model=list[AgentSuggestion])
def agent_suggestions(_admin: AdminUser) -> list[AgentSuggestion]:
    return AgentService().suggestions()


@router.post("/admin/agent/control", response_model=AgentStatusResponse)
def agent_control(payload: AgentControlRequest, _admin: AdminUser) -> AgentStatusResponse:
    return AgentService().control(payload.action, language=payload.language)


@router.post("/admin/agent/chat", response_model=AgentChatResponse)
def agent_chat(payload: AgentChatRequest, _admin: AdminUser) -> AgentChatResponse:
    return AgentService().chat(payload)