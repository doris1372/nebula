import json
from typing import Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from .auth import decode_token
from .db import get_session
from .models import Channel, DirectMessage, Membership, User
from .utils import user_to_public
from .ws_hub import hub

router = APIRouter(tags=["ws"])


@router.websocket("/ws")
async def ws_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    if not token:
        await websocket.close(code=4401)
        return
    uid = decode_token(token)
    if uid is None:
        await websocket.close(code=4401)
        return
    user = (await session.execute(select(User).where(User.id == uid))).scalar_one_or_none()
    if not user:
        await websocket.close(code=4401)
        return

    memberships = (
        await session.execute(select(Membership).where(Membership.user_id == user.id))
    ).scalars().all()
    server_ids = [m.server_id for m in memberships]

    await websocket.accept()
    await hub.connect(user.id or 0, websocket, server_ids)
    try:
        await websocket.send_text(
            json.dumps(
                {
                    "type": "hello",
                    "data": {
                        "user_id": user.id,
                        "online_user_ids": list(hub.online_user_ids()),
                    },
                }
            )
        )
        while True:
            raw = await websocket.receive_text()
            try:
                evt = json.loads(raw)
            except json.JSONDecodeError:
                continue
            etype = evt.get("type")
            data = evt.get("data") or {}
            if etype == "typing":
                channel_id = data.get("channel_id")
                dm_id = data.get("dm_id")
                payload = {
                    "type": "typing",
                    "data": {
                        "user_id": user.id,
                        "user_name": user.name,
                        "channel_id": channel_id,
                        "dm_id": dm_id,
                    },
                }
                if channel_id:
                    for sid in server_ids:
                        await hub.broadcast_to_server(sid, payload)
                elif dm_id:
                    # send back to both DM participants
                    await hub.send_to_user(user.id or 0, payload)
            elif etype == "presence":
                await hub.broadcast_presence(user.id or 0, data.get("status", "online"))
            elif etype == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            elif etype and etype.startswith("call."):
                await _handle_call(etype, data, user, session)
    except WebSocketDisconnect:
        pass
    finally:
        await hub.disconnect(user.id or 0, websocket)


async def _authorize_room(room: str, user: User, session: AsyncSession) -> bool:
    if not room:
        return False
    kind, _, raw_id = room.partition(":")
    try:
        rid = int(raw_id)
    except ValueError:
        return False
    if kind == "dm":
        dm = (
            await session.execute(select(DirectMessage).where(DirectMessage.id == rid))
        ).scalar_one_or_none()
        return bool(dm and user.id in (dm.user_a_id, dm.user_b_id))
    if kind == "vc":
        chan = (
            await session.execute(select(Channel).where(Channel.id == rid))
        ).scalar_one_or_none()
        if not chan:
            return False
        mem = (
            await session.execute(
                select(Membership).where(
                    Membership.user_id == user.id, Membership.server_id == chan.server_id
                )
            )
        ).scalar_one_or_none()
        return bool(mem)
    return False


async def _handle_call(etype: str, data: dict, user: User, session: AsyncSession) -> None:
    room = data.get("room")
    if not isinstance(room, str):
        return
    if not await _authorize_room(room, user, session):
        return
    me_id = user.id or 0
    me_public = user_to_public(user, "online").model_dump()

    if etype == "call.invite":
        target = data.get("target_user_id")
        if isinstance(target, int) and target != me_id:
            # Only allow inviting the other DM participant
            if room.startswith("dm:"):
                dm = (
                    await session.execute(
                        select(DirectMessage).where(
                            DirectMessage.id == int(room.split(":", 1)[1])
                        )
                    )
                ).scalar_one_or_none()
                if not dm:
                    return
                if target not in (dm.user_a_id, dm.user_b_id) or target == me_id:
                    return
            await hub.send_to_user(
                target,
                {
                    "type": "call.incoming",
                    "data": {"room": room, "from_user": me_public},
                },
            )
        return

    if etype == "call.decline":
        target = data.get("target_user_id")
        if isinstance(target, int):
            await hub.send_to_user(
                target,
                {"type": "call.declined", "data": {"room": room, "user_id": me_id}},
            )
        return

    if etype == "call.join":
        existing_ids = await hub.call_join(me_id, room)
        # Send current members to the joiner (they'll initiate offers)
        users = []
        if existing_ids:
            rows = (
                await session.execute(select(User).where(User.id.in_(existing_ids)))  # type: ignore[attr-defined]
            ).scalars().all()
            users = [user_to_public(u, "online").model_dump() for u in rows]
        await hub.send_to_user(
            me_id,
            {"type": "call.joined", "data": {"room": room, "members": users}},
        )
        # Notify existing participants of the newcomer
        await hub.broadcast_to_users(
            existing_ids,
            {"type": "call.peer_join", "data": {"room": room, "user": me_public}},
        )
        return

    if etype == "call.leave":
        remaining = await hub.call_leave(me_id, room)
        await hub.broadcast_to_users(
            remaining,
            {"type": "call.peer_leave", "data": {"room": room, "user_id": me_id}},
        )
        return

    if etype == "call.signal":
        target = data.get("target_user_id")
        payload = data.get("payload")
        if not isinstance(target, int) or payload is None:
            return
        # Only forward if target is actually in the room
        members = hub.call_members(room)
        if target not in members:
            return
        await hub.send_to_user(
            target,
            {
                "type": "call.signal",
                "data": {"room": room, "from_user_id": me_id, "payload": payload},
            },
        )
        return
