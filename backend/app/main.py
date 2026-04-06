"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.database import engine, Base
from app.routers.recipes import router as recipes_router
from app.routers.llm import router as llm_router

# Create database tables on startup
Base.metadata.create_all(bind=engine)

# Migration: add new columns if they don't exist
def run_migrations():
    """Add new columns to existing tables if they don't exist."""
    try:
        with engine.connect() as conn:
            # Check and add difficulty column
            conn.execute(text("""
                ALTER TABLE recipes ADD COLUMN difficulty INTEGER DEFAULT 1
            """))
            conn.commit()
    except Exception:
        conn.rollback()  # Column already exists

    try:
        with engine.connect() as conn:
            # Check and add cooking_time_minutes column
            conn.execute(text("""
                ALTER TABLE recipes ADD COLUMN cooking_time_minutes INTEGER
            """))
            conn.commit()
    except Exception:
        conn.rollback()  # Column already exists

run_migrations()

app = FastAPI(
    title="Recipe Manager API",
    description="REST API for managing recipes and ingredient lists",
    version="2.0.0",
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(recipes_router)
app.include_router(llm_router)


@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
