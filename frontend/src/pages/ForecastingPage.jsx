
import React, { useState, useEffect } from 'react';

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

import { TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

const CITIES = [
  'Bengaluru', 'Mysuru', 'Chennai', 'Hyderabad',
  'Mumbai', 'Delhi', 'Kolkata', 'Pune',
  'Kochi', 'Ahmedabad', 'Jaipur', 'Lucknow',
];

export default function ForecastingPage() {
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchForecast = async (cityToLoad = selectedCity) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `http://localhost:8000/api/forecast?city=${encodeURIComponent(cityToLoad)}&horizon_days=7`
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.detail || 'Failed to load forecast.');
      }

      setForecastData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(selectedCity);
  }, [selectedCity]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.topRow}>
          <div>
            <h3 style={styles.cardTitle}>
              <TrendingUp size={20} color="#009DFF" />
              7-Day Experimental Disease Forecasting
            </h3>

            <p style={styles.cardDesc}>
              Compares historical daily reports, a 7-day moving-average baseline, and an ARIMA projection.
            </p>
          </div>

          <div style={styles.controlsRight}>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={styles.select}
            >
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <button
              onClick={() => fetchForecast(selectedCity)}
              disabled={loading}
              style={styles.refreshBtn}
            >
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {forecastData && (
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>City & Dominant Syndrome</span>
              <span style={styles.metricValue}>
                {forecastData.city} • {forecastData.dominant_disease}
              </span>
            </div>

            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Backtest MAE</span>
              <span style={{ ...styles.metricValue, color: '#009DFF' }}>
                {forecastData.mae}
              </span>
            </div>

            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Backtest RMSE</span>
              <span style={{ ...styles.metricValue, color: '#42B6FF' }}>
                {forecastData.rmse}
              </span>
            </div>

            <div style={styles.metricCard}>
              <span style={styles.metricLabel}>Model</span>
              <span style={{ ...styles.metricValue, fontSize: '13px' }}>
                {forecastData.model_used}
              </span>
            </div>
          </div>
        )}

        {forecastData?.disclaimer && (
          <div style={styles.disclaimerBox}>
            <AlertTriangle size={16} color="#F5A623" />
            <span>{forecastData.disclaimer}</span>
          </div>
        )}

        {error && <div style={styles.errorText}>{error}</div>}

        {loading && (
          <div style={styles.loadingText}>Generating forecast...</div>
        )}
      </div>

      {forecastData && (
        <div style={styles.card}>
          <h4 style={styles.chartTitle}>
            Historical Series vs. 7-Day Forecast & Uncertainty Range
          </h4>

          <div style={styles.chartBox}>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart
                data={forecastData.series}
                margin={{ top: 10, right: 24, left: 0, bottom: 8 }}
              >
                <CartesianGrid stroke="#253650" strokeDasharray="3 3" />

                <XAxis
                  dataKey="day_label"
                  stroke="#91A0B8"
                  tick={{ fontSize: 11 }}
                  interval={3}
                />

                <YAxis stroke="#91A0B8" tick={{ fontSize: 12 }} />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1525',
                    border: '1px solid #253650',
                    borderRadius: '8px',
                    color: '#F1F5FF',
                    fontSize: '12px',
                  }}
                />

                <Legend wrapperStyle={{ fontSize: '12px', color: '#91A0B8' }} />

                <Area
                  type="monotone"
                  dataKey="upper_bound"
                  stroke="none"
                  fill="#009DFF"
                  fillOpacity={0.14}
                  name="Upper Bound"
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#F1F5FF"
                  strokeWidth={2}
                  dot={false}
                  name="Historical Reports"
                />

                <Line
                  type="monotone"
                  dataKey="moving_avg_baseline"
                  stroke="#20C997"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="7d Moving Average"
                />

                <Line
                  type="monotone"
                  dataKey="arima_forecast"
                  stroke="#009DFF"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#009DFF' }}
                  name="7d ARIMA Forecast"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  card: {
    backgroundColor: '#111D30',
    border: '1px solid #253650',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },

  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '18px',
  },

  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#F1F5FF',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '4px',
  },

  cardDesc: {
    fontSize: '13px',
    color: '#91A0B8',
  },

  controlsRight: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },

  select: {
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#F1F5FF',
    fontSize: '13px',
  },

  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#17243A',
    border: '1px solid #009DFF',
    color: '#009DFF',
    padding: '8px 14px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
    marginBottom: '16px',
  },

  metricCard: {
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  metricLabel: {
    fontSize: '11px',
    color: '#91A0B8',
  },

  metricValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#F1F5FF',
  },

  disclaimerBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    border: '1px solid #F5A623',
    color: '#F1F5FF',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '12px',
    lineHeight: '1.4',
  },

  errorText: {
    color: '#F04452',
    fontSize: '13px',
    marginTop: '10px',
  },

  loadingText: {
    color: '#009DFF',
    fontSize: '13px',
    marginTop: '10px',
  },

  chartTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#F1F5FF',
    marginBottom: '14px',
  },

  chartBox: {
    width: '100%',
    height: '360px',
  },
};
