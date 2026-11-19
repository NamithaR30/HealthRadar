
import React, { useEffect, useState } from 'react';
import {
  Activity, Send, Bot, User, X, Plus, ArrowRight, AlertCircle
} from 'lucide-react';

const API = 'http://127.0.0.1:8000';

export default function NlpAssistantPage() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I'm Radar AI. Describe your symptoms naturally."
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [result, setResult] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    fetch(`${API}/api/symptoms-list`)
      .then(res => res.json())
      .then(data => setSymptoms(data.symptoms || []))
      .catch(err => console.error(err));
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const text = input.trim();

    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInput('');
    setLoading(true);
    setParsed(null);
    setResult(null);

    try {
      const response = await fetch(`${API}/api/nlp/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Parsing failed');

      setParsed(data);

      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `Analysis complete. Found ${data.extracted_symptoms.length} active symptoms. Please review the extracted features.`
        }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: `Error: ${error.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const removeSymptom = (symptom) => {
    setParsed(prev => ({
      ...prev,
      extracted_symptoms: prev.extracted_symptoms.filter(s => s !== symptom)
    }));
    setResult(null);
  };

  const addSymptom = () => {
    if (!selected || !parsed) return;

    setParsed(prev => ({
      ...prev,
      extracted_symptoms: prev.extracted_symptoms.includes(selected)
        ? prev.extracted_symptoms
        : [...prev.extracted_symptoms, selected]
    }));

    setSelected('');
    setResult(null);
  };

  const runPrediction = async () => {
    if (!parsed?.extracted_symptoms.length || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${API}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: parsed.extracted_symptoms })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Prediction failed');

      setResult(data);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: `Error: ${error.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.grid}>
      <section style={s.card}>
        <h2 style={s.heading}>
          <Activity color="#009DFF" /> Radar AI Symptom Assistant
        </h2>
        <p style={s.muted}>Describe your symptoms in natural language.</p>

        <div style={s.chat}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                ...s.bubble,
                background: msg.sender === 'user' ? '#009DFF' : '#17243A'
              }}>
                {msg.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
                {msg.text}
              </div>
            </div>
          ))}
          {loading && <p style={s.muted}>Processing...</p>}
        </div>

        <form onSubmit={sendMessage} style={s.form}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe your symptoms..."
            style={s.input}
            disabled={loading}
          />
          <button style={s.button} disabled={loading}>
            <Send size={17} />
          </button>
        </form>
      </section>

      <section style={s.card}>
        <h2 style={s.heading}>Structured Feature Extraction</h2>
        <p style={s.muted}>Review and edit extracted symptoms.</p>

        {!parsed ? (
          <div style={s.empty}>Your extracted symptoms will appear here.</div>
        ) : (
          <>
            <div style={s.meta}>
              <span>Duration: <strong>{parsed.duration}</strong></span>
              <span>Severity: <strong>{parsed.severity}</strong></span>
            </div>

            <h4 style={s.section}>Active Symptoms</h4>
            <div style={s.chips}>
              {parsed.extracted_symptoms.map(symptom => (
                <span key={symptom} style={s.chip}>
                  {symptom.replaceAll('_', ' ')}
                  <button onClick={() => removeSymptom(symptom)} style={s.remove}>
                    <X size={13} />
                  </button>
                </span>
              ))}
              {parsed.extracted_symptoms.length === 0 && (
                <span style={s.muted}>No active symptoms detected.</span>
              )}
            </div>

            <h4 style={s.section}>Add Symptom</h4>
            <div style={s.form}>
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
                style={s.input}
              >
                <option value="">Select symptom</option>
                {symptoms.map(symptom => (
                  <option key={symptom} value={symptom}>{symptom}</option>
                ))}
              </select>
              <button type="button" onClick={addSymptom} style={s.button}>
                <Plus size={17} />
              </button>
            </div>

            {parsed.negated_symptoms.length > 0 && (
              <>
                <h4 style={{ ...s.section, color: '#F04452' }}>
                  Negated Symptoms
                </h4>
                <div style={s.chips}>
                  {parsed.negated_symptoms.map(symptom => (
                    <span key={symptom} style={s.negated}>
                      {symptom.replaceAll('_', ' ')} ✕
                    </span>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={runPrediction}
              disabled={loading || !parsed.extracted_symptoms.length}
              style={{ ...s.predict, opacity: parsed.extracted_symptoms.length ? 1 : 0.5 }}
            >
              Run Screening <ArrowRight size={17} />
            </button>

            {result && (
              <div style={s.result}>
                <h4 style={{ color: '#20C997' }}>Experimental Model Predictions</h4>
                {result.top_predictions.map((p, i) => (
                  <div key={i} style={s.prediction}>
                    <span>{i + 1}. {p.disease}</span>
                    <strong>{p.confidence}%</strong>
                  </div>
                ))}
                <p style={s.muted}>Experimental output only. Not a medical diagnosis.</p>
              </div>
            )}
          </>
        )}

        <p style={s.notice}>
          <AlertCircle size={15} />
          NLP extracts symptoms; it does not diagnose diseases.
        </p>
      </section>
    </div>
  );
}

const s = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '24px'
  },
  card: {
    background: '#111D30',
    border: '1px solid #253650',
    borderRadius: '12px',
    padding: '24px',
    minWidth: 0
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#F1F5FF',
    fontSize: '18px'
  },
  muted: { color: '#91A0B8', fontSize: '13px' },
  chat: {
    height: '350px',
    overflowY: 'auto',
    background: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px',
    padding: '14px',
    margin: '18px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  bubble: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    maxWidth: '85%',
    padding: '12px',
    borderRadius: '8px',
    color: '#F1F5FF',
    fontSize: '13px',
    lineHeight: 1.5
  },
  form: { display: 'flex', gap: '8px' },
  input: {
    flex: 1,
    minWidth: 0,
    background: '#0D1525',
    border: '1px solid #253650',
    borderRadius: '8px',
    padding: '11px',
    color: '#F1F5FF'
  },
  button: {
    background: '#009DFF',
    color: 'white',
    border: 0,
    borderRadius: '8px',
    padding: '10px 14px',
    cursor: 'pointer'
  },
  empty: {
    height: '300px',
    display: 'grid',
    placeItems: 'center',
    color: '#91A0B8'
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    background: '#0D1525',
    padding: '12px',
    borderRadius: '8px',
    color: '#91A0B8',
    fontSize: '12px'
  },
  section: {
    color: '#91A0B8',
    fontSize: '12px',
    margin: '20px 0 10px',
    textTransform: 'uppercase'
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    background: '#17243A',
    border: '1px solid #009DFF',
    color: '#42B6FF',
    padding: '6px 9px',
    borderRadius: '6px',
    fontSize: '12px'
  },
  remove: {
    background: 'transparent',
    border: 0,
    color: '#F04452',
    cursor: 'pointer'
  },
  negated: {
    color: '#F04452',
    border: '1px solid #F04452',
    padding: '6px 9px',
    borderRadius: '6px',
    fontSize: '12px'
  },
  predict: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '13px',
    marginTop: '22px',
    background: '#009DFF',
    color: 'white',
    border: 0,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600
  },
  result: {
    marginTop: '18px',
    padding: '14px',
    background: '#0D1525',
    border: '1px solid #20C997',
    borderRadius: '8px'
  },
  prediction: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    color: '#F1F5FF',
    fontSize: '12px',
    padding: '8px 0'
  },
  notice: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    color: '#91A0B8',
    fontSize: '11px',
    marginTop: '20px'
  }
};
