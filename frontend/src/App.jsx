
import React, { useState } from 'react';

import Sidebar from './components/Sidebar';
import Header from './components/Header';

import PredictionPage from './pages/PredictionPage';
import ExplainableAIPage from './pages/ExplainableAIPage';
import NlpAssistantPage from './pages/NlpAssistantPage';

import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={styles.appContainer}>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div style={styles.mainWrapper}>

        <Header activeTab={activeTab} />

        <main style={styles.contentArea}>

          {activeTab === 'radar-ai' ? (

            <NlpAssistantPage />

          ) : activeTab === 'prediction' ? (

            <PredictionPage />

          ) : activeTab === 'explainable-ai' ? (

            <ExplainableAIPage />

          ) : (

            <div style={styles.card}>
              <h2 style={styles.heading}>
                Welcome to HealthRadar
              </h2>

              <p style={styles.description}>
                You are viewing the {activeTab.toUpperCase()} module.

                {activeTab === 'overview'
                  ? ' Explore HealthRadar AI-powered public health intelligence.'
                  : ' This module is ready for development.'}
              </p>

              <p style={styles.description}>
                Select Radar AI to use the conversational symptom
                assistant, Disease Prediction to test the ML screening
                API, or Explainable AI to inspect SHAP feature
                contributions.
              </p>
            </div>

          )}

        </main>
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#080D18'
  },

  mainWrapper: {
    flex: 1,
    minWidth: 0,
    marginLeft: '72px',
    display: 'flex',
    flexDirection: 'column'
  },

  contentArea: {
    padding: '32px',
    flex: 1
  },

  card: {
    backgroundColor: '#111D30',
    border: '1px solid #253650',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },

  heading: {
    color: '#009DFF',
    marginBottom: '12px'
  },

  description: {
    color: '#91A0B8',
    lineHeight: '1.6',
    marginBottom: '10px'
  }
};
