from pydantic import BaseModel, EmailStr
from bson import ObjectId

class UserInDB(BaseModel):
    id: str
    username: str
    email: EmailStr
    hashed_password: str

    @classmethod
    def from_mongo(cls, doc):
        return cls(
            id=str(doc["_id"]),
            username=doc["username"],
            email=doc["email"],
            hashed_password=doc["hashed_password"]
        )