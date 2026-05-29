from fastapi import FastAPI, File, Form, UploadFile

from app.core.config import settings
from app.models.schemas import VoiceProcessResponse
from app.routes.budget_planning_routes import router as budget_planning_router
from app.routes.chat_routes import router as chat_router
from app.services.orchestrator import VoiceOrchestrator

app = FastAPI(title=settings.APP_NAME)

orchestrator = VoiceOrchestrator()
app.include_router(budget_planning_router)
app.include_router(chat_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.APP_NAME,
    }


@app.post("/v1/voice/process", response_model=VoiceProcessResponse)
async def process_voice(
    audio: UploadFile = File(...),
    session_id: str = Form("anonymous"),
) -> VoiceProcessResponse:
    audio_bytes = await audio.read()

    return await orchestrator.process_audio(
        audio_bytes=audio_bytes,
        filename=audio.filename or "voice-input.wav",
        content_type=audio.content_type or "application/octet-stream",
        session_id=session_id,
    )
