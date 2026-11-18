
from fastapi import FastAPI

# Create the FastAPI application
app = FastAPI(
    title="HealthRadar API",
    description="Backend API for HealthRadar",
    version="1.0.0"
)

# Root endpoint
@app.get("/")
def home():
    return {
        "message": "Welcome to HealthRadar API!",
        "status": "Backend is running successfully"
    }

# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
