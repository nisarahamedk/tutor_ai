from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Intelligent Tutoring System Backend"
    API_V1_STR: str = "/api/v1"
    # Add other configurations here (e.g., database URL, API keys)

    # Example: SUPABASE_URL: str = "your_supabase_url"
    # Example: SUPABASE_KEY: str = "your_supabase_key"
    # Example: TEMPORAL_SERVER: str = "localhost:7233"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
