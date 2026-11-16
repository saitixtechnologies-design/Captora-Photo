// Shared building blocks for the admin page editors (Homepage, Portfolio).
import { useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, Film, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApi } from './adminApi.js'
import { sizedImage } from '../utils/media.js'
import { getVideoPoster } from '../utils/youtube.js'

export function Field({ label, hint, value, onChange, multiline, rows = 4, placeholder, type = 'text' }) {
  return <label className="apf-field">
    <span>{label}</span>
    {multiline
      ? <textarea rows={rows} value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      : <input type={type} value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(type === 'number' ? Number(event.target.value) : event.target.value)} />}
    {hint && <small>{hint}</small>}
  </label>
}

export function Select({ label, value, onChange, options, hint }) {
  return <label className="apf-field">
    <span>{label}</span>
    <select value={value ?? ''} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
    {hint && <small>{hint}</small>}
  </label>
}

export function Toggle({ label, checked, onChange }) {
  return <label className="apf-toggle"><input type="checkbox" checked={checked !== false} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>
}

const acceptFor = {
  image: 'image/jpeg,image/png,image/webp,image/avif',
  video: 'video/mp4,video/webm,video/quicktime',
}

// Upload a photo or a video (or paste a link). `uploadPath` receives the file as `fieldName`.
export function MediaField({ label, hint, value, onChange, uploadPath, fieldName = 'file', kind = 'image', allowLink = false }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  async function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    const body = new FormData()
    body.append(fieldName, file)
    try {
      const { url } = await adminApi(uploadPath, { method: 'POST', body })
      onChange(url)
      toast.info(`${kind === 'video' ? 'Video' : 'Photo'} uploaded. Click “Save changes” to publish it.`)
    } catch (error) { toast.error(error.message) }
    finally { setBusy(false) }
  }
  const preview = kind === 'video' ? getVideoPoster({ video: value }) : value
  return <div className="apf-photo">
    <span className="apf-photo-label">{label}</span>
    <div className="apf-photo-row">
      <div className="apf-photo-preview">
        {kind === 'video' && value && !preview?.startsWith('http') ? <video src={value} muted playsInline preload="metadata" /> : preview ? <img src={sizedImage(preview, 400)} alt="" /> : kind === 'video' ? <Film size={22} /> : <ImagePlus size={22} />}
      </div>
      <div className="apf-photo-actions">
        <input ref={input} type="file" accept={acceptFor[kind]} hidden onChange={upload} />
        <button type="button" className="admin-secondary-button" disabled={busy} onClick={() => input.current?.click()}>{kind === 'video' ? <Film size={15} /> : <ImagePlus size={15} />}{busy ? 'Uploading…' : value ? `Replace ${kind}` : `Upload ${kind}`}</button>
        {allowLink && <input className="apf-link-input" placeholder={kind === 'video' ? 'or paste a YouTube / Drive / video link' : 'or paste a photo link'} value={value?.startsWith('/api/') ? '' : value || ''} onChange={(event) => onChange(event.target.value)} />}
        {value && <button type="button" className="apf-link-button" onClick={() => onChange('')}><X size={14} /> Remove</button>}
        {hint && <small>{hint}</small>}
      </div>
    </div>
  </div>
}

export function Panel({ title, subtitle, children, aside, show, onShow }) {
  return <section className={'apf-panel' + (show === false ? ' is-off' : '')}>
    <header>
      <div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>
      <div className="apf-panel-aside">
        {onShow && <Toggle label={show === false ? 'Hidden on site' : 'Shown on site'} checked={show} onChange={onShow} />}
        {aside}
      </div>
    </header>
    <div className="apf-panel-body">{children}</div>
  </section>
}

// A list of cards that can be added, edited, deleted, re-ordered and switched active/inactive.
export function ItemList({ items = [], onChange, renderItem, makeItem, addLabel = 'Add item', itemLabel = (item) => item.title || item.name || item.text || 'Item', max = 40 }) {
  const update = (index, next) => onChange(items.map((item, i) => (i === index ? next : item)))
  function move(index, step) {
    const target = index + step
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  function remove(index) {
    if (!window.confirm(`Delete “${itemLabel(items[index])}”? This cannot be undone after you save.`)) return
    onChange(items.filter((_, i) => i !== index))
  }
  return <div className="apf-items">
    {items.map((item, index) => {
      const active = item.active !== false
      return <div className={'apf-section' + (active ? '' : ' is-hidden')} key={item.id || index}>
        <div className="apf-section-head">
          <strong>{String(index + 1).padStart(2, '0')} · {itemLabel(item)}</strong>
          <div className="apf-section-tools">
            <button type="button" className={'apf-status' + (active ? ' is-on' : '')} onClick={() => update(index, { ...item, active: !active })}>{active ? <Eye size={14} /> : <EyeOff size={14} />}{active ? 'Active' : 'Inactive'}</button>
            <button type="button" className="admin-icon-button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={15} /></button>
            <button type="button" className="admin-icon-button" aria-label="Move down" disabled={index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} /></button>
            <button type="button" className="admin-icon-button" aria-label="Delete" onClick={() => remove(index)}><Trash2 size={15} /></button>
          </div>
        </div>
        {renderItem(item, (patch) => update(index, { ...item, ...patch }), index)}
      </div>
    })}
    {items.length < max && <button type="button" className="admin-secondary-button apf-add" onClick={() => onChange([...items, makeItem()])}><Plus size={15} /> {addLabel}</button>}
  </div>
}
