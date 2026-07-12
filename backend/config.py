from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_key: str
    pipeline_api_url: str
    pipeline_token: str
    wildfire_base_url: str
    app_secret_key: str
    cors_origins: str = "http://localhost:5173"
    log_level: str = "INFO"
    enable_docs: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
