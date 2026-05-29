import base64

try:
    import edge_tts
except ImportError:  # pragma: no cover - allows local boot without optional TTS SDK
    edge_tts = None

from app.core.config import settings
from app.models.schemas import TtsResult


TTS_VOICE_MAP = {
    "en": "en-IN-NeerjaNeural",
    "hi": "hi-IN-SwaraNeural",
    "kn": "kn-IN-SapnaNeural",
    "mr": "mr-IN-AarohiNeural",
    "ta": "ta-IN-PallaviNeural",
    "te": "te-IN-ShrutiNeural",
}


class TextToSpeechService:
    async def synthesize(self, text: str, language: str = "en") -> TtsResult:
        if not text.strip() or edge_tts is None:
            return TtsResult(audio_base64="", audio_mime_type="audio/mpeg")

        lang_code = (language or "en").lower().split("-")[0]
        voice = TTS_VOICE_MAP.get(lang_code, getattr(settings, "TTS_VOICE", "en-IN-NeerjaNeural"))

        communicate = edge_tts.Communicate(
            text=text,
            voice=voice,
        )

        audio_chunks: list[bytes] = []

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])

        audio_bytes = b"".join(audio_chunks)

        return TtsResult(
            audio_base64=base64.b64encode(audio_bytes).decode("utf-8"),
            audio_mime_type="audio/mpeg",
        )
