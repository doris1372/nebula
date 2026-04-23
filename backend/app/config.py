import os
from pathlib import Path

DATA_DIR = Path(os.environ.get("NEBULA_DATA_DIR", "/data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "nebula.db"
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me-please")
JWT_ALG = "HS256"
JWT_EXPIRY_DAYS = 30

CORS_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,https://dist-orelpyss.devinapps.com",
    ).split(",")
    if o.strip()
]
