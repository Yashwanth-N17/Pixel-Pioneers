import base64

try:
    import edge_tts
except ImportError:  # pragma: no cover - allows local boot without optional TTS SDK
    edge_tts = None

from app.core.config import settings
from app.models.schemas import TtsResult


class TextToSpeechService:
    async def synthesize(self, text: str) -> TtsResult:
        if not text.strip() or edge_tts is None:
            return TtsResult(audio_base64="", audio_mime_type="audio/mpeg")

        communicate = edge_tts.Communicate(
            text=text,
            voice=getattr(settings, "TTS_VOICE", "en-US-JennyNeural"),
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
