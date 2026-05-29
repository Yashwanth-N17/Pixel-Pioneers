import logging
from typing import Literal

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from app.voice_alerts.alert_scripts import (
    SUPPORTED_ALERT_TYPES,
    SUPPORTED_LANGUAGES,
    LANGUAGE_NAMES,
)
from app.voice_alerts.tts_generator import regenerate_audio
from app.voice_alerts.voice_alert_service import (
    get_alert_catalogue,
    get_alert_script,
    get_audio_file_path,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/voice-alerts", tags=["Voice Alerts"])


@router.get("/catalogue")
def list_all_alerts():
    """
    Returns the full catalogue of all prerecorded voice alerts.
    Use this on the frontend to know which audio files are available.

    Response includes:
    - alert_type: scam_alert | arthsaathi_intro | otp_warning
    - per language: audio_ready flag + direct audio_url + script preview
    """
    return {
        "success": True,
        "supported_languages": LANGUAGE_NAMES,
        "supported_alert_types": SUPPORTED_ALERT_TYPES,
        "catalogue": get_alert_catalogue(),
    }


@router.get("/audio/{alert_type}/{language}")
def stream_audio(
    alert_type: str,
    language: str,
):
    """
    Stream the prerecorded MP3 audio for the given alert_type + language.
    Call this URL from an <audio> tag or fetch it for playback.

    alert_type: scam_alert | arthsaathi_intro | otp_warning
    language:   en | hi | kn | mr | ta | te
    """
    if alert_type not in SUPPORTED_ALERT_TYPES:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown alert_type '{alert_type}'. Valid: {SUPPORTED_ALERT_TYPES}",
        )
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown language '{language}'. Valid: {SUPPORTED_LANGUAGES}",
        )

    path = get_audio_file_path(alert_type, language)
    if path is None:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Audio for '{alert_type}/{language}' is not yet ready. "
                "It will be generated on next server startup. "
                "Check /catalogue for audio_ready status."
            ),
        )

    return FileResponse(
        path=str(path),
        media_type="audio/mpeg",
        filename=f"arthsaathi_{alert_type}_{language}.mp3",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/script/{alert_type}/{language}")
def get_script(alert_type: str, language: str):
    """
    Return the plain text script for a given alert + language.
    Useful for showing subtitles alongside audio playback.
    """
    if alert_type not in SUPPORTED_ALERT_TYPES:
        raise HTTPException(status_code=404, detail=f"Unknown alert_type '{alert_type}'")
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=404, detail=f"Unknown language '{language}'")

    script = get_alert_script(alert_type, language)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found for this combination")

    return {
        "success": True,
        "alert_type": alert_type,
        "language": language,
        "language_name": LANGUAGE_NAMES[language],
        "script": script,
    }


@router.post("/regenerate/{alert_type}/{language}")
async def regenerate(
    alert_type: str,
    language: str,
    background_tasks: BackgroundTasks,
):
    """
    Admin endpoint: force-regenerate audio for a specific alert + language.
    Runs in the background. Check /catalogue after a few seconds to confirm.
    """
    if alert_type not in SUPPORTED_ALERT_TYPES:
        raise HTTPException(status_code=404, detail=f"Unknown alert_type '{alert_type}'")
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=404, detail=f"Unknown language '{language}'")

    background_tasks.add_task(regenerate_audio, alert_type, language)

    return {
        "success": True,
        "message": f"Regeneration started for {alert_type}/{language}. Check /catalogue in ~10 seconds.",
        "audio_url": f"/api/v1/voice-alerts/audio/{alert_type}/{language}",
    }


@router.get("/health")
def health():
    return {"status": "ok", "module": "voice_alerts"}