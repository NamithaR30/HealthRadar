
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
