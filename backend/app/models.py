
from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database import Base


class SymptomReport(Base):
    __tablename__ = "symptom_reports"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, index=True)
    symptoms = Column(String)
    predicted_disease = Column(String, index=True)
    confidence = Column(Float)
    severity = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)


class CityStats(Base):
    __tablename__ = "city_stats"

    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, unique=True, index=True)
    total_reports = Column(Integer, default=0)
    active_anomalies = Column(Integer, default=0)
    risk_level = Column(String, default="Normal")
