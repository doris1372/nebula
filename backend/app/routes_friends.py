from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import or_, select

from .auth import get_current_user
from .db import get_session
from .models import Friendship, User
from .schemas import FriendOut, FriendRequestCreate, FriendsList, UserPublic
from .utils import user_to_public
from .ws_hub import hub

router = APIRouter(prefix="/api/friends", tags=["friends"])


def _pair(a: int, b: int) -> tuple[int, int]:
    return (min(a, b), max(a, b))


async def _find_friendship(
    session: AsyncSession, a: int, b: int
) -> Friendship | None:
    pa, pb = _pair(a, b)
    return (
        await session.execute(
            select(Friendship).where(
                Friendship.user_a_id == pa, Friendship.user_b_id == pb
            )
        )
    ).scalar_one_or_none()


async def _to_out(
    session: AsyncSession, f: Friendship, me_id: int, online: set[int]
) -> FriendOut | None:
    other_id = f.user_b_id if f.user_a_id == me_id else f.user_a_id
    other = (
        await session.execute(select(User).where(User.id == other_id))
    ).scalar_one_or_none()
    if not other:
        return None
    status = f.status
    if status == "pending":
        status = "pending_out" if f.requested_by_id == me_id else "pending_in"
    return FriendOut(
        id=f.id or 0,
        user=user_to_public(other, "online" if (other.id in online) else "offline"),
        status=status,
        since=f.updated_at,
    )


@router.get("", response_model=FriendsList)
async def list_friends(
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    rows = (
        await session.execute(
            select(Friendship).where(
                or_(Friendship.user_a_id == current.id, Friendship.user_b_id == current.id)
            )
        )
    ).scalars().all()
    online = hub.online_user_ids()
    friends: list[FriendOut] = []
    incoming: list[FriendOut] = []
    outgoing: list[FriendOut] = []
    for f in rows:
        out = await _to_out(session, f, current.id or 0, online)
        if not out:
            continue
        if out.status == "accepted":
            friends.append(out)
        elif out.status == "pending_in":
            incoming.append(out)
        elif out.status == "pending_out":
            outgoing.append(out)
    return FriendsList(friends=friends, incoming=incoming, outgoing=outgoing)


@router.post("/request", response_model=FriendOut)
async def send_request(
    body: FriendRequestCreate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    handle = body.handle.strip().lower().lstrip("@")
    target = (
        await session.execute(select(User).where(User.handle == handle))
    ).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == current.id:
        raise HTTPException(status_code=400, detail="Can't befriend yourself")

    existing = await _find_friendship(session, current.id or 0, target.id or 0)
    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=400, detail="Already friends")
        if existing.status == "blocked":
            raise HTTPException(status_code=403, detail="Can't send request")
        # existing pending
        if existing.requested_by_id == current.id:
            raise HTTPException(status_code=400, detail="Request already sent")
        # They requested you — accept it instead
        existing.status = "accepted"
        session.add(existing)
        await session.commit()
        await session.refresh(existing)
        online = hub.online_user_ids()
        out = await _to_out(session, existing, current.id or 0, online)
        if out:
            await hub.send_to_user(
                target.id or 0,
                {
                    "type": "friend.accept",
                    "data": {"friendship_id": existing.id, "user_id": current.id},
                },
            )
            return out
        raise HTTPException(status_code=500, detail="Failed to materialize")

    pa, pb = _pair(current.id or 0, target.id or 0)
    f = Friendship(
        user_a_id=pa,
        user_b_id=pb,
        status="pending",
        requested_by_id=current.id or 0,
    )
    session.add(f)
    await session.commit()
    await session.refresh(f)

    online = hub.online_user_ids()
    # notify the target
    out_for_target = await _to_out(session, f, target.id or 0, online)
    if out_for_target:
        await hub.send_to_user(
            target.id or 0,
            {"type": "friend.request", "data": out_for_target.model_dump(mode="json")},
        )

    out = await _to_out(session, f, current.id or 0, online)
    if not out:
        raise HTTPException(status_code=500, detail="Failed to materialize")
    return out


@router.post("/{friendship_id}/accept", response_model=FriendOut)
async def accept_request(
    friendship_id: int,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    f = (
        await session.execute(select(Friendship).where(Friendship.id == friendship_id))
    ).scalar_one_or_none()
    if not f or current.id not in (f.user_a_id, f.user_b_id):
        raise HTTPException(status_code=404, detail="Request not found")
    if f.status != "pending" or f.requested_by_id == current.id:
        raise HTTPException(status_code=400, detail="Nothing to accept")
    f.status = "accepted"
    session.add(f)
    await session.commit()
    await session.refresh(f)

    online = hub.online_user_ids()
    # notify the other side
    other_id = f.user_b_id if f.user_a_id == current.id else f.user_a_id
    out_for_other = await _to_out(session, f, other_id, online)
    if out_for_other:
        await hub.send_to_user(
            other_id,
            {"type": "friend.accept", "data": out_for_other.model_dump(mode="json")},
        )
    out = await _to_out(session, f, current.id or 0, online)
    if not out:
        raise HTTPException(status_code=500, detail="Failed to materialize")
    return out


@router.delete("/{friendship_id}")
async def remove_or_cancel(
    friendship_id: int,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    f = (
        await session.execute(select(Friendship).where(Friendship.id == friendship_id))
    ).scalar_one_or_none()
    if not f or current.id not in (f.user_a_id, f.user_b_id):
        raise HTTPException(status_code=404, detail="Not found")
    other_id = f.user_b_id if f.user_a_id == current.id else f.user_a_id
    await session.delete(f)
    await session.commit()
    await hub.send_to_user(
        other_id,
        {"type": "friend.remove", "data": {"friendship_id": friendship_id, "user_id": current.id}},
    )
    return {"ok": True}


# Search for users by handle prefix (useful for "Add Friend" autocomplete)
@router.get("/search", response_model=list[UserPublic])
async def search_users(
    q: str,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    q = q.strip().lower().lstrip("@")
    if len(q) < 1:
        return []
    online = hub.online_user_ids()
    rows = (
        await session.execute(
            select(User)
            .where(User.handle.like(f"{q}%"))  # type: ignore[attr-defined]
            .where(User.id != current.id)
            .limit(10)
        )
    ).scalars().all()
    return [
        user_to_public(u, "online" if (u.id in online) else "offline") for u in rows
    ]
