from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


# Auth
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=40)
    handle: str = Field(min_length=2, max_length=24, pattern=r"^[a-z0-9_.-]+$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: "UserOut"


# Users
class UserOut(BaseModel):
    id: int
    email: EmailStr
    handle: str
    name: str
    avatar_color: str
    activity: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    handle: str
    name: str
    avatar_color: str
    activity: Optional[str] = None
    status: str = "online"


# Servers
class ServerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    color: Optional[str] = None
    banner: Optional[str] = None


class ServerOut(BaseModel):
    id: int
    name: str
    initials: str
    color: str
    banner: str
    invite_code: str
    owner_id: int
    member_count: int = 0


class JoinRequest(BaseModel):
    invite_code: str


# Channels
class ChannelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    type: str = Field(default="text", pattern=r"^(text|voice|announce|stage)$")
    category: str = "General"
    topic: Optional[str] = None


class ChannelOut(BaseModel):
    id: int
    server_id: int
    name: str
    type: str
    category: str
    position: int
    topic: Optional[str] = None


# Messages
class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)
    reply_to_id: Optional[int] = None
    attachments: list[dict[str, Any]] = Field(default_factory=list)


class MessageUpdate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class ReactionToggle(BaseModel):
    emoji: str = Field(min_length=1, max_length=16)


class MessageOut(BaseModel):
    id: int
    channel_id: Optional[int] = None
    dm_id: Optional[int] = None
    author: UserPublic
    content: str
    reply_to_id: Optional[int] = None
    reply_preview: Optional[dict[str, Any]] = None
    edited: bool
    attachments: list[dict[str, Any]] = Field(default_factory=list)
    reactions: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime


# DMs
class DMCreate(BaseModel):
    user_id: int


class DMOut(BaseModel):
    id: int
    other_user: UserPublic


# Friends
class FriendRequestCreate(BaseModel):
    handle: str = Field(min_length=2, max_length=24)


class FriendOut(BaseModel):
    id: int  # friendship id
    user: UserPublic
    status: str  # "accepted" | "pending_in" | "pending_out"
    since: datetime


class FriendsList(BaseModel):
    friends: list[FriendOut]
    incoming: list[FriendOut]
    outgoing: list[FriendOut]


# WS envelopes
class WSEvent(BaseModel):
    type: str
    data: dict[str, Any] = Field(default_factory=dict)


AuthResponse.model_rebuild()
