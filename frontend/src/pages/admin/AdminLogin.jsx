import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { ArrowRight, Camera, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAdminAuth } from '../../admin/useAdminAuth.js'

export default function AdminLogin() {
  const { user, login, loading } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!loading && user) return <Navigate to="/admin" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await login(email, password)
      toast.success('Welcome back.')
      navigate('/admin', { replace: true })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-art">
        <div className="admin-auth-brand"><Camera size={20} /> captora<span>.</span></div>
        <div className="admin-auth-art-copy"><span>CAPTORA STUDIO · ADMIN</span><h1>Keep every<br />story in <em>focus.</em></h1><p>One calm place to shape the services and stories your clients discover.</p></div>
        <div className="admin-auth-art-footer"><span>PHOTOGRAPHY & FILMS</span><span>LUCKNOW · WORLDWIDE</span></div>
      </section>
      <section className="admin-auth-panel">
        <div className="admin-auth-card">
          <div className="admin-auth-mobile-brand"><Camera size={18} /> captora<span>.</span></div>
          <span className="admin-auth-kicker"><ShieldCheck size={15} /> SECURE STUDIO ACCESS</span>
          <h2>Welcome back.</h2>
          <p className="admin-auth-subtitle">Sign in to manage your website content.</p>
          <form onSubmit={handleSubmit} className="admin-auth-form">
            <label>Email address<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@captora.studio" required /></label>
            <label>Password<span className="admin-password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            <div className="admin-auth-row"><span>Protected administrator account</span><Link to="/admin/forgot-password">Forgot password?</Link></div>
            <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} {!busy && <ArrowRight size={17} />}</button>
          </form>
          <p className="admin-auth-footnote">Your session is encrypted and expires automatically.</p>
        </div>
      </section>
    </main>
  )
}
