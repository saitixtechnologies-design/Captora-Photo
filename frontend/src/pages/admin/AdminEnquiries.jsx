import { useCallback, useEffect, useState } from 'react'
import { Check, Eye, Mail, MessageSquareText, Phone, Search, Trash2, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApi } from '../../admin/adminApi.js'

const formatDate = (value, options = { dateStyle: 'medium' }) => value ? new Intl.DateTimeFormat(undefined, options).format(new Date(value)) : 'Not specified'

export default function AdminEnquiries() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [viewing, setViewing] = useState(null)

  const loadItems = useCallback(async () => {
    try {
      const result = await adminApi('/admin/enquiries')
      setItems(result.items)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load once the page has rendered; state updates then happen in the request callback, not during the effect.
  useEffect(() => { Promise.resolve().then(loadItems) }, [loadItems])

  async function toggleRead(item) {
    const status = item.status === 'read' ? 'new' : 'read'
    try {
      await adminApi(`/admin/enquiries/${item.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      toast.success(status === 'read' ? 'Enquiry marked as reviewed.' : 'Enquiry marked as new.')
      if (viewing?.id === item.id) setViewing({ ...viewing, status })
      await loadItems()
    } catch (error) { toast.error(error.message) }
  }

  async function remove(item) {
    if (!window.confirm(`Delete the enquiry from ${item.name}?`)) return
    try {
      await adminApi(`/admin/enquiries/${item.id}`, { method: 'DELETE' })
      if (viewing?.id === item.id) setViewing(null)
      toast.success('Enquiry deleted.')
      await loadItems()
    } catch (error) { toast.error(error.message) }
  }

  const visible = items.filter((item) => `${item.name} ${item.email} ${item.service} ${item.location}`.toLowerCase().includes(query.trim().toLowerCase()))
  const newCount = items.filter((item) => item.status === 'new').length

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">CLIENT MESSAGES</span><h2>Enquiries</h2><p>New website enquiries appear here as soon as the form is submitted.</p></div></div>
      <section className="admin-list-panel">
        <div className="admin-list-toolbar"><div><strong>{items.length} enquiries · {newCount} new</strong><span>Sorted newest first</span></div><label className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search enquiries" /></label></div>
        {loading ? <div className="admin-empty">Loading enquiries…</div> : visible.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Client</th><th>Service</th><th>Event date</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
          {visible.map((item) => <tr key={item.id} className={item.status === 'new' ? 'admin-enquiry-new' : ''}><td><div className="admin-enquiry-client"><strong>{item.name}</strong><a href={`mailto:${item.email}`}>{item.email}</a><span>{formatDate(item.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</span></div></td><td>{item.service}</td><td>{formatDate(item.event_date)}</td><td><span className={'admin-status ' + (item.status === 'new' ? 'is-hidden' : 'is-live')}><i />{item.status === 'new' ? 'New' : 'Reviewed'}</span></td><td><div className="admin-row-actions"><button type="button" title="View enquiry" onClick={() => setViewing(item)}><Eye size={16} /></button><button type="button" title={item.status === 'new' ? 'Mark reviewed' : 'Mark new'} onClick={() => toggleRead(item)}><Check size={17} /></button><button className="is-danger" type="button" title="Delete enquiry" onClick={() => remove(item)}><Trash2 size={16} /></button></div></td></tr>)}
        </tbody></table></div> : <div className="admin-empty"><MessageSquareText size={28} /><strong>{query ? 'No enquiries match that search.' : 'No enquiries yet.'}</strong><span>When a visitor submits the website form, their message will show here.</span></div>}
      </section>
      {viewing && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewing(null) }}><section className="admin-modal admin-enquiry-modal" role="dialog" aria-modal="true" aria-labelledby="enquiry-title"><div className="admin-modal-heading"><div><span className="admin-eyebrow">WEBSITE ENQUIRY · {formatDate(viewing.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</span><h3 id="enquiry-title">{viewing.name}</h3></div><button type="button" className="admin-icon-button" onClick={() => setViewing(null)} aria-label="Close"><X size={19} /></button></div><dl className="admin-enquiry-details"><div><dt>Service</dt><dd>{viewing.service}</dd></div><div><dt>Email</dt><dd><a href={`mailto:${viewing.email}`}><Mail size={14} />{viewing.email}</a></dd></div><div><dt>Phone</dt><dd>{viewing.phone ? <a href={`tel:${viewing.phone}`}><Phone size={14} />{viewing.phone}</a> : 'Not provided'}</dd></div><div><dt>Event date</dt><dd>{formatDate(viewing.event_date)}</dd></div><div><dt>Location</dt><dd>{viewing.location || 'Not specified'}</dd></div><div className="admin-enquiry-message"><dt>Message</dt><dd>{viewing.message || 'No additional message.'}</dd></div></dl><div className="admin-modal-actions"><button className="admin-secondary-button" type="button" onClick={() => remove(viewing)}><Trash2 size={15} /> Delete</button><button className="admin-primary-button" type="button" onClick={() => toggleRead(viewing)}><Check size={15} />{viewing.status === 'new' ? 'Mark reviewed' : 'Mark as new'}</button></div></section></div>}
    </div>
  )
}
