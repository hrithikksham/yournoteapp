# app/models/reminder_model.py

from app.database import db
from bson import ObjectId
from datetime import datetime
from ..schemas.reminder_schema import ReminderCreate, ReminderUpdate
from typing import List, Dict, Optional
from pymongo import ReturnDocument

collection = db["reminders"]

async def create_reminder(reminder: ReminderCreate, user_id: str) -> Dict:
    """Creates a new reminder in the database."""
    reminder_dict = reminder.dict()
    # Convert date and time to a single datetime object for storage and sorting
    due_datetime = datetime.combine(reminder.due_date, reminder.due_time or datetime.min.time())
    
    reminder_dict.update({
        "user_id": user_id,
        "due_datetime": due_datetime,
        "created_at": datetime.utcnow()
    })
    # Remove original date/time fields to avoid redundancy
    del reminder_dict['due_date']
    if 'due_time' in reminder_dict:
        del reminder_dict['due_time']

    result = await collection.insert_one(reminder_dict)
    return await collection.find_one({"_id": result.inserted_id})

async def get_reminders_for_user_by_date(user_id: str, target_date: datetime) -> List[Dict]:
    """Retrieves all reminders for a user on a specific date, sorted by time."""
    start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)

    cursor = collection.find({
        "user_id": user_id,
        "due_datetime": {"$gte": start_of_day, "$lte": end_of_day}
    }).sort("due_datetime", 1) # Sort by time ascending
    return await cursor.to_list(length=None)

async def update_reminder(reminder_id: str, user_id: str, update_data: ReminderUpdate) -> Optional[Dict]:
    """Updates a specific reminder."""
    update_payload = update_data.dict(exclude_unset=True)

    # Handle date/time update if necessary
    if 'due_date' in update_payload or 'due_time' in update_payload:
        # Get existing reminder to combine date/time correctly
        existing = await collection.find_one({"_id": ObjectId(reminder_id), "user_id": user_id})
        if not existing: return None
        
        new_date = update_data.due_date or existing.get('due_datetime').date()
        new_time = update_data.due_time or existing.get('due_datetime').time()
        update_payload['due_datetime'] = datetime.combine(new_date, new_time)
        
        if 'due_date' in update_payload: del update_payload['due_date']
        if 'due_time' in update_payload: del update_payload['due_time']

    updated_reminder = await collection.find_one_and_update(
        {"_id": ObjectId(reminder_id), "user_id": user_id},
        {"$set": update_payload},
        return_document=ReturnDocument.AFTER
    )
    return updated_reminder

async def delete_reminder(reminder_id: str, user_id: str) -> int:
    """Deletes a reminder and returns the number of documents deleted."""
    result = await collection.delete_one({"_id": ObjectId(reminder_id), "user_id": user_id})
    return result.deleted_count

async def get_all_reminders_for_user(user_id: str) -> List[Dict]:
    """Retrieves all reminders for a user, sorted by creation date."""
    cursor = collection.find({"user_id": user_id}).sort("created_at", -1)
    return await cursor.to_list(length=None)