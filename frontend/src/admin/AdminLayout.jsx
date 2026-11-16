import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Camera, House, LayoutDashboard, LogOut, Menu, X, Images, Sparkles, MessageSquareText, PanelsTopLeft, UserRound, MessageCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAdminAuth } from './useAdminAuth.js'

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/home', label: 'Homepage', icon: House },
  { to: '/admin/services', label: 'Services', icon: Sparkles },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/portfolio', label: 'Portfolio', icon: PanelsTopLeft },
  { to: '/admin/profile-photo', label: 'Profile Photo', icon: UserRound },
  { to: '/admin/enquiries', label: 'Enquiries', icon: MessageSquareText },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageCircle },
]

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const title = links.find((link) => link.to === location.pathname)?.label || 'Overview'

  async function handleLogout() {
    try { await logout() } catch { toast.error('Could not end the session cleanly.') }
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      {menuOpen && <button className="admin-scrim" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className={'admin-sidebar' + (menuOpen ? ' is-open' : '')}>
        <NavLink to="/admin" className="admin-brand" onClick={() => setMenuOpen(false)}>
          <span className="admin-brand-mark"><Camera size={18} /></span>
          <span>captora<span>.</span><small>STUDIO ADMIN</small></span>
        </NavLink>
        <p className="admin-nav-label">MANAGE STUDIO</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => 'admin-nav-link' + (isActive ? ' is-active' : '')}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <span className="admin-online-dot" /> Website content is live
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-mobile-menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="admin-topbar-title"><span>STUDIO CONTROL</span><h1>{title}</h1></div>
          <div className="admin-topbar-user"><span className="admin-avatar">{(user?.email || 'A').slice(0, 1).toUpperCase()}</span><div><strong>{user?.name || 'Administrator'}</strong><small>{user?.email}</small></div></div>
          <button className="admin-logout" type="button" onClick={handleLogout}><LogOut size={16} /><span>Sign out</span></button>
        </header>
        <main className="admin-content"><Outlet /></main>
      </div>
    </div>
  )
}
