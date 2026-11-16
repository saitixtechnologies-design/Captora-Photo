import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { ArrowUpRight, CheckCircle2, MessageCircle } from 'lucide-react'
import { getPublicServices } from '../admin/adminApi.js'
import { isValidEmail, isValidPhone } from '../utils/validation.js'

const initialForm = { name: '', email: '', phone: '', service: '', date: '', location: '', message: '' }
const fallbackServices = ['Wedding photography', 'Pre-wedding shoot', 'Portraits & editorial', 'Films', 'Food photography', 'Interior photography', 'Product photography', 'Travel photography']

function BookingForm() {
  const [form, setForm] = useState(initialForm)
  const [services, setServices] = useState(fallbackServices)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(null)

  // The service list follows Admin → Services, so new services appear here automatically.
  useEffect(() => {
    let active = true
    getPublicServices().then((items) => {
      const names = items.filter((item) => item.isActive !== false).map((item) => item.title).filter(Boolean)
      if (active && names.length) setServices(names)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const [errors, setErrors] = useState({})

  const update = (event) => {
    const { name } = event.target
    let { value } = event.target
    // Phone: numbers only (one optional + at the start for the country code).
    if (name === 'phone') value = value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '').slice(0, 16)
    setForm((previous) => ({ ...previous, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }))
  }

  function validate() {
    const found = {}
    if (!isValidEmail(form.email)) found.email = 'Enter a valid email address, like name@gmail.com.'
    if (form.phone && !isValidPhone(form.phone)) found.phone = 'Enter a valid phone number using numbers only (10 digits, or with +91).'
    setErrors(found)
    return !Object.keys(found).length
  }

  async function submit(event) {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/public/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, service: form.service || 'Something else' }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Your enquiry could not be sent. Please try again.')
      setSent(form.name.trim().split(' ')[0] || 'there')
      setForm(initialForm)
    } catch (error) {
      toast.error(error.message || 'Could not send your enquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return <div className="ct-sent" role="status">
      <CheckCircle2 size={44} strokeWidth={1.4} />
      <h3>Thank you, {sent}.</h3>
      <p>Your enquiry has reached the Captora team. We will get back to you with availability and the next steps.</p>
      <div className="ct-sent-actions">
        <a className="ct-btn ct-btn-dark" href="https://wa.me/917084861647" target="_blank" rel="noreferrer"><MessageCircle size={17} /> Chat on WhatsApp</a>
        <button type="button" className="ct-link" onClick={() => setSent(null)}>Send another enquiry</button>
      </div>
    </div>
  }

  return (
    <form className="ct-form" onSubmit={submit}>
      <fieldset>
        <legend><span>01</span> About you</legend>
        <div className="ct-row">
          <label>Your name<input name="name" value={form.name} onChange={update} placeholder="Full name" autoComplete="name" maxLength={120} required /></label>
          <label>Email address<input type="email" name="email" value={form.email} onChange={update} onBlur={() => form.email && !isValidEmail(form.email) && setErrors((current) => ({ ...current, email: 'Enter a valid email address, like name@gmail.com.' }))} placeholder="you@example.com" autoComplete="email" maxLength={254} required aria-invalid={Boolean(errors.email)} />{errors.email && <span className="ct-error">{errors.email}</span>}</label>
        </div>
        <label>Phone / WhatsApp <small>(optional, numbers only)</small><input type="tel" inputMode="tel" name="phone" value={form.phone} onChange={update} placeholder="9876543210" autoComplete="tel" maxLength={16} aria-invalid={Boolean(errors.phone)} />{errors.phone && <span className="ct-error">{errors.phone}</span>}</label>
      </fieldset>

      <fieldset>
        <legend><span>02</span> What are you planning?</legend>
        <div className="ct-chips" role="radiogroup" aria-label="Service">
          {[...services, 'Something else'].map((name) => <label key={name} className={'ct-chip' + (form.service === name ? ' is-on' : '')}>
            <input type="radio" name="service" value={name} checked={form.service === name} onChange={update} />{name}
          </label>)}
        </div>
        <div className="ct-row">
          <label>Date <small>(if you know it)</small><input type="date" name="date" value={form.date} onChange={update} /></label>
          <label>City or venue<input name="location" value={form.location} onChange={update} placeholder="Lucknow, Jaipur, Goa…" maxLength={160} /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend><span>03</span> Tell us a little more</legend>
        <label className="ct-sr-label">Your message<textarea name="message" value={form.message} onChange={update} rows={5} placeholder="The day, the people, the feeling you want to remember…" maxLength={3000} /></label>
      </fieldset>

      <div className="ct-submit">
        <button type="submit" className="ct-btn ct-btn-gold" disabled={submitting}>{submitting ? 'Sending…' : 'Send enquiry'} <ArrowUpRight size={18} /></button>
        <p>Your details are only used to reply to your enquiry.</p>
      </div>
    </form>
  )
}

export default BookingForm
