from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class NoteCreate(BaseModel):
    title: str
    content: str
    labels: Optional[List[str]] = []
    images: Optional[List[str]] = []

class NoteUpdate(BaseModel):
    title: Optional[str]
    content: Optional[str]
    labels: Optional[List[str]]
    images: Optional[List[str]]

class NoteOut(NoteCreate):
    id: str
    created_at: datetime
    updated_at: datetime
