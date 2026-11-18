
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import HealthResponse


app = FastAPI(
    title="HealthRadar API",
    description="Backend API for AI-powered Disease Risk Prediction & Public Health Intelligence",
    version="1.0.0"
)


# Configure CORS for React frontend
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
        "message": "HealthRadar FastAPI backend is running successfully.",
        "version": "1.0.0"
    }
