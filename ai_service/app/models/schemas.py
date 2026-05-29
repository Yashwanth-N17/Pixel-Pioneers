from pydantic import BaseModel, Field


class TranscriptResult(BaseModel):
    text: str
    confidence: float = Field(ge=0, le=1)


class IntentResult(BaseModel):
    name: str
    confidence: float = Field(ge=0, le=1)
    entities: dict[str, str] = Field(default_factory=dict)


class LlmResult(BaseModel):
    text: str
    data: dict = Field(default_factory=dict)


class TtsResult(BaseModel):
    audio_base64: str
    audio_mime_type: str = "audio/mpeg"


class VoiceProcessResponse(BaseModel):
    session_id: str
    transcript: str
    intent: str
    response_text: str
    response_audio_base64: str
    response_audio_mime_type: str
    confidence: float = Field(ge=0, le=1)
    data: dict = Field(default_factory=dict)