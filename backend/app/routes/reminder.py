# In app/routes/reminder.py

from fastapi import APIRouter, Depends, HTTPException, Response
from ..models import reminder_model
from ..utils.auth import get_current_user
from ..schemas.reminder_schema import ReminderCreate, ReminderUpdate, ReminderOut
from typing import List
from datetime import date, datetime

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])

def format_reminder_out(reminder_dict: dict) -> ReminderOut:
    """Helper to format the DB reminder object for the API response."""
    # ✅ Use .get() for safety in case the field is missing
    due_datetime = reminder_dict.get('due_datetime')
    
    if due_datetime:
        return ReminderOut(
            **reminder_dict,
            id=str(reminder_dict['_id']),
            due_date=due_datetime.date(),
            due_time=due_datetime.time() if due_datetime.time() != datetime.min.time() else None
        )
    else:
        # ✅ Provide a fallback for older reminders without a due date
        return ReminderOut(
            **reminder_dict,
            id=str(reminder_dict['_id']),
            due_date=datetime.utcnow().date(), # Default to today
            due_time=None
        )

@router.post("/", response_model=ReminderOut)
async def create_reminder(reminder: ReminderCreate, user: dict = Depends(get_current_user)):
    new_reminder_db = await reminder_model.create_reminder(reminder, user_id=user["id"])
    return format_reminder_out(new_reminder_db)

@router.get("/", response_model=List[ReminderOut])
async def get_all_reminders(user: dict = Depends(get_current_user)):
    reminders_db = await reminder_model.get_all_reminders_for_user(user_id=user["id"])
    return [format_reminder_out(r) for r in reminders_db]
    
@router.get("/{target_date}", response_model=List[ReminderOut])
async def get_reminders_by_date(target_date: date, user: dict = Depends(get_current_user)):
    reminders_db = await reminder_model.get_reminders_for_user_by_date(
        user_id=user["id"],
        target_date=datetime.combine(target_date, datetime.min.time())
    )
    return [format_reminder_out(r) for r in reminders_db]

@router.put("/{reminder_id}", response_model=ReminderOut)
async def update_reminder(reminder_id: str, update_data: ReminderUpdate, user: dict = Depends(get_current_user)):
    updated_reminder_db = await reminder_model.update_reminder(
        reminder_id=reminder_id,
        user_id=user["id"],
        update_data=update_data
    )
    if not updated_reminder_db:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return format_reminder_out(updated_reminder_db)

@router.delete("/{reminder_id}", status_code=204)
async def delete_reminder(reminder_id: str, user: dict = Depends(get_current_user)):
    deleted_count = await reminder_model.delete_reminder(reminder_id=reminder_id, user_id=user["id"])
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return Response(status_code=204)
