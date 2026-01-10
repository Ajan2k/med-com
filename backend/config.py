import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Healthcare Enterprise Platform"
    
    # Database & Security
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY")
    
    # AI (Groq)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")
    
    # Zoom
    ZOOM_ACCOUNT_ID: str = os.getenv("ZOOM_ACCOUNT_ID")
    ZOOM_CLIENT_ID: str = os.getenv("ZOOM_CLIENT_ID")
    ZOOM_CLIENT_SECRET: str = os.getenv("ZOOM_CLIENT_SECRET")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL")

settings = Settings()