
from collections import Counter

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sqlalchemy.orm import Session

from app.models import SymptomReport


COMMON_SYMPTOM_POOL = [
    "fever",
    "headache",
    "fatigue",
    "cough",
    "body_ache",
    "vomiting",
    "nausea",
    "sore_throat",
    "shortness_of_breath",
    "diarrhea",
]


PROTOTYPE_SEED_REPORTS = [
    # Group A: Viral / Fever + Headache + Body Ache
    {"city": "Bengaluru", "symptoms": ["fever", "headache", "body_ache"]},
    {"city": "Bengaluru", "symptoms": ["fever", "headache", "body_ache", "fatigue"]},
    {"city": "Mysuru", "symptoms": ["fever", "headache", "body_ache"]},
    {"city": "Chennai", "symptoms": ["fever", "headache", "body_ache", "fatigue"]},
    {"city": "Hyderabad", "symptoms": ["fever", "headache", "body_ache"]},
    {"city": "Bengaluru", "symptoms": ["fever", "headache", "fatigue"]},

    # Group B: Respiratory
    {"city": "Mumbai", "symptoms": ["cough", "sore_throat", "fever"]},
    {"city": "Delhi", "symptoms": ["cough", "sore_throat", "fever", "fatigue"]},
    {"city": "Pune", "symptoms": ["cough", "sore_throat", "fever"]},
    {"city": "Kolkata", "symptoms": ["cough", "sore_throat", "fever"]},
    {"city": "Delhi", "symptoms": ["cough", "sore_throat", "fatigue"]},
    {"city": "Mumbai", "symptoms": ["cough", "sore_throat", "fever"]},

    # Group C: Gastrointestinal
    {"city": "Kochi", "symptoms": ["vomiting", "nausea", "diarrhea"]},
    {"city": "Ahmedabad", "symptoms": ["vomiting", "nausea", "diarrhea"]},
    {"city": "Jaipur", "symptoms": ["vomiting", "nausea", "diarrhea", "fatigue"]},
    {"city": "Lucknow", "symptoms": ["vomiting", "nausea", "diarrhea"]},
    {"city": "Kochi", "symptoms": ["vomiting", "nausea", "diarrhea"]},

    # Outliers
    {"city": "Jaipur", "symptoms": ["shortness_of_breath"]},
    {"city": "Lucknow", "symptoms": ["diarrhea", "sore_throat"]},
]


def _collect_reports(db: Session):
    db_rows = db.query(SymptomReport).all()
    records = []

    for row in db_rows:
        parsed_symptoms = [
            symptom.strip().lower().replace(" ", "_")
            for symptom in (row.symptoms or "").split(",")
            if symptom.strip()
        ]

        if parsed_symptoms:
            records.append({
                "city": row.city or "Unknown",
                "symptoms": parsed_symptoms,
            })

    used_seed_data = False

    if len(records) < 15:
        records.extend(PROTOTYPE_SEED_REPORTS)
        used_seed_data = True

    return records, used_seed_data


def run_symptom_clustering(
    db: Session,
    eps: float = 1.2,
    min_samples: int = 3
):
    records, used_seed_data = _collect_reports(db)

    vocab = sorted(
        set(COMMON_SYMPTOM_POOL).union(
            *(record["symptoms"] for record in records)
        )
    )

    matrix = []

    for record in records:
        row_vector = [
            1 if symptom in record["symptoms"] else 0
            for symptom in vocab
        ]
        matrix.append(row_vector)

    X = np.array(matrix, dtype=float)

    dbscan = DBSCAN(
        eps=eps,
        min_samples=min_samples,
        metric="manhattan"
    )

    labels = dbscan.fit_predict(X)

    df = pd.DataFrame(X, columns=vocab)
    df["cluster"] = labels
    df["city"] = [record["city"] for record in records]

    cluster_summaries = []

    for cluster_id in sorted(set(labels)):
        subset = df[df["cluster"] == cluster_id]
        is_noise = int(cluster_id) == -1

        symptom_counts = {}

        for symptom in vocab:
            count = int(subset[symptom].sum())

            if count > 0:
                display_name = symptom.replace("_", " ").title()
                symptom_counts[display_name] = count

        top_symptoms = [
            f"{name} ({count})"
            for name, count in sorted(
                symptom_counts.items(),
                key=lambda item: item[1],
                reverse=True
            )[:4]
        ]

        city_counter = Counter(subset["city"].tolist())

        top_cities = [
            f"{city} ({count})"
            for city, count in city_counter.most_common(3)
        ]

        cluster_summaries.append({
            "cluster_id": int(cluster_id),
            "label": (
                "Noise / Unclustered Outliers"
                if is_noise
                else f"Symptom Cluster #{int(cluster_id) + 1}"
            ),
            "report_count": int(len(subset)),
            "top_symptoms": top_symptoms,
            "top_cities": top_cities,
            "is_noise": is_noise,
        })

    clusters_found = sum(
        1 for cluster in cluster_summaries
        if not cluster["is_noise"]
    )

    noise_reports = sum(
        cluster["report_count"]
        for cluster in cluster_summaries
        if cluster["is_noise"]
    )

    source_note = (
        "Includes simulated prototype records alongside stored DB reports for demonstration."
        if used_seed_data
        else "Computed from stored SQLite symptom reports."
    )

    return {
        "total_reports_analyzed": len(records),
        "clusters_found": clusters_found,
        "noise_reports": noise_reports,
        "clusters": cluster_summaries,
        "disclaimer": (
            "Academic prototype only: statistical clusters represent "
            "co-occurring symptom patterns, not confirmed disease outbreaks. "
            f"{source_note}"
        ),
    }
