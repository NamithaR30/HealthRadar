
from pydantic import BaseModel
from typing import List

from typing import Optional


class HealthResponse(BaseModel):
    status: str
    message: str
    version: str


class PredictionRequest(BaseModel):
    symptoms: List[str]


class DiseasePrediction(BaseModel):
    disease: str
    confidence: float


class PredictionResponse(BaseModel):
    top_predictions: List[DiseasePrediction]
    input_symptoms: List[str]


# Phase 9: Explainable AI schemas

class ExplanationRequest(BaseModel):
    symptoms: List[str]


class FeatureContribution(BaseModel):
    feature: str
    shap_value: float
    impact: str


class ExplanationResponse(BaseModel):
    predicted_disease: str
    contributions: List[FeatureContribution]
    input_symptoms: List[str]


class NLPParseRequest(BaseModel):
    text: str


class ExtractedSymptom(BaseModel):
    original_phrase: str
    canonical_feature: str
    negated: bool


class NLPParseResponse(BaseModel):
    message: str
    extracted_symptoms: List[str]
    negated_symptoms: List[str]
    duration: Optional[str] = None
    severity: Optional[str] = None


class ClusterSummary(BaseModel):
    cluster_id: int
    label: str
    report_count: int
    top_symptoms: List[str]
    top_cities: List[str]
    is_noise: bool


class ClusteringResponse(BaseModel):
    total_reports_analyzed: int
    clusters_found: int
    noise_reports: int
    clusters: List[ClusterSummary]
    disclaimer: str

class CityOutbreakStatus(BaseModel):
    city: str
    latitude: float
    longitude: float
    recent_mean: float
    baseline_mean: float
    baseline_std: float
    z_score: float
    status: str
    dominant_disease: str
    recent_7d_total: int
    daily_series: List[int]


class OutbreakResponse(BaseModel):
    monitored_cities: int
    high_anomaly_count: int
    moderate_anomaly_count: int
    normal_count: int
    data_source: str
    disclaimer: str
    cities: List[CityOutbreakStatus]

    # Phase 14: Disease Forecasting schemas

class ForecastPoint(BaseModel):
    day_label: str
    day_index: int
    actual: Optional[float] = None
    moving_avg_baseline: Optional[float] = None
    arima_forecast: Optional[float] = None
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None


class ForecastResponse(BaseModel):
    city: str
    dominant_disease: str
    model_used: str
    horizon_days: int
    mae: float
    rmse: float
    data_source: str
    disclaimer: str
    series: List[ForecastPoint]