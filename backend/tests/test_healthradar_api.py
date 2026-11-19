
import os
import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine
from app import models

SAVED_MODELS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "saved_models"
)

MODELS_READY = (
    os.path.exists(os.path.join(SAVED_MODELS_DIR, "model_rf.joblib"))
    and os.path.exists(os.path.join(SAVED_MODELS_DIR, "model_xgb.joblib"))
    and os.path.exists(os.path.join(SAVED_MODELS_DIR, "label_encoder.joblib"))
    and os.path.exists(os.path.join(SAVED_MODELS_DIR, "feature_columns.joblib"))
)


class HealthRadarIntegrationTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        models.Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)

    def test_root_and_health_endpoints(self):
        root_res = self.client.get("/")
        self.assertEqual(root_res.status_code, 200)
        self.assertEqual(root_res.json().get("project"), "HealthRadar")

        health_res = self.client.get("/api/health")
        self.assertEqual(health_res.status_code, 200)
        body = health_res.json()
        self.assertEqual(body.get("status"), "online")
        self.assertIn("version", body)

    def test_nlp_parse_endpoint_with_negation_and_duration(self):
        payload = {
            "text": "I have had a high fever and severe headache for 3 days, but no cough"
        }

        res = self.client.post("/api/nlp/parse", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("3 days", (data.get("duration") or "").lower())
        self.assertEqual(data.get("severity"), "High")
        self.assertIsInstance(data.get("extracted_symptoms"), list)

    def test_nlp_parse_rejects_empty_text(self):
        res = self.client.post("/api/nlp/parse", json={"text": "   "})
        self.assertEqual(res.status_code, 400)

    def test_clusters_and_outbreaks_endpoints(self):
        cluster_res = self.client.get("/api/clusters?eps=1.2&min_samples=3")
        self.assertEqual(cluster_res.status_code, 200)
        cluster_data = cluster_res.json()
        self.assertGreater(cluster_data.get("total_reports_analyzed", 0), 0)
        self.assertIn("disclaimer", cluster_data)

        outbreak_res = self.client.get("/api/outbreaks")
        self.assertEqual(outbreak_res.status_code, 200)
        outbreak_data = outbreak_res.json()
        self.assertEqual(outbreak_data.get("monitored_cities"), 12)
        self.assertIn("disclaimer", outbreak_data)

        for city_item in outbreak_data.get("cities", []):
            self.assertIn(
                city_item["status"],
                ["High anomaly", "Moderate anomaly", "Normal"],
            )

    def test_forecast_endpoint_valid_and_invalid_city(self):
        ok_res = self.client.get(
            "/api/forecast?city=Bengaluru&horizon_days=7"
        )
        self.assertEqual(ok_res.status_code, 200)
        fc_data = ok_res.json()
        self.assertEqual(fc_data.get("city"), "Bengaluru")
        self.assertEqual(fc_data.get("horizon_days"), 7)
        self.assertIn("mae", fc_data)
        self.assertIn("rmse", fc_data)
        self.assertGreaterEqual(len(fc_data.get("series", [])), 49)

        bad_res = self.client.get(
            "/api/forecast?city=Atlantis&horizon_days=7"
        )
        self.assertEqual(bad_res.status_code, 404)

    @unittest.skipUnless(MODELS_READY, "Trained .joblib artifacts not present yet")
    def test_prediction_and_explain_endpoints(self):
        pred_res = self.client.post(
            "/api/predict",
            json={"symptoms": ["fever", "headache"]}
        )
        self.assertEqual(pred_res.status_code, 200)
        pred_data = pred_res.json()
        self.assertEqual(len(pred_data.get("top_predictions", [])), 3)

        exp_res = self.client.post(
            "/api/explain",
            json={"symptoms": ["fever", "headache"]}
        )
        self.assertEqual(exp_res.status_code, 200)
        exp_data = exp_res.json()
        self.assertIn("predicted_disease", exp_data)
        self.assertIsInstance(exp_data.get("contributions"), list)


if __name__ == "__main__":
    unittest.main()
