"""AI assist for CMS article body (enhance or regenerate HTML)."""

from __future__ import annotations

import html
import re

from fastapi import HTTPException, status

from app.core.config import Settings, get_settings
from app.schemas.ai_content import AiContentRequest
from app.services.openrouter_service import OpenRouterService

_FENCE_RE = re.compile(r"^```(?:html)?\s*\n?([\s\S]*?)\n?```$", re.IGNORECASE)

_BASE_EDITOR_RULES = """You are a senior copy editor for an Indian digital news platform.
Output ONLY an HTML fragment for a rich-text editor: allowed tags are <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <u>, <blockquote>, <a href="...">.
Do not wrap in <html> or <body>. Do not use markdown or code fences."""

_ENHANCE_SYSTEM = f"""{_BASE_EDITOR_RULES}

Your job is ENHANCE (light edit), not rewrite from scratch.

Rules:
- Fix grammar, spelling, punctuation, and awkward sentences. Improve clarity and flow with minimal changes.
- Keep the author's voice, facts, and angle. Do not invent quotes, statistics, officials, or events.
- Do NOT paste or paraphrase the short description as the lede if the article already has a different opening.
- Do NOT add filler sections (e.g. "cultural significance", "socio-economic implications", generic "in conclusion") unless the draft already covers them.
- Do NOT add subheadings unless the draft already has at least four paragraphs or already uses headings — then at most one or two <h2> tags.
- Stay close to the input length: target roughly the same word count (about -10% to +15%). Never balloon a tight draft into a long essay.
- If the draft is already clear, change as little as possible while still polishing prose.
- Use <strong> sparingly for key terms only."""

_REGENERATE_SYSTEM = f"""{_BASE_EDITOR_RULES}

Your job is to write a fresh full article from the title and summary.
Use a professional, neutral Indian newsroom tone. Multiple <p> paragraphs; add <h2> subheads when the story warrants depth.
Keep facts grounded in the title/summary; do not invent named quotes or precise numbers not implied by the input."""


def _strip_html(text: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", text or "")
    return html.unescape(re.sub(r"\s+", " ", without_tags)).strip()


def _word_count(text: str) -> int:
    plain = _strip_html(text)
    if not plain:
        return 0
    return len(plain.split())


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


def _build_prompt(payload: AiContentRequest) -> tuple[str, str]:
    """Returns (system_prompt, user_prompt)."""
    lang = _language_label(payload.language.value if hasattr(payload.language, "value") else str(payload.language))
    summary = (payload.short_description or "").strip() or "(none)"
    body_html = (payload.content or "").strip()
    body_plain = _strip_html(body_html)
    words = _word_count(body_html)

    if payload.mode == "enhance":
        if len(body_plain) < 20:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Write at least a few sentences in Content before using Enhance.",
            )
        lo = max(40, int(words * 0.85))
        hi = max(lo + 20, int(words * 1.15)) if words >= 80 else max(lo + 30, int(words * 1.25))
        user = (
            f"Language: {lang}\n"
            f"Title (context only — do not replace the lede with this): {payload.title.strip()}\n"
            f"Short description (context only — do not copy into the body): {summary}\n"
            f"Input word count: {words} (keep output between ~{lo} and ~{hi} words)\n\n"
            f"Article to enhance (HTML — preserve structure; edit in place):\n{body_html or f'<p>{html.escape(body_plain)}</p>'}\n\n"
            "Return the enhanced HTML only. Light edit: better prose, same story, same length band, no generic padding."
        )
        return _ENHANCE_SYSTEM, user

    if len(payload.title.strip()) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required to regenerate content.")
    draft_note = body_plain if body_plain else "(empty — write from title and summary only)"
    user = (
        f"Language: {lang}\n"
        f"Title: {payload.title.strip()}\n"
        f"Summary: {summary}\n\n"
        f"Optional draft reference (do not copy verbatim):\n{draft_note}\n\n"
        "Write a complete news article (multiple paragraphs) based on the title and summary. "
        "Rewrite fresh even if a draft is provided."
    )
    return _REGENERATE_SYSTEM, user


def _finalize_html(text: str, *, mode: str, input_words: int) -> str:
    cleaned = _clean_model_html(text)
    out_words = _word_count(cleaned)
    if out_words < 20:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI returned empty or unusable content. Try again.",
        )
    if mode == "enhance" and input_words >= 80 and out_words > input_words * 1.45:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Enhance produced an article much longer than your draft. "
                "Try again or edit manually — the editor is tuned for light polish, not expansion."
            ),
        )
    return cleaned


class AiContentService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.router = OpenRouterService(self.settings)

    def generate(self, payload: AiContentRequest) -> dict:
        system_prompt, user_prompt = _build_prompt(payload)
        input_words = _word_count(payload.content or "")
        if not self.router.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "OPENROUTER_API_KEY is not configured. Add it to backend/.env "
                    "(same key as Admin → Agent). Optionally set OPENROUTER_MODELS for model order."
                ),
            )
        temperature = 0.2 if payload.mode == "enhance" else 0.42
        text, model = self.router.chat(
            system=system_prompt,
            user=user_prompt,
            temperature=temperature,
            max_tokens=4096 if payload.mode == "regenerate" else min(4096, max(1200, int(input_words * 2.5))),
        )
        html_out = _finalize_html(text, mode=payload.mode, input_words=input_words)
        return {"content": html_out, "provider": f"openrouter:{model}"}