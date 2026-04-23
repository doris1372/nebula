import json
import secrets
import string
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from .models import Membership, Message, Reaction, User
from .schemas import MessageOut, UserPublic


def make_invite_code(n: int = 8) -> str:
    alphabet = string.ascii_lowercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(n))


def initials_of(name: str) -> str:
    words = [w for w in name.split() if w]
    if not words:
        return "?"
    if len(words) == 1:
        return words[0][:2].upper()
    return (words[0][0] + words[1][0]).upper()


def user_to_public(user: User, status: str = "online") -> UserPublic:
    return UserPublic(
        id=user.id or 0,
        handle=user.handle,
        name=user.name,
        avatar_color=user.avatar_color,
        activity=user.activity,
        status=status,
    )


async def ensure_membership(session: AsyncSession, user_id: int, server_id: int) -> Optional[Membership]:
    q = select(Membership).where(Membership.user_id == user_id, Membership.server_id == server_id)
    return (await session.execute(q)).scalar_one_or_none()


async def build_message_out(
    session: AsyncSession,
    message: Message,
    online_ids: set[int],
) -> MessageOut:
    author = (await session.execute(select(User).where(User.id == message.author_id))).scalar_one_or_none()
    author_public = (
        user_to_public(author, "online" if author and author.id in online_ids else "offline")
        if author
        else UserPublic(id=0, handle="unknown", name="Unknown", avatar_color="from-ink-500 to-ink-700", status="offline")
    )

    reply_preview: Optional[dict[str, Any]] = None
    if message.reply_to_id:
        reply_msg = (
            await session.execute(select(Message).where(Message.id == message.reply_to_id))
        ).scalar_one_or_none()
        if reply_msg:
            reply_author = (
                await session.execute(select(User).where(User.id == reply_msg.author_id))
            ).scalar_one_or_none()
            reply_preview = {
                "author_id": reply_msg.author_id,
                "author_name": reply_author.name if reply_author else "Unknown",
                "content": (reply_msg.content[:140] + "…") if len(reply_msg.content) > 140 else reply_msg.content,
            }

    reactions_rows = (
        await session.execute(select(Reaction).where(Reaction.message_id == message.id))
    ).scalars().all()
    by_emoji: dict[str, dict[str, Any]] = {}
    for r in reactions_rows:
        bucket = by_emoji.setdefault(r.emoji, {"emoji": r.emoji, "count": 0, "user_ids": []})
        bucket["count"] += 1
        bucket["user_ids"].append(r.user_id)
    reactions = list(by_emoji.values())

    try:
        attachments = json.loads(message.attachments_json or "[]")
        if not isinstance(attachments, list):
            attachments = []
    except json.JSONDecodeError:
        attachments = []

    return MessageOut(
        id=message.id or 0,
        channel_id=message.channel_id,
        dm_id=message.dm_id,
        author=author_public,
        content=message.content,
        reply_to_id=message.reply_to_id,
        reply_preview=reply_preview,
        edited=message.edited,
        attachments=attachments,
        reactions=reactions,
        created_at=message.created_at,
    )
