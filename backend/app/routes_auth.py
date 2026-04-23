from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from .auth import create_token, get_current_user, hash_password, verify_password
from .db import get_session
from .models import Channel, Membership, Server, User
from .schemas import AuthResponse, LoginRequest, ProfileUpdate, SignupRequest, UserOut
from .utils import initials_of, make_invite_code

router = APIRouter(prefix="/api/auth", tags=["auth"])


GRADIENT_PRESETS = [
    "from-fuchsia-400 to-rose-500",
    "from-cyan-400 to-blue-600",
    "from-emerald-400 to-teal-500",
    "from-amber-400 to-orange-500",
    "from-violet-400 to-purple-600",
    "from-indigo-400 to-blue-700",
    "from-pink-400 to-red-500",
    "from-lime-400 to-green-600",
]


def pick_color(seed: str) -> str:
    idx = sum(ord(c) for c in seed) % len(GRADIENT_PRESETS)
    return GRADIENT_PRESETS[idx]


def user_out(u: User) -> UserOut:
    return UserOut(
        id=u.id or 0,
        email=u.email,
        handle=u.handle,
        name=u.name,
        avatar_color=u.avatar_color,
        activity=u.activity,
    )


@router.post("/signup", response_model=AuthResponse)
async def signup(body: SignupRequest, session: AsyncSession = Depends(get_session)):
    existing_email = (await session.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_handle = (await session.execute(select(User).where(User.handle == body.handle))).scalar_one_or_none()
    if existing_handle:
        raise HTTPException(status_code=400, detail="Handle already taken")

    user = User(
        email=body.email,
        handle=body.handle,
        name=body.name,
        password_hash=hash_password(body.password),
        avatar_color=pick_color(body.handle),
    )
    session.add(user)
    await session.flush()

    # Create a starter server for the new user
    server = Server(
        name=f"{body.name}'s space",
        owner_id=user.id or 0,
        initials=initials_of(body.name),
        invite_code=make_invite_code(),
        color=pick_color(body.handle + "server"),
    )
    session.add(server)
    await session.flush()

    session.add(Membership(user_id=user.id or 0, server_id=server.id or 0, role="founder"))
    session.add(Channel(server_id=server.id or 0, name="lobby", category="General", topic="Say hi and explore Nebula 🌙"))
    session.add(Channel(server_id=server.id or 0, name="random", category="General"))
    session.add(Channel(server_id=server.id or 0, name="Cozy Lounge", type="voice", category="Voice Stages"))

    await session.commit()
    await session.refresh(user)

    return AuthResponse(token=create_token(user.id or 0), user=user_out(user))


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest, session: AsyncSession = Depends(get_session)):
    user = (await session.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthResponse(token=create_token(user.id or 0), user=user_out(user))


@router.get("/me", response_model=UserOut)
async def me(current: User = Depends(get_current_user)):
    return user_out(current)


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: ProfileUpdate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if body.handle and body.handle != current.handle:
        existing = (
            await session.execute(select(User).where(User.handle == body.handle))
        ).scalar_one_or_none()
        if existing and existing.id != current.id:
            raise HTTPException(status_code=400, detail="Handle already taken")
        current.handle = body.handle
    if body.name is not None:
        current.name = body.name
    if body.avatar_color is not None:
        current.avatar_color = body.avatar_color
    if body.activity is not None:
        current.activity = body.activity or None
    session.add(current)
    await session.commit()
    await session.refresh(current)
    return user_out(current)
