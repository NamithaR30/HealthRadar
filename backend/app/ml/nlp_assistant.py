
import os
import re
import joblib


BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(__file__))
)

SAVED_MODELS_DIR = os.path.join(
    BASE_DIR, "saved_models"
)

FEATURE_PATH = os.path.join(
    SAVED_MODELS_DIR, "feature_columns.joblib"
)

feature_columns = joblib.load(FEATURE_PATH)


def normalize_text(text):
    text = text.lower()
    text = text.replace("-", " ")
    text = re.sub(r"[^\w\s']", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# Colloquial phrases mapped to standard database symptoms
SYNONYM_MAP = {
    "high temp": "fever",
    "temperature": "fever",
    "feverish": "fever",
    "throbbing head": "headache",
    "head pain": "headache",
    "throwing up": "vomiting",
    "puking": "vomiting",
    "exhaustion": "fatigue",
    "tiredness": "fatigue",
    "dizzy": "dizziness",
}


def build_vocabulary():

    vocabulary = {}

    # Add actual dataset symptoms
    for feature in feature_columns:
        phrase = normalize_text(feature.replace("_", " "))
        vocabulary[phrase] = feature

    # Add only synonyms whose target exists in the dataset
    feature_lookup = {
        normalize_text(feature.replace("_", " ")): feature
        for feature in feature_columns
    }

    for synonym, canonical in SYNONYM_MAP.items():
        canonical_normalized = normalize_text(canonical)

        if canonical_normalized in feature_lookup:
            vocabulary[normalize_text(synonym)] = (
                feature_lookup[canonical_normalized]
            )

    return vocabulary


VOCABULARY = build_vocabulary()


def is_negated(text, start_position):

    preceding_text = text[:start_position]

    # Check the words immediately before the symptom
    words = preceding_text.split()

    recent_words = " ".join(words[-5:])

    negation_patterns = [
        r"\bno\b",
        r"\bnot\b",
        r"\bwithout\b",
        r"\bdon't have\b",
        r"\bdont have\b",
        r"\bdo not have\b",
        r"\bnever\b",
        r"\bdenies\b",
        r"\bdenied\b",
    ]

    for pattern in negation_patterns:
        match = re.search(pattern, recent_words)

        if match:
            remaining_words = recent_words[match.end():].split()

            # Negation should apply only to nearby symptoms
            if len(remaining_words) <= 3:
                return True

    return False


def parse_natural_text(text: str):

    normalized_text = normalize_text(text)

    if not normalized_text:
        raise ValueError("Please enter a symptom description.")

    # Extract duration
    duration_match = re.search(
        r"\b(?:for|since)\s+(\d+\s+"
        r"(?:days?|weeks?|months?|hours?))\b",
        normalized_text
    )

    duration = (
        duration_match.group(1)
        if duration_match
        else "Not specified"
    )

    # Extract severity
    severity = "Moderate"

    if any(
        word in normalized_text.split()
        for word in ["severe", "extreme", "unbearable"]
    ):
        severity = "High"

    elif any(
        word in normalized_text.split()
        for word in ["mild", "slight", "minor"]
    ):
        severity = "Mild"

    extracted = []
    negated = []
    original_phrases = {}

    # Match longer phrases first
    sorted_vocabulary = sorted(
        VOCABULARY.items(),
        key=lambda item: len(item[0]),
        reverse=True
    )

    for phrase, canonical in sorted_vocabulary:

        pattern = r"(?<!\w)" + re.escape(phrase) + r"(?!\w)"

        for match in re.finditer(pattern, normalized_text):

            original_phrase = match.group(0)

            if is_negated(normalized_text, match.start()):

                if canonical not in negated:
                    negated.append(canonical)

            else:

                if canonical not in extracted:
                    extracted.append(canonical)
                    original_phrases[canonical] = original_phrase

    return {
        "message": (
            f"Successfully analyzed text. "
            f"Extracted {len(extracted)} active symptom(s)."
        ),
        "extracted_symptoms": extracted,
        "negated_symptoms": negated,
        "duration": duration,
        "severity": severity
    }
