from app.models.schemas import TranscriptResult


class SpeechToTextService:
    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> TranscriptResult:
        if not audio_bytes:
            return TranscriptResult(text="", confidence=0)

        # Replace this mock with Whisper, Deepgram, Azure Speech, or Google STT.
        return TranscriptResult(
            text="Mock transcript: user asked for help using the voice assistant.",
            confidence=0.91,
        )