# app/schemas/reminder_schema.py

from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime

class ReminderBase(BaseModel):
    text: str
    due_date: date
    due_time: Optional[time] = None
    note: Optional[str] = None
    is_completed: bool = False

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    text: Optional[str] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    note: Optional[str] = None
    is_completed: Optional[bool] = None

class ReminderOut(ReminderBase):
    id: str
    user_id: str
    created_at: datetime