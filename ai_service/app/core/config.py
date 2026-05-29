from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "ArthSaathi AI Service"
    APP_ENV: str = "development"
    API_PREFIX: str = "/api/v1"

    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GROQ_CHAT_MODEL: str = "llama-3.1-8b-instant"
    GROQ_BUDGET_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_WHISPER_MODEL: str = "whisper-large-v3-turbo"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
