import { useCallback, useEffect, useState } from 'react'
import { Edit3, Eye, ImagePlus, Plus, Search, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApi } from '../../admin/adminApi.js'

const emptyForm = { title: '', description: '', detail: '', imageUrl: '', mediaType: 'image', sortOrder: 0 }

export default function AdminServices() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [removedImages, setRemovedImages] = useState([])
  const [saving, setSaving] = useState(false)

  const loadItems = useCallback(async () => {
    try { const result = await adminApi('/admin/services'); setItems(result.items) }
    catch (error) { toast.error(error.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let active = true
    adminApi('/admin/services').then((result) => { if (active) setItems(result.items) }).catch((error) => { if (active) toast.error(error.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  useEffect(() => () => imagePreviews.filter((url) => url.startsWith('blob:')).forEach((url) => URL.revokeObjectURL(url)), [imagePreviews])

  function openForm(item = null) {
    setFormOpen(true)
    setEditing(item)
    setImageFiles([])
    setImagePreviews([])
    setExistingImages(item?.mediaType === 'image' ? (item.images || [item.image]).filter(Boolean) : [])
    setRemovedImages([])
    setForm(item ? { title: item.title, description: item.description, detail: item.detail || '', imageUrl: '', mediaType: item.mediaType || 'image', sortOrder: item.sortOrder || 0 } : emptyForm)
  }
  function closeForm() { setFormOpen(false); setEditing(null); setImageFiles([]); setImagePreviews([]); setExistingImages([]); setRemovedImages([]); setForm(emptyForm) }
  function chooseMedia(event) {
    const selected = Array.from(event.target.files || [])
    const limit = form.mediaType === 'video' ? 1 : Math.max(10 - existingImages.length, 0)
    const combined = form.mediaType === 'video' ? selected.slice(0, 1) : [...imageFiles, ...selected].filter((file, index, files) => files.findIndex((candidate) => candidate.name === file.name && candidate.size === file.size && candidate.lastModified === file.lastModified) === index).slice(0, limit)
    if (combined.length < (form.mediaType === 'video' ? selected.length : [...imageFiles, ...selected].length)) toast.error(form.mediaType === 'video' ? 'Choose one video.' : `A service can contain up to 10 photos. ${Math.max(10 - existingImages.length - imageFiles.length, 0)} more can be selected.`)
    setImageFiles(combined)
    setImagePreviews(combined.map((file) => URL.createObjectURL(file)))
    event.target.value = ''
  }
  function removeExistingPhoto(index) { const removed = existingImages[index]; const remaining = existingImages.filter((_, photoIndex) => photoIndex !== index); setExistingImages(remaining); setRemovedImages((current) => [...new Set([...current, removed])]); setForm((current) => ({ ...current, imageUrl: current.imageUrl === removed ? (remaining[0] || '') : current.imageUrl })) }
  function removeSelectedPhoto(index) { const remaining = imageFiles.filter((_, fileIndex) => fileIndex !== index); setImageFiles(remaining); setImagePreviews(remaining.map((file) => URL.createObjectURL(file))) }
  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }

  async function save(event) {
    event.preventDefault()
    if (editing && editing.mediaType !== form.mediaType && !imageFiles.length && !form.imageUrl) return toast.error('Choose new media when changing the media type.')
    setSaving(true)
    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => body.append(key, String(value)))
    imageFiles.forEach((file) => body.append(form.mediaType === 'video' ? 'video' : 'image', file))
    body.append('removedImages', JSON.stringify(removedImages))
    try {
      await adminApi('/admin/services' + (editing ? '/' + editing.id : ''), { method: editing ? 'PUT' : 'POST', body })
      toast.success(editing ? 'Service updated.' : 'Service published.')
      closeForm()
      await loadItems()
    } catch (error) { toast.error(error.message) }
    finally { setSaving(false) }
  }

  async function toggleStatus(item) {
    try { await adminApi('/admin/services/' + item.id + '/status', { method: 'PATCH', body: JSON.stringify({ isActive: !item.isActive }) }); toast.success(item.isActive ? 'Service hidden from the website.' : 'Service is live on the website.'); await loadItems() }
    catch (error) { toast.error(error.message) }
  }
  async function remove(item) {
    if (!window.confirm('Delete “' + item.title + '” permanently?')) return
    try { await adminApi('/admin/services/' + item.id, { method: 'DELETE' }); toast.success('Service deleted.'); await loadItems() }
    catch (error) { toast.error(error.message) }
  }

  const visible = items.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()))
  const previewImages = form.mediaType === 'image' ? [...existingImages, ...imagePreviews] : []
  const videoPreview = imagePreviews[0] || form.imageUrl || (editing?.mediaType === 'video' ? editing.image : '')
  const needsMedia = !editing || editing.mediaType !== form.mediaType

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">SERVICES ON YOUR WEBSITE</span><h2>Services</h2><p>Create and maintain the photography and film services clients can explore.</p></div><button className="admin-primary-button admin-heading-button" type="button" onClick={() => openForm()}><Plus size={17} /> Add service</button></div>
      <section className="admin-list-panel">
        <div className="admin-list-toolbar"><div><strong>{items.length} services</strong><span>Only active services appear publicly</span></div><label className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services" /></label></div>
        {loading ? <div className="admin-empty">Loading your services…</div> : visible.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Service</th><th>Details</th><th>Status</th><th>Order</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
          {visible.map((item) => <tr key={item.id}><td><div className="admin-item-cell">{item.mediaType === 'video' ? <video src={item.video || item.image} muted autoPlay loop playsInline /> : <img src={item.image} alt="" />}<div><strong>{item.title}</strong><span>{item.description}</span></div></div></td><td className="admin-detail-cell">{item.detail || '—'}</td><td><span className={'admin-status ' + (item.isActive ? 'is-live' : 'is-hidden')}><i />{item.isActive ? 'Active' : 'Inactive'}</span></td><td>{String(item.sortOrder).padStart(2, '0')}</td><td><div className="admin-row-actions"><button type="button" title="View service" onClick={() => setViewing(item)}><Eye size={16} /></button><button type="button" title={item.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggleStatus(item)}>{item.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</button><button type="button" title="Edit service" onClick={() => openForm(item)}><Edit3 size={16} /></button><button className="is-danger" type="button" title="Delete service" onClick={() => remove(item)}><Trash2 size={16} /></button></div></td></tr>)}
        </tbody></table></div> : <div className="admin-empty"><ImagePlus size={28} /><strong>{query ? 'No services match that search.' : 'Your services start here.'}</strong><span>Add your first service and it will be ready to show on your website.</span>{!query && <button className="admin-secondary-button" type="button" onClick={() => openForm()}><Plus size={16} /> Add a service</button>}</div>}
      </section>
      {viewing && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewing(null) }}><section className="admin-modal admin-view-modal" role="dialog" aria-modal="true" aria-labelledby="service-view-title"><div className="admin-modal-heading"><div><span className="admin-eyebrow">WEBSITE SERVICE</span><h3 id="service-view-title">{viewing.title}</h3></div><button type="button" className="admin-icon-button" onClick={() => setViewing(null)} aria-label="Close"><X size={19} /></button></div><div className="admin-view-content">{viewing.mediaType === 'video' ? <video className="admin-view-media" src={viewing.video || viewing.image} controls playsInline /> : <img className="admin-view-media" src={(viewing.images || [viewing.image])[0]} alt={viewing.title} />}<p>{viewing.description}</p>{viewing.detail && <p>{viewing.detail}</p>}<div className="admin-view-meta"><span className={'admin-status ' + (viewing.isActive ? 'is-live' : 'is-hidden')}><i />{viewing.isActive ? 'Visible on website' : 'Hidden from website'}</span><span>{viewing.mediaType === 'video' ? 'Video' : (viewing.images || [viewing.image]).length + ' photos'} · Order {String(viewing.sortOrder).padStart(2, '0')}</span></div></div><div className="admin-modal-actions"><button className="admin-secondary-button" type="button" onClick={() => setViewing(null)}>Close</button><button className="admin-primary-button" type="button" onClick={() => { const item = viewing; setViewing(null); openForm(item) }}><Edit3 size={15} /> Edit service</button></div></section></div>}
      {formOpen && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm() }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="service-modal-title"><div className="admin-modal-heading"><div><span className="admin-eyebrow">WEBSITE SERVICE</span><h3 id="service-modal-title">{editing ? 'Edit service' : 'Add a service'}</h3></div><button type="button" className="admin-icon-button" onClick={closeForm} aria-label="Close"><X size={19} /></button></div>
        <form className="admin-form" onSubmit={save}><label>Service name<input name="title" value={form.title} onChange={updateField} maxLength={120} required placeholder="Wedding Stories" /></label><label>Description<textarea name="description" value={form.description} onChange={updateField} maxLength={1200} rows={3} required placeholder="Describe what clients can expect…" /></label><label>Coverage details<input name="detail" value={form.detail} onChange={updateField} maxLength={500} placeholder="Full-day coverage · Curated online gallery" /></label><div className="admin-form-row"><label>Display order<input name="sortOrder" type="number" min="0" value={form.sortOrder} onChange={updateField} /></label><label>Service media<select name="mediaType" value={form.mediaType} onChange={(event) => { setForm((current) => ({ ...current, mediaType: event.target.value, imageUrl: '' })); setImageFiles([]); setImagePreviews([]); setExistingImages([]); setRemovedImages([]) }}><option value="image">Photos</option><option value="video">Video</option></select><input type="file" accept={form.mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/avif'} multiple={form.mediaType === 'image'} onChange={chooseMedia} disabled={form.mediaType === 'image' && existingImages.length + imageFiles.length >= 10} required={needsMedia && !form.imageUrl && !imageFiles.length} /><small>{form.mediaType === 'video' ? 'Upload one video.' : `Up to 10 photos total. New selections add to the current set (${existingImages.length + imageFiles.length}/10).`}</small></label></div>{form.mediaType === 'video' && <label>Or use a video URL<input name="imageUrl" type="url" value={form.imageUrl} onChange={updateField} placeholder="https://…" /></label>}{form.mediaType === 'image' && <label>Or use one image URL<input name="imageUrl" type="url" value={form.imageUrl} onChange={updateField} placeholder="https://…" /></label>}{form.mediaType === 'video' && videoPreview && <div className="admin-form-preview"><video src={videoPreview} muted autoPlay loop playsInline /></div>}{form.mediaType === 'image' && previewImages.length > 0 && <div className="admin-form-preview admin-multi-preview">{existingImages.map((src, index) => <div className="admin-selected-photo" key={'saved-' + src + index}><img src={src} alt={'Saved service photo ' + (index + 1)} /><button type="button" onClick={() => removeExistingPhoto(index)} aria-label={'Remove saved photo ' + (index + 1)}>×</button></div>)}{imagePreviews.map((src, index) => <div className="admin-selected-photo" key={src + index}><img src={src} alt={'New service photo ' + (index + 1)} /><button type="button" onClick={() => removeSelectedPhoto(index)} aria-label={'Remove selected photo ' + (index + 1)}>×</button></div>)}</div>}<div className="admin-modal-actions"><button className="admin-secondary-button" type="button" onClick={closeForm}>Cancel</button><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Publish service'}</button></div></form>
      </section></div>}
    </div>
  )
}
