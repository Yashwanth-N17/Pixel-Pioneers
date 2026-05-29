
# ai_service/app/routes/speech_routes.py
# Standalone speech-to-text endpoint (transcription only, no GPT)

import logging

import logging


from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.speech.whisper_service import transcribe_audio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/speech", tags=["Speech"])


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
):

    """
    Transcribes uploaded audio to text using Whisper.
    Returns raw transcription — no GPT analysis.
    Used for testing STT independently.
    """

    if not audio:
        raise HTTPException(status_code=400, detail="Audio file is required.")

    try:
        audio_bytes = await audio.read()
    except Exception as e:

        raise HTTPException(status_code=400, detail=f"Failed to read audio: {str(e)}")

        raise HTTPException(status_code=400, detail=f"Failed to read audio: {e}")

    try:
        result = await transcribe_audio(
            audio_bytes=audio_bytes,
            mimetype=audio.content_type or "audio/webm",
            language=language,
        )
        return {
            "success": True,
            "transcribed_text": result["text"],
            "language": result["language"],
            "duration": result["duration"],
        }
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))