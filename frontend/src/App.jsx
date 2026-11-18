import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { Activity, ShieldCheck, TrendingUp, MapPin } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="main-content">
        <Header activeTab={activeTab} />

        <section className="dashboard-content">
          <div className="welcome-section">
            <div>
              <span className="eyebrow">PUBLIC HEALTH INTELLIGENCE</span>
              <h2>Welcome to HealthRadar</h2>
              <p>
                Intelligent disease monitoring, prediction and outbreak
                analysis — all in one place.
              </p>
            </div>

            <div className="welcome-icon">
              <Activity size={42} />
            </div>
          </div>

          <div className="section-heading">
            <div>
              <h3>Health Overview</h3>
              <p>Your public health monitoring workspace</p>
            </div>
            <span className="live-indicator">
              <span className="status-dot"></span>
              LIVE MONITORING
            </span>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>System Status</span>
                <ShieldCheck />
              </div>
              <h2>Operational</h2>
              <p className="stat-description">HealthRadar services</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Monitoring Mode</span>
                <Activity />
              </div>
              <h2>Active</h2>
              <p className="stat-description">Monitoring interface</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Forecasting</span>
                <TrendingUp />
              </div>
              <h2>Ready</h2>
              <p className="stat-description">Forecasting module</p>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Coverage</span>
                <MapPin />
              </div>
              <h2>India</h2>
              <p className="stat-description">Planned city coverage</p>
            </div>
          </div>

          <div className="info-panel">
            <div className="info-icon">
              <Activity size={22} />
            </div>
            <div>
              <h3>HealthRadar Intelligence Platform</h3>
              <p>
                Explore disease prediction, explainable AI, symptom
                clustering, outbreak mapping and forecasting through
                the navigation panel.
              </p>
            </div>
          </div>

          <p className="disclaimer">
            Prototype interface. Data and health indicators are not
            intended for medical diagnosis.
          </p>
        </section>
      </main>
    </div>
  )
}

export default App
