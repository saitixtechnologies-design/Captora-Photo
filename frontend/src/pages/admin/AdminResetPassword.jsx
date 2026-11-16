import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApi } from '../../admin/adminApi.js'

export default function AdminResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (password.length < 12) return toast.error('Use at least 12 characters for your new password.')
    if (password !== confirmation) return toast.error('The passwords do not match.')
    setBusy(true)
    try {
      const result = await adminApi('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) })
      toast.success(result.message)
      navigate('/admin/login', { replace: true })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-auth-page admin-auth-single">
      <section className="admin-auth-panel"><div className="admin-auth-card">
        <div className="admin-auth-mobile-brand"><LockKeyhole size={18} /> captora<span>.</span></div>
        <span className="admin-auth-kicker">SET A NEW PASSWORD</span><h2>Make it secure.</h2>
        <p className="admin-auth-subtitle">Choose a new password with at least 12 characters.</p>
        {token ? <form onSubmit={handleSubmit} className="admin-auth-form">
          <label>New password<span className="admin-password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          <label>Confirm password<input type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
          <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? 'Updating…' : 'Update password'} {!busy && <ArrowRight size={17} />}</button>
        </form> : <p className="admin-inline-error">This reset link is missing its token. Request a new link to continue.</p>}
        <Link className="admin-back-link" to="/admin/login"><ArrowLeft size={15} /> Back to sign in</Link>
      </div></section>
    </main>
  )
}
