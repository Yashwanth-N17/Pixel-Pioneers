import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.loan_routes import router as loan_router
from app.core.config import settings
from app.routes.ai_analysis_routes import router as ai_analysis_router
from app.routes.chat_routes import router as chat_router
from app.routes.speech_routes import router as speech_router
from app.routes.voice_alert_routes import router as voice_alert_router
from app.voice_alerts.tts_generator import generate_all_audio_files


app = FastAPI(title=settings.APP_NAME, version="1.0.0")

from app.core.constants import settings

# Existing routers
# from app.routes import ocr_routes, scam_routes

# AI analysis router
from app.routes.ai_analysis_routes import router as ai_analysis_router

# Chat + Speech routers
from app.routes.chat_routes import router as chat_router
from app.routes.speech_routes import router as speech_router

logger = logging.getLogger(__name__)


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Multilingual financial intelligence for rural India",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Existing routers
# app.include_router(ocr_routes.router)
# app.include_router(scam_routes.router)

# AI Analysis
app.include_router(ai_analysis_router, prefix=settings.API_PREFIX)
app.include_router(chat_router)
app.include_router(speech_router)
app.include_router(voice_alert_router)


@app.on_event("startup")
async def on_startup():
    """Generate all prerecorded audio files on first boot."""
    logger.info("[STARTUP] Generating prerecorded voice alerts ...")
    await generate_all_audio_files()
    logger.info("[STARTUP] Voice alert audio ready.")

# Chat + Voice Input
app.include_router(chat_router)
app.include_router(speech_router)
app.include_router(loan_router)

@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "status": "running",
        "docs": "/docs",
        "health": f"{settings.API_PREFIX}/ai-analysis/health",

        "voice_alerts": "/api/v1/voice-alerts/catalogue",

    }


@app.get("/health")
async def health():
    return {
        "status": "ok",

        "service": "ArthSaathi AI"

        "service": settings.APP_NAME,

    }