import pydantic_settings
from typing import Optional
from enum import Enum
from granian.log import LogLevels
from sqlalchemy.engine.url import URL

class DevPhase(str, Enum):
    DEV = "dev"
    PROD = "prod"

class Settings(pydantic_settings.BaseSettings):
    project_name: str = "Citygen"
    dev_phase: DevPhase = DevPhase.PROD
    app_port: int = 8000
    secret_key: str
    access_token_lifetime_seconds: int = 60 * 60 * 24 * 30
    log_level: LogLevels = LogLevels.info

    mail_username: Optional[str] = None
    mail_password: Optional[str] = None
    mail_from: Optional[str] = None
    mail_port: Optional[int] = None
    mail_server: Optional[str] = None
    mail_from_name: Optional[str] = None
    mail_starttls: bool = True
    mail_ssl_tls: bool = False

    db_driver: str = "postgresql+asyncpg"
    db_host: str
    db_port: int = 5432
    db_user: str = "postgres"
    db_password: str = "password"
    db_database: str = "postgres"

    db_pool_size: int = 0
    db_max_overflow: int = 0
    db_echo: bool = False
    db_pool_pre_ping: bool = True

    @property
    def db_dsn(self) -> URL:
        return URL.create(
            self.db_driver,
            self.db_user,
            self.db_password,
            self.db_host,
            self.db_port,
            self.db_database,
        )
    
    @property
    def mail_enabled(self) -> bool:
        return self.mail_username is not None and self.mail_password is not None


settings = Settings()
