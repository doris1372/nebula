import json
from typing import Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from .auth import decode_token
from .db import get_session
from .models import Membership, User
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
    except WebSocketDisconnect:
        pass
    finally:
        await hub.disconnect(user.id or 0, websocket)
