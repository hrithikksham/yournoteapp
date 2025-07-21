from fastapi import APIRouter, Depends
from ..utils.auth import get_current_user
from ..models import note_model
from typing import List

router = APIRouter(prefix="/api/labels", tags=["Labels"])

@router.get("/", response_model=List[str])
async def get_all_user_labels(user: dict = Depends(get_current_user)):
    """
    Gets all unique labels for the currently authenticated user.
    """
    return await note_model.get_all_labels_for_user(user_id=user["id"])

