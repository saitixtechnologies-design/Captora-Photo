import { useEffect, useState } from 'react'
import { ExternalLink, RotateCcw, Save } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApi } from '../../admin/adminApi.js'
import { Field, ItemList, MediaField, Panel, Select, Toggle } from '../../admin/editorKit.jsx'
import { setIn } from '../../admin/setIn.js'
import { defaultHomeContent, mergeHomeContent, stepIcons, uid } from '../../data/homeContent.js'
import '../../admin/admin-portfolio.css'

const uploadPath = '/admin/page-content/home/media'
const Photo = (props) => <MediaField uploadPath={uploadPath} kind="image" {...props} />
const Video = (props) => <MediaField uploadPath={uploadPath} kind="video" allowLink {...props} />
const titleHint = 'New line = new line. Put *words in stars* to show them in gold italics.'

export default function AdminHome() {
  const [content, setContent] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    adminApi('/admin/page-content/home')
      .then((result) => { setContent(mergeHomeContent(result.content, defaultHomeContent)); setUpdatedAt(result.updatedAt) })
      .catch((error) => { toast.error(error.message); setContent(mergeHomeContent(null, defaultHomeContent)) })
  }, [])

  useEffect(() => {
    if (!dirty) return undefined
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const set = (...path) => (value) => { setContent((current) => setIn(current, path, value)); setDirty(true) }

  async function save() {
    setSaving(true)
    try {
      const result = await adminApi('/admin/page-content/home', { method: 'PUT', body: JSON.stringify({ content }) })
      setContent(mergeHomeContent(result.content, defaultHomeContent))
      setUpdatedAt(result.updatedAt)
      setDirty(false)
      toast.success('Homepage updated. The changes are live.')
    } catch (error) { toast.error(error.message) }
    finally { setSaving(false) }
  }

  function restore() {
    if (!window.confirm('Put back the original homepage text, slides and lists? Files you uploaded here are removed when you save.')) return
    setContent(structuredClone(defaultHomeContent))
    setDirty(true)
  }

  if (!content) return <div className="admin-page"><div className="admin-loading"><span />Loading the homepage</div></div>
  const { hero, marquee, intro, work, categories, film, services, process, reviews, clients } = content

  return <div className="admin-page apf-page">
    <div className="admin-page-heading">
      <div><span className="admin-eyebrow">HOMEPAGE</span><h2>Homepage</h2><p>Every section of the homepage: slides, videos, photos, text and buttons. Switch any section or item on or off, and save to publish.</p></div>
      <a className="admin-secondary-button admin-heading-button" href="/" target="_blank" rel="noreferrer"><ExternalLink size={16} /> View homepage</a>
    </div>

    <div className="apf-editor">
      <Panel title="1 · Hero (top of the page)" subtitle="Full-screen photos that change slowly, or one background video." show={hero.show} onShow={set('hero', 'show')}>
        <div className="apf-grid">
          <Select label="Background" value={hero.mode} onChange={set('hero', 'mode')} options={[{ value: 'slides', label: 'Photo slideshow' }, { value: 'video', label: 'Background video' }]} />
          <Field label="Seconds per photo" type="number" value={hero.slideSeconds} onChange={set('hero', 'slideSeconds')} />
          <Field label="Small line above the title" value={hero.eyebrow} onChange={set('hero', 'eyebrow')} />
        </div>
        <Field label="Title" hint={titleHint} multiline rows={2} value={hero.title} onChange={set('hero', 'title')} />
        <Field label="Text under the title" multiline rows={2} value={hero.text} onChange={set('hero', 'text')} />
        <div className="apf-grid">
          <Field label="Gold button — text" value={hero.primaryLabel} onChange={set('hero', 'primaryLabel')} />
          <Field label="Gold button — link" hint="A page like /portfolio or a full web link." value={hero.primaryLink} onChange={set('hero', 'primaryLink')} />
          <Field label="Outline button — text" value={hero.secondaryLabel} onChange={set('hero', 'secondaryLabel')} />
          <Field label="Outline button — link" value={hero.secondaryLink} onChange={set('hero', 'secondaryLink')} />
        </div>
        <div className="apf-grid">
          <Toggle label="Show camera details (REC, timecode)" checked={hero.showHud} onChange={set('hero', 'showHud')} />
          <Field label="Camera text, top right" value={hero.hudRight} onChange={set('hero', 'hudRight')} />
        </div>
        {hero.mode === 'video'
          ? <div className="apf-grid">
            <Video label="Background video" hint="Upload an MP4 / WebM / MOV, or paste a YouTube or Drive link. Plays muted on a loop." value={hero.video} onChange={set('hero', 'video')} />
            <Photo label="Cover photo while the video loads" value={hero.videoPoster} onChange={set('hero', 'videoPoster')} />
          </div>
          : <>
            <span className="apf-photo-label">Slides</span>
            <ItemList items={hero.slides} onChange={set('hero', 'slides')} addLabel="Add slide" itemLabel={(slide) => slide.label || 'Slide'}
              makeItem={() => ({ id: uid('slide'), active: true, image: '', label: '' })}
              renderItem={(slide, patch) => <div className="apf-grid">
                <Photo label="Photo" hint="Wide landscape photo, at least 1920px wide." value={slide.image} onChange={(image) => patch({ image })} />
                <Field label="Caption (bottom right)" value={slide.label} onChange={(label) => patch({ label })} />
              </div>} />
          </>}
      </Panel>

      <Panel title="2 · Moving words strip" show={marquee.show} onShow={set('marquee', 'show')}>
        <ItemList items={marquee.words} onChange={set('marquee', 'words')} addLabel="Add word" itemLabel={(word) => word.text || 'Word'}
          makeItem={() => ({ id: uid('word'), active: true, text: '' })}
          renderItem={(word, patch) => <Field label="Word or phrase" value={word.text} onChange={(text) => patch({ text })} />} />
      </Panel>

      <Panel title="3 · About intro" show={intro.show} onShow={set('intro', 'show')}>
        <div className="apf-grid">
          <Field label="Small line" value={intro.eyebrow} onChange={set('intro', 'eyebrow')} />
          <Field label="Photo badge" value={intro.badge} onChange={set('intro', 'badge')} />
          <Field label="Signature" value={intro.signature} onChange={set('intro', 'signature')} />
          <Field label="Link text" value={intro.linkLabel} onChange={set('intro', 'linkLabel')} />
          <Field label="Link goes to" value={intro.linkTo} onChange={set('intro', 'linkTo')} />
          <Field label="Second link text" hint="Leave empty to hide it." value={intro.secondLinkLabel} onChange={set('intro', 'secondLinkLabel')} />
          <Field label="Second link goes to" value={intro.secondLinkTo} onChange={set('intro', 'secondLinkTo')} />
        </div>
        <Field label="Title" hint={titleHint} multiline rows={2} value={intro.title} onChange={set('intro', 'title')} />
        <Field label="Text" hint="Leave an empty line between paragraphs." multiline rows={6} value={intro.body} onChange={set('intro', 'body')} />
        <Photo label="Photo" hint="Empty = the Profile Photo from the admin." value={intro.photo} onChange={set('intro', 'photo')} />
      </Panel>

      <Panel title="4 · Selected work (sliding photos)" show={work.show} onShow={set('work', 'show')}>
        <div className="apf-grid">
          <Field label="Small line" value={work.eyebrow} onChange={set('work', 'eyebrow')} />
          <Select label="Photos come from" value={work.source} onChange={set('work', 'source')} options={[{ value: 'gallery', label: 'Latest gallery photos (automatic)' }, { value: 'custom', label: 'My own list below' }]} />
          {work.source === 'gallery' && <Field label="How many gallery photos" type="number" value={work.galleryCount} onChange={set('work', 'galleryCount')} />}
        </div>
        <Field label="Title" hint={titleHint} multiline rows={2} value={work.title} onChange={set('work', 'title')} />
        <Field label="Last card text" hint={titleHint} multiline rows={2} value={work.moreLabel} onChange={set('work', 'moreLabel')} />
        {work.source === 'custom' && <ItemList items={work.items} onChange={set('work', 'items')} addLabel="Add photo"
          makeItem={() => ({ id: uid('work'), active: true, image: '', title: '', category: '', link: '/portfolio' })}
          renderItem={(item, patch) => <div className="apf-grid">
            <Photo label="Photo" hint="Portrait (tall) photos look best." value={item.image} onChange={(image) => patch({ image })} />
            <Field label="Title" value={item.title} onChange={(title) => patch({ title })} />
            <Field label="Category" value={item.category} onChange={(category) => patch({ category })} />
            <Field label="Link" value={item.link} onChange={(link) => patch({ link })} />
          </div>} />}
      </Panel>

      <Panel title="5 · Categories" subtitle="An empty photo uses the first gallery photo whose category matches the name." show={categories.show} onShow={set('categories', 'show')}>
        <div className="apf-grid">
          <Field label="Small line" value={categories.eyebrow} onChange={set('categories', 'eyebrow')} />
          <Field label="Title" hint={titleHint} value={categories.title} onChange={set('categories', 'title')} />
        </div>
        <ItemList items={categories.items} onChange={set('categories', 'items')} addLabel="Add category"
          makeItem={() => ({ id: uid('cat'), active: true, name: '', image: '', link: '/portfolio' })}
          renderItem={(item, patch) => <div className="apf-grid">
            <Photo label="Photo" value={item.image} onChange={(image) => patch({ image })} />
            <Field label="Name" value={item.name} onChange={(name) => patch({ name })} />
            <Field label="Link" value={item.link} onChange={(link) => patch({ link })} />
          </div>} />
      </Panel>

      <Panel title="6 · Featured film" subtitle="Empty video = the first video in the gallery." show={film.show} onShow={set('film', 'show')}>
        <div className="apf-grid">
          <Field label="Small line" value={film.eyebrow} onChange={set('film', 'eyebrow')} />
          <Field label="Film title" hint="Empty = the gallery video’s title." value={film.title} onChange={set('film', 'title')} />
          <Field label="Button text" value={film.buttonLabel} onChange={set('film', 'buttonLabel')} />
        </div>
        <div className="apf-grid">
          <Video label="Film" value={film.video} onChange={set('film', 'video')} />
          <Photo label="Cover photo" hint="Empty = the video’s own thumbnail." value={film.poster} onChange={set('film', 'poster')} />
        </div>
      </Panel>

      <Panel title="7 · Services" subtitle="The service cards come from Admin → Services." show={services.show} onShow={set('services', 'show')}>
        <div className="apf-grid">
          <Field label="Small line" value={services.eyebrow} onChange={set('services', 'eyebrow')} />
          <Field label="Title" hint={titleHint} value={services.title} onChange={set('services', 'title')} />
          <Field label="Link text" value={services.linkLabel} onChange={set('services', 'linkLabel')} />
          <Field label="How many services" type="number" value={services.count} onChange={set('services', 'count')} />
        </div>
      </Panel>

      <Panel title="8 · How it works" show={process.show} onShow={set('process', 'show')}>
        <div className="apf-grid">
          <Field label="Small line" value={process.eyebrow} onChange={set('process', 'eyebrow')} />
          <Field label="Title" hint={titleHint} value={process.title} onChange={set('process', 'title')} />
        </div>
        <ItemList items={process.steps} onChange={set('process', 'steps')} addLabel="Add step" max={8}
          makeItem={() => ({ id: uid('step'), active: true, icon: 'camera', title: '', text: '' })}
          renderItem={(step, patch) => <>
            <div className="apf-grid">
              <Field label="Step title" value={step.title} onChange={(title) => patch({ title })} />
              <Select label="Icon" value={step.icon} onChange={(icon) => patch({ icon })} options={stepIcons} />
            </div>
            <Field label="Text" multiline rows={2} value={step.text} onChange={(text) => patch({ text })} />
          </>} />
      </Panel>

      <Panel title="9 · Reviews" subtitle="Reviews come from Admin → Feedback (only approved ones are shown)." show={reviews.show} onShow={set('reviews', 'show')}>
        <div className="apf-grid">
          <Field label="Small line" value={reviews.eyebrow} onChange={set('reviews', 'eyebrow')} />
          <Field label="Title" hint={titleHint} value={reviews.title} onChange={set('reviews', 'title')} />
        </div>
      </Panel>

      <Panel title="10 · Client logos" show={clients.show} onShow={set('clients', 'show')}>
        <Field label="Small line" value={clients.eyebrow} onChange={set('clients', 'eyebrow')} />
        <Photo label="Logos image" value={clients.image} onChange={set('clients', 'image')} />
        <Field label="Image description (for search engines and screen readers)" multiline rows={2} value={clients.alt} onChange={set('clients', 'alt')} />
      </Panel>

      <div className="apf-savebar">
        <span>{dirty ? 'You have unsaved changes.' : updatedAt ? 'All changes saved.' : 'Showing the default homepage. Save once to start editing it live.'}</span>
        <button type="button" className="apf-link-button" onClick={restore}><RotateCcw size={14} /> Restore original</button>
        <button type="button" className="admin-primary-button" disabled={saving || (!dirty && Boolean(updatedAt))} onClick={save}><Save size={16} />{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </div>
  </div>
}
