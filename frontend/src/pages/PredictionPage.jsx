
import React, { useState, useEffect, useMemo } from 'react';
import {
  BrainCircuit,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  X
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000';

export default function PredictionPage() {
  const [symptomsList, setSymptomsList] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const response = await fetch(`${API_URL}/api/symptoms-list`);

        if (!response.ok) {
          throw new Error('Could not load recognized symptoms.');
        }

        const data = await response.json();
        setSymptomsList(data.symptoms || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingSymptoms(false);
      }
    };

    fetchSymptoms();
  }, []);

  const filteredSymptoms = useMemo(() => {
    const query = searchInput.trim().toLowerCase();

    return symptomsList
      .filter(symptom =>
        !selectedSymptoms.includes(symptom) &&
        symptom.toLowerCase().includes(query)
      )
      .slice(0, 50);
  }, [symptomsList, selectedSymptoms, searchInput]);

  const handleToggleSymptom = (symptom) => {
    setSelectedSymptoms(previous =>
      previous.includes(symptom)
        ? previous.filter(item => item !== symptom)
        : [...previous, symptom]
    );

    setPredictions(null);
    setError(null);
  };

  const handleRemoveSymptom = (symptom) => {
    setSelectedSymptoms(previous =>
      previous.filter(item => item !== symptom)
    );

    setPredictions(null);
  };

  const handleRunPrediction = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one recognized symptom.');
      return;
    }

    setError(null);
    setLoading(true);
    setPredictions(null);

    try {
      const response = await fetch(`${API_URL}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symptoms: selectedSymptoms
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Prediction failed. Please try again.'
        );
      }

      setPredictions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.grid}>

        {/* Symptom Selector */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <BrainCircuit size={20} color="#009DFF" />
            Select Patient Symptoms
          </h3>

          <p style={styles.cardDesc}>
            Search and select symptoms from the recognized dataset.
          </p>

          <div style={styles.searchWrapper}>
            <Search size={18} color="#91A0B8" />

            <input
              type="text"
              placeholder="Search symptoms..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={styles.input}
              disabled={loadingSymptoms}
            />
          </div>

          <div style={styles.symptomList}>
            {loadingSymptoms ? (
              <p style={styles.listMessage}>
                Loading recognized symptoms...
              </p>
            ) : symptomsList.length === 0 ? (
              <p style={styles.listMessage}>
                Unable to load symptoms. Check that the backend is running.
              </p>
            ) : filteredSymptoms.length === 0 ? (
              <p style={styles.listMessage}>
                No matching symptoms found.
              </p>
            ) : (
              filteredSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  style={styles.symptomOption}
                  onClick={() => handleToggleSymptom(symptom)}
                >
                  <span>{symptom}</span>
                  <span style={styles.addSymbol}>+</span>
                </button>
              ))
            )}
          </div>

          <p style={styles.listHint}>
            Showing up to 50 matching symptoms out of {symptomsList.length}.
          </p>

          <div style={styles.selectedBox}>
            <span style={styles.selectedLabel}>
              Selected symptoms ({selectedSymptoms.length})
            </span>

            <div style={styles.tagContainer}>
              {selectedSymptoms.length === 0 ? (
                <span style={styles.emptyText}>
                  No symptoms selected yet.
                </span>
              ) : (
                selectedSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    style={styles.tag}
                    onClick={() => handleRemoveSymptom(symptom)}
                    title="Remove symptom"
                  >
                    {symptom}
                    <X size={13} />
                  </button>
                ))
              )}
            </div>
          </div>

          <button
            onClick={handleRunPrediction}
            disabled={loading || loadingSymptoms || symptomsList.length === 0}
            style={{
              ...styles.predictBtn,
              opacity: loading || loadingSymptoms ? 0.6 : 1,
              cursor: loading || loadingSymptoms ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <>
                <RefreshCw className="spin" size={18} />
                Analyzing Symptoms...
              </>
            ) : (
              'Run Ensemble Prediction'
            )}
          </button>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Prediction Results */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            Disease Risk Rankings
          </h3>

          <p style={styles.cardDesc}>
            Top-3 ensemble predictions (Random Forest + XGBoost).
          </p>

          {!predictions ? (
            <div style={styles.placeholderBox}>
              <p style={styles.emptyText}>
                Select symptoms and run the prediction to view results.
              </p>
            </div>
          ) : (
            <div style={styles.resultsContainer}>
              <div style={styles.matchedInfo}>
                <CheckCircle size={16} color="#20C997" />

                <span style={styles.matchedText}>
                  Matched {predictions.input_symptoms.length} recognized
                  symptoms.
                </span>
              </div>

              {predictions.top_predictions.map((prediction, index) => (
                <div key={index} style={styles.resultCard}>
                  <div style={styles.rankBadge}>
                    #{index + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={styles.diseaseName}>
                      {prediction.disease}
                    </h4>

                    <div style={styles.progressBarBg}>
                      <div
                        style={{
                          ...styles.progressBarFill,
                          width: `${Math.min(
                            Math.max(prediction.confidence, 0),
                            100
                          )}%`,
                          backgroundColor:
                            index === 0 ? '#009DFF' : '#42B6FF'
                        }}
                      />
                    </div>
                  </div>

                  <span style={styles.confidenceText}>
                    {prediction.confidence}%
                  </span>
                </div>
              ))}

              <p style={styles.disclaimer}>
                Experimental model output for educational purposes only.
                These predictions are not medical diagnoses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    alignItems: 'start'
  },

  card: {
    backgroundColor: '#111D30',
    border: '1px solid #253650',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    minWidth: 0
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
    color: '#91A0B8',
    marginBottom: '20px',
    lineHeight: '1.5'
  },

  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px',
    padding: '0 12px',
    marginBottom: '12px'
  },

  input: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
    border: 'none',
    padding: '12px 0',
    color: '#F1F5FF',
    fontSize: '14px',
    outline: 'none'
  },

  symptomList: {
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px',
    height: '230px',
    overflowY: 'auto'
  },

  symptomOption: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid #253650',
    color: '#F1F5FF',
    textAlign: 'left',
    fontSize: '13px',
    cursor: 'pointer'
  },

  addSymbol: {
    color: '#009DFF',
    fontSize: '18px',
    fontWeight: '700'
  },

  listMessage: {
    color: '#91A0B8',
    fontSize: '13px',
    padding: '16px',
    textAlign: 'center'
  },

  listHint: {
    color: '#566A8F',
    fontSize: '11px',
    marginTop: '8px',
    marginBottom: '16px'
  },

  selectedBox: {
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    minHeight: '80px'
  },

  selectedLabel: {
    fontSize: '13px',
    color: '#91A0B8'
  },

  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px'
  },

  tag: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#17243A',
    border: '1px solid #009DFF',
    color: '#009DFF',
    padding: '5px 9px',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer'
  },

  emptyText: {
    fontSize: '12px',
    color: '#566A8F',
    fontStyle: 'italic'
  },

  predictBtn: {
    width: '100%',
    backgroundColor: '#009DFF',
    color: '#F1F5FF',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 0 12px rgba(0, 157, 255, 0.3)'
  },

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '14px',
    backgroundColor: 'rgba(240, 68, 82, 0.1)',
    border: '1px solid #F04452',
    padding: '10px',
    borderRadius: '8px',
    color: '#F04452',
    fontSize: '13px'
  },

  placeholderBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    backgroundColor: '#0D1525',
    border: '1px dashed #253650',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center'
  },

  resultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },

  matchedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(32, 201, 151, 0.1)',
    border: '1px solid #20C997',
    padding: '10px',
    borderRadius: '8px'
  },

  matchedText: {
    fontSize: '13px',
    color: '#20C997'
  },

  resultCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    padding: '14px',
    borderRadius: '8px'
  },

  rankBadge: {
    width: '28px',
    height: '28px',
    flexShrink: 0,
    backgroundColor: '#17243A',
    border: '1px solid #009DFF',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    color: '#009DFF',
    fontSize: '12px'
  },

  diseaseName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#F1F5FF',
    marginBottom: '6px',
    textTransform: 'capitalize'
  },

  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: '#111D30',
    borderRadius: '3px',
    overflow: 'hidden'
  },

  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.4s ease'
  },

  confidenceText: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#009DFF',
    minWidth: '50px',
    textAlign: 'right'
  },

  disclaimer: {
    color: '#91A0B8',
    fontSize: '11px',
    lineHeight: '1.5',
    borderTop: '1px solid #253650',
    paddingTop: '12px'
  }
};
