# app/models/user_model.py
from pymongo import ReturnDocument
from app.database import db
from bson import ObjectId
from datetime import datetime
from ..schemas.user_schema import UserCreate
from ..utils.security import get_password_hash
from typing import Dict, Optional

collection = db["users"]

async def create_user(user: UserCreate) -> Dict:
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "account_name": user.account_name,
        "email": user.email,
        "phone_no": user.phone_no,
        "hashed_password": hashed_password,
        "profile_image_url": None,
        "created_at": datetime.utcnow()
    }
    result = await collection.insert_one(user_dict)
    new_user = await collection.find_one({"_id": result.inserted_id})
    return new_user

async def get_user_by_email(email: str) -> Optional[Dict]:
    """Retrieves a user by their email."""
    return await collection.find_one({"email": email})

async def get_user_by_id(user_id: str) -> Optional[Dict]:
    """Retrieves a user by their unique ID."""
    return await collection.find_one({"_id": ObjectId(user_id)})

async def get_user_by_identifier(identifier: str) -> Optional[Dict]:
    """Retrieves a user by either their email or phone number."""
    return await collection.find_one({
        "$or": [{"email": identifier}, {"phone_no": identifier}]
    })
    
async def get_user_by_phone(phone_no: str) -> Optional[Dict]:
    """Retrieves a user by their phone number."""
    return await collection.find_one({"phone_no": phone_no})

async def update_user_profile_image(user_id: str, image_url: str) -> Optional[Dict]:
    """Updates the user's profile image URL and returns the updated user document."""
    updated_user = await collection.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": {"profile_image_url": image_url}},
        return_document=ReturnDocument.AFTER
    )
    return updated_user

async def delete_user_and_data(user_id: str) -> Dict[str, int]:
    user_obj_id = ObjectId(user_id)

    # Delete all associated data (make sure schema uses ObjectId for user_id)
    notes_deleted = await db["notes"].delete_many({"user_id": user_obj_id})
    journals_deleted = await db["journal_entries"].delete_many({"user_id": user_obj_id})
    reminders_deleted = await db["reminders"].delete_many({"user_id": user_obj_id})

    # Delete the user document itself
    user_deleted = await collection.delete_one({"_id": user_obj_id})

    return {
        "notes_deleted": notes_deleted.deleted_count,
        "journals_deleted": journals_deleted.deleted_count,
        "reminders_deleted": reminders_deleted.deleted_count,
        "user_deleted": user_deleted.deleted_count,
    }


