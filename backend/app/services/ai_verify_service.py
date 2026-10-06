"""AI verification for local-feed articles (Gemini or OpenAI)."""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request

from fastapi import HTTPException, status

from app.core.config import Settings, get_settings

_JSON_RE = re.compile(r"\{[\s\S]*\}")

VERIFY_SYSTEM = """You are a news credibility assistant for a digital newsroom in India.
Analyze the article metadata and decide if it looks like real reporting or likely misinformation/fake news.
Respond with ONLY valid JSON (no markdown) in this exact shape:
{"verdict":"likely_real"|"likely_fake"|"uncertain","confidence":0-100,"summary":"one short paragraph explaining why"}
Be conservative: use uncertain when evidence is weak. Do not invent facts not present in the input."""

# Gemini free-tier often returns these when capacity is tight.
_FLAKY_MARKERS = (
    "high demand",
    "unavailable",
    "resource_exhausted",
    "too many requests",
    "rate limit",
    "temporarily",
    "overloaded",
    "503",
    "429",
    "500",
    "404",
)


def _http_json(url: str, *, method: str = "GET", body: dict | None = None, headers: dict | None = None) -> dict:
    data = None
    req_headers = {"User-Agent": "DigitalNewsVerify/1.0", "Accept": "application/json"}
    if headers:
        req_headers.update(headers)
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        req_headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error ({exc.code}): {detail or exc.reason}",
        ) from exc
    except urllib.error.URLError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not reach AI provider: {exc.reason}",
        ) from exc
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider returned invalid JSON: {raw[:200]}",
        ) from exc
    if not isinstance(parsed, dict):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI provider returned unexpected payload")
    return parsed


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


def _is_flaky_provider_error(exc: HTTPException) -> bool:
    """True when Gemini (or another provider) failed in a retry/fallback-worthy way."""
    if exc.status_code not in {
        status.HTTP_502_BAD_GATEWAY,
        status.HTTP_503_SERVICE_UNAVAILABLE,
        status.HTTP_504_GATEWAY_TIMEOUT,
    }:
        return False
    detail = str(exc.detail or "").lower()
    return any(marker in detail for marker in _FLAKY_MARKERS)


class AiVerifyService:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def verify_article(
        self,
        *,
        title: str,
        description: str | None,
        source_name: str | None,
        url: str,
        published_at: str | None,
    ) -> dict:
        provider = (self.settings.ai_verify_provider or "gemini").strip().lower()
        prompt = _build_user_prompt(
            title=title,
            description=description,
            source=source_name,
            url=url,
            published_at=published_at,
        )

        if provider == "openai":
            result = self._verify_openai(prompt)
            result["provider"] = "openai"
            return result

        # Default: try Gemini first; on flaky errors fall back to OpenAI if key is set.
        try:
            result = self._verify_gemini(prompt)
            result["provider"] = "gemini"
            return result
        except HTTPException as gemini_exc:
            if not self.settings.openai_api_key.strip() or not _is_flaky_provider_error(gemini_exc):
                raise
            try:
                result = self._verify_openai(prompt)
                result["provider"] = "openai"
                result["fallback_from"] = "gemini"
                return result
            except HTTPException as openai_exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=(
                        f"Gemini failed ({gemini_exc.detail}); "
                        f"OpenAI fallback also failed ({openai_exc.detail})"
                    ),
                ) from openai_exc

    def _verify_gemini(self, prompt: str) -> dict:
        key = self.settings.gemini_api_key.strip()
        if not key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GEMINI_API_KEY is not configured. Add it to backend/.env to enable AI verify.",
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
                    "parts": [{"text": f"{VERIFY_SYSTEM}\n\n{prompt}"}],
                }
            ],
            "generationConfig": {"temperature": 0.2},
        }
        data = _http_json(url, method="POST", body=body)
        text = ""
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError):
            text = json.dumps(data)[:2000]
        parsed = _extract_verdict(text)
        parsed["raw"] = text
        return parsed

    def _verify_openai(self, prompt: str) -> dict:
        key = self.settings.openai_api_key.strip()
        if not key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OPENAI_API_KEY is not configured. Add it to backend/.env to enable AI verify.",
            )
        model = self.settings.openai_model.strip() or "gpt-4o-mini"
        url = "https://api.openai.com/v1/chat/completions"
        body = {
            "model": model,
            "temperature": 0.2,
            "messages": [
                {"role": "system", "content": VERIFY_SYSTEM},
                {"role": "user", "content": prompt},
            ],
        }
        data = _http_json(
            url,
            method="POST",
            body=body,
            headers={"Authorization": f"Bearer {key}"},
        )
        text = ""
        try:
            text = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            text = json.dumps(data)[:2000]
        parsed = _extract_verdict(text)
        parsed["raw"] = text
        return parsed
