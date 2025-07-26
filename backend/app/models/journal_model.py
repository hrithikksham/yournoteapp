# app/models/journal_model.py

from app.database import db
from bson import ObjectId
from datetime import datetime
from ..schemas.journal_schema import JournalEntryCreate, JournalEntryUpdate
from typing import List, Dict, Optional

collection = db["journal"]

async def create_journal_entry(entry: JournalEntryCreate, user_id: str) -> Dict:
    """Creates a new journal entry in the database."""
    entry_dict = entry.dict()
    entry_dict.update({
        "user_id": user_id,
        "entry_date": datetime.combine(entry.entry_date, datetime.min.time()),
        "created_at": datetime.utcnow()
    })
    
    result = await collection.insert_one(entry_dict)
    new_entry = await collection.find_one({"_id": result.inserted_id})
    return new_entry

# ✅ FIX: Renamed this function to match the one called in your routes.
async def get_all_journal_entries_for_user(user_id: str) -> List[Dict]:
    """Retrieves all journal entries for a user, sorted by date."""
    cursor = collection.find({"user_id": user_id}).sort("entry_date", -1)
    return await cursor.to_list(length=None) # Using length=None to get all documents

async def get_journal_entry_by_id(entry_id: str, user_id: str) -> Optional[Dict]:
    """Retrieves a single journal entry by its ID for a specific user."""
    return await collection.find_one({"_id": ObjectId(entry_id), "user_id": user_id})

async def update_journal_entry(entry_id: str, user_id: str, update_data: JournalEntryUpdate) -> Optional[Dict]:
    """Updates a specific journal entry."""
    update_payload = {"$set": update_data.dict(exclude_unset=True)}
    if update_data.entry_date:
        update_payload["$set"]["entry_date"] = datetime.combine(update_data.entry_date, datetime.min.time())
    
    update_payload["$set"]["updated_at"] = datetime.utcnow()
    
    from pymongo import ReturnDocument
    updated_entry = await collection.find_one_and_update(
        {"_id": ObjectId(entry_id), "user_id": user_id},
        update_payload,
        return_document=ReturnDocument.AFTER
    )
    return updated_entry

async def delete_journal_entry(entry_id: str, user_id: str) -> int:
    """Deletes a journal entry and returns the number of documents deleted."""
    result = await collection.delete_one({"_id": ObjectId(entry_id), "user_id": user_id})
    return result.deleted_count

    
