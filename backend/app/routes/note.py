from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.schemas.note_schema import NoteCreate, NoteUpdate, NoteOut
from app.database import db
from app.utils.auth import get_current_user
from bson import ObjectId
from datetime import datetime
import os
import shutil

router = APIRouter(prefix="/api/notes", tags=["Notes"])

@router.post("/", response_model=NoteOut)
async def create_note(note: NoteCreate, user=Depends(get_current_user)):
    note_dict = note.dict()
    note_dict.update({
        "user_id": str(user["id"]),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    result = await db["notes"].insert_one(note_dict)
    note_dict["id"] = str(result.inserted_id)
    return NoteOut(**note_dict)

@router.get("/", response_model=list[NoteOut])
async def get_notes(user=Depends(get_current_user)):
    notes_cursor = db["notes"].find({"user_id": str(user["_id"])})
    notes = []
    async for note in notes_cursor:
        note["id"] = str(note["_id"])
        notes.append(NoteOut(**note))
    return notes

@router.put("/{note_id}", response_model=NoteOut)
async def update_note(note_id: str, update_data: NoteUpdate, user=Depends(get_current_user)):
    note = await db["notes"].find_one({
        "_id": ObjectId(note_id),
        "user_id": str(user["_id"])
    })
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    await db["notes"].update_one(
        {"_id": ObjectId(note_id)},
        {"$set": {
            **update_data.dict(exclude_unset=True),
            "updated_at": datetime.utcnow()
        }}
    )
    updated_note = await db["notes"].find_one({"_id": ObjectId(note_id)})
    updated_note["id"] = str(updated_note["_id"])
    return NoteOut(**updated_note)

@router.delete("/{note_id}")
async def delete_note(note_id: str, user=Depends(get_current_user)):
    result = await db["notes"].delete_one({
        "_id": ObjectId(note_id),
        "user_id": str(user["_id"])
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted successfully"}

@router.post("/upload-image/")
async def upload_note_image(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    # Validate file type (optional)
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image format")

    # Save path
    uploads_dir = "app/static/note_images"
    os.makedirs(uploads_dir, exist_ok=True)

    # Unique file name to avoid overwriting
    filename = f"{user['id']}_{datetime.utcnow().timestamp()}_{file.filename}"
    file_path = os.path.join(uploads_dir, filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Public path for frontend use
    public_path = f"/static/note_images/{filename}"

    return {
        "message": "Image uploaded successfully",
        "filename": filename,
        "path": public_path
    }