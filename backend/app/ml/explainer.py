
import os
import joblib
import shap
import numpy as np
import pandas as pd

# --------------------------------------------------
# PATHS AND MODEL LOADING
# --------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(__file__))
)

SAVED_MODELS_DIR = os.path.join(BASE_DIR, "saved_models")

rf_model = joblib.load(
    os.path.join(SAVED_MODELS_DIR, "model_rf_mendeley.joblib")
)

feature_columns = joblib.load(
    os.path.join(SAVED_MODELS_DIR, "feature_columns.joblib")
)

label_encoder = joblib.load(
    os.path.join(SAVED_MODELS_DIR, "label_encoder.joblib")
)

# Normalize symptom names for exact matching
symptom_lookup = {
    symptom.strip().lower().replace(" ", "_"): symptom
    for symptom in feature_columns
}

# SHAP explainer is initialized only when first needed
explainer = None


# --------------------------------------------------
# SHAP EXPLANATION FUNCTION
# --------------------------------------------------

def explain_prediction(symptoms_list):

    global explainer

    if not symptoms_list:
        raise ValueError("At least one symptom is required.")

    # Normalize user symptoms
    user_symptoms = [
        symptom.strip().lower().replace(" ", "_")
        for symptom in symptoms_list
    ]

    # Create input feature vector
    feature_vector = np.zeros(
        len(feature_columns),
        dtype=np.float32
    )

    matched_symptoms = []

    for symptom in user_symptoms:

        matched_column = symptom_lookup.get(symptom)

        if matched_column is not None:

            index = feature_columns.index(matched_column)

            feature_vector[index] = 1.0

            if matched_column not in matched_symptoms:
                matched_symptoms.append(matched_column)

    if not matched_symptoms:
        raise ValueError(
            "No recognized symptoms matched for SHAP explanation."
        )

    # Convert input into DataFrame
    X_input = pd.DataFrame(
        [feature_vector],
        columns=feature_columns
    )

    # Predict disease using Random Forest
    pred_idx = int(rf_model.predict(X_input)[0])

    predicted_disease = label_encoder.inverse_transform(
        [pred_idx]
    )[0]

    # Initialize SHAP TreeExplainer once
    if explainer is None:
        explainer = shap.TreeExplainer(rf_model)

    # Calculate SHAP values
    shap_values = explainer.shap_values(
        X_input,
        check_additivity=False
    )

    # Handle different SHAP output formats
    if isinstance(shap_values, list):

        class_shap = np.asarray(
            shap_values[pred_idx]
        )[0]

    else:

        shap_values = np.asarray(shap_values)

        if shap_values.ndim == 3:

            if shap_values.shape[-1] == len(label_encoder.classes_):
                class_shap = shap_values[0, :, pred_idx]

            elif shap_values.shape[0] == len(label_encoder.classes_):
                class_shap = shap_values[pred_idx, 0, :]

            else:
                raise ValueError(
                    "Unexpected SHAP output dimensions."
                )

        elif shap_values.ndim == 2:

            class_shap = shap_values[0]

        else:

            raise ValueError(
                "Unsupported SHAP output format."
            )

    if len(class_shap) != len(feature_columns):
        raise ValueError(
            "SHAP feature count does not match the dataset."
        )

    # Extract contributions for selected symptoms
    contributions = []

    for index, shap_value in enumerate(class_shap):

        if feature_vector[index] > 0:

            value = float(shap_value)

            if value > 0:
                impact_label = "Increases Risk"

            elif value < 0:
                impact_label = "Decreases Risk"

            else:
                impact_label = "No measurable impact"

            contributions.append({
                "feature": feature_columns[index].replace(
                    "_", " "
                ).title(),
                "shap_value": round(value, 6),
                "impact": impact_label
            })

    # Sort by absolute SHAP contribution
    contributions.sort(
        key=lambda item: abs(item["shap_value"]),
        reverse=True
    )

    # Return explanation response
    return {
        "predicted_disease": predicted_disease,
        "contributions": contributions[:10],
        "input_symptoms": matched_symptoms
    }
