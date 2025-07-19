from fastapi import APIRouter, HTTPException, Depends, Body
from ..schemas.user_schema import UserCreate, UserLogin, UserOut
from ..utils.auth import (
    create_access_token, 
    create_refresh_token, 
    get_current_user,
    verify_password,
    SECRET_KEY, # 👈 Import constants for the refresh endpoint
    ALGORITHM
)
from ..models import user_model # 👈 Import the user model
from jose import jwt, JWTError # 👈 Import JWT libraries
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut)
async def register(user: UserCreate):
    # Use the model to check if the user exists
    if await user_model.get_user_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await user_model.get_user_by_phone(user.phone_no): # Assumes you add this function to user_model
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # Use the model to create the user
    new_user = await user_model.create_user(user)
    return UserOut(**new_user, id=str(new_user["_id"]))

@router.post("/login")
async def login(form_data: UserLogin):
    # Use the model to find the user
    db_user = await user_model.get_user_by_identifier(form_data.identifier)

    if not db_user or not verify_password(form_data.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(db_user["_id"])})
    refresh_token = create_refresh_token({"sub": str(db_user["_id"])})
    return {"access_token": access_token, "refresh_token": refresh_token}

@router.get("/me", response_model=UserOut)
async def get_me(user: dict = Depends(get_current_user)):
    # This remains the same, as the dependency handles the logic
    return UserOut(**user)

@router.post("/refresh")
async def refresh_token(refresh_token: str = Body(..., embed=True)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if datetime.fromtimestamp(payload.get("exp")) < datetime.utcnow():
            raise credentials_exception # Token has expired
        
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # Use the model to ensure the user still exists
    user = await user_model.get_user_by_id(user_id)
    if user is None:
        raise credentials_exception

    new_access_token = create_access_token({"sub": user_id})
    return {"access_token": new_access_token, "token_type": "bearer"}