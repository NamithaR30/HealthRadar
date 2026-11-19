
import React, { useState, useEffect } from 'react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import {
  LayoutDashboard,
  BarChart3,
  Info,
  AlertTriangle,
} from 'lucide-react';

const STATUS_BADGE_COLORS = {
  'High anomaly': '#F04452',
  'Moderate anomaly': '#F5A623',
  'Normal': '#20C997',
};


// ==========================================
// OVERVIEW VIEW
// ==========================================

export function OverviewView({ onNavigate }) {
  const [outbreaks, setOutbreaks] = useState(null);
  const [clusters, setClusters] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/api/outbreaks').then((r) => {
        if (!r.ok) throw new Error('Failed to load outbreak data');
        return r.json();
      }),

      fetch('http://localhost:8000/api/clusters').then((r) => {
        if (!r.ok) throw new Error('Failed to load clustering data');
        return r.json();
      }),
    ])
      .then(([outData, clData]) => {
        setOutbreaks(outData);
        setClusters(clData);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={styles.stack}>
      <div style={styles.card}>
        <div style={styles.rowBetween}>
          <div>
            <h3 style={styles.title}>
              <LayoutDashboard size={20} color="#009DFF" />
              HealthRadar Surveillance Summary
            </h3>

            <p style={styles.desc}>
              Unified view across Personal Screening, Community Clustering
              & Z-Score Monitoring, and Forecasting.
            </p>
          </div>

          <div style={styles.quickActions}>
            <button
              onClick={() => onNavigate('radar-ai')}
              style={styles.primaryBtn}
            >
              Open Radar AI
            </button>

            <button
              onClick={() => onNavigate('outbreak-map')}
              style={styles.secondaryBtn}
            >
              Open Outbreak Map
            </button>
          </div>
        </div>

        {error && (
          <div style={styles.errorText}>
            Backend error: {error}
          </div>
        )}

        <div style={styles.kpiGrid}>
          <div style={styles.kpiBox}>
            <span style={styles.kpiLabel}>Monitored Cities</span>
            <span style={styles.kpiVal}>
              {outbreaks?.monitored_cities ?? '—'}
            </span>
          </div>

          <div style={styles.kpiBox}>
            <span style={styles.kpiLabel}>
              High Anomalies (z ≥ 3)
            </span>
            <span style={{ ...styles.kpiVal, color: '#F04452' }}>
              {outbreaks?.high_anomaly_count ?? '—'}
            </span>
          </div>

          <div style={styles.kpiBox}>
            <span style={styles.kpiLabel}>
              Moderate Anomalies (1.5 ≤ z &lt; 3)
            </span>
            <span style={{ ...styles.kpiVal, color: '#F5A623' }}>
              {outbreaks?.moderate_anomaly_count ?? '—'}
            </span>
          </div>

          <div style={styles.kpiBox}>
            <span style={styles.kpiLabel}>
              DBSCAN Symptom Clusters
            </span>
            <span style={{ ...styles.kpiVal, color: '#009DFF' }}>
              {clusters?.clusters_found ?? '—'}
            </span>
          </div>
        </div>

        {outbreaks?.disclaimer && (
          <div style={styles.disclaimer}>
            <AlertTriangle
              size={16}
              color="#F5A623"
              style={{ flexShrink: 0 }}
            />
            <span>{outbreaks.disclaimer}</span>
          </div>
        )}
      </div>

      {outbreaks?.cities && (
        <div style={styles.card}>
          <h4 style={styles.subTitle}>
            City Z-Score Snapshot (7-Day vs. 35-Day Baseline)
          </h4>

          <div style={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={outbreaks.cities}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  stroke="#253650"
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="city"
                  stroke="#91A0B8"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  stroke="#91A0B8"
                  tick={{ fontSize: 12 }}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1525',
                    border: '1px solid #253650',
                    borderRadius: '8px',
                    color: '#F1F5FF',
                    fontSize: '12px',
                  }}
                />

                <Bar
                  dataKey="z_score"
                  fill="#009DFF"
                  radius={[4, 4, 0, 0]}
                  name="Z-Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}


// ==========================================
// ANALYTICS VIEW
// ==========================================

export function AnalyticsView() {
  const [outbreaks, setOutbreaks] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetch('http://localhost:8000/api/outbreaks')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load outbreaks');
        return res.json();
      })
      .then((data) => setOutbreaks(data))
      .catch(() => {});
  }, []);

  const rows = (outbreaks?.cities || []).filter(
    (city) =>
      statusFilter === 'All' || city.status === statusFilter
  );

  return (
    <div style={styles.card}>
      <div style={styles.rowBetween}>
        <div>
          <h3 style={styles.title}>
            <BarChart3 size={20} color="#009DFF" />
            Regional Surveillance & Anomaly Comparison
          </h3>

          <p style={styles.desc}>
            Compare recent 7-day averages, 35-day baselines,
            and Z-scores across monitored cities.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.select}
        >
          <option value="All">All Statuses</option>
          <option value="High anomaly">High anomaly</option>
          <option value="Moderate anomaly">Moderate anomaly</option>
          <option value="Normal">Normal</option>
        </select>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>City</th>
              <th style={styles.th}>Dominant Syndrome</th>
              <th style={styles.th}>7d Avg</th>
              <th style={styles.th}>35d Baseline</th>
              <th style={styles.th}>Z-Score</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const badgeColor =
                STATUS_BADGE_COLORS[r.status] || '#009DFF';

              return (
                <tr key={r.city} style={styles.tr}>
                  <td style={styles.tdStrong}>{r.city}</td>
                  <td style={styles.td}>{r.dominant_disease}</td>
                  <td style={styles.td}>{r.recent_mean}</td>
                  <td style={styles.td}>{r.baseline_mean}</td>
                  <td style={styles.tdStrong}>{r.z_score}</td>

                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        color: badgeColor,
                        borderColor: badgeColor,
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan="6" style={styles.td}>
                  No cities found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ==========================================
// ABOUT VIEW
// ==========================================

export function AboutView() {
  return (
    <div style={styles.card}>
      <h3 style={styles.title}>
        <Info size={20} color="#009DFF" />
        About HealthRadar
      </h3>

      <p
        style={{
          ...styles.desc,
          marginTop: '8px',
          lineHeight: '1.6',
        }}
      >
        <strong style={{ color: '#F1F5FF' }}>
          HealthRadar
        </strong>

        {' '}

        (Tagline: <em>Predict. Explain. Monitor.</em>) is an academic
        screening and public health surveillance prototype combining
        NLP symptom extraction, Random Forest + XGBoost ensemble
        classification, SHAP explainability, DBSCAN symptom clustering,
        Z-score anomaly detection, and moving-average / ARIMA forecasting.
      </p>

      <div style={styles.disclaimer}>
        <AlertTriangle
          size={16}
          color="#F5A623"
          style={{ flexShrink: 0 }}
        />

        <span>
          <strong>Academic Prototype Disclaimer:</strong>
          {' '}
          HealthRadar is not a medical diagnostic system.
          Statistical clusters, Z-score anomalies, and experimental
          forecasts derived from simulated regional series do not
          represent confirmed disease outbreaks or clinical diagnoses.
        </span>
      </div>
    </div>
  );
}


// ==========================================
// SHARED STYLES
// ==========================================

const styles = {
  stack: {
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

  rowBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '18px',
  },

  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#F1F5FF',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  subTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#F1F5FF',
    marginBottom: '12px',
  },

  desc: {
    fontSize: '13px',
    color: '#91A0B8',
    marginTop: '4px',
  },

  quickActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },

  primaryBtn: {
    backgroundColor: '#009DFF',
    color: '#F1F5FF',
    border: 'none',
    borderRadius: '8px',
    padding: '9px 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  secondaryBtn: {
    backgroundColor: '#17243A',
    color: '#009DFF',
    border: '1px solid #009DFF',
    borderRadius: '8px',
    padding: '9px 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: '14px',
    marginBottom: '16px',
  },

  kpiBox: {
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  kpiLabel: {
    fontSize: '12px',
    color: '#91A0B8',
  },

  kpiVal: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#F1F5FF',
  },

  disclaimer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    border: '1px solid #F5A623',
    color: '#F1F5FF',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '12px',
    lineHeight: '1.45',
    marginTop: '14px',
  },

  errorText: {
    color: '#F04452',
    fontSize: '13px',
    marginBottom: '12px',
  },

  chartWrap: {
    width: '100%',
    height: '300px',
  },

  select: {
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#F1F5FF',
    fontSize: '13px',
  },

  tableWrap: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },

  thRow: {
    borderBottom: '1px solid #253650',
    textAlign: 'left',
    color: '#91A0B8',
  },

  th: {
    padding: '10px 12px',
    fontWeight: '600',
  },

  tr: {
    borderBottom: '1px solid #17243A',
  },

  td: {
    padding: '10px 12px',
    color: '#91A0B8',
  },

  tdStrong: {
    padding: '10px 12px',
    color: '#F1F5FF',
    fontWeight: '600',
  },

  badge: {
    padding: '3px 9px',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '11px',
    fontWeight: '600',
    backgroundColor: '#0D1525',
  },
};
