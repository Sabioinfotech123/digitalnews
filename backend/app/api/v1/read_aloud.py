from fastapi import APIRouter
from fastapi.responses import Response

from app.schemas.read_aloud import ReadAloudCapabilities, ReadAloudRequest
from app.services.read_aloud_service import ReadAloudService

router = APIRouter(tags=["read-aloud"])


@router.get("/read-aloud/capabilities", response_model=ReadAloudCapabilities)
def read_aloud_capabilities() -> ReadAloudCapabilities:
    svc = ReadAloudService()
    if not svc.is_configured():
        return ReadAloudCapabilities(polly=False, polly_reason="not_configured")
    ok, reason = svc.polly_operational()
    return ReadAloudCapabilities(polly=ok, polly_reason=reason)


@router.post("/read-aloud/synthesize")
def synthesize_read_aloud(payload: ReadAloudRequest) -> Response:
    text = " ".join(payload.text.split())
    audio = ReadAloudService().synthesize_mp3(text=text, language=payload.language)
    return Response(content=audio, media_type="audio/mpeg")
