
# ai_service/app/routes/chat_routes.py
# FastAPI routes for text and voice chat

import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional

import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel


from app.finance_ai.chat_service import process_chat_message
from app.speech.whisper_service import transcribe_audio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Chat"])



# ─────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────


class TextChatRequest(BaseModel):
    message: str
    language: Optional[str] = "en"
    user_context: Optional[dict] = {}



# ─────────────────────────────────────────
# TEXT CHAT
# ─────────────────────────────────────────

@router.post("/message")
async def chat_message(request: TextChatRequest):
    """
    Accepts a text message, classifies intent, calls GPT,
    and returns structured financial response.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")


@router.post("/message")
async def chat_message(request: TextChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        result = await process_chat_message(
            message=request.message,
            language=request.language or "en",
            user_context=request.user_context or {},
        )
        return result
    except RuntimeError as e:

        logger.error(f"[CHAT ROUTE] Error: {str(e)}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"[CHAT ROUTE] Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal error in chat processing.")


# ─────────────────────────────────────────
# VOICE CHAT
# ─────────────────────────────────────────


        logger.error(f"[CHAT] Error: {e}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"[CHAT] Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal error in chat processing.")


@router.post("/voice")
async def chat_voice(
    audio: UploadFile = File(...),
    language: str = Form(default="en"),
    user_context: str = Form(default="{}"),
):

    """
    Accepts audio file, transcribes via Whisper,
    then passes transcribed text through GPT financial analysis.
    """
    import json

    # Validate file

    if not audio:
        raise HTTPException(status_code=400, detail="Audio file is required.")

    if audio.size and audio.size > 25 * 1024 * 1024:

        raise HTTPException(
            status_code=413,
            detail="Audio file too large. Maximum size is 25MB."
        )

    # Parse user context

        raise HTTPException(status_code=413, detail="Audio file too large. Maximum size is 25MB.")


    try:
        context_dict = json.loads(user_context)
    except Exception:
        context_dict = {}


    # Read audio bytes
    try:
        audio_bytes = await audio.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read audio file: {str(e)}")

    # Step 1 — Transcribe

    try:
        audio_bytes = await audio.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read audio file: {e}")


    try:
        transcription = await transcribe_audio(
            audio_bytes=audio_bytes,
            mimetype=audio.content_type or "audio/webm",
            language=language,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    transcribed_text = transcription.get("text", "")


    if not transcribed_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not transcribe audio. Please speak clearly and try again."
        )

    # Step 2 — Process through GPT

    if not transcribed_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not transcribe audio. Please speak clearly and try again.",
        )


    try:
        result = await process_chat_message(
            message=transcribed_text,
            language=language,
            user_context=context_dict,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


    # Merge transcription into result
    result["transcribed_text"] = transcribed_text
    result["audio_duration"] = transcription.get("duration")


    result["transcribed_text"] = transcribed_text
    result["audio_duration"] = transcription.get("duration")

    return result