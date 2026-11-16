import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ExternalLink, Images, PanelsTopLeft, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { adminApi } from '../../admin/adminApi.js'
import { defaultPortfolioContent, mergePortfolioContent, newSection, sectionLayouts } from '../../data/portfolioContent.js'
import { Field, MediaField, Panel, Toggle } from '../../admin/editorKit.jsx'
import { setIn } from '../../admin/setIn.js'
import AdminGallery from './AdminGallery.jsx'
import '../../admin/admin-portfolio.css'

// Photos for this page upload through the portfolio endpoint.
const PhotoField = (props) => <MediaField uploadPath="/admin/portfolio-content/photo" fieldName="image" kind="image" {...props} />

export default function AdminPortfolio() {
  const [tab, setTab] = useState('content')
  const [content, setContent] = useState(null)
  const [categories, setCategories] = useState([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    adminApi('/admin/portfolio-content')
      .then((result) => { setContent(mergePortfolioContent(result.content)); setUpdatedAt(result.updatedAt) })
      .catch((error) => { toast.error(error.message); setContent(mergePortfolioContent(null)) })
    adminApi('/admin/gallery/categories').then((result) => setCategories(result.items)).catch(() => {})
  }, [tab])

  useEffect(() => {
    if (!dirty) return undefined
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const update = (path) => (value) => { setContent((current) => setIn(current, path, value)); setDirty(true) }

  function moveSection(index, step) {
    const target = index + step
    if (target < 0 || target >= content.sections.length) return
    const sections = [...content.sections]
    ;[sections[index], sections[target]] = [sections[target], sections[index]]
    update(['sections'])(sections)
  }
  function removeSection(index) {
    if (!window.confirm(`Remove the “${content.sections[index].title}” section from the page? Its photos stay in Photos & films.`)) return
    update(['sections'])(content.sections.filter((_, i) => i !== index))
  }
  function resetText() {
    if (!window.confirm('Put back the original text and layout? Photos you uploaded here will be cleared when you save.')) return
    setContent(structuredClone(defaultPortfolioContent))
    setDirty(true)
  }

  async function save() {
    setSaving(true)
    try {
      const result = await adminApi('/admin/portfolio-content', { method: 'PUT', body: JSON.stringify({ content }) })
      setContent(mergePortfolioContent(result.content))
      setUpdatedAt(result.updatedAt)
      setDirty(false)
      toast.success('Portfolio page updated. The changes are live.')
    } catch (error) { toast.error(error.message) }
    finally { setSaving(false) }
  }

  function switchTab(next) {
    if (next === tab) return
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) return
    setDirty(false)
    setTab(next)
  }

  return <div className="admin-page apf-page">
    <div className="admin-page-heading">
      <div><span className="admin-eyebrow">PORTFOLIO PAGE</span><h2>Portfolio</h2><p>Edit every heading, paragraph and photo on the public Portfolio page. Section photos and films are added under “Photos &amp; films”.</p></div>
      <a className="admin-secondary-button admin-heading-button" href="/portfolio" target="_blank" rel="noreferrer"><ExternalLink size={16} /> View page</a>
    </div>

    <div className="apf-tabs" role="tablist">
      <button type="button" role="tab" aria-selected={tab === 'content'} className={tab === 'content' ? 'is-active' : ''} onClick={() => switchTab('content')}><PanelsTopLeft size={16} /> Page content</button>
      <button type="button" role="tab" aria-selected={tab === 'media'} className={tab === 'media' ? 'is-active' : ''} onClick={() => switchTab('media')}><Images size={16} /> Photos &amp; films</button>
    </div>

    {tab === 'media' && <AdminGallery mode="portfolio" />}

    {tab === 'content' && !content && <div className="admin-loading"><span />Loading the portfolio page</div>}

    {tab === 'content' && content && <div className="apf-editor">
      <datalist id="apf-categories">{[...new Set([...categories, ...content.sections.map((section) => section.category)].filter(Boolean))].map((name) => <option key={name} value={name} />)}</datalist>

      <Panel title="1 · Top of the page" subtitle="The big PORTFOLIO title, the small details above it and the wide photo below.">
        <div className="apf-grid">
          <Field label="Big title" value={content.hero.title} onChange={update(['hero', 'title'])} />
          <Field label="Side text — line 1" value={content.hero.sideTop} onChange={update(['hero', 'sideTop'])} />
          <Field label="Side text — line 2" value={content.hero.sideBottom} onChange={update(['hero', 'sideBottom'])} />
          <Field label="Name" value={content.hero.metaName} onChange={update(['hero', 'metaName'])} />
          <Field label="Role" value={content.hero.metaRole} onChange={update(['hero', 'metaRole'])} />
          <Field label="Studio" value={content.hero.metaStudio} onChange={update(['hero', 'metaStudio'])} />
          <Field label="Based in" value={content.hero.metaLocation} onChange={update(['hero', 'metaLocation'])} />
        </div>
        <div className="apf-grid">
          <PhotoField label="Polaroid photo (next to the title)" hint="Empty = the profile photo." value={content.hero.photo} onChange={update(['hero', 'photo'])} />
          <PhotoField label="Wide photo below the title" hint="Empty = the first Travel photo." value={content.hero.banner} onChange={update(['hero', 'banner'])} />
        </div>
      </Panel>

      <Panel title="2 · Who I am">
        <div className="apf-grid">
          <Field label="Heading" value={content.about.heading} onChange={update(['about', 'heading'])} />
          <Field label="Name" value={content.about.name} onChange={update(['about', 'name'])} />
          <Field label="Role" value={content.about.role} onChange={update(['about', 'role'])} />
          <Field label="Photo caption" value={content.about.caption} onChange={update(['about', 'caption'])} />
        </div>
        <Field label="About text" hint="Leave an empty line between paragraphs." multiline rows={8} value={content.about.body} onChange={update(['about', 'body'])} />
        <div className="apf-list">
          <span className="apf-photo-label">Quick facts</span>
          {content.about.facts.map((fact, index) => <div className="apf-list-row" key={index}>
            <input placeholder="Label (e.g. Based in)" value={fact.label || ''} onChange={(event) => update(['about', 'facts', index, 'label'])(event.target.value)} />
            <input placeholder="Value" value={fact.value || ''} onChange={(event) => update(['about', 'facts', index, 'value'])(event.target.value)} />
            <button type="button" className="admin-icon-button" aria-label="Remove fact" onClick={() => update(['about', 'facts'])(content.about.facts.filter((_, i) => i !== index))}><Trash2 size={15} /></button>
          </div>)}
          {content.about.facts.length < 6 && <button type="button" className="apf-link-button" onClick={() => update(['about', 'facts'])([...content.about.facts, { label: '', value: '' }])}><Plus size={14} /> Add a fact</button>}
        </div>
        <PhotoField label="Photo" hint="Empty = the profile photo." value={content.about.photo} onChange={update(['about', 'photo'])} />
        <Field label="Signature (script text under sections)" value={content.signature} onChange={update(['signature'])} />
      </Panel>

      <Panel title="3 · Portfolio highlights" subtitle="One card per visible section below; each card uses that section’s first photo.">
        <Field label="Heading" value={content.highlights.heading} onChange={update(['highlights', 'heading'])} />
      </Panel>

      <Panel title="4 · Work sections" subtitle="Each section shows photos from Photos & films whose category matches. Use the arrows to change the order."
        aside={<button type="button" className="admin-secondary-button" onClick={() => update(['sections'])([...content.sections, newSection()])}><Plus size={15} /> Add section</button>}>
        {content.sections.map((section, index) => <div className={'apf-section' + (section.show === false ? ' is-hidden' : '')} key={section.id || index}>
          <div className="apf-section-head">
            <strong>{String(index + 1).padStart(2, '0')} · {section.title || 'Untitled'}</strong>
            <div className="apf-section-tools">
              <Toggle label="Show" checked={section.show} onChange={update(['sections', index, 'show'])} />
              <button type="button" className="admin-icon-button" aria-label="Move up" disabled={index === 0} onClick={() => moveSection(index, -1)}><ArrowUp size={15} /></button>
              <button type="button" className="admin-icon-button" aria-label="Move down" disabled={index === content.sections.length - 1} onClick={() => moveSection(index, 1)}><ArrowDown size={15} /></button>
              <button type="button" className="admin-icon-button" aria-label="Remove section" onClick={() => removeSection(index)}><Trash2 size={15} /></button>
            </div>
          </div>
          <div className="apf-grid">
            <Field label="Title" hint="Use “&” for the small script “and”." value={section.title} onChange={update(['sections', index, 'title'])} />
            <label className="apf-field"><span>Photos from category</span><input list="apf-categories" value={section.category || ''} onChange={(event) => update(['sections', index, 'category'])(event.target.value)} /><small>Same category name as in Photos &amp; films.</small></label>
            <label className="apf-field"><span>Layout</span><select value={section.layout || 'photos-right'} onChange={(event) => update(['sections', index, 'layout'])(event.target.value)}>{sectionLayouts.map((layout) => <option key={layout.value} value={layout.value}>{layout.label}</option>)}</select></label>
          </div>
          <Field label="Main text" multiline rows={3} value={section.intro} onChange={update(['sections', index, 'intro'])} />
          <div className="apf-grid">
            <Field label="Small heading" value={section.detailHeading} onChange={update(['sections', index, 'detailHeading'])} />
            <Field label="Tags line" value={section.tags} onChange={update(['sections', index, 'tags'])} />
          </div>
          <Field label="Small text" multiline rows={2} value={section.detailText} onChange={update(['sections', index, 'detailText'])} />
        </div>)}
      </Panel>

      <Panel title="5 · Films" subtitle="Every active video in Photos & films is shown with its category as the heading (e.g. WEDDING, STREET).">
        <Toggle label="Show films on the page" checked={content.films.show} onChange={update(['films', 'show'])} />
      </Panel>

      <Panel title="6 · Behind the scenes">
        <Toggle label="Show this section" checked={content.behind.show} onChange={update(['behind', 'show'])} />
        <div className="apf-grid">
          <Field label="Title" value={content.behind.title} onChange={update(['behind', 'title'])} />
          <label className="apf-field"><span>Photos from category</span><input list="apf-categories" value={content.behind.category || ''} onChange={(event) => update(['behind', 'category'])(event.target.value)} /></label>
        </div>
        <Field label="Text" multiline rows={4} value={content.behind.body} onChange={update(['behind', 'body'])} />
      </Panel>

      <Panel title="7 · Contact me">
        <div className="apf-grid">
          <Field label="Title — line 1" value={content.contact.titleTop} onChange={update(['contact', 'titleTop'])} />
          <Field label="Title — line 2" value={content.contact.titleBottom} onChange={update(['contact', 'titleBottom'])} />
          <Field label="Name" value={content.contact.name} onChange={update(['contact', 'name'])} />
          <Field label="Role" value={content.contact.role} onChange={update(['contact', 'role'])} />
          <Field label="Phone" value={content.contact.phone} onChange={update(['contact', 'phone'])} />
          <Field label="Email" value={content.contact.email} onChange={update(['contact', 'email'])} />
          <Field label="WhatsApp number" hint="With country code, e.g. 917084861647." value={content.contact.whatsapp} onChange={update(['contact', 'whatsapp'])} />
          <Field label="Instagram link" placeholder="https://www.instagram.com/…" value={content.contact.instagram} onChange={update(['contact', 'instagram'])} />
          <Field label="Location" value={content.contact.location} onChange={update(['contact', 'location'])} />
          <Field label="Closing line" value={content.contact.tagline} onChange={update(['contact', 'tagline'])} />
        </div>
        <PhotoField label="Photo" hint="Empty = the profile photo." value={content.contact.photo} onChange={update(['contact', 'photo'])} />
      </Panel>

      <div className="apf-savebar">
        <span>{dirty ? 'You have unsaved changes.' : updatedAt ? 'All changes saved.' : 'Showing the default text. Save once to start editing it live.'}</span>
        <button type="button" className="apf-link-button" onClick={resetText}><RotateCcw size={14} /> Restore original text</button>
        <button type="button" className="admin-primary-button" disabled={saving || (!dirty && Boolean(updatedAt))} onClick={save}><Save size={16} />{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </div>}
  </div>
}
