
import { Activity, Bell, ShieldCheck } from 'lucide-react';

const pageInfo = {
  overview: {
    title: 'Overview',
    description: 'Monitor disease patterns and public health intelligence.',
  },
  'radar-ai': {
    title: 'Radar AI',
    description: 'Your intelligent public health monitoring assistant.',
  },
  prediction: {
    title: 'Disease Prediction',
    description: 'Predict potential disease risks using machine learning.',
  },
  'explainable-ai': {
    title: 'Explainable AI',
    description: 'Understand the factors behind model predictions.',
  },
  clusters: {
    title: 'Symptom Clusters',
    description: 'Discover patterns in reported symptoms.',
  },
  'outbreak-map': {
    title: 'Outbreak Map',
    description: 'Explore simulated disease activity across India.',
  },
  forecasting: {
    title: 'Forecasting',
    description: 'Explore potential disease trends and forecasts.',
  },
  analytics: {
    title: 'Analytics',
    description: 'Review public health trends and statistics.',
  },
  about: {
    title: 'About HealthRadar',
    description: 'Learn about the HealthRadar project and its technology.',
  },
};

function Header({ activeTab }) {
  const currentPage = pageInfo[activeTab] || pageInfo.overview;

  return (
    <header style={styles.header}>
      <div style={styles.headerTitle}>
        <h1 style={styles.title}>{currentPage.title}</h1>
        <p style={styles.description}>{currentPage.description}</p>
      </div>

      <div style={styles.headerActions}>
        <div style={styles.systemStatus}>
          <span style={styles.statusDot} />
          <ShieldCheck size={16} color="#20C997" />
          <span>System Online</span>
        </div>

        <button
          style={styles.headerIcon}
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={19} />
        </button>

        <div style={styles.avatar}>
          <Activity size={21} color="#009DFF" />
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    minHeight: '100px',
    padding: '22px 32px',
    backgroundColor: '#080D18',
    borderBottom: '1px solid #253650',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    boxSizing: 'border-box',
    flexWrap: 'wrap',
  },

  headerTitle: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },

  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#F1F5FF',
    margin: 0,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  },

  description: {
    fontSize: '13px',
    color: '#91A0B8',
    margin: 0,
    fontFamily: 'Inter, sans-serif',
  },

  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },

  systemStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    color: '#20C997',
    fontSize: '12px',
    fontWeight: 500,
  },

  statusDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#20C997',
    boxShadow: '0 0 8px rgba(32, 201, 151, 0.5)',
  },

  headerIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '9px',
    border: '1px solid #253650',
    backgroundColor: '#111D30',
    color: '#91A0B8',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },

  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#111D30',
    border: '1px solid #253650',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export default Header;
