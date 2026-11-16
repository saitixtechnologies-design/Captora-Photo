import { useCallback, useEffect, useState } from 'react'
import { Eye, EyeOff, MessageCircle, Search, Star, Trash2, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApi } from '../../admin/adminApi.js'

const formatDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

export default function AdminFeedback() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [viewing, setViewing] = useState(null)

  const loadItems = useCallback(async () => {
    try {
      const result = await adminApi('/admin/feedback')
      setItems(result.items || [])
      setViewing((current) => current ? (result.items || []).find((item) => item.id === current.id) || null : null)
    } catch (error) { toast.error(error.message) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { loadItems() }, [loadItems])

  async function toggleActive(item) {
    try {
      await adminApi(`/admin/feedback/${item.id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive: !item.is_active }) })
      toast.success(item.is_active ? 'Feedback hidden from the website.' : 'Feedback is live in the homepage testimonials.')
      await loadItems()
    } catch (error) { toast.error(error.message) }
  }
  async function remove(item) {
    if (!window.confirm(`Delete feedback from ${item.name}?`)) return
    try {
      await adminApi(`/admin/feedback/${item.id}`, { method: 'DELETE' })
      toast.success('Feedback deleted.')
      if (viewing?.id === item.id) setViewing(null)
      await loadItems()
    } catch (error) { toast.error(error.message) }
  }

  const visible = items.filter((item) => `${item.name} ${item.email} ${item.message}`.toLowerCase().includes(query.trim().toLowerCase()))
  const activeCount = items.filter((item) => item.is_active).length
  const pendingCount = items.length - activeCount
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">CLIENT WORDS</span><h2>Feedback</h2><p>Review client notes here. Only active feedback appears in the homepage testimonial section.</p></div></div>
      <section className="admin-list-panel">
        <div className="admin-list-toolbar"><div><strong>{items.length} feedback · {pendingCount} pending · {activeCount} live</strong><span>Newest first · Public display requires approval</span></div><label className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search feedback" /></label></div>
        {loading ? <div className="admin-empty">Loading feedback…</div> : visible.length ? <div className="admin-table-wrap"><table className="admin-table admin-feedback-table"><thead><tr><th>Client</th><th>Feedback</th><th>Rating</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
          {visible.map((item) => <tr key={item.id}><td><div className="admin-item-cell">{item.image_url ? <img src={item.image_url} alt="" /> : <span className="admin-feedback-avatar">{item.name?.slice(0, 1).toUpperCase()}</span>}<div><strong>{item.name}</strong>{item.email ? <a href={`mailto:${item.email}`}>{item.email}</a> : <span>No email provided</span>}<span>{formatDate(item.created_at)}</span><span>{item.public_consent ? 'Public sharing allowed' : 'No public permission'}</span></div></div></td><td className="admin-feedback-message">{item.message}</td><td><span className="admin-feedback-rating"><Star size={13} fill="currentColor" />{item.rating}/5</span></td><td><span className={'admin-status ' + (item.is_active ? 'is-live' : 'is-hidden')}><i />{item.is_active ? 'Live' : 'Pending'}</span></td><td><div className="admin-row-actions"><button type="button" title="Read feedback" onClick={() => setViewing(item)}><Eye size={16} /></button><button type="button" title={!item.public_consent ? 'Client permission is required before publishing' : item.is_active ? 'Hide from website' : 'Approve and publish'} aria-label={item.is_active ? 'Hide feedback from website' : 'Approve and publish feedback'} onClick={() => toggleActive(item)} disabled={!item.is_active && !item.public_consent}>{item.is_active ? <EyeOff size={16} /> : <Eye size={16} />}</button><button className="is-danger" type="button" title="Delete feedback" onClick={() => remove(item)}><Trash2 size={16} /></button></div></td></tr>)}
        </tbody></table></div> : <div className="admin-empty"><MessageCircle size={28} /><strong>{query ? 'No feedback matches that search.' : 'No feedback yet.'}</strong><span>Client submissions from the Feedback page will appear here for review.</span></div>}
      </section>
      {viewing && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewing(null) }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title"><div className="admin-modal-heading"><div><span className="admin-eyebrow">CLIENT FEEDBACK · {formatDate(viewing.created_at)}</span><h3 id="feedback-title">{viewing.name}</h3></div><button type="button" className="admin-icon-button" onClick={() => setViewing(null)} aria-label="Close"><X size={19} /></button></div><div className="admin-view-content"><div className="admin-feedback-rating">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} fill={index < viewing.rating ? 'currentColor' : 'none'} />)} <span>{viewing.rating} out of 5</span></div>{viewing.email && <p><strong>Email:</strong> <a href={`mailto:${viewing.email}`}>{viewing.email}</a></p>}<p className="admin-feedback-full-message">{viewing.message}</p>{viewing.image_url && <img className="admin-view-media admin-feedback-detail-image" src={viewing.image_url} alt={`Photo shared by ${viewing.name}`} />}</div><div className="admin-modal-actions"><button className="admin-secondary-button" type="button" onClick={() => remove(viewing)}><Trash2 size={15} /> Delete</button><button className="admin-primary-button" type="button" onClick={() => toggleActive(viewing)} disabled={!viewing.is_active && !viewing.public_consent}>{viewing.is_active ? <><EyeOff size={15} /> Hide from website</> : <><Eye size={15} /> Approve and publish</>}</button></div></section></div>}
    </div>
  )
}