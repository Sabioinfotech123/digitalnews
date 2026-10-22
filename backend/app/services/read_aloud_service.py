from __future__ import annotations

import time

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, status

from app.core.config import Settings, get_settings

_POLLY_OK_CACHE: tuple[float, bool, str | None] | None = None
_POLLY_CACHE_TTL_SEC = 300


def _client_error_code(exc: ClientError) -> str:
    return exc.response.get("Error", {}).get("Code", "Unknown")


class ReadAloudService:
    """Cloud TTS via Amazon Polly (same AWS credentials as S3)."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def is_configured(self) -> bool:
        return bool(
            self.settings.aws_access_key_id
            and self.settings.aws_secret_access_key
            and self.settings.read_aloud_polly_enabled
        )

    def _client(self):
        return boto3.client(
            "polly",
            aws_access_key_id=self.settings.aws_access_key_id,
            aws_secret_access_key=self.settings.aws_secret_access_key,
            region_name=self.settings.aws_region,
        )

    def polly_operational(self) -> tuple[bool, str | None]:
        """True when AWS keys work for Polly. Cached briefly."""
        global _POLLY_OK_CACHE
        if not self.is_configured():
            return False, "not_configured"

        now = time.time()
        if _POLLY_OK_CACHE and now - _POLLY_OK_CACHE[0] < _POLLY_CACHE_TTL_SEC:
            return _POLLY_OK_CACHE[1], _POLLY_OK_CACHE[2]

        ok = False
        reason: str | None = "polly_unreachable"
        try:
            self._client().describe_voices(LanguageCode="en-IN")
            ok = True
            reason = None
        except ClientError as exc:
            code = _client_error_code(exc)
            if code in {"UnrecognizedClientException", "InvalidClientTokenId", "SignatureDoesNotMatch"}:
                reason = "invalid_aws_credentials"
            elif code in {"AccessDeniedException", "UnauthorizedOperation"}:
                reason = "polly_access_denied"
            else:
                reason = code
        except BotoCoreError:
            reason = "polly_unreachable"

        _POLLY_OK_CACHE = (now, ok, reason)
        return ok, reason

    def _synthesis_attempts(self, client, *, language: str) -> list[dict]:
        lang_code = "te-IN" if language == "te" else "en-IN"
        attempts: list[dict] = []

        try:
            resp = client.describe_voices(LanguageCode=lang_code)
            for voice in resp.get("Voices", []):
                voice_id = voice["Id"]
                engines = voice.get("SupportedEngines") or ["standard"]
                if "neural" in engines:
                    attempts.append(
                        {"VoiceId": voice_id, "Engine": "neural", "LanguageCode": lang_code},
                    )
                if "standard" in engines:
                    attempts.append(
                        {"VoiceId": voice_id, "Engine": "standard", "LanguageCode": lang_code},
                    )
        except ClientError as exc:
            self._raise_for_client_error(exc)
        except BotoCoreError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="polly_unreachable",
            ) from exc

        if not attempts:
            if language == "te":
                attempts = [
                    {"VoiceId": "Kajal", "Engine": "neural", "LanguageCode": "te-IN"},
                    {"VoiceId": "Kajal", "Engine": "standard", "LanguageCode": "te-IN"},
                ]
            else:
                attempts = [
                    {"VoiceId": "Kajal", "Engine": "neural", "LanguageCode": "en-IN"},
                    {"VoiceId": "Aditi", "Engine": "standard", "LanguageCode": "en-IN"},
                ]

        seen: set[tuple[str, str, str]] = set()
        unique: list[dict] = []
        for row in attempts:
            key = (row["VoiceId"], row["Engine"], row["LanguageCode"])
            if key in seen:
                continue
            seen.add(key)
            unique.append(row)
        return unique

    def _raise_for_client_error(self, exc: ClientError) -> None:
        code = _client_error_code(exc)
        if code in {"UnrecognizedClientException", "InvalidClientTokenId", "SignatureDoesNotMatch"}:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="invalid_aws_credentials",
            ) from exc
        if code in {"AccessDeniedException", "UnauthorizedOperation"}:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="polly_access_denied",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"polly_error:{code}",
        ) from exc

    def synthesize_mp3(self, *, text: str, language: str) -> bytes:
        if not self.is_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="not_configured",
            )

        client = self._client()
        attempts = self._synthesis_attempts(client, language=language)

        last_error: ClientError | None = None
        for params in attempts:
            try:
                response = client.synthesize_speech(
                    Text=text,
                    OutputFormat="mp3",
                    TextType="text",
                    **params,
                )
                stream = response.get("AudioStream")
                if stream is None:
                    raise HTTPException(status_code=502, detail="polly_empty_audio")
                return stream.read()
            except ClientError as exc:
                last_error = exc
                if _client_error_code(exc) in {
                    "UnrecognizedClientException",
                    "InvalidClientTokenId",
                    "AccessDeniedException",
                }:
                    self._raise_for_client_error(exc)
                continue
            except BotoCoreError as exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="polly_unreachable",
                ) from exc

        if last_error:
            self._raise_for_client_error(last_error)
        raise HTTPException(status_code=502, detail="polly_no_voice")
