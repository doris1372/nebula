from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    handle: str = Field(index=True, unique=True)
    name: str
    password_hash: str
    avatar_color: str = "from-brand-500 to-accent-500"
    activity: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)


class Server(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    owner_id: int = Field(foreign_key="user.id", index=True)
    banner: str = "from-brand-600 via-fuchsia-500 to-accent-400"
    initials: str
    color: str = "from-brand-500 to-accent-500"
    invite_code: str = Field(index=True, unique=True)
    created_at: datetime = Field(default_factory=utcnow)


class Membership(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    server_id: int = Field(foreign_key="server.id", index=True)
    role: str = "member"  # founder | moderator | member
    created_at: datetime = Field(default_factory=utcnow)


class Channel(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    server_id: int = Field(foreign_key="server.id", index=True)
    name: str
    type: str = "text"  # text | voice | announce | stage
    category: str = "General"
    position: int = 0
    topic: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    channel_id: Optional[int] = Field(default=None, foreign_key="channel.id", index=True)
    dm_id: Optional[int] = Field(default=None, foreign_key="directmessage.id", index=True)
    author_id: int = Field(foreign_key="user.id", index=True)
    content: str
    reply_to_id: Optional[int] = Field(default=None, foreign_key="message.id")
    edited: bool = False
    attachments_json: str = "[]"
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class Reaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    message_id: int = Field(foreign_key="message.id", index=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    emoji: str


class DirectMessage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_a_id: int = Field(foreign_key="user.id", index=True)
    user_b_id: int = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=utcnow)
