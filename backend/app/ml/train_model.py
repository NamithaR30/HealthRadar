
import os
import json
import gc
import joblib
import numpy as np

from scipy.sparse import csr_matrix

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    f1_score,
    classification_report
)

from app.ml.preprocess import load_and_preprocess_data


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(__file__))
)

MODELS_DIR = os.path.join(BASE_DIR, "saved_models")
REPORT_DIR = os.path.join(BASE_DIR, "data", "evaluation")

RF_PATH = os.path.join(
    MODELS_DIR, "model_rf_mendeley.joblib"
)

REPORT_PATH = os.path.join(
    REPORT_DIR, "random_forest_report.json"
)


def train_and_evaluate_models():

    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(REPORT_DIR, exist_ok=True)

    print("Loading and preprocessing dataset...")

    X_train, X_test, y_train, y_test, label_encoder = (
        load_and_preprocess_data()
    )

    print("\nDataset details:")
    print("Training records:", len(X_train))
    print("Testing records:", len(X_test))
    print("Features:", X_train.shape[1])
    print("Classes:", len(label_encoder.classes_))

    print("\nConverting data to float32 sparse matrices...")

    X_train_sparse = csr_matrix(
        X_train.to_numpy(dtype=np.float32)
    )

    X_test_sparse = csr_matrix(
        X_test.to_numpy(dtype=np.float32)
    )

    del X_train, X_test
    gc.collect()

    print("\nTraining a fresh Random Forest...")

    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        max_leaf_nodes=None,
        min_samples_leaf=2,
        min_samples_split=4,
        max_features="sqrt",
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=1
    )

    rf_model.fit(X_train_sparse, y_train)

    print("\nRandom Forest training completed.")

    print("\nEvaluating model...")

    predictions = rf_model.predict(X_test_sparse)

    accuracy = accuracy_score(y_test, predictions)

    balanced_accuracy = balanced_accuracy_score(
        y_test, predictions
    )

    macro_f1 = f1_score(
        y_test,
        predictions,
        average="macro",
        zero_division=0
    )

    weighted_f1 = f1_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0
    )

    report = classification_report(
        y_test,
        predictions,
        labels=np.arange(len(label_encoder.classes_)),
        target_names=label_encoder.classes_,
        output_dict=True,
        zero_division=0
    )

    results = {
        "model": "Random Forest",
        "accuracy": float(accuracy),
        "balanced_accuracy": float(balanced_accuracy),
        "macro_f1": float(macro_f1),
        "weighted_f1": float(weighted_f1),
        "training_records": int(len(y_train)),
        "testing_records": int(len(y_test)),
        "features": int(X_train_sparse.shape[1]),
        "classes": int(len(label_encoder.classes_)),
        "configuration": rf_model.get_params()
    }

    print("\n--- RANDOM FOREST RESULTS ---")
    print(f"Accuracy: {accuracy * 100:.2f}%")
    print(f"Balanced Accuracy: {balanced_accuracy * 100:.2f}%")
    print(f"Macro F1: {macro_f1 * 100:.2f}%")
    print(f"Weighted F1: {weighted_f1 * 100:.2f}%")

    print("\nSaving evaluation report...")

    with open(REPORT_PATH, "w", encoding="utf-8") as file:
        json.dump(
            {
                "summary": results,
                "classification_report": report
            },
            file,
            indent=4
        )

    print("Report saved:", REPORT_PATH)

    print("\nSaving newly trained Random Forest...")

    joblib.dump(rf_model, RF_PATH, compress=3)

    print("Model saved:", RF_PATH)

    print("\nTraining and evaluation completed.")


if __name__ == "__main__":
    train_and_evaluate_models()
