
# ai_service/app/speech/whisper_service.py
# Whisper speech-to-text via OpenAI API

import io
import logging
from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# Language code mapping — ISO 639-1 codes that Whisper accepts
SUPPORTED_LANGUAGES = {
    "en": "en",
    "hi": "hi",
    "kn": "kn",
    "te": "te",
    "ta": "ta",
    "mr": "mr",
}


async def transcribe_audio(
    audio_bytes: bytes,
    mimetype: str = "audio/webm",
    language: str = "en",
) -> dict:
    """
    Transcribe audio bytes using OpenAI Whisper.

    Returns:
        {
            "text": str,
            "language": str,
            "duration": float | None
        }
    """
    whisper_lang = SUPPORTED_LANGUAGES.get(language, None)

    # Determine file extension from mimetype
    ext_map = {
        "audio/mpeg": "mp3",
        "audio/mp4": "mp4",
        "audio/wav": "wav",
        "audio/x-wav": "wav",
        "audio/webm": "webm",
        "audio/ogg": "ogg",
        "audio/flac": "flac",
        "audio/m4a": "m4a",
        "audio/x-m4a": "m4a",
    }
    extension = ext_map.get(mimetype, "webm")
    filename = f"audio_input.{extension}"

    try:
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename  # OpenAI SDK uses .name for format detection

        logger.info(f"[WHISPER] Transcribing audio | lang={whisper_lang} | size={len(audio_bytes)} bytes")

        transcription = await client.audio.transcriptions.create(
            model="whisper-1",
            file=(filename, audio_bytes, mimetype),
            language=whisper_lang,
            response_format="verbose_json",
        )

        text = transcription.text or ""
        duration = getattr(transcription, "duration", None)

        logger.info(f"[WHISPER] Transcription complete: '{text[:80]}...'")

        return {
            "text": text.strip(),
            "language": language,
            "duration": duration,
        }

    except Exception as e:
        logger.error(f"[WHISPER] Transcription failed: {str(e)}")
        raise RuntimeError(f"Whisper transcription failed: {str(e)}")

import io
import logging

from groq import AsyncGroq
from app.core.config import settings

logger = logging.getLogger(__name__)

client = AsyncGroq(api_key=settings.GROQ_API_KEY)

# Groq's Whisper endpoint is free-tier
WHISPER_MODEL = "whisper-large-v3-turbo"

MIMETYPE_EXT = {
    "audio/webm": "webm",
    "audio/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/flac": "flac",
}


async def transcribe_audio(audio_bytes: bytes, mimetype: str, language: str = "en") -> dict:
    ext = MIMETYPE_EXT.get(mimetype, "webm")
    filename = f"audio.{ext}"

    try:
        transcription = await client.audio.transcriptions.create(
            file=(filename, io.BytesIO(audio_bytes), mimetype),
            model=WHISPER_MODEL,
            language=language,
            response_format="verbose_json",
        )
        return {
            "text": transcription.text,
            "language": getattr(transcription, "language", language),
            "duration": getattr(transcription, "duration", None),
        }
    except Exception as e:
        logger.error(f"[WHISPER] Transcription failed: {e}")
        raise RuntimeError(f"Transcription failed: {e}")

