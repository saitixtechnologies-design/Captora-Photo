import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Star, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { isValidEmail } from '../utils/validation.js'
import { getPublicFeedback } from '../admin/adminApi.js'
import { sizedImage } from '../utils/media.js'
import '../../styles/signature.css'

export default function Feedback() {
  const [rating, setRating] = useState(5)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [sending, setSending] = useState(false)
  const fileRef = useRef(null)
  const formRef = useRef(null)
  const [wall, setWall] = useState([])
  useEffect(() => {
    let active = true
    getPublicFeedback().then((items) => { if (active) setWall(items.slice(0, 12)) }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  function chooseImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file.'); event.target.value = ''; return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Choose an image smaller than 10 MB.'); event.target.value = ''; return }
    if (preview) URL.revokeObjectURL(preview)
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  function removeImage() {
    if (preview) URL.revokeObjectURL(preview)
    setPreview('')
    setImage(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit(event) {
    event.preventDefault()
    if (sending) return
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()
    if (email && !isValidEmail(email)) { toast.error('Enter a valid email address, like name@gmail.com.'); return }
    formData.set('rating', String(rating))
    if (image) formData.set('image', image)
    setSending(true)
    try {
      const response = await fetch('/api/public/feedback', { method: 'POST', body: formData })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Your feedback could not be sent. Please try again.')
      toast.success('Thank you! Your feedback has been submitted for review.')
      formRef.current?.reset()
      setRating(5)
      removeImage()
    } catch (error) { toast.error(error.message) }
    finally { setSending(false) }
  }

  return (
    <div className="light-page feedback-page">
      <section className="feedback-hero wrap">
        <p className="eyebrow">A NOTE FROM YOU</p>
        <h1>Your story, <em>in your words.</em></h1>
        <p className="feedback-lede">If Captora was part of a moment that matters to you, we’d love to hear how it felt. Your words help future clients know what to expect.</p>
      </section>
      <section className="feedback-layout wrap">
        <aside className="feedback-note">
          <span className="feedback-note-index">01 / A LITTLE REFLECTION</span>
          <h2>Honest words<br />make a <em>difference.</em></h2>
          <p>Your feedback is shared with the studio first. You can choose whether Captora may feature it on the website after review.</p>
          <div className="feedback-note-contact"><span>CAPTORA PHOTOGRAPHY &amp; FILMS</span><a href="mailto:captoraphotography@gmail.com">captoraphotography@gmail.com <ArrowUpRight size={15} /></a></div>
        </aside>
        <form ref={formRef} className="feedback-form" onSubmit={submit}>
          <p className="eyebrow">CLIENT FEEDBACK</p>
          <h2>Thank you for <em>being here.</em></h2>
          <div className="feedback-form-grid">
            <label>Your name<input name="name" autoComplete="name" maxLength="120" placeholder="Full name" required /></label>
            <label>Email address <span>(optional)</span><input name="email" type="email" autoComplete="email" maxLength="254" placeholder="you@example.com" /></label>
          </div>
          <fieldset className="feedback-rating"><legend>How was your experience?</legend><div role="radiogroup" aria-label="Rating out of five stars">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} star${value === 1 ? '' : 's'}`} onClick={() => setRating(value)} className={value <= rating ? 'is-selected' : ''}><Star size={22} fill={value <= rating ? 'currentColor' : 'none'} /></button>)}</div></fieldset>
          <label className="feedback-message-label">Your feedback<textarea name="message" rows="6" maxLength="2000" placeholder="Tell us what stood out, or how the experience felt…" required /></label>
          <div className="feedback-upload-row"><div><strong>Add a photo <span>(optional)</span></strong><small>A portrait or a favourite moment · JPG, PNG, WebP · up to 10 MB</small></div><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={chooseImage} aria-label="Upload an optional photo" /></div>
          {preview && <div className="feedback-image-preview"><img src={preview} alt="Selected feedback photo preview" /><button type="button" onClick={removeImage} aria-label="Remove selected photo"><X size={16} /></button></div>}
          <label className="feedback-consent"><input name="publicConsent" type="checkbox" required /><span>I give Captora permission to display my feedback on its website if the team approves it.</span></label>
          <button className="button button-dark feedback-submit" type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send your feedback'} <ArrowUpRight size={17} /></button>
          <p className="feedback-review-note">Feedback is reviewed by the Captora team before appearing publicly.</p>
        </form>
      </section>

      {wall.length > 0 && <section className="sg-wall" aria-label="Kind words from Captora clients">
        <div className="wrap sg-wall-head"><p className="eyebrow">KIND WORDS, PINNED UP</p><h2>Notes from the people <em>we photographed.</em></h2></div>
        <div className="sg-wall-line" aria-hidden="true" />
        <div className="sg-wall-row">
          {wall.map((item, i) => <figure key={item.id || i} className="sg-note" style={{ '--sway': `${(i % 2 ? 1 : -1) * (2 + (i % 3))}deg`, '--delay': `${(i % 5) * -0.7}s` }}>
            <span className="sg-pin" aria-hidden="true" />
            {item.image_url ? <img src={sizedImage(item.image_url, 500)} alt="" loading="lazy" /> : <span className="sg-note-initial" aria-hidden="true">{(item.name || 'C').slice(0, 1)}</span>}
            <div className="sg-note-stars" aria-label={`${item.rating || 5} out of 5 stars`}>{Array.from({ length: 5 }, (_, k) => <Star key={k} size={13} fill={k < (item.rating || 5) ? 'currentColor' : 'none'} />)}</div>
            <blockquote>{item.message}</blockquote>
            <figcaption>— {item.name}</figcaption>
          </figure>)}
        </div>
      </section>}
    </div>
  )
}