import mimetypes
import secrets
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from .auth import get_current_user
from .config import UPLOAD_DIR
from .models import User

router = APIRouter(prefix="/api/files", tags=["files"])

MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


def _safe_suffix(name: str) -> str:
    suffix = Path(name).suffix.lower()
    if len(suffix) > 10 or any(c in suffix for c in "/\\"):
        return ""
    return suffix


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current: User = Depends(get_current_user),
):
    _ = current  # authorization only
    content = await file.read()
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File too large")
    token = secrets.token_urlsafe(16)
    suffix = _safe_suffix(file.filename or "")
    fname = f"{token}{suffix}"
    out_path = UPLOAD_DIR / fname
    out_path.write_bytes(content)
    mime = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
    kind = "image" if mime.startswith("image/") else "file"
    return {
        "url": f"/api/files/{fname}",
        "name": file.filename,
        "size": len(content),
        "kind": kind,
        "mime": mime,
    }


@router.get("/{fname}")
async def get_file(fname: str):
    # Prevent path traversal: only allow the exact filename
    if "/" in fname or "\\" in fname or fname.startswith("."):
        raise HTTPException(status_code=400, detail="Bad filename")
    path = UPLOAD_DIR / fname
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path)
