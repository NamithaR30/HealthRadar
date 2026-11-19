
import {
  LayoutDashboard,
  Activity,
  BrainCircuit,
  FileText,
  Network,
  Map,
  TrendingUp,
  BarChart3,
  Info,
} from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'radar-ai', label: 'Radar AI', icon: Activity },
  { id: 'prediction', label: 'Disease Prediction', icon: BrainCircuit },
  { id: 'explainable-ai', label: 'Explainable AI', icon: FileText },
  { id: 'clusters', label: 'Symptom Clusters', icon: Network },
  { id: 'outbreak-map', label: 'Outbreak Map', icon: Map },
  { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'about', label: 'About', icon: Info },
];

function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside style={styles.sidebar}>

      {/* Logo */}
      <div style={styles.logo}>
        <Activity size={27} color="#009DFF" strokeWidth={2.2} />
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              title={item.label}
              aria-label={item.label}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.activeItem : {}),
              }}
            >
              <Icon
                size={21}
                strokeWidth={1.8}
                color={isActive ? '#009DFF' : '#91A0B8'}
              />
            </button>
          );
        })}
      </nav>

      {/* System Status */}
      <div style={styles.bottom}>
        <span style={styles.statusDot} title="System Online" />
      </div>

    </aside>
  );
}

const styles = {
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '72px',
    backgroundColor: '#0D1525',
    borderRight: '1px solid #253650',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1000,
    boxSizing: 'border-box',
  },

  logo: {
    width: '100%',
    height: '76px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottom: '1px solid #253650',
    flexShrink: 0,
  },

  nav: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '9px',
    width: '100%',
    paddingTop: '24px',
    flex: 1,
  },

  navItem: {
    width: '46px',
    height: '46px',
    border: '1px solid transparent',
    borderRadius: '10px',
    backgroundColor: 'transparent',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: 0,
  },

  activeItem: {
    backgroundColor: 'rgba(0, 157, 255, 0.12)',
    border: '1px solid rgba(0, 157, 255, 0.35)',
    boxShadow: '0 0 12px rgba(0, 157, 255, 0.12)',
  },

  bottom: {
    width: '100%',
    height: '65px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderTop: '1px solid #253650',
    flexShrink: 0,
  },

  statusDot: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    backgroundColor: '#20C997',
    boxShadow: '0 0 10px rgba(32, 201, 151, 0.6)',
  },
};

export default Sidebar;
