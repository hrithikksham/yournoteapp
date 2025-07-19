from fastapi import APIRouter, Depends
from ..utils.auth import get_current_user
from ..models import note_model, reminder_model
from typing import List, Dict
from datetime import datetime, date
from bson import ObjectId # Import ObjectId to check its type

router = APIRouter(prefix="/api/home", tags=["Home Screen"])

def format_db_item(item: Dict) -> Dict:
    """Helper function to convert ObjectId to string for any item."""
    if "_id" in item and isinstance(item["_id"], ObjectId):
        item["_id"] = str(item["_id"])
    return item

@router.get("/")
async def get_home_data(user: dict = Depends(get_current_user)):
    """
    Aggregates all necessary data for the main home screen in one call.
    """
    user_id = user["id"]
    
    # 1. Fetch today's upcoming reminders
    today = datetime.combine(date.today(), datetime.min.time())
    reminders_db = await reminder_model.get_reminders_for_user_by_date(user_id, today)
    upcoming_reminders = [r for r in reminders_db if not r.get('is_completed', False)][:3]

    # 2. Fetch all notes
    notes_db = await note_model.get_notes_for_user(user_id)

    # 3. Extract all unique labels from the notes
    all_labels = set()
    for note in notes_db:
        if "labels" in note and note["labels"]:
            for label in note["labels"]:
                all_labels.add(label)

    # 4. ✅ Manually convert all ObjectId fields to strings before returning
    return {
        "reminders": [format_db_item(r) for r in upcoming_reminders],
        "notes": [format_db_item(n) for n in notes_db],
        "labels": sorted(list(all_labels))
    }
