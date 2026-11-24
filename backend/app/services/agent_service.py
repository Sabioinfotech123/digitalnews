"""In-process news agent: fetch suggestions, runtime controls, chat drafts."""

from __future__ import annotations

import re
import threading
import time
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.core.config import Settings, get_settings
from app.models.content import ContentLanguage, NewsType
from app.schemas.agent import (
    AgentChatRequest,
    AgentChatResponse,
    AgentControlAction,
    AgentCredibility,
    AgentDraftFields,
    AgentRuntimeStatus,
    AgentStatusResponse,
    AgentSuggestion,
)
from app.services.agent_news_fetch_service import fetch_agent_suggestions
from app.services.openrouter_service import OpenRouterService

_AGENT_SYSTEM = """You are AK News Agent — an Indian digital newsroom assistant.
Given story metadata or a user topic, you:
1) Estimate credibility (real vs fake percentages that sum to 100).
2) Produce a full CMS-ready news draft suitable for an Indian digital news site.

Respond with ONLY valid JSON (no markdown) in this shape:
{
  "assistant_message": "2-4 sentences for the editor: what you drafted, key angles, and what to double-check",
  "credibility": {
    "title": "headline being judged",
    "real_percent": 0-100,
    "fake_percent": 0-100,
    "verdict": "likely_real"|"likely_fake"|"uncertain",
    "summary": "4-6 sentences: source quality, what is confirmed vs inferred, red flags if any"
  },
  "draft": {
    "title": "specific, compelling headline (not generic)",
    "slug": "lowercase-url-slug",
    "short_description": "plain text 120-280 chars: who, what, where, why it matters",
    "content": "HTML only: at least 5 <p> paragraphs plus 2-3 <h2> subheads; context, main facts, India-relevant implications; <ul><li> for key points when helpful",
    "news_type": "latest"|"trending"|"featured"|"more",
    "language": "en"|"te",
    "image_url": null or URL string,
    "seo_title": "...",
    "seo_description": "150-160 chars",
    "source_url": "...",
    "source_name": "..."
  }
}
real_percent + fake_percent must equal 100.
Write in a professional newsroom tone. Expand thin inputs into a complete story — never reply with only a one-line summary.
Do not invent named quotes, exact numbers, or court/police claims not supported by the input; use cautious wording when details are missing.
Rewrite in original words; do not copy source text verbatim."""


class AgentRuntime:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.status: AgentRuntimeStatus = AgentRuntimeStatus.stopped
        self.suggestions: list[AgentSuggestion] = []
        self.last_fetch_at: datetime | None = None
        self.next_fetch_at: datetime | None = None
        self._timer: threading.Timer | None = None
        self._settings: Settings | None = None

    def _interval_sec(self) -> int:
        settings = self._settings or get_settings()
        minutes = max(5, int(getattr(settings, "agent_refetch_minutes", 15) or 15))
        return minutes * 60

    def _cancel_timer(self) -> None:
        if self._timer:
            self._timer.cancel()
            self._timer = None

    def _schedule_next(self) -> None:
        self._cancel_timer()
        if self.status != AgentRuntimeStatus.running:
            self.next_fetch_at = None
            return
        interval = self._interval_sec()
        self.next_fetch_at = datetime.now(timezone.utc) + timedelta(seconds=interval)

        def tick() -> None:
            try:
                self.refetch()
            finally:
                with self._lock:
                    if self.status == AgentRuntimeStatus.running:
                        self._schedule_next()

        self._timer = threading.Timer(interval, tick)
        self._timer.daemon = True
        self._timer.start()

    def refetch(self) -> int:
        items = fetch_agent_suggestions()
        with self._lock:
            self.suggestions = items
            self.last_fetch_at = datetime.now(timezone.utc)
        return len(items)

    def control(self, action: AgentControlAction) -> AgentRuntimeStatus:
        self._settings = get_settings()
        if action == AgentControlAction.start:
            with self._lock:
                self.status = AgentRuntimeStatus.running
            self.refetch()
            with self._lock:
                self._schedule_next()
        elif action == AgentControlAction.stop:
            with self._lock:
                self.status = AgentRuntimeStatus.stopped
                self._cancel_timer()
                self.next_fetch_at = None
        elif action == AgentControlAction.pause:
            with self._lock:
                if self.status == AgentRuntimeStatus.running:
                    self.status = AgentRuntimeStatus.paused
                self._cancel_timer()
                self.next_fetch_at = None
        elif action == AgentControlAction.resume:
            with self._lock:
                if self.status in {AgentRuntimeStatus.paused, AgentRuntimeStatus.stopped}:
                    self.status = AgentRuntimeStatus.running
            with self._lock:
                self._schedule_next()
        elif action == AgentControlAction.refetch:
            self.refetch()
            with self._lock:
                if self.status == AgentRuntimeStatus.running:
                    self._schedule_next()
        with self._lock:
            return self.status

    def get_status(self) -> AgentStatusResponse:
        router = OpenRouterService()
        with self._lock:
            settings = self._settings or get_settings()
            minutes = max(5, int(getattr(settings, "agent_refetch_minutes", 15) or 15))
            return AgentStatusResponse(
                status=self.status,
                suggestions_count=len(self.suggestions),
                last_fetch_at=self.last_fetch_at,
                next_fetch_at=self.next_fetch_at,
                refetch_interval_minutes=minutes,
                openrouter_configured=router.is_configured(),
                models=router.model_chain(),
            )

    def list_suggestions(self) -> list[AgentSuggestion]:
        with self._lock:
            return list(self.suggestions)

    def find_suggestion(self, suggestion_id: str) -> AgentSuggestion | None:
        with self._lock:
            for s in self.suggestions:
                if s.id == suggestion_id:
                    return s
        return None


