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


class VoiceProcessResponse(BaseModel):
    session_id: str
    transcript: str
    intent: str
    response_text: str
    confidence: float = Field(ge=0, le=1)
    data: dict = Field(default_factory=dict)