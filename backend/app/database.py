from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://hrithikksham:hrithik1234@yournote.b0oanay.mongodb.net/?retryWrites=true&w=majority&appName=yournote")
client = AsyncIOMotorClient(MONGODB_URI)
db = client["yournote"]  # ✅ Make sure it's explicitly the right DB name

def get_db() -> AsyncIOMotorDatabase:
    return db

async def connect_to_mongo():
    try:
        await client.admin.command("ping")
        print("✅ MongoDB connected!")
    except Exception as e:
        print("❌ MongoDB connection failed:", e)