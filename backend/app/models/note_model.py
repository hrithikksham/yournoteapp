from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class NoteInDB(BaseModel):
    user_id: str = Field(...)
    title: str
    content: str
    labels: Optional[List[str]] = Field(default_factory=list)
    images: Optional[List[str]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)