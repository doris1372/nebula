from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import or_, select

from .auth import get_current_user
from .db import get_session
from .models import DirectMessage, User
from .schemas import DMCreate, DMOut, UserPublic
from .ws_hub import hub

router = APIRouter(prefix="/api/dms", tags=["dms"])


def _pair(a: int, b: int) -> tuple[int, int]:
    return (min(a, b), max(a, b))


@router.get("", response_model=list[DMOut])
async def list_my_dms(
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    q = select(DirectMessage).where(
        or_(DirectMessage.user_a_id == current.id, DirectMessage.user_b_id == current.id)
    )
    rows = (await session.execute(q)).scalars().all()
    online = hub.online_user_ids()
    out: list[DMOut] = []
    for dm in rows:
        other_id = dm.user_b_id if dm.user_a_id == current.id else dm.user_a_id
        other = (await session.execute(select(User).where(User.id == other_id))).scalar_one_or_none()
        if not other:
            continue
        out.append(
            DMOut(
                id=dm.id or 0,
                other_user=UserPublic(
                    id=other.id or 0,
                    handle=other.handle,
                    name=other.name,
                    avatar_color=other.avatar_color,
                    activity=other.activity,
                    status="online" if other.id in online else "offline",
                ),
            )
        )
    return out


@router.post("", response_model=DMOut)
async def open_dm(
    body: DMCreate,
    current: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if body.user_id == current.id:
        raise HTTPException(status_code=400, detail="Can't DM yourself")
    other = (await session.execute(select(User).where(User.id == body.user_id))).scalar_one_or_none()
    if not other:
        raise HTTPException(status_code=404, detail="User not found")

    a, b = _pair(current.id or 0, other.id or 0)
    existing = (
        await session.execute(
            select(DirectMessage).where(
                DirectMessage.user_a_id == a, DirectMessage.user_b_id == b
            )
        )
    ).scalar_one_or_none()
    if existing:
        dm = existing
    else:
        dm = DirectMessage(user_a_id=a, user_b_id=b)
        session.add(dm)
        await session.commit()
        await session.refresh(dm)

    online = hub.online_user_ids()
    return DMOut(
        id=dm.id or 0,
        other_user=UserPublic(
            id=other.id or 0,
            handle=other.handle,
            name=other.name,
            avatar_color=other.avatar_color,
            activity=other.activity,
            status="online" if other.id in online else "offline",
        ),
    )
