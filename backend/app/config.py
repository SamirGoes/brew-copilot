from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="BREW_", env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./data/brew-copilot.db"
    cors_origins: list[str] = ["http://localhost:5173"]
    styles_path: Path = BASE_DIR / "data" / "styles.json"


settings = Settings()
