
import warnings
import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA

from app.analytics.anomaly import compute_outbreak_anomalies


def generate_city_forecast(city_name: str = "Bengaluru", horizon_days: int = 7):
    outbreak_data = compute_outbreak_anomalies(disease_filter=None)

    city_match = next(
        (c for c in outbreak_data["cities"] if c["city"].lower() == city_name.lower()),
        None,
    )

    if not city_match:
        raise ValueError(f"City '{city_name}' is not in the monitored cities list.")

    raw_series = np.array(city_match["daily_series"], dtype=float)
    n_days = len(raw_series)

    # 7-day moving average across historical days
    s_series = pd.Series(raw_series)
    ma_series = s_series.rolling(window=7, min_periods=1).mean().to_numpy()

    # Backtest on last 7 observed days
    backtest_window = min(7, max(1, n_days - 1))
    actuals_bt = raw_series[-backtest_window:]
    preds_bt = []

    for idx in range(n_days - backtest_window, n_days):
        start_idx = max(0, idx - 7)
        window_slice = raw_series[start_idx:idx]
        preds_bt.append(
            float(np.mean(window_slice)) if len(window_slice) > 0 else raw_series[idx]
        )

    preds_bt_arr = np.array(preds_bt, dtype=float)
    errors = actuals_bt - preds_bt_arr

    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    residual_std = max(float(np.std(errors)), 1.0)

    # ARIMA(1, 1, 1) with moving-average fallback
    model_used = "ARIMA(1,1,1) + 7d Moving-Average Baseline"

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            fitted = ARIMA(raw_series, order=(1, 1, 1)).fit()
            forecast_res = fitted.get_forecast(steps=horizon_days)

            fc_mean = np.maximum(0.0, forecast_res.predicted_mean)
            conf_int = forecast_res.conf_int(alpha=0.2)

            lower_arr = np.maximum(0.0, conf_int[:, 0])
            upper_arr = np.maximum(fc_mean, conf_int[:, 1])

    except Exception:
        model_used = "7-Day Moving-Average Fallback (ARIMA non-convergent)"

        last_ma = float(ma_series[-1])
        fc_mean = np.full(horizon_days, max(0.0, last_ma))
        lower_arr = np.maximum(0.0, fc_mean - 1.28 * residual_std)
        upper_arr = fc_mean + 1.28 * residual_std

    points = []

    for i in range(n_days):
        points.append({
            "day_label": f"D-{n_days - i}",
            "day_index": i + 1,
            "actual": round(float(raw_series[i]), 2),
            "moving_avg_baseline": round(float(ma_series[i]), 2),
            "arima_forecast": None,
            "lower_bound": None,
            "upper_bound": None,
        })

    # Future forecast points
    last_ma_val = round(float(ma_series[-1]), 2)

    for step in range(horizon_days):
        day_num = n_days + step + 1

        points.append({
            "day_label": f"+{step + 1}d",
            "day_index": day_num,
            "actual": None,
            "moving_avg_baseline": last_ma_val,
            "arima_forecast": round(float(fc_mean[step]), 2),
            "lower_bound": round(float(lower_arr[step]), 2),
            "upper_bound": round(float(upper_arr[step]), 2),
        })

    return {
        "city": city_match["city"],
        "dominant_disease": city_match["dominant_disease"],
        "model_used": model_used,
        "horizon_days": horizon_days,
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "data_source": "Simulated 42-day regional report series (for academic prototyping)",
        "disclaimer": (
            "Experimental prototype only: forecasts are statistical projections from simulated data "
            "and do not represent actual future disease incidence or clinical outcomes."
        ),
        "series": points,
    }
