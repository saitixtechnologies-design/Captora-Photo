import { Fragment, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Mail, MapPin, MessageCircle, Phone, Play, X } from 'lucide-react'
import { Link } from 'react-router'
import { createPortal } from 'react-dom'
import { getPublicGallery, getPublicPortfolioContent } from '../admin/adminApi.js'
import { mergePortfolioContent, safeLink } from '../data/portfolioContent.js'
import { getYouTubeEmbedUrl, getVideoPoster } from '../utils/youtube.js'
import { sizedImage } from '../utils/media.js'
import '../../styles/portfolio-editorial.css'

const same = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase()
const slug = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// "FOOD & BEVERAGE" → FOOD <small script "and"> BEVERAGE, like an editorial title.
function Title({ text, as: Tag = 'h2', className = '' }) {
  const parts = (text || '').split(/\s+&\s+|\s+and\s+/i)
  return <Tag className={'pf-title ' + className}>{parts.map((part, index) => <Fragment key={index}>{index > 0 && <i className="pf-title-and">and</i>}<span>{part}</span></Fragment>)}</Tag>
}

function Paragraphs({ text, className }) {
  return (text || '').split(/\n\s*\n/).filter((line) => line.trim()).map((line, index) => <p className={className} key={index}>{line}</p>)
}

function Polaroid({ src, alt, caption, className = '' }) {
  if (!src) return null
  return <figure className={'pf-polaroid ' + className}><img src={sizedImage(src, 900)} alt={alt} loading="lazy" />{caption && <figcaption>{caption}</figcaption>}</figure>
}

