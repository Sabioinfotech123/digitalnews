"""AI assist for CMS article body (enhance or regenerate HTML)."""

from __future__ import annotations

import html
import re
import urllib.parse

from fastapi import HTTPException, status

from app.core.config import Settings, get_settings
from app.schemas.ai_content import AiContentRequest
from app.services.ai_verify_service import _http_json, _is_flaky_provider_error

_FENCE_RE = re.compile(r"^```(?:html)?\s*\n?([\s\S]*?)\n?```$", re.IGNORECASE)

_EDITOR_SYSTEM = """You are a professional news editor for an Indian digital news platform.
Output ONLY an HTML fragment for a rich-text editor: allowed tags are <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <u>, <blockquote>, <a href="...">.
Do not wrap in <html> or <body>. Do not use markdown or code fences.
Keep facts from the input; do not invent sources, quotes, or events that were not implied by the title or summary."""


def _strip_html(text: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", text or "")
    return html.unescape(re.sub(r"\s+", " ", without_tags)).strip()


def _language_label(code: str) -> str:
    if code == "te":
        return "Telugu"
    return "English"


def _clean_model_html(text: str) -> str:
    raw = (text or "").strip()
    fence = _FENCE_RE.match(raw)
    if fence:
        raw = fence.group(1).strip()
    return raw


def _build_prompt(payload: AiContentRequest) -> str:
    lang = _language_label(payload.language.value if hasattr(payload.language, "value") else str(payload.language))
    summary = (payload.short_description or "").strip() or "(none)"
    body_plain = _strip_html(payload.content)
    if payload.mode == "enhance":
        if len(body_plain) < 20:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Write at least a few sentences in Content before using Enhance.",
            )
        return (
            f"Language: {lang}\n"
            f"Title: {payload.title.strip()}\n"
            f"Summary: {summary}\n\n"
            f"Current article (plain text):\n{body_plain}\n\n"
            "Enhance this article: improve grammar, clarity, and flow; add subheadings (<h2>/<h3>) where helpful. "
            "Preserve all factual claims; do not add new facts."
        )
    if len(payload.title.strip()) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required to regenerate content.")
    draft_note = body_plain if body_plain else "(empty — write from title and summary only)"
    return (
        f"Language: {lang}\n"
        f"Title: {payload.title.strip()}\n"
        f"Summary: {summary}\n\n"
        f"Optional draft reference:\n{draft_note}\n\n"
        "Write a complete news article (multiple paragraphs) based on the title and summary. "
        "Use a professional, neutral news tone. Rewrite fresh even if a draft is provided."
    )


class AiContentService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def generate(self, payload: AiContentRequest) -> dict:
        user_prompt = _build_prompt(payload)
        provider = (self.settings.ai_verify_provider or "gemini").strip().lower()

        if provider == "openai":
            html_out = self._generate_openai(user_prompt)
            return {"content": html_out, "provider": "openai"}

        try:
            html_out = self._generate_gemini(user_prompt)
            return {"content": html_out, "provider": "gemini"}
        except HTTPException as gemini_exc:
            if not self.settings.openai_api_key.strip() or not _is_flaky_provider_error(gemini_exc):
                raise
            html_out = self._generate_openai(user_prompt)
            return {"content": html_out, "provider": "openai"}

    def _generate_gemini(self, user_prompt: str) -> str:
        key = self.settings.gemini_api_key.strip()
        if not key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GEMINI_API_KEY is not configured. Add it to backend/.env to use AI content tools.",
            )
        model = self.settings.gemini_model.strip() or "gemini-3.5-flash-lite"
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{urllib.parse.quote(model)}"
            f":generateContent?key={urllib.parse.quote(key)}"
        )
        body = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{_EDITOR_SYSTEM}\n\n{user_prompt}"}],
                }
            ],
            "generationConfig": {"temperature": 0.45},
        }
        data = _http_json(url, method="POST", body=body)
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI provider returned an unexpected response.",
            ) from exc
        cleaned = _clean_model_html(str(text))
        if len(_strip_html(cleaned)) < 20:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI returned empty or unusable content. Try again.",
            )
        return cleaned

    def _generate_openai(self, user_prompt: str) -> str:
        key = self.settings.openai_api_key.strip()
        if not key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OPENAI_API_KEY is not configured. Add it to backend/.env to use AI content tools.",
            )
        model = self.settings.openai_model.strip() or "gpt-4o-mini"
        url = "https://api.openai.com/v1/chat/completions"
        body = {
            "model": model,
            "temperature": 0.45,
            "messages": [
                {"role": "system", "content": _EDITOR_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
        }
        data = _http_json(
            url,
            method="POST",
            body=body,
            headers={"Authorization": f"Bearer {key}"},
        )
        try:
            text = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI provider returned an unexpected response.",
            ) from exc
        cleaned = _clean_model_html(str(text))
        if len(_strip_html(cleaned)) < 20:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI returned empty or unusable content. Try again.",
            )
        return cleaned
