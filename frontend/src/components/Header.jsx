
import { Activity, Bell, ShieldCheck } from 'lucide-react'

const pageInfo = {
  overview: {
    title: 'Overview',
    description: 'Monitor disease patterns and public health intelligence.'
  },
  'radar-ai': {
    title: 'Radar AI',
    description: 'Your intelligent public health monitoring assistant.'
  },
  prediction: {
    title: 'Disease Prediction',
    description: 'Predict potential disease risks using machine learning.'
  },
  'explainable-ai': {
    title: 'Explainable AI',
    description: 'Understand the factors behind model predictions.'
  },
  clusters: {
    title: 'Symptom Clusters',
    description: 'Discover patterns in reported symptoms.'
  },
  'outbreak-map': {
    title: 'Outbreak Map',
    description: 'Explore simulated disease activity across India.'
  },
  forecasting: {
    title: 'Forecasting',
    description: 'Explore potential disease trends and forecasts.'
  },
  analytics: {
    title: 'Analytics',
    description: 'Review public health trends and statistics.'
  },
  about: {
    title: 'About HealthRadar',
    description: 'Learn about the HealthRadar project and its technology.'
  }
}

function Header({ activeTab }) {
  const currentPage = pageInfo[activeTab] || pageInfo.overview

  return (
    <header className="main-header">
      <div className="header-title">
        <h1>{currentPage.title}</h1>
        <p>{currentPage.description}</p>
      </div>

      <div className="header-actions">
        <div className="system-status">
          <span className="status-dot"></span>
          <ShieldCheck size={15} />
          <span>System Online</span>
        </div>

        <button className="header-icon" title="Notifications">
          <Bell size={19} />
        </button>

        <div className="header-avatar">
          <Activity size={20} />
        </div>
      </div>
    </header>
  )
}

export default Header