_RUNTIME = AgentRuntime()


def get_agent_runtime() -> AgentRuntime:
    return _RUNTIME


def _slugify(title: str) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")
    return (text[:300] or "news-story").strip("-")


class AgentService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.runtime = get_agent_runtime()
        self.router = OpenRouterService(self.settings)

    def status(self) -> AgentStatusResponse:
        return self.runtime.get_status()

    def control(self, action: AgentControlAction) -> AgentStatusResponse:
        self.runtime.control(action)
        return self.runtime.get_status()

    def suggestions(self) -> list[AgentSuggestion]:
        return self.runtime.list_suggestions()

    def chat(self, payload: AgentChatRequest) -> AgentChatResponse:
        suggestion = None
        if payload.suggestion_id:
            suggestion = self.runtime.find_suggestion(payload.suggestion_id)
            if not suggestion:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suggestion not found")

        user_prompt = self._build_user_prompt(payload, suggestion)
        text, model = self.router.chat(
            system=_AGENT_SYSTEM,
            user=user_prompt,
            temperature=0.45,
            json_mode=True,
            max_tokens=4096,
        )
        data = self.router.parse_json_object(text)
        response = self._map_response(data, model, payload.language)
        if suggestion:
            response.draft.source_url = suggestion.url
            response.draft.source_name = suggestion.source_name
            if not response.draft.image_url and suggestion.image_url:
                response.draft.image_url = suggestion.image_url
        return response

    def _build_user_prompt(self, payload: AgentChatRequest, suggestion: AgentSuggestion | None) -> str:
        lang = payload.language.value if hasattr(payload.language, "value") else str(payload.language)
        if suggestion:
            return (
                f"Editor selected this trending story.\n"
                f"Feed: {suggestion.feed}\n"
                f"Title: {suggestion.title}\n"
                f"Source: {suggestion.source_name or 'unknown'}\n"
                f"URL: {suggestion.url}\n"
                f"Published: {suggestion.published_at or 'unknown'}\n"
                f"Description: {suggestion.description or '(none)'}\n"
                f"Editor note: {payload.message.strip()}\n"
                f"Write draft in language: {lang}\n"
                f"Pick news_type trending if feed is trending or viral, else latest.\n"
                f"Requirements: full article body (multiple sections), detailed short_description, "
                f"and a thorough credibility summary."
            )
        return (
            f"Editor typed this topic or headline:\n{payload.message.strip()}\n"
            f"Write draft in language: {lang}\n"
            f"Requirements: full article body (multiple sections), detailed short_description, "
            f"and a thorough credibility summary.\n"
            f"No external URL unless you set source fields to unknown."
        )

    def _map_response(self, data: dict, model: str, lang: ContentLanguage) -> AgentChatResponse:
        cred_raw = data.get("credibility") if isinstance(data.get("credibility"), dict) else {}
        draft_raw = data.get("draft") if isinstance(data.get("draft"), dict) else {}
        try:
            real = int(cred_raw.get("real_percent") or 50)
            fake = int(cred_raw.get("fake_percent") or 50)
        except (TypeError, ValueError):
            real, fake = 50, 50
        total = real + fake
        if total != 100 and total > 0:
            real = round(real * 100 / total)
            fake = 100 - real
        elif total == 0:
            real, fake = 50, 50
        verdict = str(cred_raw.get("verdict") or "uncertain").strip().lower()
        if verdict not in {"likely_real", "likely_fake", "uncertain"}:
            verdict = "uncertain"

        title = str(draft_raw.get("title") or cred_raw.get("title") or "Untitled story").strip()
        slug = str(draft_raw.get("slug") or _slugify(title)).strip()[:320]
        short = str(draft_raw.get("short_description") or "").strip()[:500]
        content = str(draft_raw.get("content") or "<p></p>").strip()
        if not short:
            short = title[:500]

        news_type_raw = str(draft_raw.get("news_type") or "latest").strip().lower()
        try:
            news_type = NewsType(news_type_raw)
        except ValueError:
            news_type = NewsType.latest

        lang_raw = str(draft_raw.get("language") or lang.value).strip().lower()
        try:
            language = ContentLanguage(lang_raw)
        except ValueError:
            language = lang

        draft = AgentDraftFields(
            title=title,
            slug=slug,
            short_description=short,
            content=content,
            news_type=news_type,
            language=language,
            image_url=draft_raw.get("image_url"),
            seo_title=draft_raw.get("seo_title") or title[:300],
            seo_description=draft_raw.get("seo_description") or short[:500] or None,
            source_url=draft_raw.get("source_url"),
            source_name=draft_raw.get("source_name"),
        )
        credibility = AgentCredibility(
            title=str(cred_raw.get("title") or title)[:300],
            real_percent=max(0, min(100, real)),
            fake_percent=max(0, min(100, fake)),
            verdict=verdict,  # type: ignore[arg-type]
            summary=str(cred_raw.get("summary") or "").strip()[:2000],
        )
        assistant = str(data.get("assistant_message") or "Draft is ready. Review and use Add to create news.").strip()
        return AgentChatResponse(
            assistant_message=assistant,
            credibility=credibility,
            draft=draft,
            model_used=model,
        )