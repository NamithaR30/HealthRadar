
import {
  LayoutDashboard,
  Activity,
  BrainCircuit,
  FileText,
  Network,
  Map,
  TrendingUp,
  BarChart3,
  Info
} from 'lucide-react'

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'radar-ai', label: 'Radar AI', icon: Activity },
  { id: 'prediction', label: 'Disease Prediction', icon: BrainCircuit },
  { id: 'explainable-ai', label: 'Explainable AI', icon: FileText },
  { id: 'clusters', label: 'Symptom Clusters', icon: Network },
  { id: 'outbreak-map', label: 'Outbreak Map', icon: Map },
  { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'about', label: 'About', icon: Info }
]

function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Activity size={25} />
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              title={item.label}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={21} strokeWidth={1.8} />
            </button>
          )
        })}
      </nav>

      <div className="sidebar-bottom">
        <span className="sidebar-status" title="System Online" />
      </div>
    </aside>
  )
}

export default Sidebar
