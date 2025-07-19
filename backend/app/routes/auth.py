from fastapi import APIRouter, HTTPException, Depends
from app.schemas.user_schema import UserCreate, UserLogin, UserOut
from app.models.user_model import UserInDB
from app.database import db
from app.utils.auth import get_password_hash, verify_password, create_access_token
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from bson import ObjectId
from pprint import pprint
from app.schemas.user_schema import UserCreate, UserLogin, UserOut
from app.utils.auth import get_current_user # Import your dependency

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut)
async def register(user: UserCreate):
    # Check if email or phone number already exists
    if await db["users"].find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await db["users"].find_one({"phone_no": user.phone_no}):
        raise HTTPException(status_code=400, detail="Phone number already registered")

    hashed_password = get_password_hash(user.password)
    user_dict = {
        "account_name": user.account_name,
        "email": user.email,
        "phone_no": user.phone_no,
        "hashed_password": hashed_password,
        "profile_image_url": None # Initially null
    }
    result = await db["users"].insert_one(user_dict)
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    return UserOut(**created_user, id=str(created_user["_id"]))

@router.post("/login")
async def login(form_data: UserLogin):
    # Find user by either email or phone number
    db_user = await db["users"].find_one({
        "$or": [{"email": form_data.identifier}, {"phone_no": form_data.identifier}]
    })

    if not db_user or not verify_password(form_data.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(db_user["_id"])})
    refresh_token = create_refresh_token({"sub": str(db_user["_id"])})
    return {"access_token": access_token, "refresh_token": refresh_token}

# Use the reusable get_current_user dependency
@router.get("/me", response_model=UserOut)
async def get_me(user: dict = Depends(get_current_user)):
    # The dependency already fetches and validates the user
    return UserOut(**user, id=str(user["_id"]))