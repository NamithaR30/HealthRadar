
import React, { useState, useEffect } from 'react';
import {
  Network,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Layers
} from 'lucide-react';

export default function ClustersPage() {
  const [data, setData] = useState(null);
  const [eps, setEps] = useState(1.2);
  const [minSamples, setMinSamples] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClusters = async (
    customEps = eps,
    customMin = minSamples
  ) => {
    setLoading(true);
    setError(null);

    try {
      const url =
        `http://localhost:8000/api/clusters?eps=${customEps}&min_samples=${customMin}`;

      const response = await fetch(url);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.detail || 'Failed to load clusters.');
      }

      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const handleApplyParams = (e) => {
    e.preventDefault();
    fetchClusters(eps, minSamples);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.topRow}>
          <div>
            <h3 style={styles.cardTitle}>
              <Network size={20} color="#009DFF" />
              DBSCAN Symptom Pattern Clustering
            </h3>
            <p style={styles.cardDesc}>
              Groups reports with similar symptom combinations
              and isolates atypical outlier reports.
            </p>
          </div>

          <button
            onClick={() => fetchClusters()}
            disabled={loading}
            style={styles.refreshBtn}
          >
            <RefreshCw size={15} />
            <span>{loading ? 'Loading...' : 'Re-run DBSCAN'}</span>
          </button>
        </div>

        <form onSubmit={handleApplyParams} style={styles.paramForm}>
          <div style={styles.paramGroup}>
            <label style={styles.label}>
              Neighborhood Radius (eps):
            </label>
            <input
              type="number"
              step="0.1"
              min="0.2"
              max="5.0"
              value={eps}
              onChange={(e) =>
                setEps(parseFloat(e.target.value) || 1.2)
              }
              style={styles.numInput}
            />
          </div>

          <div style={styles.paramGroup}>
            <label style={styles.label}>Min Samples:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={minSamples}
              onChange={(e) =>
                setMinSamples(parseInt(e.target.value, 10) || 3)
              }
              style={styles.numInput}
            />
          </div>

          <button type="submit" style={styles.applyBtn}>
            Apply Parameters
          </button>
        </form>

        {data && (
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Reports Analyzed</span>
              <span style={styles.statValue}>
                {data.total_reports_analyzed}
              </span>
            </div>

            <div style={styles.statBox}>
              <span style={styles.statLabel}>Clusters Detected</span>
              <span style={{ ...styles.statValue, color: '#009DFF' }}>
                {data.clusters_found}
              </span>
            </div>

            <div style={styles.statBox}>
              <span style={styles.statLabel}>Noise / Outliers</span>
              <span style={{ ...styles.statValue, color: '#F5A623' }}>
                {data.noise_reports}
              </span>
            </div>
          </div>
        )}

        {data?.disclaimer && (
          <div style={styles.disclaimerBox}>
            <AlertTriangle
              size={16}
              color="#F5A623"
              style={{ flexShrink: 0 }}
            />
            <span>{data.disclaimer}</span>
          </div>
        )}

        {error && <div style={styles.errorText}>{error}</div>}
      </div>

      {loading && (
        <p style={styles.cardDesc}>Loading symptom clusters...</p>
      )}

      {data && (
        <div style={styles.clustersGrid}>
          {data.clusters.map((cluster) => (
            <div
              key={cluster.cluster_id}
              style={{
                ...styles.clusterCard,
                borderColor: cluster.is_noise
                  ? '#F5A623'
                  : '#253650'
              }}
            >
              <div style={styles.clusterHeader}>
                <span style={styles.clusterTitle}>
                  <Layers
                    size={16}
                    color={cluster.is_noise ? '#F5A623' : '#009DFF'}
                  />
                  {cluster.label}
                </span>

                <span style={styles.countBadge}>
                  {cluster.report_count} reports
                </span>
              </div>

              <div style={styles.sectionBlock}>
                <div style={styles.miniLabel}>
                  Co-occurring Symptoms:
                </div>

                <div style={styles.tagWrap}>
                  {cluster.top_symptoms.length > 0 ? (
                    cluster.top_symptoms.map((symptom, i) => (
                      <span key={i} style={styles.symTag}>
                        {symptom}
                      </span>
                    ))
                  ) : (
                    <span style={styles.muted}>
                      No shared symptom pattern
                    </span>
                  )}
                </div>
              </div>

              <div style={styles.sectionBlock}>
                <div style={styles.miniLabel}>
                  <MapPin
                    size={12}
                    style={{
                      marginRight: '4px',
                      verticalAlign: 'middle'
                    }}
                  />
                  Top Cities:
                </div>

                <div style={styles.cityText}>
                  {cluster.top_cities.length > 0
                    ? cluster.top_cities.join(' • ')
                    : 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  card: {
    backgroundColor: '#111D30',
    border: '1px solid #253650',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '18px'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#F1F5FF',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px'
  },
  cardDesc: {
    fontSize: '13px',
    color: '#91A0B8'
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#17243A',
    border: '1px solid #009DFF',
    color: '#009DFF',
    padding: '8px 14px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer'
  },
  paramForm: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
    flexWrap: 'wrap',
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    padding: '14px',
    borderRadius: '8px',
    marginBottom: '18px'
  },
  paramGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '12px',
    color: '#91A0B8',
    fontWeight: '500'
  },
  numInput: {
    width: '100px',
    backgroundColor: '#111D30',
    border: '1px solid #253650',
    borderRadius: '6px',
    padding: '8px 10px',
    color: '#F1F5FF',
    fontSize: '13px'
  },
  applyBtn: {
    backgroundColor: '#009DFF',
    color: '#F1F5FF',
    border: 'none',
    borderRadius: '6px',
    padding: '9px 16px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '16px'
  },
  statBox: {
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#91A0B8'
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#F1F5FF'
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
    lineHeight: '1.4'
  },
  errorText: {
    color: '#F04452',
    fontSize: '13px',
    marginTop: '10px'
  },
  clustersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  clusterCard: {
    backgroundColor: '#111D30',
    border: '1px solid #253650',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  clusterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  clusterTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#F1F5FF',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  countBadge: {
    backgroundColor: '#17243A',
    color: '#009DFF',
    border: '1px solid #253650',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  miniLabel: {
    fontSize: '11px',
    color: '#91A0B8',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  tagWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  symTag: {
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    color: '#F1F5FF',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px'
  },
  cityText: {
    fontSize: '13px',
    color: '#91A0B8'
  },
  muted: {
    fontSize: '12px',
    color: '#566a8f',
    fontStyle: 'italic'
  }
};
