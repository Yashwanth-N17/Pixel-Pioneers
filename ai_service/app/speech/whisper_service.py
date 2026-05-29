import io
import logging

try:
    from groq import AsyncGroq
except ImportError:  # pragma: no cover - allows local boot without optional AI SDK
    AsyncGroq = None

from app.core.config import settings

logger = logging.getLogger(__name__)

DEFAULT_WHISPER_MODEL = "whisper-large-v3-turbo"
MIMETYPE_EXT = {
    "audio/webm": "webm",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/ogg": "ogg",
    "audio/flac": "flac",
    "audio/m4a": "m4a",
    "audio/x-m4a": "m4a",
}


async def transcribe_audio(audio_bytes: bytes, mimetype: str = "audio/webm", language: str = "en") -> dict:
    if not audio_bytes:
        return {"text": "", "language": language, "duration": None}

    if not settings.GROQ_API_KEY or AsyncGroq is None:
        logger.warning("[WHISPER] GROQ_API_KEY missing; returning fallback transcript.")
        return {
            "text": "Voice input received. Please help me with my finances.",
            "language": language,
            "duration": None,
        }

    ext = MIMETYPE_EXT.get(mimetype, "webm")
    filename = f"audio.{ext}"
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    try:
        transcription = await client.audio.transcriptions.create(
            file=(filename, io.BytesIO(audio_bytes), mimetype),
            model=settings.GROQ_WHISPER_MODEL or DEFAULT_WHISPER_MODEL,
            language=language,
            response_format="verbose_json",
        )
        return {
            "text": (getattr(transcription, "text", "") or "").strip(),
            "language": getattr(transcription, "language", language),
            "duration": getattr(transcription, "duration", None),
        }
    except Exception as exc:
        logger.error("[WHISPER] Transcription failed: %s", exc)
        raise RuntimeError(f"Transcription failed: {exc}") from exc
