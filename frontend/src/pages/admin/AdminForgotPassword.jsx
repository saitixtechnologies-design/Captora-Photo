import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApi } from '../../admin/adminApi.js'

export default function AdminForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [devResetUrl, setDevResetUrl] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await adminApi('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
      setSent(true)
      setDevResetUrl(result.devResetUrl || '')
      toast.success('Reset instructions requested.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-auth-page admin-auth-single">
      <section className="admin-auth-panel">
        <div className="admin-auth-card">
          <div className="admin-auth-mobile-brand"><Mail size={18} /> captora<span>.</span></div>
          <span className="admin-auth-kicker">ACCOUNT RECOVERY</span>
          <h2>{sent ? 'Check your inbox.' : 'Forgot password?'}</h2>
          <p className="admin-auth-subtitle">{sent ? 'If the address matches an administrator account, you will receive a reset link.' : 'Enter your administrator email and we’ll send a secure reset link.'}</p>
          {!sent ? (
            <form onSubmit={handleSubmit} className="admin-auth-form">
              <label>Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@captora.studio" required /></label>
              <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'} {!busy && <ArrowRight size={17} />}</button>
            </form>
          ) : devResetUrl && <a className="admin-dev-reset-link" href={devResetUrl}>Open the development reset link <ArrowRight size={15} /></a>}
          <Link className="admin-back-link" to="/admin/login"><ArrowLeft size={15} /> Back to sign in</Link>
        </div>
      </section>
    </main>
  )
}
