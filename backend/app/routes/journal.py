# In app/routes/journal.py
from fastapi import APIRouter, Depends
from ..models import journal_model # 👈 Import the journal model
from ..utils.auth import get_current_user
from ..schemas.journal_schema import JournalEntryCreate, JournalEntryOut  , JournalEntryUpdate
from fastapi import HTTPException, Response
from datetime import datetime
from typing import List

router = APIRouter(prefix="/api/journal", tags=["Journal"])

@router.post("/", response_model=JournalEntryOut)
async def create_journal_entry(
    entry: JournalEntryCreate,
    user: dict = Depends(get_current_user)
):
    # Use the model to handle database interaction
    new_entry = await journal_model.create_journal_entry(entry, user_id=user["id"])
    return JournalEntryOut(**new_entry, id=str(new_entry["_id"]))

@router.get("/", response_model=List[JournalEntryOut])
async def get_all_journal_entries(user: dict = Depends(get_current_user)):
    """
    Gets all journal entries for the current user,
    sorted by entry_date in descending order (newest first).
    """
    # Use the model to get all entries
    entries = await journal_model.get_journal_entries_for_user(user_id=user["id"])
    
    # Convert the list of dictionaries into a list of Pydantic models
    return [JournalEntryOut(**entry, id=str(entry["_id"])) for entry in entries]

    # Add this function to app/routes/journal.py

@router.get("/{entry_id}", response_model=JournalEntryOut)
async def get_journal_entry_by_id(entry_id: str, user: dict = Depends(get_current_user)):
    """
    Gets a single journal entry by its ID.
    """
    # Use the model to find the specific entry
    entry = await journal_model.get_journal_entry_by_id(
        entry_id=entry_id, 
        user_id=user["id"]
    )
    
    # If the entry doesn't exist or doesn't belong to the user, raise a 404
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    return JournalEntryOut(**entry, id=str(entry["_id"]))

@router.delete("/{entry_id}", status_code=204)
async def delete_journal_entry(entry_id: str, user: dict = Depends(get_current_user)):
    """
    Deletes a specific journal entry by its ID.
    """
    # Use the model to delete the entry
    deleted_count = await journal_model.delete_journal_entry(
        entry_id=entry_id, 
        user_id=user["id"]
    )
    
    # If nothing was deleted, the entry was not found for that user
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    # Return a 204 No Content response on successful deletion
    return Response(status_code=204)

@router.put("/{entry_id}", response_model=JournalEntryOut)
async def update_journal_entry(
    entry_id: str,
    update_data: JournalEntryUpdate,
    user: dict = Depends(get_current_user)
):
    """
    Updates a specific journal entry by its ID.
    """
    updated_entry = await journal_model.update_journal_entry(
        entry_id=entry_id,
        user_id=user["id"],
        update_data=update_data
    )
    
    if not updated_entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    return JournalEntryOut(**updated_entry, id=str(updated_entry["_id"]))