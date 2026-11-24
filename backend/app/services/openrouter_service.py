"""OpenRouter chat completions with ordered model failover."""

from __future__ import annotations

import json
import re

from fastapi import HTTPException, status

from app.core.config import Settings, get_settings
from app.services.llm_http import http_json, is_flaky_provider_error

_JSON_BLOCK = re.compile(r"\{[\s\S]*\}")

_RETRY_MARKERS = (
    "rate limit",
    "429",
    "quota",
    "exhausted",
    "overloaded",
    "unavailable",
    "503",
    "502",
    "timeout",
    "credit",
    "insufficient",
)


class OpenRouterService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def model_chain(self) -> list[str]:
        raw = (self.settings.openrouter_models or "").strip()
        if not raw:
            return [
                "google/gemini-2.0-flash-exp:free",
                "openai/gpt-4o-mini",
                "meta-llama/llama-3.2-3b-instruct:free",
            ]
        return [m.strip() for m in raw.split(",") if m.strip()]

    def is_configured(self) -> bool:
        return bool(self.settings.openrouter_api_key.strip())

    def chat(
        self,
        *,
        system: str,
        user: str,
        temperature: float = 0.35,
        json_mode: bool = False,
        max_tokens: int | None = None,
    ) -> tuple[str, str]:
        key = self.settings.openrouter_api_key.strip()
        if not key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OPENROUTER_API_KEY is not configured. Add it to backend/.env.",
            )
        base = (self.settings.openrouter_base_url or "https://openrouter.ai/api/v1").rstrip("/")
        url = f"{base}/chat/completions"
        headers = {
            "Authorization": f"Bearer {key}",
            "HTTP-Referer": "https://digitalnews.local",
            "X-Title": "AK News Agent",
        }
        body_base: dict = {
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
        }
        if json_mode:
            body_base["response_format"] = {"type": "json_object"}
        if max_tokens is not None and max_tokens > 0:
            body_base["max_tokens"] = max_tokens

        errors: list[str] = []
        for model in self.model_chain():
            body = {**body_base, "model": model}
            try:
                llm_timeout = max(60, int(getattr(self.settings, "agent_llm_timeout_sec", 120) or 120))
                data = http_json(
                    url,
                    method="POST",
                    body=body,
                    headers=headers,
                    timeout=llm_timeout,
                )
                text = self._extract_text(data)
                if not text.strip():
                    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Empty model response")
                return text.strip(), model
            except HTTPException as exc:
                errors.append(f"{model}: {exc.detail}")
                if not self._should_try_next(exc):
                    break
                continue

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="All OpenRouter models failed. " + " | ".join(errors[-3:]),
        )

    @staticmethod
    def _extract_text(data: dict) -> str:
        try:
            return str(data["choices"][0]["message"]["content"] or "")
        except (KeyError, IndexError, TypeError):
            return ""

    @staticmethod
    def _should_try_next(exc: HTTPException) -> bool:
        if is_flaky_provider_error(exc):
            return True
        detail = str(exc.detail or "").lower()
        return any(m in detail for m in _RETRY_MARKERS)

    @staticmethod
    def parse_json_object(text: str) -> dict:
        raw = (text or "").strip()
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass
        match = _JSON_BLOCK.search(raw)
        if match:
            try:
                parsed = json.loads(match.group(0))
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                pass
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI did not return valid JSON for the agent response.",
        )