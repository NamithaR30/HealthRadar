
import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "saved_models")

DATASET_PATH = os.path.join(
    DATA_DIR,
    "Disease and symptoms dataset.csv"
)


def load_and_preprocess_data():

    print("Loading Mendeley dataset...")

    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_PATH}"
        )

    # Read column names first
    columns = pd.read_csv(DATASET_PATH, nrows=0).columns

    # Use memory-efficient data types
    dtype_map = {
        column: "uint8"
        for column in columns
        if column != "diseases"
    }

    dtype_map["diseases"] = "string"

    # Load dataset using optimized data types
    df = pd.read_csv(
        DATASET_PATH,
        dtype=dtype_map
    )

    print(f"Original records: {len(df)}")

    # Clean column names
    df.columns = df.columns.str.strip()

    # Remove exact duplicate records
    before = len(df)
    df = df.drop_duplicates().reset_index(drop=True)

    print(f"Duplicates removed: {before - len(df)}")
    print(f"Records after cleaning: {len(df)}")

    # Check disease column
    if "diseases" not in df.columns:
        raise ValueError(
            "Dataset must contain a 'diseases' column."
        )

    # Separate symptoms and disease labels
    X = df.drop(columns=["diseases"])
    y = df["diseases"].astype(str).str.strip()

    # Validate symptom features
    if X.isna().any().any():
        raise ValueError(
            "Missing values found in symptom features."
        )

    feature_columns = list(X.columns)

    # Identify disease classes with enough samples to stratify
    class_counts = y.value_counts()

    eligible_classes = class_counts[class_counts >= 2].index
    rare_classes = class_counts[class_counts < 2].index

    eligible_mask = y.isin(eligible_classes)

    X_common = X.loc[eligible_mask]
    y_common = y.loc[eligible_mask]

    X_rare = X.loc[~eligible_mask]
    y_rare = y.loc[~eligible_mask]

    # Split common classes into training and testing sets
    X_train_common, X_test, y_train_common, y_test = train_test_split(
        X_common,
        y_common,
        test_size=0.20,
        random_state=42,
        stratify=y_common
    )

    # Keep single-record classes in training only
    X_train = pd.concat([X_train_common, X_rare])
    y_train = pd.concat([y_train_common, y_rare])

    # Shuffle training records
    shuffled_indices = X_train.sample(
        frac=1,
        random_state=42
    ).index

    X_train = X_train.loc[shuffled_indices]
    y_train = y_train.loc[shuffled_indices]

    # Encode disease labels
    label_encoder = LabelEncoder()

    y_train_encoded = label_encoder.fit_transform(y_train)
    y_test_encoded = label_encoder.transform(y_test)

    # Save preprocessing artifacts
    os.makedirs(MODELS_DIR, exist_ok=True)

    joblib.dump(
        label_encoder,
        os.path.join(MODELS_DIR, "label_encoder.joblib")
    )

    joblib.dump(
        feature_columns,
        os.path.join(MODELS_DIR, "feature_columns.joblib")
    )

    print("\nPreprocessing completed successfully!")
    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    print(f"Total symptoms: {len(feature_columns)}")
    print(f"Total diseases: {len(label_encoder.classes_)}")
    print(f"Rare diseases kept in training: {len(rare_classes)}")

    return (
        X_train,
        X_test,
        y_train_encoded,
        y_test_encoded,
        label_encoder
    )


if __name__ == "__main__":
    load_and_preprocess_data()
