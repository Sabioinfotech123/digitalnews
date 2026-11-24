"""AI verification for local-feed articles (OpenRouter multi-model)."""

from __future__ import annotations

import json
import re

from fastapi import HTTPException, status

from app.core.config import Settings, get_settings
from app.services.openrouter_service import OpenRouterService

_JSON_RE = re.compile(r"\{[\s\S]*\}")

VERIFY_SYSTEM = """You are a news credibility assistant for a digital newsroom in India.
Analyze the article metadata and decide if it looks like real reporting or likely misinformation/fake news.
Respond with ONLY valid JSON (no markdown) in this exact shape:
{"verdict":"likely_real"|"likely_fake"|"uncertain","confidence":0-100,"summary":"one short paragraph explaining why"}
Be conservative: use uncertain when evidence is weak. Do not invent facts not present in the input."""

# Shown in DB / admin UI (`verified_local_news.ai_provider` max 40 chars).
_MAX_PROVIDER_LEN = 40

def _extract_verdict(text: str) -> dict:
    match = _JSON_RE.search(text or "")
    if not match:
        return {
            "verdict": "uncertain",
            "confidence": 0,
            "summary": "AI returned no structured result.",
        }
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        return {
            "verdict": "uncertain",
            "confidence": 0,
            "summary": "Could not parse AI verification JSON.",
        }
    return _normalize_verdict_fields(data)


def _normalize_verdict_fields(data: dict) -> dict:
    verdict = str(data.get("verdict") or "uncertain").strip().lower()
    if verdict not in {"likely_real", "likely_fake", "uncertain"}:
        verdict = "uncertain"
    try:
        confidence = int(data.get("confidence") or 0)
    except (TypeError, ValueError):
        confidence = 0
    confidence = max(0, min(100, confidence))
    summary = str(data.get("summary") or "").strip() or "No summary provided."
    return {"verdict": verdict, "confidence": confidence, "summary": summary}


def _build_user_prompt(*, title: str, description: str | None, source: str | None, url: str, published_at: str | None) -> str:
    return (
        f"Title: {title}\n"
        f"Source: {source or 'unknown'}\n"
        f"Published: {published_at or 'unknown'}\n"
        f"URL: {url}\n"
        f"Description: {description or '(none)'}\n"
    )


def _provider_label(model: str) -> str:
    label = f"openrouter:{model}"
    if len(label) <= _MAX_PROVIDER_LEN:
        return label
    return model[:_MAX_PROVIDER_LEN]


class AiVerifyService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.router = OpenRouterService(self.settings)

    def verify_article(
        self,
        *,
        title: str,
        description: str | None,
        source_name: str | None,
        url: str,
        published_at: str | None,
    ) -> dict:
        if not self.router.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "OPENROUTER_API_KEY is not configured. Add it to backend/.env "
                    "(same key as Agent and CMS AI tools)."
                ),
            )
        prompt = _build_user_prompt(
            title=title,
            description=description,
            source=source_name,
            url=url,
            published_at=published_at,
        )
        text, model = self.router.chat(
            system=VERIFY_SYSTEM,
            user=prompt,
            temperature=0.2,
            json_mode=True,
            max_tokens=1024,
        )
        try:
            data = OpenRouterService.parse_json_object(text)
            parsed = _normalize_verdict_fields(data)
        except HTTPException:
            parsed = _extract_verdict(text)
        parsed["raw"] = text
        parsed["provider"] = _provider_label(model)
        return parsed