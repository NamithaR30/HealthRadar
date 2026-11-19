
import numpy as np


MONITORED_CITIES = [
    {"city": "Bengaluru", "lat": 12.9716, "lon": 77.5946, "base": 18.0, "std": 3.2, "spike": 12.5, "disease": "Viral Fever"},
    {"city": "Mysuru", "lat": 12.2958, "lon": 76.6394, "base": 7.5, "std": 1.8, "spike": 1.2, "disease": "Dengue"},
    {"city": "Chennai", "lat": 13.0827, "lon": 80.2707, "base": 16.0, "std": 3.0, "spike": 6.8, "disease": "Influenza"},
    {"city": "Hyderabad", "lat": 17.3850, "lon": 78.4867, "base": 15.0, "std": 2.9, "spike": 1.5, "disease": "Viral Fever"},
    {"city": "Mumbai", "lat": 19.0760, "lon": 72.8777, "base": 24.0, "std": 4.1, "spike": 16.0, "disease": "Dengue"},
    {"city": "Delhi", "lat": 28.6139, "lon": 77.2090, "base": 26.0, "std": 4.5, "spike": 7.9, "disease": "Respiratory Illness"},
    {"city": "Kolkata", "lat": 22.5726, "lon": 88.3639, "base": 17.5, "std": 3.1, "spike": 1.0, "disease": "Malaria"},
    {"city": "Pune", "lat": 18.5204, "lon": 73.8567, "base": 13.0, "std": 2.5, "spike": 6.2, "disease": "Viral Fever"},
    {"city": "Kochi", "lat": 9.9312, "lon": 76.2673, "base": 9.5, "std": 2.0, "spike": 0.8, "disease": "Dengue"},
    {"city": "Ahmedabad", "lat": 23.0225, "lon": 72.5714, "base": 14.0, "std": 2.7, "spike": 1.4, "disease": "Typhoid"},
    {"city": "Jaipur", "lat": 26.9124, "lon": 75.7873, "base": 12.5, "std": 2.4, "spike": 11.8, "disease": "Influenza"},
    {"city": "Lucknow", "lat": 26.8467, "lon": 80.9462, "base": 13.5, "std": 2.6, "spike": 1.1, "disease": "Gastroenteritis"},
]


def _classify_z_score(z: float) -> str:
    if z >= 3.0:
        return "High anomaly"
    elif z >= 1.5:
        return "Moderate anomaly"
    return "Normal"


def compute_outbreak_anomalies(disease_filter: str | None = None):
    cities_output = []
    high_count = 0
    moderate_count = 0
    normal_count = 0

    for idx, cfg in enumerate(MONITORED_CITIES):
        if disease_filter and disease_filter.lower() != "all":
            if disease_filter.lower() not in cfg["disease"].lower():
                continue

        rng = np.random.default_rng(seed=2026 + idx)

        baseline_days = np.maximum(
            0,
            np.round(
                rng.normal(
                    loc=cfg["base"],
                    scale=cfg["std"],
                    size=35
                )
            )
        ).astype(int)

        recent_days = np.maximum(
            0,
            np.round(
                rng.normal(
                    loc=cfg["base"] + cfg["spike"],
                    scale=cfg["std"],
                    size=7
                )
            )
        ).astype(int)

        baseline_mean = float(np.mean(baseline_days))
        baseline_std = float(np.std(baseline_days))
        recent_mean = float(np.mean(recent_days))

        z_score = (
            (recent_mean - baseline_mean) /
            (baseline_std + 1.0)
        )

        status = _classify_z_score(z_score)

        if status == "High anomaly":
            high_count += 1
        elif status == "Moderate anomaly":
            moderate_count += 1
        else:
            normal_count += 1

        combined_series = [
            int(x)
            for x in np.concatenate([baseline_days, recent_days])
        ]

        cities_output.append({
            "city": cfg["city"],
            "latitude": cfg["lat"],
            "longitude": cfg["lon"],
            "recent_mean": round(recent_mean, 2),
            "baseline_mean": round(baseline_mean, 2),
            "baseline_std": round(baseline_std, 2),
            "z_score": round(float(z_score), 2),
            "status": status,
            "dominant_disease": cfg["disease"],
            "recent_7d_total": int(np.sum(recent_days)),
            "daily_series": combined_series,
        })

    cities_output.sort(
        key=lambda item: item["z_score"],
        reverse=True
    )

    return {
        "monitored_cities": len(cities_output),
        "high_anomaly_count": high_count,
        "moderate_anomaly_count": moderate_count,
        "normal_count": normal_count,
        "data_source": (
            "Simulated regional surveillance series "
            "(42-day window: 35-day baseline + 7-day recent)"
        ),
        "disclaimer": (
            "Simulated regional case data is used for academic "
            "prototyping. Statistical Z-score anomalies do not "
            "represent confirmed public health outbreaks."
        ),
        "cities": cities_output,
    }
