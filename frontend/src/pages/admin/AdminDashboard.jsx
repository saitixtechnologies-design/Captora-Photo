import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Images, Sparkles, CircleCheck, Plus } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApi } from '../../admin/adminApi.js'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [busy, setBusy] = useState(true)
  useEffect(() => {
    adminApi('/admin/dashboard').then((result) => setStats(result.stats)).catch((error) => toast.error(error.message)).finally(() => setBusy(false))
  }, [])

  const cards = [
    { label: 'Services', total: stats?.services ?? 0, active: stats?.activeServices ?? 0, icon: Sparkles, to: '/admin/services', color: 'sand' },
    { label: 'Gallery stories', total: stats?.gallery ?? 0, active: stats?.activeGallery ?? 0, icon: Images, to: '/admin/gallery', color: 'rose' },
  ]

  return (
    <div className="admin-page">
      <div className="admin-welcome"><div><span className="admin-eyebrow">YOUR STUDIO, AT A GLANCE</span><h2>Good to see you.</h2><p>Keep your services and stories current. Changes go straight to your website.</p></div><div className="admin-welcome-stamp"><CircleCheck size={17} /><span>CONTENT SYNC<br /><strong>CONNECTED</strong></span></div></div>
      <div className="admin-stats-grid">
        {cards.map(({ label, total, active, icon: Icon, to, color }) => <Link className="admin-stat-card" to={to} key={label}><span className={'admin-stat-icon ' + color}><Icon size={20} /></span><span className="admin-stat-label">{label}</span><strong>{busy ? '—' : total}</strong><span className="admin-stat-meta">{busy ? 'Loading…' : active + ' active on website'}<ArrowRight size={15} /></span></Link>)}
      </div>
      <section className="admin-quick-panel"><div><span className="admin-eyebrow">QUICK ACTIONS</span><h3>What would you like to update?</h3><p>Publish a new service or add a story to the gallery.</p></div><div className="admin-quick-actions"><Link to="/admin/services" className="admin-secondary-button"><Plus size={17} /> Add a service</Link><Link to="/admin/gallery" className="admin-secondary-button"><Plus size={17} /> Add gallery media</Link></div></section>
      <p className="admin-dashboard-note">Inactive items stay saved in your admin and are hidden from the public website.</p>
    </div>
  )
}
