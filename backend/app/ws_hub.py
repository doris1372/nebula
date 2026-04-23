import asyncio
import json
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class Hub:
    """Tracks connected websockets per user, plus presence and broadcast helpers."""

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        # user_id -> set of sockets
        self.connections: dict[int, set[WebSocket]] = defaultdict(set)
        # server_id -> set of user_ids (members who have an open socket)
        self.server_members: dict[int, set[int]] = defaultdict(set)
        # user_id -> set of server_ids they subscribe to
        self.user_servers: dict[int, set[int]] = defaultdict(set)
        # channel_id -> set of user_ids currently typing
        self.typing: dict[int, set[int]] = defaultdict(set)

    async def connect(self, user_id: int, ws: WebSocket, server_ids: list[int]) -> None:
        async with self._lock:
            was_offline = not self.connections[user_id]
            self.connections[user_id].add(ws)
            self.user_servers[user_id] = set(server_ids)
            for sid in server_ids:
                self.server_members[sid].add(user_id)
        if was_offline:
            await self.broadcast_presence(user_id, "online")

    async def disconnect(self, user_id: int, ws: WebSocket) -> None:
        async with self._lock:
            sockets = self.connections.get(user_id, set())
            sockets.discard(ws)
            still_online = bool(sockets)
            server_ids = list(self.user_servers.get(user_id, set()))
            if not still_online:
                for sid in server_ids:
                    self.server_members.get(sid, set()).discard(user_id)
                self.user_servers.pop(user_id, None)
                self.connections.pop(user_id, None)
        if not still_online:
            for sid in server_ids:
                await self.broadcast_to_server(sid, {"type": "presence", "data": {"user_id": user_id, "status": "offline"}})

    async def broadcast_presence(self, user_id: int, status: str) -> None:
        server_ids = list(self.user_servers.get(user_id, set()))
        for sid in server_ids:
            await self.broadcast_to_server(sid, {"type": "presence", "data": {"user_id": user_id, "status": status}})

    async def send_to_user(self, user_id: int, payload: dict[str, Any]) -> None:
        sockets = list(self.connections.get(user_id, set()))
        for ws in sockets:
            try:
                await ws.send_text(json.dumps(payload, default=str))
            except Exception:
                pass

    async def broadcast_to_server(self, server_id: int, payload: dict[str, Any]) -> None:
        user_ids = list(self.server_members.get(server_id, set()))
        for uid in user_ids:
            await self.send_to_user(uid, payload)

    async def broadcast_to_users(self, user_ids: list[int], payload: dict[str, Any]) -> None:
        for uid in user_ids:
            await self.send_to_user(uid, payload)

    def online_user_ids(self) -> set[int]:
        return {uid for uid, socks in self.connections.items() if socks}


hub = Hub()
