from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_name: str = "Patrimônio API"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: Literal["development", "staging", "production"] = "development"

    # Database
    database_url: str = "sqlite+aiosqlite:///./patrimonio.db"

    # CORS
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Cache
    cache_dir: str = "./cache"
    market_data_ttl_hours: int = 24

    # Monte Carlo defaults
    mc_simulations: int = 10_000
    mc_seed: int | None = None

    # BCB API
    bcb_base_url: str = "https://api.bcb.gov.br/dados/serie/bcdata.sgs"

    # Rate limiting (requests per minute for external APIs)
    yfinance_rate_limit: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
