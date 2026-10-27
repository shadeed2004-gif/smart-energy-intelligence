"""
Main FastAPI Application Entrypoint
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.database import engine, Base
from app.api.v1.router import api_router
from app.db.seed import seed_database
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate security before startup
    settings.validate_production_security()

    # Initialize SQLite schema and seed demo dataset if needed
    os.makedirs("data", exist_ok=True)
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"Database bootstrap notice: {e}")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Smart Energy Intelligence - Real-Time IoT & AI Energy Management",
    lifespan=lifespan
)

# CORS Middleware with explicit trusted origins (no wildcards)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "demo_mode": settings.DEMO_MODE,
        "docs_url": "/docs"
    }
