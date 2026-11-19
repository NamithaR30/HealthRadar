
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db

from app.schemas import (
    ClusteringResponse,
    ClusterSummary,
    OutbreakResponse,
    CityOutbreakStatus,
    ForecastResponse,
    ForecastPoint
)

from app.analytics.clustering import run_symptom_clustering
from app.analytics.anomaly import compute_outbreak_anomalies
from app.analytics.forecasting import generate_city_forecast


router = APIRouter(
    prefix="/api",
    tags=["Analytics & Clustering"]
)


@router.get("/clusters", response_model=ClusteringResponse)
def get_symptom_clusters(
    eps: float = Query(default=1.2, gt=0.1, le=10.0),
    min_samples: int = Query(default=3, ge=1, le=50),
    db: Session = Depends(get_db)
):
    try:
        result = run_symptom_clustering(
            db=db,
            eps=eps,
            min_samples=min_samples
        )

        return ClusteringResponse(
            total_reports_analyzed=result["total_reports_analyzed"],
            clusters_found=result["clusters_found"],
            noise_reports=result["noise_reports"],
            clusters=[
                ClusterSummary(**cluster)
                for cluster in result["clusters"]
            ],
            disclaimer=result["disclaimer"]
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@router.get("/outbreaks", response_model=OutbreakResponse)
def get_outbreak_anomalies(
    disease: Optional[str] = Query(default=None)
):
    try:
        result = compute_outbreak_anomalies(
            disease_filter=disease
        )

        return OutbreakResponse(
            monitored_cities=result["monitored_cities"],
            high_anomaly_count=result["high_anomaly_count"],
            moderate_anomaly_count=result["moderate_anomaly_count"],
            normal_count=result["normal_count"],
            data_source=result["data_source"],
            disclaimer=result["disclaimer"],
            cities=[
                CityOutbreakStatus(**city)
                for city in result["cities"]
            ]
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@router.get("/forecast", response_model=ForecastResponse)
def get_disease_forecast(
    city: str = Query(default="Bengaluru"),
    horizon_days: int = Query(default=7, ge=1, le=14)
):
    try:
        result = generate_city_forecast(
            city_name=city,
            horizon_days=horizon_days
        )

        return ForecastResponse(
            city=result["city"],
            dominant_disease=result["dominant_disease"],
            model_used=result["model_used"],
            horizon_days=result["horizon_days"],
            mae=result["mae"],
            rmse=result["rmse"],
            data_source=result["data_source"],
            disclaimer=result["disclaimer"],
            series=[
                ForecastPoint(**point)
                for point in result["series"]
            ]
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
