from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# This schema is used when creating a note for the first time
class NoteCreate(BaseModel):
    title: str
    content: str
    labels: Optional[List[str]] = []
    is_locked: bool = False

# This schema defines the optional fields that can be sent when updating a note.
class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    labels: Optional[List[str]] = None
    is_locked: Optional[bool] = None

# This schema defines the data structure sent back to the frontend
class NoteOut(BaseModel):
    id: str
    user_id: str
    title: str
    content: str
    labels: List[str]
    # ✅ FIX: Provide a default value for is_locked.
    # This makes the schema compatible with older notes that don't have this field.
    is_locked: bool = False 
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


