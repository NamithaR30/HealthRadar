
import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000';

export default function ExplainableAIPage() {
  const [symptomsList, setSymptomsList] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [explanation, setExplanation] = useState(null);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  // Fetch recognized symptoms from the backend
  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const response = await fetch(`${API_URL}/api/symptoms-list`);

        if (!response.ok) {
          throw new Error('Unable to load the recognized symptoms list.');
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

  // Search only recognized symptoms
  const filteredSymptoms = useMemo(() => {
    const query = searchInput.trim().toLowerCase();

    if (!query) return [];

    return symptomsList
      .filter((symptom) =>
        symptom.toLowerCase().includes(query)
      )
      .filter((symptom) =>
        !selectedSymptoms.includes(symptom)
      )
      .slice(0, 10);

  }, [searchInput, symptomsList, selectedSymptoms]);

  // Add a symptom
  const handleAddSymptom = (symptom) => {
    setSelectedSymptoms((previous) => [...previous, symptom]);
    setSearchInput('');
    setShowSuggestions(false);
    setError(null);
  };

  // Remove a symptom
  const handleRemoveSymptom = (symptom) => {
    setSelectedSymptoms((previous) =>
      previous.filter((item) => item !== symptom)
    );
  };

  // Generate SHAP explanation
  const handleFetchExplanation = async (event) => {
    event.preventDefault();

    if (selectedSymptoms.length === 0) {
      setError('Please select at least one recognized symptom.');
      return;
    }

    setError(null);
    setExplanation(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/explain`, {
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
          data.detail || 'Unable to generate SHAP explanation.'
        );
      }

      setExplanation(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset the analysis
  const handleReset = () => {
    setSelectedSymptoms([]);
    setSearchInput('');
    setExplanation(null);
    setError(null);
  };

  const maxContribution = explanation?.contributions?.length
    ? Math.max(
        ...explanation.contributions.map(
          (item) => Math.abs(item.shap_value)
        ),
        0.000001
      )
    : 1;

  return (
    <div style={styles.container}>

      {/* Page introduction */}
      <div style={styles.pageIntro}>
        <div>
          <div style={styles.eyebrow}>
            <FileText size={15} />
            MODEL INTERPRETABILITY
          </div>

          <h2 style={styles.pageTitle}>
            Explainable AI
          </h2>

          <p style={styles.pageDescription}>
            Understand how selected symptoms contribute to the
            Random Forest model's predicted disease class.
          </p>
        </div>

        <div style={styles.modelBadge}>
          <span style={styles.onlineDot} />
          Random Forest · SHAP
        </div>
      </div>

      <div style={styles.grid}>

        {/* LEFT: Symptom input */}
        <section style={styles.card}>
          <div style={styles.cardHeading}>
            <div style={styles.iconBox}>
              <Search size={19} />
            </div>

            <div>
              <h3 style={styles.cardTitle}>
                Select Symptoms
              </h3>

              <p style={styles.cardDesc}>
                Choose symptoms from the recognized dataset.
              </p>
            </div>
          </div>

          <form onSubmit={handleFetchExplanation}>

            <label style={styles.label}>
              Search symptoms
            </label>

            <div style={styles.searchWrapper}>
              <Search size={17} color="#91A0B8" />

              <input
                type="text"
                value={searchInput}
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={
                  loadingSymptoms
                    ? 'Loading symptoms...'
                    : 'Search a symptom...'
                }
                disabled={loadingSymptoms}
                style={styles.searchInput}
              />
            </div>

            {showSuggestions && filteredSymptoms.length > 0 && (
              <div style={styles.suggestions}>
                {filteredSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    style={styles.suggestionItem}
                    onClick={() => handleAddSymptom(symptom)}
                  >
                    <span>{symptom}</span>
                    <span style={styles.addSymbol}>+</span>
                  </button>
                ))}
              </div>
            )}

            {showSuggestions &&
              searchInput.trim() &&
              filteredSymptoms.length === 0 && (
                <p style={styles.noResults}>
                  No matching unselected symptoms found.
                </p>
              )}

            <div style={styles.selectedHeader}>
              <span style={styles.label}>
                Selected symptoms
              </span>

              <span style={styles.countBadge}>
                {selectedSymptoms.length}
              </span>
            </div>

            <div style={styles.selectedContainer}>
              {selectedSymptoms.length === 0 ? (
                <p style={styles.emptyText}>
                  No symptoms selected yet.
                </p>
              ) : (
                selectedSymptoms.map((symptom) => (
                  <div key={symptom} style={styles.symptomChip}>
                    <span>{symptom}</span>

                    <button
                      type="button"
                      onClick={() => handleRemoveSymptom(symptom)}
                      style={styles.removeButton}
                      aria-label={`Remove ${symptom}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="submit"
              disabled={loading || loadingSymptoms}
              style={{
                ...styles.actionButton,
                opacity: loading || loadingSymptoms ? 0.65 : 1,
                cursor: loading || loadingSymptoms
                  ? 'not-allowed'
                  : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={17} />
                  Generating explanation...
                </>
              ) : (
                <>
                  <FileText size={17} />
                  Generate SHAP Explanation
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={styles.resetButton}
            >
              Reset analysis
            </button>

          </form>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={17} />
              <span>{error}</span>
            </div>
          )}

          <div style={styles.infoBox}>
            <div style={styles.infoHeading}>
              <Info size={16} />
              How SHAP works
            </div>

            <p style={styles.infoText}>
              SHAP assigns each feature a contribution value
              for the selected prediction. Positive values
              push the model toward the predicted class,
              while negative values push it away.
            </p>
          </div>
        </section>

        {/* RIGHT: Explanation results */}
        <section style={styles.card}>
          <div style={styles.cardHeading}>
            <div style={styles.iconBox}>
              <FileText size={19} />
            </div>

            <div>
              <h3 style={styles.cardTitle}>
                Why this prediction?
              </h3>

              <p style={styles.cardDesc}>
                SHAP feature contribution breakdown.
              </p>
            </div>
          </div>

          {!explanation ? (
            <div style={styles.placeholder}>
              <div style={styles.placeholderIcon}>
                <FileText size={30} />
              </div>

              <h4 style={styles.placeholderTitle}>
                No explanation generated
              </h4>

              <p style={styles.placeholderText}>
                Select symptoms and generate an explanation
                to see the model's feature contributions.
              </p>
            </div>
          ) : (
            <div style={styles.resultsContainer}>

              {/* Predicted disease */}
              <div style={styles.predictionBanner}>
                <div style={styles.predictionIcon}>
                  <CheckCircle size={21} />
                </div>

                <div>
                  <span style={styles.smallLabel}>
                    Random Forest predicted class
                  </span>

                  <h3 style={styles.predictedDisease}>
                    {explanation.predicted_disease}
                  </h3>
                </div>
              </div>

              {/* Matched symptoms */}
              <div style={styles.matchedSection}>
                <span style={styles.sectionLabel}>
                  Matched input symptoms
                </span>

                <div style={styles.matchedList}>
                  {explanation.input_symptoms.map((symptom) => (
                    <span key={symptom} style={styles.matchedChip}>
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contribution chart */}
              <div style={styles.chartSection}>
                <div style={styles.chartHeading}>
                  <h4 style={styles.chartTitle}>
                    Feature Contributions
                  </h4>

                  <span style={styles.chartUnit}>
                    SHAP value
                  </span>
                </div>

                {explanation.contributions.length === 0 ? (
                  <p style={styles.emptyText}>
                    No feature contributions were returned.
                  </p>
                ) : (
                  explanation.contributions.map((item, index) => {
                    const value = Number(item.shap_value);
                    const isPositive = value > 0;
                    const isNegative = value < 0;
                    const isZero = value === 0;

                    const barWidth = isZero
                      ? 0
                      : Math.max(
                          (Math.abs(value) / maxContribution) * 100,
                          2
                        );

                    return (
                      <div
                        key={`${item.feature}-${index}`}
                        style={styles.contributionItem}
                      >
                        <div style={styles.contributionHeader}>
                          <span style={styles.featureName}>
                            {item.feature}
                          </span>

                          <span
                            style={{
                              ...styles.shapValue,
                              color: isPositive
                                ? '#42B6FF'
                                : isNegative
                                  ? '#F5A623'
                                  : '#91A0B8'
                            }}
                          >
                            {value > 0 ? '+' : ''}
                            {value.toFixed(6)}
                          </span>
                        </div>

                        <div style={styles.barBackground}>
                          <div
                            style={{
                              ...styles.barFill,
                              width: `${barWidth}%`,
                              backgroundColor: isPositive
                                ? '#009DFF'
                                : isNegative
                                  ? '#F5A623'
                                  : '#566A8F'
                            }}
                          />
                        </div>

                        <div style={styles.impactRow}>
                          {isPositive ? (
                            <TrendingUp size={13} color="#42B6FF" />
                          ) : isNegative ? (
                            <TrendingDown size={13} color="#F5A623" />
                          ) : (
                            <Minus size={13} color="#91A0B8" />
                          )}

                          <span
                            style={{
                              ...styles.impactText,
                              color: isPositive
                                ? '#42B6FF'
                                : isNegative
                                  ? '#F5A623'
                                  : '#91A0B8'
                            }}
                          >
                            {item.impact}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={styles.disclaimer}>
                SHAP explanations describe the Random Forest
                component only, not the RF–XGBoost ensemble.
                This academic prototype is not a medical
                diagnostic system.
              </div>

            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    color: '#F1F5FF'
  },

  pageIntro: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '24px'
  },

  eyebrow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#42B6FF',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1.2px',
    marginBottom: '9px'
  },

  pageTitle: {
    color: '#F1F5FF',
    fontSize: '25px',
    fontWeight: '700',
    margin: '0 0 7px'
  },

  pageDescription: {
    color: '#91A0B8',
    fontSize: '13px',
    lineHeight: '1.6',
    margin: 0
  },

  modelBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '10px 13px',
    border: '1px solid #253650',
    borderRadius: '8px',
    backgroundColor: '#111D30',
    color: '#91A0B8',
    fontSize: '12px'
  },

  onlineDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#20C997'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
    gap: '20px',
    alignItems: 'start'
  },

  card: {
    minWidth: 0,
    backgroundColor: '#111D30',
    border: '1px solid #253650',
    borderRadius: '12px',
    padding: '22px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
  },

  cardHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '22px'
  },

  iconBox: {
    width: '39px',
    height: '39px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#42B6FF',
    backgroundColor: '#17243A',
    border: '1px solid #253650',
    borderRadius: '9px'
  },

  cardTitle: {
    color: '#F1F5FF',
    fontSize: '16px',
    fontWeight: '700',
    margin: '0 0 4px'
  },

  cardDesc: {
    color: '#91A0B8',
    fontSize: '12px',
    margin: 0,
    lineHeight: '1.5'
  },

  label: {
    display: 'block',
    color: '#F1F5FF',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '9px'
  },

  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '0 12px',
    height: '43px',
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px'
  },

  searchInput: {
    width: '100%',
    minWidth: 0,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#F1F5FF',
    fontSize: '13px'
  },

  suggestions: {
    marginTop: '5px',
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px',
    overflow: 'hidden',
    maxHeight: '210px',
    overflowY: 'auto'
  },

  suggestionItem: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    color: '#F1F5FF',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid #253650',
    fontSize: '12px',
    textAlign: 'left',
    cursor: 'pointer'
  },

  addSymbol: {
    color: '#42B6FF',
    fontSize: '18px'
  },

  noResults: {
    color: '#91A0B8',
    fontSize: '12px',
    margin: '10px 0'
  },

  selectedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '22px'
  },

  countBadge: {
    color: '#42B6FF',
    backgroundColor: '#17243A',
    border: '1px solid #253650',
    borderRadius: '20px',
    padding: '3px 9px',
    fontSize: '11px',
    fontWeight: '700'
  },

  selectedContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: '8px',
    minHeight: '95px',
    alignContent: 'flex-start',
    padding: '12px',
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px',
    marginBottom: '17px'
  },

  symptomChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '7px 9px',
    backgroundColor: '#17243A',
    border: '1px solid #285078',
    borderRadius: '6px',
    color: '#D9ECFF',
    fontSize: '11px'
  },

  removeButton: {
    display: 'flex',
    padding: 0,
    color: '#91A0B8',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer'
  },

  emptyText: {
    color: '#71819A',
    fontSize: '12px',
    margin: '8px 0'
  },

  actionButton: {
    width: '100%',
    minHeight: '43px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    color: '#FFFFFF',
    backgroundColor: '#1677FF',
    border: '1px solid #1677FF',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 0 12px rgba(0,157,255,0.2)'
  },

  resetButton: {
    width: '100%',
    marginTop: '9px',
    padding: '10px',
    color: '#91A0B8',
    backgroundColor: 'transparent',
    border: '1px solid #253650',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer'
  },

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    marginTop: '14px',
    padding: '11px',
    color: '#F04452',
    backgroundColor: 'rgba(240,68,82,0.08)',
    border: '1px solid rgba(240,68,82,0.5)',
    borderRadius: '8px',
    fontSize: '12px'
  },

  infoBox: {
    marginTop: '20px',
    padding: '14px',
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px'
  },

  infoHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    color: '#42B6FF',
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '8px'
  },

  infoText: {
    color: '#91A0B8',
    fontSize: '11px',
    lineHeight: '1.7',
    margin: 0
  },

  placeholder: {
    minHeight: '350px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '25px',
    backgroundColor: '#0D1525',
    border: '1px dashed #253650',
    borderRadius: '9px'
  },

  placeholderIcon: {
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#42B6FF',
    backgroundColor: '#17243A',
    borderRadius: '14px',
    marginBottom: '16px'
  },

  placeholderTitle: {
    color: '#F1F5FF',
    fontSize: '14px',
    margin: '0 0 8px'
  },

  placeholderText: {
    maxWidth: '260px',
    color: '#91A0B8',
    fontSize: '12px',
    lineHeight: '1.7',
    margin: 0
  },

  resultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '19px'
  },

  predictionBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    padding: '15px',
    backgroundColor: '#0D1525',
    border: '1px solid #1677FF',
    borderRadius: '9px'
  },

  predictionIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#42B6FF',
    backgroundColor: '#17243A',
    borderRadius: '9px'
  },

  smallLabel: {
    color: '#91A0B8',
    fontSize: '11px'
  },

  predictedDisease: {
    color: '#F1F5FF',
    fontSize: '17px',
    fontWeight: '700',
    margin: '4px 0 0',
    textTransform: 'capitalize'
  },

  matchedSection: {
    paddingBottom: '16px',
    borderBottom: '1px solid #253650'
  },

  sectionLabel: {
    display: 'block',
    color: '#91A0B8',
    fontSize: '11px',
    fontWeight: '600',
    marginBottom: '10px'
  },

  matchedList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '7px'
  },

  matchedChip: {
    padding: '6px 9px',
    color: '#42B6FF',
    backgroundColor: '#17243A',
    border: '1px solid #253650',
    borderRadius: '6px',
    fontSize: '11px'
  },

  chartSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },

  chartHeading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  chartTitle: {
    color: '#F1F5FF',
    fontSize: '14px',
    margin: 0
  },

  chartUnit: {
    color: '#71819A',
    fontSize: '10px'
  },

  contributionItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px'
  },

  contributionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px'
  },

  featureName: {
    color: '#DCE6F5',
    fontSize: '12px',
    fontWeight: '600'
  },

  shapValue: {
    fontSize: '11px',
    fontWeight: '700',
    fontVariantNumeric: 'tabular-nums'
  },

  barBackground: {
    height: '7px',
    width: '100%',
    backgroundColor: '#17243A',
    borderRadius: '10px',
    overflow: 'hidden'
  },

  barFill: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.3s ease'
  },

  impactRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },

  impactText: {
    fontSize: '10px'
  },

  disclaimer: {
    padding: '11px',
    color: '#91A0B8',
    backgroundColor: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '7px',
    fontSize: '10px',
    lineHeight: '1.6'
  }
};
