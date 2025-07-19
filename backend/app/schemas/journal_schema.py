# In a new file, e.g., app/schemas/journal_schema.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class JournalEntryCreate(BaseModel):
    content: str
    entry_date: date
    image_urls: Optional[List[str]] = []

class JournalEntryUpdate(BaseModel):
    content: Optional[str] = None
    entry_date: Optional[date] = None
    image_urls: Optional[List[str]] = None

class JournalEntryOut(BaseModel):
    id: str
    user_id: str
    content: str
    entry_date: date
    image_urls: List[str]
    created_at: datetime