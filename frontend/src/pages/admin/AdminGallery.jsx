import { useCallback, useEffect, useState } from 'react'
import { Edit3, Eye, Images, Plus, Search, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApi } from '../../admin/adminApi.js'
import { getDrivePhotoUrl, getYouTubeEmbedUrl, getVideoPoster } from '../../utils/youtube.js'

const emptyForm = { title: '', category: 'Wedding', location: '', mediaType: 'image', mediaUrl: '', thumbnailUrl: '', size: 'normal', sortOrder: 0 }

export default function AdminGallery({ mode = 'gallery' }) {
  const isPortfolio = mode === 'portfolio'
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [customCategory, setCustomCategory] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [mediaFiles, setMediaFiles] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [removedImages, setRemovedImages] = useState([])
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [saving, setSaving] = useState(false)

  const loadItems = useCallback(async () => {
    try { const [gallery, result] = await Promise.all([adminApi('/admin/gallery'), adminApi('/admin/gallery/categories')]); setItems(gallery.items); setCategories(result.items) }
    catch (error) { toast.error(error.message) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    let active = true
    Promise.all([adminApi('/admin/gallery'), adminApi('/admin/gallery/categories')]).then(([gallery, result]) => { if (active) { setItems(gallery.items); setCategories(result.items) } }).catch((error) => { if (active) toast.error(error.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  useEffect(() => () => {
    mediaPreview.split('|').filter((url) => url.startsWith('blob:')).forEach((url) => URL.revokeObjectURL(url))
    if (thumbnailPreview.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview)
  }, [mediaPreview, thumbnailPreview])

  function openForm(item = null) {
    setFormOpen(true)
    setEditing(item)
    setMediaFiles([])
    setExistingImages(item?.type === 'image' ? (item.images || [item.image]).filter(Boolean) : [])
    setRemovedImages([])
    setMediaPreview('')
    setCustomCategory(false)
    setThumbnailFile(null)
    setForm(item ? { title: item.title, category: item.category, location: item.location || '', mediaType: item.type, mediaUrl: item.mediaUrl, thumbnailUrl: item.thumbnail || '', size: item.size || 'normal', sortOrder: item.sortOrder || 0 } : emptyForm)
  }
  function closeForm() { setFormOpen(false); setEditing(null); setMediaFiles([]); setExistingImages([]); setRemovedImages([]); setThumbnailFile(null); setMediaPreview(''); setThumbnailPreview(''); setForm(emptyForm) }
  function chooseMedia(event) {
    const selected = Array.from(event.target.files || [])
    const capacity = form.mediaType === 'image' ? Math.max(10 - existingImages.length, 0) : 1
    const combined = [...mediaFiles, ...selected].filter((file, index, files) => files.findIndex((candidate) => candidate.name === file.name && candidate.size === file.size && candidate.lastModified === file.lastModified) === index)
    const files = combined.slice(0, capacity)
    if (combined.length > capacity) toast.error(form.mediaType === 'image' ? `Only ${capacity} more photo${capacity === 1 ? '' : 's'} can be added. A story allows up to 10 photos.` : 'Upload one video per story.')
    setMediaFiles(files)
    setMediaPreview(files.map((file) => URL.createObjectURL(file)).join('|'))
    event.target.value = ''
  }

  function removeExistingPhoto(index) {
    const removed = existingImages[index]
    const remaining = existingImages.filter((_, imageIndex) => imageIndex !== index)
    setExistingImages(remaining)
    setRemovedImages((current) => [...new Set([...current, removed])])
    setForm((current) => ({ ...current, mediaUrl: current.mediaUrl === removed ? (remaining[0] || '') : current.mediaUrl }))
  }

  function removeSelectedPhoto(index) {
    const remaining = mediaFiles.filter((_, fileIndex) => fileIndex !== index)
    setMediaFiles(remaining)
    setMediaPreview(remaining.map((file) => URL.createObjectURL(file)).join('|'))
  }
  function chooseThumbnail(event) {
    const file = event.target.files?.[0] || null
    setThumbnailFile(file)
    setThumbnailPreview(file ? URL.createObjectURL(file) : '')
  }
  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }

  async function save(event) {
    event.preventDefault()
    if (editing && editing.type !== form.mediaType && !mediaFiles.length && form.mediaUrl === editing.mediaUrl) return toast.error('Choose a new file when changing the media type.')
    setSaving(true)
    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => body.append(key, String(value)))
    mediaFiles.forEach((file) => body.append('media', file))
    body.append('removedImages', JSON.stringify(removedImages))
    if (thumbnailFile) body.append('thumbnail', thumbnailFile)
    try {
      await adminApi('/admin/gallery' + (editing ? '/' + editing.id : ''), { method: editing ? 'PUT' : 'POST', body })
      toast.success(editing ? 'Gallery item updated.' : 'Gallery item published.')
      closeForm()
      await loadItems()
    } catch (error) { toast.error(error.message) }
    finally { setSaving(false) }
  }

  async function toggleStatus(item) {
    try { await adminApi('/admin/gallery/' + item.id + '/status', { method: 'PATCH', body: JSON.stringify({ isActive: !item.isActive }) }); toast.success(item.isActive ? 'Gallery item hidden from the website.' : 'Gallery item is live on the website.'); await loadItems() }
    catch (error) { toast.error(error.message) }
  }
  async function remove(item) {
    if (!window.confirm('Delete “' + item.title + '” permanently?')) return
    try { await adminApi('/admin/gallery/' + item.id, { method: 'DELETE' }); toast.success('Gallery item deleted.'); await loadItems() }
    catch (error) { toast.error(error.message) }
  }

  const portfolioSections = ['Portfolio Highlights', 'Food & Beverage', 'Travel', 'Wedding', 'Interior', 'Street', 'Product', 'Behind the Scenes', 'Films', 'Photographer Portrait', 'Portraits', 'Pre-Wedding']
  const defaultCategories = isPortfolio ? portfolioSections : ['Wedding', 'Pre-Wedding', 'Portraits', 'Travel', 'Food', 'Food & Beverage', 'Interior', 'Street', 'Product', 'Films', 'Behind the Scenes']
  const categoryOptions = [...new Set([...categories, ...items.map((item) => item.category).filter(Boolean), ...defaultCategories])].sort((a, b) => a.localeCompare(b))
  const visible = items.filter((item) => (item.title + ' ' + item.category).toLowerCase().includes(query.trim().toLowerCase()))
  const previewFile = mediaPreview
  const previewImage = getDrivePhotoUrl(thumbnailPreview || form.thumbnailUrl || (form.mediaType === 'image' ? form.mediaUrl : ''), 1200)

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">{isPortfolio ? 'PORTFOLIO SECTIONS' : 'PHOTOGRAPHS & FILMS'}</span><h2>{isPortfolio ? 'Portfolio' : 'Gallery'}</h2><p>{isPortfolio ? 'Choose a section and add photos or films. Active work appears in the matching section on your Portfolio page.' : 'Add a photo or a short film. Active media appears in the public gallery.'}</p></div><button className="admin-primary-button admin-heading-button" type="button" onClick={() => openForm()}><Plus size={17} /> {isPortfolio ? 'Add portfolio work' : 'Add media'}</button></div>
      <section className="admin-list-panel">
        <div className="admin-list-toolbar"><div><strong>{items.length} gallery items</strong><span>Videos preview muted and looped in the gallery</span></div><label className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search gallery" /></label></div>
        {loading ? <div className="admin-empty">Loading your gallery…</div> : visible.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Story</th><th>Type</th><th>Status</th><th>Order</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
          {visible.map((item) => <tr key={item.id}><td><div className="admin-item-cell admin-gallery-cell">{item.type === 'video' ? (getYouTubeEmbedUrl(item.video) ? <img src={getVideoPoster(item)} alt="" /> : <video src={item.video} poster={getVideoPoster(item) || undefined} muted autoPlay loop playsInline />) : <img src={item.image} alt="" />}<div><strong>{item.title}</strong><span>{item.category}{item.location ? ' · ' + item.location : ''}</span></div></div></td><td><span className="admin-media-type">{item.type === 'image' ? `${(item.images || []).length || 1} photo${((item.images || []).length || 1) === 1 ? '' : 's'}` : 'video'}</span></td><td><span className={'admin-status ' + (item.isActive ? 'is-live' : 'is-hidden')}><i />{item.isActive ? 'Active' : 'Inactive'}</span></td><td>{String(item.sortOrder).padStart(2, '0')}</td><td><div className="admin-row-actions"><button type="button" title="View gallery item" onClick={() => setViewing(item)}><Eye size={16} /></button><button type="button" title={item.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggleStatus(item)}>{item.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</button><button type="button" title="Edit gallery item" onClick={() => openForm(item)}><Edit3 size={16} /></button><button className="is-danger" type="button" title="Delete gallery item" onClick={() => remove(item)}><Trash2 size={16} /></button></div></td></tr>)}
        </tbody></table></div> : <div className="admin-empty"><Images size={28} /><strong>{query ? 'No gallery items match that search.' : 'Your gallery is waiting for its first story.'}</strong><span>{isPortfolio ? 'Upload work into a section to show it on the Portfolio page.' : 'Upload a photograph or video to make it available on the website.'}</span>{!query && <button className="admin-secondary-button" type="button" onClick={() => openForm()}><Plus size={16} /> Add media</button>}</div>}
      </section>
      {viewing && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewing(null) }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="gallery-view-title"><div className="admin-modal-heading"><div><span className="admin-eyebrow">WEBSITE GALLERY</span><h3 id="gallery-view-title">{viewing.title}</h3></div><button type="button" className="admin-icon-button" onClick={() => setViewing(null)} aria-label="Close"><X size={19} /></button></div><div className="admin-view-content">{viewing.type === 'video' ? (getYouTubeEmbedUrl(viewing.video) ? <iframe className="admin-view-media admin-view-embed" src={getYouTubeEmbedUrl(viewing.video)} title={viewing.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <video className="admin-view-media" src={viewing.video} poster={getVideoPoster(viewing) || undefined} controls playsInline />) : <div className="admin-form-preview admin-multi-preview">{(viewing.images || [viewing.image]).map((src, index) => <img key={src + index} src={src} alt={`${viewing.title} photo ${index + 1}`} />)}</div>}<p>{viewing.category}{viewing.location ? ' · ' + viewing.location : ''}</p><div className="admin-view-meta"><span className={'admin-status ' + (viewing.isActive ? 'is-live' : 'is-hidden')}><i />{viewing.isActive ? 'Visible on website' : 'Hidden from website'}</span><span>{viewing.type === 'image' ? `${(viewing.images || []).length || 1} photos` : 'video'} · Order {String(viewing.sortOrder).padStart(2, '0')}</span></div></div><div className="admin-modal-actions"><button className="admin-secondary-button" type="button" onClick={() => setViewing(null)}>Close</button><button className="admin-primary-button" type="button" onClick={() => { const item = viewing; setViewing(null); openForm(item) }}><Edit3 size={15} /> Edit item</button></div></section></div>}
      {formOpen && <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm() }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="gallery-modal-title"><div className="admin-modal-heading"><div><span className="admin-eyebrow">WEBSITE GALLERY</span><h3 id="gallery-modal-title">{editing ? 'Edit gallery item' : 'Add gallery media'}</h3></div><button type="button" className="admin-icon-button" onClick={closeForm} aria-label="Close"><X size={19} /></button></div>
        <form className="admin-form" onSubmit={save}><label>Story title<input name="title" value={form.title} onChange={updateField} maxLength={160} required placeholder="The Beginning of Forever" /></label><div className="admin-form-row"><label>Category<select value={customCategory ? '__new__' : form.category} onChange={(event) => { const value = event.target.value; setCustomCategory(value === '__new__'); setForm((current) => ({ ...current, category: value === '__new__' ? '' : value })) }} required={!customCategory}><option value="" disabled>Select a category</option>{categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}<option value="__new__">+ Add a new category</option></select>{customCategory && <input name="category" value={form.category} onChange={updateField} maxLength={80} required autoFocus placeholder="Enter category name" />}</label><label>Location<input name="location" value={form.location} onChange={updateField} maxLength={160} placeholder="Lucknow, India" /></label></div><div className="admin-form-row"><label>Media type<select name="mediaType" value={form.mediaType} onChange={(event) => { setForm((current) => ({ ...current, mediaType: event.target.value })); setMediaFiles([]); setMediaPreview('') }}><option value="image">Photograph</option><option value="video">Video</option></select></label><label>Grid size<select name="size" value={form.size} onChange={updateField}><option value="normal">Standard</option><option value="wide">Wide</option><option value="tall">Tall</option></select></label></div><div className="admin-form-row"><label>{form.mediaType === 'video' ? 'Video file' : 'Photos (up to 10)'}<input type="file" accept={form.mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/avif'} multiple={form.mediaType === 'image'} onChange={chooseMedia} disabled={form.mediaType === 'image' && existingImages.length + mediaFiles.length >= 10} required={!editing && !form.mediaUrl && !mediaFiles.length} />{form.mediaType === 'video' && mediaFiles[0] && <small>Selected: {mediaFiles[0].name}</small>}</label><label>Display order<input name="sortOrder" type="number" min="0" value={form.sortOrder} onChange={updateField} /></label></div><label>Or use a media URL<input name="mediaUrl" type="url" value={form.mediaUrl} onChange={updateField} placeholder={form.mediaType === 'video' ? 'Paste a YouTube or direct video URL (https://youtu.be/…)' : 'https://…'} /></label>{form.mediaType === 'video' && <small>Paste a YouTube link or a direct MP4/WebM URL. YouTube videos play in the website viewer.</small>}{form.mediaType === 'video' && <label>Video poster image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={chooseThumbnail} /><small>Optional. Without a poster, the video itself previews in the gallery.</small></label>}{form.mediaType === 'image' && <small>{existingImages.length + mediaFiles.length}/10 photos selected. New selections are added to this story.</small>}{form.mediaType === 'image' && (existingImages.length > 0 || mediaFiles.length > 0) && <div className="admin-form-preview admin-multi-preview">{existingImages.map((src, index) => <div className="admin-selected-photo" key={'saved-' + src + index}><img src={src} alt={'Saved gallery photo ' + (index + 1)} /><button type="button" onClick={() => removeExistingPhoto(index)} aria-label={'Remove saved photo ' + (index + 1)}>×</button></div>)}{mediaPreview.split('|').filter(Boolean).map((src, index) => <div className="admin-selected-photo" key={src}><img src={src} alt={'New gallery photo ' + (index + 1)} /><button type="button" onClick={() => removeSelectedPhoto(index)} aria-label={'Remove selected photo ' + (index + 1)}>×</button></div>)}</div>}{form.mediaType === 'video' && previewFile && <div className="admin-form-preview"><video src={previewFile.split('|')[0]} autoPlay muted loop playsInline /></div>}{form.mediaType === 'video' && !previewFile && getYouTubeEmbedUrl(form.mediaUrl) && <div className="admin-form-preview"><img src={getVideoPoster({ video: form.mediaUrl })} alt="YouTube video preview" /></div>}{form.mediaType === 'image' && !existingImages.length && !mediaFiles.length && previewImage && <div className="admin-form-preview"><img src={previewImage} alt="Gallery preview" /></div>}<div className="admin-modal-actions"><button className="admin-secondary-button" type="button" onClick={closeForm}>Cancel</button><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Publish to gallery'}</button></div></form>
      </section></div>}
    </div>
  )
}
