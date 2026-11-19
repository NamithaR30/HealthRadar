
import React, { useState } from 'react';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

import {
  OverviewView,
  AnalyticsView,
  AboutView,
} from './pages/DashboardViews';

import PredictionPage from './pages/PredictionPage';
import ExplainableAIPage from './pages/ExplainableAIPage';
import NlpAssistantPage from './pages/NlpAssistantPage';
import ClustersPage from './pages/ClustersPage';
import OutbreakMapPage from './pages/OutbreakMapPage';
import ForecastingPage from './pages/ForecastingPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderPage = () => {
    switch (activeTab) {
      case 'radar-ai':
        return <NlpAssistantPage />;

      case 'prediction':
        return <PredictionPage />;

      case 'explainable-ai':
        return <ExplainableAIPage />;

      case 'clusters':
        return <ClustersPage />;

      case 'outbreak-map':
        return <OutbreakMapPage />;

      case 'forecasting':
        return <ForecastingPage />;

      case 'analytics':
        return <AnalyticsView />;

      case 'about':
        return <AboutView />;

      case 'overview':
      default:
        return <OverviewView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div style={styles.appContainer}>

      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main application area */}
      <div style={styles.mainWrapper}>

        {/* Dynamic page header */}
        <Header activeTab={activeTab} />

        {/* Selected page */}
        <main style={styles.contentArea}>
          {renderPage()}
        </main>

      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#080D18',
    color: '#F1F5FF',
  },

  mainWrapper: {
    flex: 1,
    minWidth: 0,
    minHeight: '100vh',
    marginLeft: '72px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#080D18',
  },

  contentArea: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    padding: '32px',
  },

  card: {
    backgroundColor: '#111D30',
    border: '1px solid #253650',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },

  welcomeTitle: {
    color: '#009DFF',
    marginBottom: '12px',
    fontSize: '24px',
  },

  welcomeText: {
    color: '#91A0B8',
    lineHeight: '1.6',
  },
};
