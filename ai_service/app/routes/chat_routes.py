import json
import logging
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.finance_ai.chat_service import process_chat_message
from app.services.tts_service import TextToSpeechService
from app.speech.whisper_service import transcribe_audio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class TextChatRequest(BaseModel):
    message: str = Field(min_length=1)
    language: str = "en"
    user_context: dict[str, Any] = Field(default_factory=dict)


class TextToSpeechRequest(BaseModel):
    text: str = Field(min_length=1)
    language: str = "en"


@router.post("/message")
async def chat_message(request: TextChatRequest) -> dict[str, Any]:
    try:
        return await process_chat_message(
            message=request.message.strip(),
            language=request.language or "en",
            user_context=request.user_context or {},
        )
    except RuntimeError as exc:
        logger.error("[CHAT] text processing failed: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("[CHAT] unexpected text processing error")
        raise HTTPException(status_code=500, detail="Internal error in chat processing.") from exc


@router.post("/voice")
async def chat_voice(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
    user_context: str = Form(default="{}"),
) -> dict[str, Any]:
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is required.")
    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file too large. Maximum size is 25MB.")

    try:
        context_dict = json.loads(user_context) if user_context else {}
    except json.JSONDecodeError:
        context_dict = {}

    try:
        transcription = await transcribe_audio(
            audio_bytes=audio_bytes,
            mimetype=audio.content_type or "audio/webm",
            language=language or "en",
        )
    except RuntimeError as exc:
        logger.error("[CHAT] voice transcription failed: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    transcribed_text = (transcription.get("text") or "").strip()
    if not transcribed_text:
        raise HTTPException(status_code=422, detail="Could not transcribe audio. Please speak clearly and try again.")

    try:
        result = await process_chat_message(
            message=transcribed_text,
            language=language or "en",
            user_context=context_dict,
        )
    except RuntimeError as exc:
        logger.error("[CHAT] voice chat processing failed: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    result["transcribed_text"] = transcribed_text
    result["audio_duration"] = transcription.get("duration")
    return result


@router.post("/tts")
async def chat_tts(request: TextToSpeechRequest) -> dict[str, str]:
    try:
        tts = TextToSpeechService()
        result = await tts.synthesize(request.text, language=request.language)
        if not result.audio_base64:
            raise HTTPException(status_code=503, detail="Text-to-speech is not available.")
        return {
            "audio_base64": result.audio_base64,
            "audio_mime_type": result.audio_mime_type,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("[CHAT] TTS failed")
        raise HTTPException(status_code=503, detail="Text-to-speech failed.") from exc
