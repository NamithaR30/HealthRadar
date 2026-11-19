
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import HealthResponse
from app.database import engine
from app import models

from app.routers import prediction, nlp_router, analytics


# Automatically create database tables
models.Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="HealthRadar API",
    description="Backend API for AI-powered Disease Risk Prediction & Public Health Intelligence",
    version="1.0.0"
)

app.include_router(prediction.router)
app.include_router(nlp_router.router)
app.include_router(analytics.router)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "project": "HealthRadar",
        "status": "active",
        "docs": "/docs"
    }


@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "online",
        "message": "HealthRadar FastAPI backend and SQLite database are initialized successfully.",
        "version": "1.0.0"
    }
