from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .db import init_db
from .routes_auth import router as auth_router
from .routes_dms import router as dms_router
from .routes_files import router as files_router
from .routes_messages import router as messages_router
from .routes_servers import channels_router, router as servers_router
from .routes_ws import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Nebula API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"^https://.*\.devinapps\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"ok": True}


app.include_router(auth_router)
app.include_router(servers_router)
app.include_router(channels_router)
app.include_router(messages_router)
app.include_router(dms_router)
app.include_router(files_router)
app.include_router(ws_router)
