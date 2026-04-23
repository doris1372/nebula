from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from .auth import get_current_user
from .db import get_session
from .models import Channel, Membership, Server, User
from .schemas import ChannelCreate, ChannelOut, JoinRequest, ServerCreate, ServerOut
from .utils import initials_of, make_invite_code
from .routes_auth import pick_color

router = APIRouter(prefix="/api/servers", tags=["servers"])


async def server_to_out(session: AsyncSession, s: Server) -> ServerOut:
    count = (
        await session.execute(select(func.count(Membership.id)).where(Membership.server_id == s.id))
    ).scalar_one()
    return ServerOut(
        id=s.id or 0,
        name=s.name,
        initials=s.initials,
        color=s.color,
        banner=s.banner,
        invite_code=s.invite_code,
        owner_id=s.owner_id,
        member_count=int(count or 0),
    )


@router.get("", response_model=list[ServerOut])
async def list_my_servers(
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    q = (
        select(Server)
        .join(Membership, Membership.server_id == Server.id)
        .where(Membership.user_id == current.id)
        .order_by(Server.created_at)
    )
    servers = (await session.execute(q)).scalars().all()
    return [await server_to_out(session, s) for s in servers]


@router.post("", response_model=ServerOut)
async def create_server(
    body: ServerCreate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    server = Server(
        name=body.name,
        owner_id=current.id or 0,
        initials=initials_of(body.name),
        color=body.color or pick_color(body.name),
        banner=body.banner or "from-brand-600 via-fuchsia-500 to-accent-400",
        invite_code=make_invite_code(),
    )
    session.add(server)
    await session.flush()
    session.add(Membership(user_id=current.id or 0, server_id=server.id or 0, role="founder"))
    session.add(Channel(server_id=server.id or 0, name="lobby", category="General", topic="Welcome to the channel 🎉"))
    session.add(Channel(server_id=server.id or 0, name="random", category="General"))
    await session.commit()
    await session.refresh(server)
    return await server_to_out(session, server)


@router.post("/join", response_model=ServerOut)
async def join_server(
    body: JoinRequest,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    code = body.invite_code.strip().lower()
    server = (await session.execute(select(Server).where(Server.invite_code == code))).scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Invite code not found")
    existing = (
        await session.execute(
            select(Membership).where(
                Membership.server_id == server.id, Membership.user_id == current.id
            )
        )
    ).scalar_one_or_none()
    if not existing:
        session.add(Membership(user_id=current.id or 0, server_id=server.id or 0, role="member"))
        await session.commit()
    await session.refresh(server)
    return await server_to_out(session, server)


@router.delete("/{server_id}/membership")
async def leave_server(
    server_id: int,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    server = (
        await session.execute(select(Server).where(Server.id == server_id))
    ).scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    mem = (
        await session.execute(
            select(Membership).where(
                Membership.server_id == server_id, Membership.user_id == current.id
            )
        )
    ).scalar_one_or_none()
    if not mem:
        raise HTTPException(status_code=404, detail="Not a member")
    if server.owner_id == current.id:
        raise HTTPException(
            status_code=400,
            detail="Owners can't leave their own server. Delete it instead.",
        )
    await session.delete(mem)
    await session.commit()
    return {"ok": True}


@router.get("/{server_id}/members")
async def list_members(
    server_id: int,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # ensure the user is a member
    mine = (
        await session.execute(
            select(Membership).where(
                Membership.server_id == server_id, Membership.user_id == current.id
            )
        )
    ).scalar_one_or_none()
    if not mine:
        raise HTTPException(status_code=403, detail="Not a member of this server")

    from .ws_hub import hub

    rows = (
        await session.execute(
            select(User, Membership.role)
            .join(Membership, Membership.user_id == User.id)
            .where(Membership.server_id == server_id)
            .order_by(User.name)
        )
    ).all()
    online = hub.online_user_ids()
    return [
        {
            "id": u.id,
            "handle": u.handle,
            "name": u.name,
            "avatar_color": u.avatar_color,
            "activity": u.activity,
            "role": role,
            "status": "online" if u.id in online else "offline",
        }
        for (u, role) in rows
    ]


# --- channels ---

channels_router = APIRouter(prefix="/api/servers/{server_id}/channels", tags=["channels"])


async def _assert_member(session: AsyncSession, user: User, server_id: int) -> None:
    row = (
        await session.execute(
            select(Membership).where(
                Membership.server_id == server_id, Membership.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=403, detail="Not a member of this server")


@channels_router.get("", response_model=list[ChannelOut])
async def list_channels(
    server_id: int,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await _assert_member(session, current, server_id)
    rows = (
        await session.execute(
            select(Channel).where(Channel.server_id == server_id).order_by(Channel.category, Channel.position, Channel.id)
        )
    ).scalars().all()
    return [ChannelOut(**c.model_dump()) for c in rows]


@channels_router.post("", response_model=ChannelOut)
async def create_channel(
    server_id: int,
    body: ChannelCreate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await _assert_member(session, current, server_id)
    ch = Channel(
        server_id=server_id,
        name=body.name,
        type=body.type,
        category=body.category,
        topic=body.topic,
    )
    session.add(ch)
    await session.commit()
    await session.refresh(ch)
    return ChannelOut(**ch.model_dump())
