# app/models/note_model.py

from app.database import db
from bson import ObjectId
from datetime import datetime
from ..schemas.note_schema import NoteCreate, NoteUpdate
from typing import List, Dict, Optional
from pymongo import ReturnDocument

collection = db["notes"]

async def create_note(note: NoteCreate, user_id: str) -> Dict:
    """Creates a new note in the database."""
    note_dict = note.dict()
    note_dict.update({
        "user_id": user_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    result = await collection.insert_one(note_dict)
    new_note = await collection.find_one({"_id": result.inserted_id})
    return new_note

async def get_notes_for_user(user_id: str) -> List[Dict]:
    """Retrieves all notes for a user, sorted by last updated."""
    cursor = collection.find({"user_id": user_id}).sort("updated_at", -1)
    return await cursor.to_list(length=None)

async def get_note_by_id(note_id: str, user_id: str) -> Optional[Dict]:
    """Retrieves a single note by its ID for a specific user."""
    return await collection.find_one({"_id": ObjectId(note_id), "user_id": user_id})

async def update_note(note_id: str, user_id: str, update_data: NoteUpdate) -> Optional[Dict]:
    """Updates a specific note."""
    update_payload = {
        "$set": {
            **update_data.dict(exclude_unset=True),
            "updated_at": datetime.utcnow()
        }
    }
    
    updated_note = await collection.find_one_and_update(
        {"_id": ObjectId(note_id), "user_id": user_id},
        update_payload,
        return_document=ReturnDocument.AFTER
    )
    return updated_note

async def delete_note(note_id: str, user_id: str) -> int:
    """Deletes a note and returns the number of documents deleted."""
    result = await collection.delete_one({"_id": ObjectId(note_id), "user_id": user_id})
    return result.deleted_count