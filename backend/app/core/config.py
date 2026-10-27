from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Smart Energy Intelligence"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development | production | test

    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str = "sqlite:///./data/smart_energy.db"

    HA_BASE_URL: str = ""
    HA_TOKEN: str = ""
    HA_VERIFY_SSL: bool = False

    TELEMETRY_INTERVAL_SECONDS: int = 30
    TELEMETRY_RETRY_LIMIT: int = 3

    DEMO_MODE: bool = True
    DEMO_DATA_SEED: int = 42

    DEFAULT_CURRENCY: str = "INR"
    DEFAULT_TARIFF_RATE: float = 7.50

    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173"]'

    TIMEZONE: str = "Asia/Kolkata"

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        # In production, disallow default insecure secret keys
        return v

    def validate_production_security(self) -> None:
        """
        Hardens production deployment by asserting strong secrets and non-wildcard configs.
        """
        if self.ENVIRONMENT == "production":
            if self.SECRET_KEY in ["dev-secret-key-change-in-production", "secret", "changeme", ""]:
                raise ValueError("Insecure default SECRET_KEY cannot be used in production environment.")
            if len(self.SECRET_KEY) < 32:
                raise ValueError("SECRET_KEY must be at least 32 characters in production.")

    def get_cors_origins(self) -> List[str]:
        try:
            origins = json.loads(self.CORS_ORIGINS)
            if isinstance(origins, list):
                # Never allow wildcard in production
                return [o.strip() for o in origins if o.strip() and (self.ENVIRONMENT != "production" or o != "*")]
            return ["http://localhost:5173"]
        except Exception:
            return ["http://localhost:5173"]


settings = Settings()
