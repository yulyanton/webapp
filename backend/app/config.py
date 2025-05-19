# app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGO_DETAILS: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "notes_app_modular"
    NOTES_COLLECTION_NAME: str = "notes"

    # Для чтения из .env файла (если он есть)
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