export default function Portfolio() {
  const [stories, setStories] = useState([])
  const [saved, setSaved] = useState(null)
  const [viewer, setViewer] = useState(null)
  const content = useMemo(() => mergePortfolioContent(saved), [saved])

  useEffect(() => {
    let active = true
    getPublicGallery().then((items) => { if (active) setStories(items.filter((item) => item.isActive !== false)) }).catch(() => {})
    getPublicPortfolioContent().then((data) => { if (active) setSaved(data) }).catch(() => {})
    return () => { active = false }
  }, [])

  // Every photo of a category, flattened across its stories.
  const photosOf = useMemo(() => (category) => stories
    .filter((story) => story.type !== 'video' && same(story.category, category))
    .flatMap((story) => (story.images?.length ? story.images : [story.image]).filter(Boolean).map((src) => ({ src, title: story.title }))), [stories])

  const portrait = stories.find((story) => same(story.category, 'Photographer Portrait'))?.image || ''
  const { hero, about, highlights, films, behind, contact, signature } = content
  const sections = content.sections.filter((section) => section && section.show !== false)
  const heroBanner = hero.banner || photosOf('Travel')[0]?.src || photosOf('Portfolio Highlights')[0]?.src || ''
  const filmStories = stories.filter((story) => story.type === 'video' && story.video)
  const behindPhotos = photosOf(behind.category).slice(0, 6)
  const whatsapp = (contact.whatsapp || '').replace(/\D/g, '')
  const instagram = safeLink(contact.instagram)

  function openPhotos(photos, index) { setViewer({ kind: 'photos', photos, index }) }

  return <main className="pf-page">
    <section className="pf-hero" id="top">
      <div className="pf-meta">
        <span><small>NAME</small>{hero.metaName}</span>
        <span><small>ROLE</small>{hero.metaRole}</span>
        <span><small>STUDIO</small>{hero.metaStudio}</span>
        <span><small>BASED IN</small>{hero.metaLocation}</span>
      </div>
      <div className="pf-hero-head">
        <h1 className="pf-hero-title">{hero.title}</h1>
        <div className="pf-hero-side"><span>{hero.sideTop}</span><span>{hero.sideBottom}</span></div>
        <Polaroid src={hero.photo || portrait} alt={hero.metaName} className="pf-hero-polaroid" />
      </div>
      {heroBanner && <div className="pf-hero-banner"><img src={sizedImage(heroBanner, 2000)} alt="" /></div>}
    </section>

    <section className="pf-about" id="who-i-am">
      <div className="pf-about-photo">
        <Polaroid src={about.photo || portrait} alt={about.name} caption={about.caption} />
        {!(about.photo || portrait) && <div className="pf-empty">Add a profile photo in Admin → Portfolio</div>}
      </div>
      <div className="pf-about-copy">
        <Title text={about.heading} />
        <div className="pf-about-name"><strong>{about.name}</strong><span>{about.role}</span></div>
        {about.facts?.length > 0 && <dl className="pf-facts">{about.facts.filter((fact) => fact?.label || fact?.value).map((fact, index) => <div key={index}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
        <Paragraphs text={about.body} className="pf-body" />
        {signature && <span className="pf-signature">{signature}</span>}
      </div>
    </section>

    <section className="pf-highlights" id="portfolio-highlights">
      <Title text={highlights.heading} className="pf-highlights-title" />
      <div className="pf-highlight-grid">
        {sections.map((section) => {
          const cover = photosOf(section.category)[0]?.src
          return <a className="pf-highlight-card" key={section.id} href={'#' + slug(section.id || section.title)}>
            <span>{section.title}</span>
            {cover ? <img src={sizedImage(cover, 700)} alt={section.title} loading="lazy" /> : <i />}
          </a>
        })}
      </div>
    </section>

    {sections.map((section) => {
      const photos = photosOf(section.category)
      const layout = section.layout || 'photos-right'
      const shown = photos.slice(0, layout === 'banner' ? 5 : 6)
      const copy = <div className="pf-section-copy">
        <Title text={section.title} />
        <Paragraphs text={section.intro} className="pf-body" />
        {section.detailHeading && <h3 className="pf-detail-heading">{section.detailHeading}</h3>}
        <Paragraphs text={section.detailText} className="pf-body pf-body-small" />
        {section.tags && <p className="pf-tags">{section.tags}</p>}
        {signature && <span className="pf-signature">{signature}</span>}
      </div>
      const grid = shown.length
        ? <div className={'pf-photo-grid count-' + shown.length}>{shown.map((photo, index) => <button type="button" key={photo.src + index} onClick={() => openPhotos(photos, index)}><img src={sizedImage(photo.src, 900)} alt={photo.title} loading="lazy" /></button>)}</div>
        : <div className="pf-empty">Add photos with category “{section.category}” in Admin → Portfolio → Photos &amp; films</div>
      return <section className={'pf-section layout-' + layout} id={slug(section.id || section.title)} key={section.id}>
        {layout === 'photos-left' ? <>{grid}{copy}</> : <>{copy}{grid}</>}
      </section>
    })}

    {films.show !== false && filmStories.map((story) => {
      const youTube = getYouTubeEmbedUrl(story.video)
      const poster = getVideoPoster(story)
      return <section className="pf-film" key={story.id}>
        <Title text={story.category || story.title} />
        <button type="button" className="pf-film-frame" onClick={() => setViewer({ kind: 'video', story })} aria-label={'Play ' + story.title}>
          {youTube ? (poster && <img src={sizedImage(poster, 1600)} alt={story.title} loading="lazy" />) : <video src={story.video} poster={poster || undefined} muted autoPlay loop playsInline />}
          <span className="pf-play"><Play size={30} fill="currentColor" /></span>
        </button>
        {story.title && !same(story.title, story.category) && <p className="pf-film-caption">{story.title}</p>}
      </section>
    })}

    {behind.show !== false && <section className="pf-behind">
      <div className={'pf-behind-photos count-' + behindPhotos.length}>{behindPhotos.map((photo, index) => <button type="button" key={photo.src + index} onClick={() => openPhotos(behindPhotos, index)}><img src={sizedImage(photo.src, 900)} alt={photo.title} loading="lazy" /></button>)}</div>
      <div className="pf-behind-card">
        <Title text={behind.title} />
        <Paragraphs text={behind.body} className="pf-body" />
        {signature && <span className="pf-signature">{signature}</span>}
      </div>
    </section>}

    <section className="pf-contact" id="contact-me">
      <div className="pf-contact-main">
        <h2 className="pf-contact-title"><span>{contact.titleTop}</span><span>{contact.titleBottom}</span></h2>
        <div className="pf-contact-details">
          <strong>{contact.name}</strong>
          <span className="pf-contact-role">{contact.role}</span>
          {contact.phone && <a href={'tel:' + contact.phone.replace(/[^\d+]/g, '')}><Phone size={18} />{contact.phone}</a>}
          {contact.email && <a href={'mailto:' + contact.email}><Mail size={18} />{contact.email}</a>}
          {whatsapp && <a href={'https://wa.me/' + whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={18} />WhatsApp</a>}
          {instagram && <a href={instagram} target="_blank" rel="noreferrer"><span className="pf-ig">IG</span>Instagram</a>}
          {contact.location && <span><MapPin size={18} />{contact.location}</span>}
        </div>
        <Polaroid src={contact.photo || portrait} alt={contact.name} className="pf-contact-polaroid" />
      </div>
      <div className="pf-contact-tagline"><span />{contact.tagline}<span /></div>
      <Link to="/contact#enquiry" className="pf-contact-cta">Start an enquiry <ArrowRight size={16} /></Link>
    </section>

    {viewer && createPortal(<Viewer viewer={viewer} setViewer={setViewer} />, document.body)}
  </main>
}

function Viewer({ viewer, setViewer }) {
  const close = () => setViewer(null)
  const count = viewer.kind === 'photos' ? viewer.photos.length : 1
  const move = (step) => setViewer((current) => ({ ...current, index: (current.index + step + count) % count }))

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') setViewer(null)
      if (viewer.kind === 'photos' && event.key === 'ArrowRight') setViewer((current) => ({ ...current, index: (current.index + 1) % count }))
      if (viewer.kind === 'photos' && event.key === 'ArrowLeft') setViewer((current) => ({ ...current, index: (current.index - 1 + count) % count }))
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [viewer.kind, count, setViewer])

  const photo = viewer.kind === 'photos' ? viewer.photos[viewer.index] : null
  const story = viewer.story
  const youTube = story && getYouTubeEmbedUrl(story.video, true)
  return <div className="pf-viewer" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) close() }}>
    <button className="pf-viewer-close" type="button" onClick={close} aria-label="Close"><X size={22} /></button>
    {count > 1 && <button className="pf-viewer-arrow previous" type="button" onClick={() => move(-1)} aria-label="Previous photo"><ArrowLeft size={22} /></button>}
    {photo && <img className="pf-viewer-media" src={sizedImage(photo.src, 2000)} alt={photo.title} />}
    {story && (youTube
      ? <iframe className="pf-viewer-media pf-viewer-embed" src={youTube} title={story.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      : <video className="pf-viewer-media" src={story.video} poster={getVideoPoster(story) || undefined} controls autoPlay playsInline />)}
    {count > 1 && <button className="pf-viewer-arrow next" type="button" onClick={() => move(1)} aria-label="Next photo"><ArrowRight size={22} /></button>}
    <div className="pf-viewer-caption"><span>{photo?.title || story?.title}</span>{count > 1 && <span>{viewer.index + 1} / {count}</span>}</div>
  </div>
}
