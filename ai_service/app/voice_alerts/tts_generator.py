import asyncio
import logging
from pathlib import Path

import edge_tts

from app.voice_alerts.alert_scripts import (
    ALERT_SCRIPTS,
    SUPPORTED_LANGUAGES,
    TTS_VOICE_MAP,
)

logger = logging.getLogger(__name__)

AUDIO_DIR = Path("app/audio")


def get_audio_path(alert_type: str, language: str) -> Path:
    return AUDIO_DIR / f"{alert_type}_{language}.mp3"


def audio_exists(alert_type: str, language: str) -> bool:
    return get_audio_path(alert_type, language).exists()


async def generate_single_audio(alert_type: str, language: str) -> bool:
    """Generate one TTS audio file using free Edge TTS and save it to disk."""
    path = get_audio_path(alert_type, language)

    if path.exists():
        logger.info(f"[TTS] Already exists, skipping: {path.name}")
        return True

    script = ALERT_SCRIPTS[alert_type][language]
    voice = TTS_VOICE_MAP.get(language, "en-IN-NeerjaNeural")

    try:
        logger.info(f"[TTS] Generating with Edge TTS: {alert_type} / {language}")

        communicate = edge_tts.Communicate(
            text=script,
            voice=voice,
            rate="+0%",
            volume="+0%",
            pitch="+0Hz",
        )

        await communicate.save(str(path))

        logger.info(f"[TTS] Saved: {path.name} ({path.stat().st_size} bytes)")
        return True

    except Exception as e:
        logger.error(f"[TTS] Failed {alert_type}/{language}: {e}")
        return False


async def generate_all_audio_files():
    """Called at app startup. Generates all missing audio files."""
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    tasks = []

    for alert_type, lang_scripts in ALERT_SCRIPTS.items():
        for language in SUPPORTED_LANGUAGES:
            if language in lang_scripts:
                tasks.append(generate_single_audio(alert_type, language))

    if not tasks:
        logger.info("[TTS] No audio generation tasks found.")
        return

    results = await asyncio.gather(*tasks)

    success = sum(1 for result in results if result)
    total = len(tasks)

    logger.info(f"[TTS] Audio generation complete: {success}/{total} files ready")


async def regenerate_audio(alert_type: str, language: str) -> bool:
    """Force regenerate a specific audio file."""
    path = get_audio_path(alert_type, language)

    if path.exists():
        path.unlink()

    return await generate_single_audio(alert_type, language)