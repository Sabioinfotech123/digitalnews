"""Shared HTTP + retry helpers for LLM API calls (breaks import cycles)."""

from __future__ import annotations

import json
import urllib.error
import urllib.request

from fastapi import HTTPException, status

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


def http_json(
    url: str,
    *,
    method: str = "GET",
    body: dict | None = None,
    headers: dict | None = None,
    timeout: int = 45,
) -> dict:
    data = None
    req_headers = {"User-Agent": "DigitalNewsLlm/1.0", "Accept": "application/json"}
    if headers:
        req_headers.update(headers)
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        req_headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
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


def is_flaky_provider_error(exc: HTTPException) -> bool:
    """True when a provider failed in a way that warrants trying the next model."""
    if exc.status_code not in {
        status.HTTP_502_BAD_GATEWAY,
        status.HTTP_503_SERVICE_UNAVAILABLE,
        status.HTTP_504_GATEWAY_TIMEOUT,
    }:
        return False
    detail = str(exc.detail or "").lower()
    return any(marker in detail for marker in _FLAKY_MARKERS)