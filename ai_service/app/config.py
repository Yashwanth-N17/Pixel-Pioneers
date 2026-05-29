from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    APP_NAME: str = "voice-ai-service"
    AI_PROVIDER: str = "mock"
    VECTOR_DB_ENABLED: bool = False
    TTS_VOICE: str = "en-US-JennyNeural"

    class Config:
        env_file = ".env"


settings = Settings()