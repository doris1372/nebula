import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from .auth import get_current_user
from .db import get_session
from .models import Channel, DirectMessage, Membership, Message, Reaction, User
from .schemas import MessageCreate, MessageOut, MessageUpdate, ReactionToggle
from .utils import build_message_out
from .ws_hub import hub

router = APIRouter(tags=["messages"])


async def _channel_and_server(session: AsyncSession, channel_id: int) -> tuple[Channel, int]:
    ch = (await session.execute(select(Channel).where(Channel.id == channel_id))).scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Channel not found")
    return ch, ch.server_id


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


async def _assert_dm_participant(session: AsyncSession, user: User, dm_id: int) -> DirectMessage:
    dm = (await session.execute(select(DirectMessage).where(DirectMessage.id == dm_id))).scalar_one_or_none()
    if not dm or (user.id not in (dm.user_a_id, dm.user_b_id)):
        raise HTTPException(status_code=403, detail="Not part of this DM")
    return dm


# ---- Channel messages ----

@router.get("/api/channels/{channel_id}/messages", response_model=list[MessageOut])
async def list_channel_messages(
    channel_id: int,
    before: int | None = None,
    limit: int = 50,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _, server_id = await _channel_and_server(session, channel_id)
    await _assert_member(session, current, server_id)
    q = select(Message).where(Message.channel_id == channel_id)
    if before:
        q = q.where(Message.id < before)
    q = q.order_by(Message.id.desc()).limit(min(max(limit, 1), 100))
    rows = (await session.execute(q)).scalars().all()
    online = hub.online_user_ids()
    out = [await build_message_out(session, m, online) for m in rows]
    out.reverse()
    return out


@router.post("/api/channels/{channel_id}/messages", response_model=MessageOut)
async def post_channel_message(
    channel_id: int,
    body: MessageCreate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    ch, server_id = await _channel_and_server(session, channel_id)
    await _assert_member(session, current, server_id)
    msg = Message(
        channel_id=channel_id,
        author_id=current.id or 0,
        content=body.content,
        reply_to_id=body.reply_to_id,
        attachments_json=json.dumps(body.attachments or []),
    )
    session.add(msg)
    await session.commit()
    await session.refresh(msg)

    online = hub.online_user_ids()
    payload = await build_message_out(session, msg, online)
    await hub.broadcast_to_server(
        server_id,
        {"type": "message.create", "data": payload.model_dump(mode="json")},
    )
    return payload


@router.patch("/api/messages/{message_id}", response_model=MessageOut)
async def edit_message(
    message_id: int,
    body: MessageUpdate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    msg = (await session.execute(select(Message).where(Message.id == message_id))).scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Not found")
    if msg.author_id != current.id:
        raise HTTPException(status_code=403, detail="Not your message")
    msg.content = body.content
    msg.edited = True
    session.add(msg)
    await session.commit()
    await session.refresh(msg)

    online = hub.online_user_ids()
    payload = await build_message_out(session, msg, online)
    if msg.channel_id:
        ch = (await session.execute(select(Channel).where(Channel.id == msg.channel_id))).scalar_one_or_none()
        if ch:
            await hub.broadcast_to_server(
                ch.server_id, {"type": "message.update", "data": payload.model_dump(mode="json")}
            )
    elif msg.dm_id:
        dm = (await session.execute(select(DirectMessage).where(DirectMessage.id == msg.dm_id))).scalar_one_or_none()
        if dm:
            await hub.broadcast_to_users(
                [dm.user_a_id, dm.user_b_id],
                {"type": "message.update", "data": payload.model_dump(mode="json")},
            )
    return payload


@router.delete("/api/messages/{message_id}")
async def delete_message(
    message_id: int,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    msg = (await session.execute(select(Message).where(Message.id == message_id))).scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Not found")
    if msg.author_id != current.id:
        raise HTTPException(status_code=403, detail="Not your message")

    channel_id = msg.channel_id
    dm_id = msg.dm_id

    # delete reactions first
    rxs = (await session.execute(select(Reaction).where(Reaction.message_id == message_id))).scalars().all()
    for r in rxs:
        await session.delete(r)
    await session.delete(msg)
    await session.commit()

    if channel_id:
        ch = (await session.execute(select(Channel).where(Channel.id == channel_id))).scalar_one_or_none()
        if ch:
            await hub.broadcast_to_server(
                ch.server_id, {"type": "message.delete", "data": {"id": message_id, "channel_id": channel_id}}
            )
    elif dm_id:
        dm = (await session.execute(select(DirectMessage).where(DirectMessage.id == dm_id))).scalar_one_or_none()
        if dm:
            await hub.broadcast_to_users(
                [dm.user_a_id, dm.user_b_id],
                {"type": "message.delete", "data": {"id": message_id, "dm_id": dm_id}},
            )
    return {"ok": True}


@router.post("/api/messages/{message_id}/reactions", response_model=MessageOut)
async def toggle_reaction(
    message_id: int,
    body: ReactionToggle,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    msg = (await session.execute(select(Message).where(Message.id == message_id))).scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Not found")

    existing = (
        await session.execute(
            select(Reaction).where(
                Reaction.message_id == message_id,
                Reaction.user_id == current.id,
                Reaction.emoji == body.emoji,
            )
        )
    ).scalar_one_or_none()
    if existing:
        await session.delete(existing)
    else:
        session.add(Reaction(message_id=message_id, user_id=current.id or 0, emoji=body.emoji))
    await session.commit()

    online = hub.online_user_ids()
    payload = await build_message_out(session, msg, online)
    if msg.channel_id:
        ch = (await session.execute(select(Channel).where(Channel.id == msg.channel_id))).scalar_one_or_none()
        if ch:
            await hub.broadcast_to_server(
                ch.server_id, {"type": "message.update", "data": payload.model_dump(mode="json")}
            )
    elif msg.dm_id:
        dm = (await session.execute(select(DirectMessage).where(DirectMessage.id == msg.dm_id))).scalar_one_or_none()
        if dm:
            await hub.broadcast_to_users(
                [dm.user_a_id, dm.user_b_id],
                {"type": "message.update", "data": payload.model_dump(mode="json")},
            )
    return payload


# ---- DM messages ----

@router.get("/api/dms/{dm_id}/messages", response_model=list[MessageOut])
async def list_dm_messages(
    dm_id: int,
    before: int | None = None,
    limit: int = 50,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    await _assert_dm_participant(session, current, dm_id)
    q = select(Message).where(Message.dm_id == dm_id)
    if before:
        q = q.where(Message.id < before)
    q = q.order_by(Message.id.desc()).limit(min(max(limit, 1), 100))
    rows = (await session.execute(q)).scalars().all()
    online = hub.online_user_ids()
    out = [await build_message_out(session, m, online) for m in rows]
    out.reverse()
    return out


@router.post("/api/dms/{dm_id}/messages", response_model=MessageOut)
async def post_dm_message(
    dm_id: int,
    body: MessageCreate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    dm = await _assert_dm_participant(session, current, dm_id)
    msg = Message(
        dm_id=dm_id,
        author_id=current.id or 0,
        content=body.content,
        reply_to_id=body.reply_to_id,
        attachments_json=json.dumps(body.attachments or []),
    )
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    online = hub.online_user_ids()
    payload = await build_message_out(session, msg, online)
    await hub.broadcast_to_users(
        [dm.user_a_id, dm.user_b_id],
        {"type": "message.create", "data": payload.model_dump(mode="json")},
    )
    return payload
