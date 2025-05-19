# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager

from .routers import notes
from .database import create_indexes, client as mongo_client
from .config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup...")
    print(f"Connecting to MongoDB: {settings.MONGO_DETAILS}")
    print(f"Using database: {settings.DATABASE_NAME}")
    await create_indexes()
    yield
    print("Application shutdown...")
    mongo_client.close()
    print("MongoDB connection closed.")

app = FastAPI(
    title="Notes App Backend (Modular)",
    description="A simple backend for a notes application using Python, FastAPI, and MongoDB.",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(notes.router, prefix="/api/v1")

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Notes App API!"}
