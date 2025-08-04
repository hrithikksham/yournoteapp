from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserCreate(BaseModel):
    account_name: str
    email: EmailStr
    phone_no: str
    password: str

class UserLogin(BaseModel):
    # This field will accept either an email or a phone number
    identifier: str
    password: str

class UserOut(BaseModel):
    id: str
    account_name: str
    email: EmailStr
    phone_no: str
    profile_image_url: Optional[str] = None

class TokenRefreshRequest(BaseModel):
    refresh_token: str
