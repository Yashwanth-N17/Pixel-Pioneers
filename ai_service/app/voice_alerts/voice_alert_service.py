import logging
from pathlib import Path

from app.voice_alerts.alert_scripts import (
    ALERT_SCRIPTS,
    LANGUAGE_NAMES,
    SUPPORTED_ALERT_TYPES,
    SUPPORTED_LANGUAGES,
)
from app.voice_alerts.tts_generator import audio_exists, get_audio_path

logger = logging.getLogger(__name__)


def get_alert_catalogue() -> dict:
    """Return a full catalogue of all available alerts with availability status."""
    catalogue = {}

    for alert_type in SUPPORTED_ALERT_TYPES:
        catalogue[alert_type] = {
            "alert_type": alert_type,
            "languages": {},
        }
        for lang in SUPPORTED_LANGUAGES:
            if lang in ALERT_SCRIPTS[alert_type]:
                catalogue[alert_type]["languages"][lang] = {
                    "language_name": LANGUAGE_NAMES[lang],
                    "audio_ready": audio_exists(alert_type, lang),
                    "audio_url": f"/api/v1/voice-alerts/audio/{alert_type}/{lang}",
                    "script_preview": ALERT_SCRIPTS[alert_type][lang][:80] + "...",
                }

    return catalogue


def get_audio_file_path(alert_type: str, language: str) -> Path | None:
    """Return path to audio file if it exists, else None."""
    if alert_type not in SUPPORTED_ALERT_TYPES:
        return None
    if language not in SUPPORTED_LANGUAGES:
        return None
    if not audio_exists(alert_type, language):
        return None
    return get_audio_path(alert_type, language)


def get_alert_script(alert_type: str, language: str) -> str | None:
    """Return the raw script text for an alert."""
    return ALERT_SCRIPTS.get(alert_type, {}).get(language)