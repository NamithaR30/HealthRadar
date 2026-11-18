
import os
import pandas as pd
import joblib

from sklearn.preprocessing import LabelEncoder


# Define project directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "saved_models")


def load_and_preprocess_data():

    training_path = os.path.join(DATA_DIR, "Training.csv")
    testing_path = os.path.join(DATA_DIR, "Testing.csv")

    # Check whether dataset files exist
    if not os.path.exists(training_path):
        raise FileNotFoundError(f"Training dataset not found: {training_path}")

    if not os.path.exists(testing_path):
        raise FileNotFoundError(f"Testing dataset not found: {testing_path}")

    # Load datasets
    train_df = pd.read_csv(training_path)
    test_df = pd.read_csv(testing_path)

    # Clean column names
    train_df.columns = train_df.columns.str.strip()
    test_df.columns = test_df.columns.str.strip()

    # Remove unwanted CSV index columns
    train_df = train_df.loc[:, ~train_df.columns.str.startswith("Unnamed:")]
    test_df = test_df.loc[:, ~test_df.columns.str.startswith("Unnamed:")]

    # Remove duplicate rows
    train_df = train_df.drop_duplicates()
    test_df = test_df.drop_duplicates()

    # Check target column
    if "prognosis" not in train_df.columns:
        raise ValueError("Training dataset must contain prognosis column.")

    if "prognosis" not in test_df.columns:
        raise ValueError("Testing dataset must contain prognosis column.")

    # Separate features and target
    X_train = train_df.drop(columns=["prognosis"])
    y_train = train_df["prognosis"]

    X_test = test_df.drop(columns=["prognosis"])
    y_test = test_df["prognosis"]

    # Ensure both datasets have matching features
    if list(X_train.columns) != list(X_test.columns):
        raise ValueError("Training and testing feature columns do not match.")

    # Encode disease labels
    label_encoder = LabelEncoder()

    y_train_encoded = label_encoder.fit_transform(y_train)

    y_test_encoded = label_encoder.transform(y_test)

    # Create model directory
    os.makedirs(MODELS_DIR, exist_ok=True)

    # Save encoder and feature names
    joblib.dump(
        label_encoder,
        os.path.join(MODELS_DIR, "label_encoder.joblib")
    )

    joblib.dump(
        list(X_train.columns),
        os.path.join(MODELS_DIR, "feature_columns.joblib")
    )

    print("Dataset successfully loaded and preprocessed!")
    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    print(f"Total symptoms: {X_train.shape[1]}")
    print(f"Total diseases: {len(label_encoder.classes_)}")

    return (
        X_train,
        X_test,
        y_train_encoded,
        y_test_encoded,
        label_encoder
    )


if __name__ == "__main__":
    load_and_preprocess_data()
