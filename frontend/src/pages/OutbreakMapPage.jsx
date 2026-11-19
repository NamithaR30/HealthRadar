
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, AlertTriangle, Filter, Activity } from 'lucide-react';

const STATUS_COLORS = {
  'High anomaly': '#F04452',
  'Moderate anomaly': '#F5A623',
  'Normal': '#20C997',
};

export default function OutbreakMapPage() {
  const [outbreakData, setOutbreakData] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    const loadOutbreaks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8000/api/outbreaks');
        const json = await res.json();
        if (!res.ok) throw new Error(json.detail || 'Failed to load outbreak data.');
        setOutbreakData(json);
        if (json.cities && json.cities.length > 0) {
          setSelectedCity(json.cities[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOutbreaks();
  }, []);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [21.5, 78.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19,
}).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const filteredCities = (outbreakData?.cities || []).filter((cityItem) => {
    const matchesDisease =
      selectedDisease === 'All' || cityItem.dominant_disease === selectedDisease;
    const matchesStatus =
      selectedStatus === 'All' || cityItem.status === selectedStatus;
    return matchesDisease && matchesStatus;
  });

  // Update markers whenever filteredCities changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredCities.forEach((cityItem) => {
      const color = STATUS_COLORS[cityItem.status] || '#009DFF';
      const marker = L.circleMarker([cityItem.latitude, cityItem.longitude], {
        radius: cityItem.status === 'High anomaly' ? 12 : cityItem.status === 'Moderate anomaly' ? 10 : 8,
        fillColor: color,
        color: '#080D18',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });

      marker.bindPopup(`
        <div style="min-width: 160px; font-family: Inter, sans-serif;">
          <strong style="font-size: 14px;">${cityItem.city}</strong><br/>
          <span>Status: <strong style="color: ${color};">${cityItem.status}</strong></span><br/>
          <span>Z-Score: <strong>${cityItem.z_score}</strong></span><br/>
          <span>Dominant: ${cityItem.dominant_disease}</span><br/>
          <span>7d Total: ${cityItem.recent_7d_total}</span>
        </div>
      `);

      marker.on('click', () => {
        setSelectedCity(cityItem);
      });

      marker.addTo(markersLayerRef.current);
    });
  }, [filteredCities]);

  const diseaseOptions = [
    'All',
    ...Array.from(new Set((outbreakData?.cities || []).map((c) => c.dominant_disease))),
  ];

  const handleFocusCity = (cityItem) => {
    setSelectedCity(cityItem);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([cityItem.latitude, cityItem.longitude], 7, {
        animate: true,
      });
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Banner & Filters */}
      <div style={styles.card}>
        <div style={styles.filterHeader}>
          <div>
            <h3 style={styles.cardTitle}>
              <MapPin size={20} color="#009DFF" />
              India Regional Outbreak Surveillance Map
            </h3>
            <p style={styles.cardDesc}>
              7-day recent reporting window compared against a 35-day baseline using Z-score analysis.
            </p>
          </div>

          <div style={styles.filtersRow}>
            <div style={styles.filterControl}>
              <Filter size={14} color="#91A0B8" />
              <select
                value={selectedDisease}
                onChange={(e) => setSelectedDisease(e.target.value)}
                style={styles.select}
              >
                {diseaseOptions.map((d) => (
                  <option key={d} value={d}>{d === 'All' ? 'All Diseases' : d}</option>
                ))}
              </select>
            </div>

            <div style={styles.filterControl}>
              <Activity size={14} color="#91A0B8" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={styles.select}
              >
                <option value="All">All Anomaly Levels</option>
                <option value="High anomaly">High anomaly (z &ge; 3)</option>
                <option value="Moderate anomaly">Moderate anomaly (1.5 &le; z &lt; 3)</option>
                <option value="Normal">Normal</option>
              </select>
            </div>
          </div>
        </div>

        {outbreakData?.disclaimer && (
          <div style={styles.disclaimerBox}>
            <AlertTriangle size={16} color="#F5A623" style={{ flexShrink: 0 }} />
            <span>{outbreakData.disclaimer}</span>
          </div>
        )}

        {error && <div style={styles.errorText}>{error}</div>}
        {loading && <div style={styles.loadingText}>Loading regional Z-score data...</div>}
      </div>

      {/* Main Map + City Inspector Split */}
      <div style={styles.mapGrid}>
        <div style={styles.mapCard}>
          <div ref={mapContainerRef} style={styles.mapCanvas} />
          <div style={styles.legendBar}>
            <span style={styles.legendItem}>
              <span style={{ ...styles.dot, backgroundColor: '#F04452' }} /> High anomaly (z &ge; 3)
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.dot, backgroundColor: '#F5A623' }} /> Moderate anomaly (1.5 &le; z &lt; 3)
            </span>
            <span style={styles.legendItem}>
              <span style={{ ...styles.dot, backgroundColor: '#20C997' }} /> Normal
            </span>
          </div>
        </div>

        <div style={styles.inspectorCard}>
          <h4 style={styles.inspectorTitle}>City Anomaly Inspector</h4>
          {selectedCity ? (
            <div style={styles.detailStack}>
              <div style={styles.cityTop}>
                <div>
                  <div style={styles.cityName}>{selectedCity.city}</div>
                  <div style={styles.diseaseSub}>Dominant: {selectedCity.dominant_disease}</div>
                </div>
                <span
                  style={{
                    ...styles.statusPill,
                    color: STATUS_COLORS[selectedCity.status] || '#009DFF',
                    borderColor: STATUS_COLORS[selectedCity.status] || '#009DFF',
                  }}
                >
                  {selectedCity.status}
                </span>
              </div>

              <div style={styles.metricRow}>
                <div style={styles.metricBox}>
                  <span style={styles.metricLabel}>Z-Score</span>
                  <span style={styles.metricVal}>{selectedCity.z_score}</span>
                </div>
                <div style={styles.metricBox}>
                  <span style={styles.metricLabel}>7d Total</span>
                  <span style={styles.metricVal}>{selectedCity.recent_7d_total}</span>
                </div>
              </div>

              <div style={styles.metricRow}>
                <div style={styles.metricBox}>
                  <span style={styles.metricLabel}>7d Avg</span>
                  <span style={styles.metricVal}>{selectedCity.recent_mean}</span>
                </div>
                <div style={styles.metricBox}>
                  <span style={styles.metricLabel}>35d Baseline Avg</span>
                  <span style={styles.metricVal}>{selectedCity.baseline_mean}</span>
                </div>
              </div>

              <div style={styles.cityListBox}>
                <div style={styles.listLabel}>Monitored Cities ({filteredCities.length})</div>
                <div style={styles.cityButtons}>
                  {filteredCities.map((c) => (
                    <button
                      key={c.city}
                      onClick={() => handleFocusCity(c)}
                      style={{
                        ...styles.cityBtn,
                        borderColor: selectedCity.city === c.city ? '#009DFF' : '#253650',
                        color: selectedCity.city === c.city ? '#009DFF' : '#F1F5FF',
                      }}
                    >
                      {c.city} ({c.z_score})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p style={styles.cardDesc}>Select a marker on the map to inspect city metrics.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#111D30', border: '1px solid #253650', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
  filterHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#F1F5FF', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' },
  cardDesc: { fontSize: '13px', color: '#91A0B8' },
  filtersRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  filterControl: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0D1525', border: '1px solid #253650', borderRadius: '8px', padding: '6px 12px' },
  select: { backgroundColor: 'transparent', color: '#F1F5FF', border: 'none', fontSize: '13px', outline: 'none', cursor: 'pointer' },
  disclaimerBox: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(245, 166, 35, 0.1)', border: '1px solid #F5A623', color: '#F1F5FF', padding: '12px', borderRadius: '8px', fontSize: '12px' },
  errorText: { color: '#F04452', fontSize: '13px', marginTop: '10px' },
  loadingText: { color: '#009DFF', fontSize: '13px', marginTop: '10px' },
  mapGrid: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' },
  mapCard: { backgroundColor: '#111D30', border: '1px solid #253650', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  mapCanvas: { width: '100%', height: '460px', zIndex: 1 },
  legendBar: { display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '12px 18px', backgroundColor: '#0D1525', borderTop: '1px solid #253650', fontSize: '12px', color: '#91A0B8' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' },
  inspectorCard: { backgroundColor: '#111D30', border: '1px solid #253650', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  inspectorTitle: { fontSize: '16px', fontWeight: '700', color: '#F1F5FF' },
  detailStack: { display: 'flex', flexDirection: 'column', gap: '16px' },
  cityTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', backgroundColor: '#0D1525', border: '1px solid #253650', padding: '14px', borderRadius: '8px' },
  cityName: { fontSize: '17px', fontWeight: '700', color: '#F1F5FF' },
  diseaseSub: { fontSize: '12px', color: '#91A0B8', marginTop: '2px' },
  statusPill: { fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '12px', border: '1px solid', backgroundColor: '#111D30', whiteSpace: 'nowrap' },
  metricRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  metricBox: { backgroundColor: '#0D1525', border: '1px solid #253650', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  metricLabel: { fontSize: '11px', color: '#91A0B8' },
  metricVal: { fontSize: '18px', fontWeight: '700', color: '#009DFF' },
  cityListBox: { display: 'flex', flexDirection: 'column', gap: '8px' },
  listLabel: { fontSize: '11px', color: '#91A0B8', textTransform: 'uppercase', letterSpacing: '0.4px' },
  cityButtons: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  cityBtn: { backgroundColor: '#0D1525', border: '1px solid #253650', borderRadius: '6px', padding: '5px 9px', fontSize: '12px', cursor: 'pointer' },
};
