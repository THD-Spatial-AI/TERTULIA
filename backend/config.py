from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PostgreSQL
    database_url: str

    # Go authentication service
    auth_service_url: str = "http://localhost:8001"
    auth_internal_secret: str = ""
    auth_realm: str = "tertulia"

    # feeedback_pipeline backend URL
    pipeline_api_url: str
    pipeline_token: str

    # Wildfire application base URL
    wildfire_base_url: str

    # CORS
    cors_origins: str = "http://localhost:5173"

    log_level: str = "INFO"
    enable_docs: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
