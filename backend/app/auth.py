from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Query, WebSocket, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from .config import JWT_ALG, JWT_EXPIRY_DAYS, JWT_SECRET
from .db import get_session
from .models import User

bearer = HTTPBearer(auto_error=False)


def _truncate(raw: str) -> bytes:
    return raw.encode("utf-8")[:72]


def hash_password(raw: str) -> str:
    return bcrypt.hashpw(_truncate(raw), bcrypt.gensalt()).decode("utf-8")


def verify_password(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_truncate(raw), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=JWT_EXPIRY_DAYS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return int(payload["sub"])
    except Exception:
        return None


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    session: AsyncSession = Depends(get_session),
) -> User:
    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    uid = decode_token(creds.credentials)
    if uid is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = (await session.execute(select(User).where(User.id == uid))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_user_from_ws(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> User:
    if not token:
        await websocket.close(code=4401)
        raise HTTPException(status_code=401, detail="Missing token")
    uid = decode_token(token)
    if uid is None:
        await websocket.close(code=4401)
        raise HTTPException(status_code=401, detail="Invalid token")
    user = (await session.execute(select(User).where(User.id == uid))).scalar_one_or_none()
    if user is None:
        await websocket.close(code=4401)
        raise HTTPException(status_code=401, detail="User not found")
    return user
