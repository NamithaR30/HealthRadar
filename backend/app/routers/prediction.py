
import os
import joblib
import numpy as np
import pandas as pd

from scipy.sparse import csr_matrix
from fastapi import APIRouter, HTTPException

from app.schemas import (
    PredictionRequest,
    PredictionResponse,
    DiseasePrediction,
    ExplanationRequest,
    ExplanationResponse,
    FeatureContribution
)

from app.ml.explainer import explain_prediction


router = APIRouter(prefix="/api", tags=["Prediction"])

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(__file__))
)

SAVED_MODELS_DIR = os.path.join(
    BASE_DIR,
    "saved_models"
)

try:
    rf_model = joblib.load(
        os.path.join(SAVED_MODELS_DIR, "model_rf_mendeley.joblib")
    )

    xgb_model = joblib.load(
        os.path.join(SAVED_MODELS_DIR, "model_xgb_mendeley.joblib")
    )

    label_encoder = joblib.load(
        os.path.join(SAVED_MODELS_DIR, "label_encoder.joblib")
    )

    feature_columns = joblib.load(
        os.path.join(SAVED_MODELS_DIR, "feature_columns.joblib")
    )

    symptom_lookup = {
        symptom.strip().lower().replace(" ", "_"): symptom
        for symptom in feature_columns
    }

    print("Mendeley ML models loaded successfully!")

except Exception as e:
    rf_model = None
    xgb_model = None
    label_encoder = None
    feature_columns = []
    symptom_lookup = {}

    print(f"Warning: Could not load Mendeley models: {e}")


@router.post("/predict", response_model=PredictionResponse)
def predict_disease(request: PredictionRequest):

    if rf_model is None or xgb_model is None:
        raise HTTPException(
            status_code=503,
            detail="ML models are not available."
        )

    if not request.symptoms:
        raise HTTPException(
            status_code=400,
            detail="At least one symptom must be provided."
        )

    feature_vector = np.zeros(
        len(feature_columns),
        dtype=np.float32
    )

    matched_symptoms = []

    for symptom in request.symptoms:
        normalized = symptom.strip().lower().replace(" ", "_")
        matched_column = symptom_lookup.get(normalized)

        if matched_column is not None:
            index = feature_columns.index(matched_column)
            feature_vector[index] = 1.0

            if matched_column not in matched_symptoms:
                matched_symptoms.append(matched_column)

    if not matched_symptoms:
        raise HTTPException(
            status_code=400,
            detail="No exact recognized symptoms found."
        )

    input_df = pd.DataFrame(
        [feature_vector],
        columns=feature_columns
    )

    input_sparse = csr_matrix(
        feature_vector.reshape(1, -1)
    )

    rf_probabilities = rf_model.predict_proba(input_df)[0]
    xgb_probabilities = xgb_model.predict_proba(input_sparse)[0]

    ensemble_probabilities = (
        rf_probabilities + xgb_probabilities
    ) / 2.0

    top_indices = np.argsort(
        ensemble_probabilities
    )[-3:][::-1]

    top_predictions = []

    for index in top_indices:
        disease_name = label_encoder.inverse_transform(
            [int(index)]
        )[0]

        confidence = float(
            ensemble_probabilities[index] * 100
        )

        top_predictions.append(
            DiseasePrediction(
                disease=disease_name,
                confidence=round(confidence, 2)
            )
        )

    return PredictionResponse(
        top_predictions=top_predictions,
        input_symptoms=matched_symptoms
    )


@router.get("/symptoms-list")
def get_symptoms_list():
    return {
        "symptoms": feature_columns
    }


# Phase 9: Explainable AI endpoint

@router.post("/explain", response_model=ExplanationResponse)
def explain_disease_prediction(request: ExplanationRequest):

    if not request.symptoms:
        raise HTTPException(
            status_code=400,
            detail="At least one symptom must be provided for explanation."
        )

    try:
        explanation_data = explain_prediction(request.symptoms)

        return ExplanationResponse(
            predicted_disease=explanation_data["predicted_disease"],
            contributions=[
                FeatureContribution(**contribution)
                for contribution in explanation_data["contributions"]
            ],
            input_symptoms=explanation_data["input_symptoms"]
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        print(f"SHAP explanation error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Unable to generate SHAP explanation."
        )
