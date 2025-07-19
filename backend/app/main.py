from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_to_mongo
from app.routes import auth, note , journal ,reminder , home
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles


load_dotenv()

app = FastAPI(title="YourNote API", version="1.0.0")

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/static", StaticFiles(directory="app/static"), name="static")

# MongoDB connection
@app.on_event("startup")
async def startup_db():
    await connect_to_mongo()

@app.get("/")
def read_root():
    return {"Hello": "Welcome to YourNote API! 🚀"}

# Routes

app.include_router(auth.router)
app.include_router(note.router)
app.include_router(journal.router)
app.include_router(reminder.router)
app.include_router(home.router)