import { useEffect, useState } from 'react'
import { ImagePlus, UserRound } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApi } from '../../admin/adminApi.js'

const title = 'Abhishek Pratap Singh'
const category = 'Photographer Portrait'

export default function AdminProfilePhoto() {
  const [existing, setExisting] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const result = await adminApi('/admin/gallery')
      setExisting(result.items.find((item) => item.category?.toLowerCase() === category.toLowerCase()) || null)
    } catch (error) { toast.error(error.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview) }, [preview])

  function choosePhoto(event) {
    const selected = event.target.files?.[0] || null
    setFile(selected)
    setPreview(selected ? URL.createObjectURL(selected) : '')
    event.target.value = ''
  }

  async function save(event) {
    event.preventDefault()
    if (!file) return toast.error('Choose Abhishek’s photo first.')
    setSaving(true)
    const body = new FormData()
    body.append('title', title)
    body.append('category', category)
    body.append('location', 'Lucknow, Uttar Pradesh, India')
    body.append('mediaType', 'image')
    body.append('mediaUrl', existing?.mediaUrl || '')
    body.append('thumbnailUrl', '')
    body.append('size', 'normal')
    body.append('sortOrder', '0')
    body.append('removedImages', JSON.stringify(existing?.images || [existing?.image].filter(Boolean)))
    body.append('media', file)
    try {
      await adminApi('/admin/gallery' + (existing ? '/' + existing.id : ''), { method: existing ? 'PUT' : 'POST', body })
      if (existing && !existing.isActive) await adminApi('/admin/gallery/' + existing.id + '/status', { method: 'PATCH', body: JSON.stringify({ isActive: true }) })
      toast.success('Profile photo updated. It is now visible on the portfolio page.')
      setFile(null)
      setPreview('')
      await load()
    } catch (error) { toast.error(error.message) }
    finally { setSaving(false) }
  }

  const currentPhoto = preview || existing?.image
  return <div className="admin-page admin-profile-photo-page">
    <div className="admin-page-heading"><div><span className="admin-eyebrow">PORTFOLIO IDENTITY</span><h2>Profile photo</h2><p>Upload Abhishek’s portrait. It appears in the “Who I Am” and contact sections on the public portfolio.</p></div></div>
    <section className="admin-list-panel admin-profile-photo-panel">
      <div className="admin-profile-photo-preview">{currentPhoto ? <img src={currentPhoto} alt="Abhishek Pratap Singh profile preview" /> : <div><UserRound size={42} /><span>No profile photo uploaded</span></div>}</div>
      <form className="admin-form admin-profile-photo-form" onSubmit={save}>
        <div><span className="admin-eyebrow">ABHISHEK PRATAP SINGH · LUCKNOW</span><h3>Photographer portrait</h3><p>This image is kept separate from the public gallery and portfolio story sections.</p></div>
        <label>Choose a profile photo<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={choosePhoto} /><small>Use a clear portrait photo. JPG, PNG, WebP or AVIF.</small></label>
        <div className="admin-modal-actions"><button className="admin-primary-button" type="submit" disabled={saving || loading || !file}><ImagePlus size={16} />{saving ? 'Saving…' : existing ? 'Update profile photo' : 'Upload profile photo'}</button></div>
      </form>
    </section>
  </div>
}
