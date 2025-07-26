from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from fastapi.responses import JSONResponse
from ..schemas.note_schema import NoteCreate, NoteUpdate, NoteOut
from ..utils.auth import get_current_user
from ..models import note_model
from typing import List
import aiofiles
import re
from pathlib import Path
from datetime import datetime

router = APIRouter(prefix="/api/notes", tags=["Notes"])

@router.post("/", response_model=NoteOut)
async def create_note(note: NoteCreate, user: dict = Depends(get_current_user)):
    new_note = await note_model.create_note(note, user_id=user["id"])
    return NoteOut(**new_note, id=str(new_note["_id"]))

@router.get("/", response_model=List[NoteOut])
async def get_notes(user: dict = Depends(get_current_user)):
    notes = await note_model.get_notes_for_user(user_id=user["id"])
    return [NoteOut(**note, id=str(note["_id"])) for note in notes]

@router.get("/{note_id}", response_model=NoteOut)
async def get_note_by_id(note_id: str, user: dict = Depends(get_current_user)):
    note = await note_model.get_note_by_id(note_id=note_id, user_id=user["id"])
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteOut(**note, id=str(note["_id"]))

@router.put("/{note_id}", response_model=NoteOut)
async def update_note(note_id: str, update_data: NoteUpdate, user: dict = Depends(get_current_user)):
    updated_note = await note_model.update_note(
        note_id=note_id, 
        user_id=user["id"], 
        update_data=update_data
    )
    if not updated_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteOut(**updated_note, id=str(updated_note["_id"]))

@router.delete("/{note_id}", status_code=204)
async def delete_note(note_id: str, user: dict = Depends(get_current_user)):
    deleted_count = await note_model.delete_note(note_id=note_id, user_id=user["id"])
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return Response(status_code=204)

@router.post("/upload-image")
async def upload_note_image(
    file: UploadFile = File(...),  # 👈 Explicitly expecting multipart/form-data
    user: dict = Depends(get_current_user)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image format")

    uploads_dir = Path("app/static/note_images")
    uploads_dir.mkdir(parents=True, exist_ok=True)

    safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '', file.filename)
    filename = f"{user['id']}_{datetime.utcnow().timestamp()}_{safe_filename}"
    file_path = uploads_dir / filename

    try:
        async with aiofiles.open(file_path, "wb") as buffer:
            content = await file.read()
            await buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {e}")

    public_path = f"/static/note_images/{filename}"
    return {"message": "Image uploaded successfully", "filename": filename, "path": public_path}