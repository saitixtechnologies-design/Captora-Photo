import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, Clock, Expand, HeartHandshake, Images, MessageCircle, X } from 'lucide-react'
import { Link } from 'react-router'
import { getPublicServices } from '../admin/adminApi.js'
import { sizedImage } from '../utils/media.js'
import { getVideoPoster, getYouTubeBackgroundUrl, getYouTubeEmbedUrl } from '../utils/youtube.js'
import '../../styles/services-editorial.css'
import '../../styles/signature.css'

const heroSlides = [
  { src: '/hero/services-film.jpg', label: 'ON SET · THE WEDDING FILM' },
  { src: '/hero/services-studio.jpg', label: 'IN THE STUDIO · FOOD & PRODUCT' },
]

const promises = [
  { icon: HeartHandshake, title: 'Planned around you', text: 'A short call first, then a shot list and timeline shaped to your day or brand.' },
  { icon: Clock, title: 'On time, every time', text: 'Clear delivery dates agreed up front, with a sneak peek soon after the shoot.' },
  { icon: Images, title: 'Made to keep', text: 'Carefully edited photographs and films in a private online gallery to share and download.' },
]

const slug = (text) => 'service-' + (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const photosOf = (service) => (service.mediaType === 'video' ? [] : (service.images?.length ? service.images : [service.image]).filter(Boolean))
const detailsOf = (service) => (service.detail || '').split(/\s*[·•|,]\s*/).map((item) => item.trim()).filter(Boolean)

function HeroSlides() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % heroSlides.length), 7000)
    return () => clearInterval(timer)
  }, [])
  return <div className="sv-hero-media" aria-hidden="true">
    {heroSlides.map((slide, i) => <img key={slide.src} className={'sv-hero-slide' + (i === index ? ' is-active' : '')} src={slide.src} alt="" fetchPriority={i === 0 ? 'high' : 'low'} />)}
    <span className="sv-hero-label">{String(index + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')} · {heroSlides[index].label}</span>
  </div>
}

function PhotoViewer({ service, start, onClose }) {
  const photos = photosOf(service)
  const [index, setIndex] = useState(start)
  const move = useCallback((step) => setIndex((current) => (current + step + photos.length) % photos.length), [photos.length])
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') move(1)
      if (event.key === 'ArrowLeft') move(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [move, onClose])
  return createPortal(<div className="sv-viewer" role="dialog" aria-modal="true" aria-label={service.title + ' photos'} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <button type="button" className="sv-viewer-close" onClick={onClose} aria-label="Close"><X size={22} /></button>
    {photos.length > 1 && <button type="button" className="sv-viewer-arrow is-prev" onClick={() => move(-1)} aria-label="Previous photo"><ArrowLeft size={22} /></button>}
    <img key={photos[index]} src={sizedImage(photos[index], 2000)} alt={`${service.title}, photo ${index + 1}`} />
    {photos.length > 1 && <button type="button" className="sv-viewer-arrow is-next" onClick={() => move(1)} aria-label="Next photo"><ArrowRight size={22} /></button>}
    <div className="sv-viewer-caption"><strong>{service.title}</strong><span>{String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span></div>
  </div>, document.body)
}

function ServiceRow({ service, index }) {
  const photos = photosOf(service)
  const [photo, setPhoto] = useState(0)
  const [viewer, setViewer] = useState(null)
  const details = detailsOf(service)
  const isVideo = service.mediaType === 'video'
  const embed = isVideo && getYouTubeEmbedUrl(service.video)
  const move = (step) => setPhoto((current) => (current + step + photos.length) % photos.length)

  return <article className={'sv-row' + (index % 2 ? ' is-flipped' : '')} id={slug(service.title)} style={{ '--i': index }}>
    <div className="sv-media">
      {isVideo
        ? (embed ? <><img src={sizedImage(getVideoPoster({ video: service.video, image: service.image }), 1200)} alt={service.title} loading="lazy" />{getYouTubeBackgroundUrl(service.video) && <iframe className="sv-media-embed" src={getYouTubeBackgroundUrl(service.video)} title={service.title} allow="autoplay; encrypted-media; picture-in-picture" tabIndex={-1} aria-hidden="true" />}</> : <video src={service.video || service.image} muted autoPlay loop playsInline preload="metadata" aria-label={service.title} />)
        : photos.map((src, i) => <img key={src + i} className={'sv-media-photo' + (i === photo ? ' is-active' : '')} src={sizedImage(src, 1200)} alt={`${service.title}, photo ${i + 1}`} loading="lazy" />)}
      <span className="sv-media-num">{String(index + 1).padStart(2, '0')}</span>
      {!isVideo && photos.length > 0 && <button type="button" className="sv-media-open" onClick={() => setViewer(photo)} aria-label={'View photos for ' + service.title}><Expand size={18} /></button>}
      {photos.length > 1 && <div className="sv-media-nav">
        <button type="button" onClick={() => move(-1)} aria-label="Previous photo"><ArrowLeft size={18} /></button>
        <span>{photo + 1} / {photos.length}</span>
        <button type="button" onClick={() => move(1)} aria-label="Next photo"><ArrowRight size={18} /></button>
      </div>}
    </div>
    <div className="sv-copy">
      <span className="sv-copy-num">{String(index + 1).padStart(2, '0')} — Service</span>
      <h2>{service.title}</h2>
      <p>{service.description}</p>
      {details.length > 0 && <ul className="sv-details">{details.map((item) => <li key={item}><Check size={16} strokeWidth={2.2} />{item}</li>)}</ul>}
      <div className="sv-copy-actions">
        <Link to="/contact#enquiry" className="sv-btn sv-btn-dark">Enquire about this <ArrowUpRight size={17} /></Link>
        {!isVideo && photos.length > 0 && <button type="button" className="sv-link" onClick={() => setViewer(photo)}>View {photos.length} photo{photos.length > 1 ? 's' : ''}</button>}
      </div>
    </div>
    {viewer !== null && <PhotoViewer service={service} start={viewer} onClose={() => setViewer(null)} />}
  </article>
}

export default function Services() {
  const [services, setServices] = useState([])
  useEffect(() => {
    let active = true
    getPublicServices().then((items) => { if (active) setServices(items.filter((item) => item.isActive !== false)) }).catch(() => {})
    return () => { active = false }
  }, [])

  return <main className="sv-page">
    <section className="sv-hero">
      <HeroSlides />
      <div className="sv-hero-shade" aria-hidden="true" />
      <div className="sv-frame" aria-hidden="true"><i className="tl" /><i className="tr" /><i className="bl" /><i className="br" /></div>
      <div className="sv-wrap sv-hero-copy">
        <p className="sv-eyebrow sv-rise"><span />Our services</p>
        <h1 className="sv-rise sv-rise-2">Here for the<br /><em>whole story.</em></h1>
        <p className="sv-hero-text sv-rise sv-rise-3">Weddings, films, portraits, food, interiors, products and travel — each one planned with care and photographed to last.</p>
        <div className="sv-hero-actions sv-rise sv-rise-4">
          <Link to="/contact#enquiry" className="sv-btn sv-btn-gold">Plan your shoot <ArrowUpRight size={17} /></Link>
          <a href="#sv-list" className="sv-btn sv-btn-ghost">See all services <ArrowDown size={17} /></a>
        </div>
      </div>
    </section>

    {services.length > 0 && <nav className="sv-index" aria-label="Jump to a service">
      <div className="sv-wrap sv-index-inner">
        {services.map((service, index) => <a key={service.id || index} href={'#' + slug(service.title)}><small>{String(index + 1).padStart(2, '0')}</small>{service.title}</a>)}
      </div>
    </nav>}

    <section className="sv-list sv-wrap" id="sv-list">
      <div className="sv-list-head">
        <p className="sv-eyebrow"><span />How we can help</p>
        <h2>Thoughtful coverage, <em>beautifully told.</em></h2>
      </div>
      {services.length
        ? services.map((service, index) => <ServiceRow key={service.id || index} service={service} index={index} />)
        : <p className="sv-empty">Our services are being updated. Please check back soon, or <Link to="/contact">get in touch</Link>.</p>}
    </section>

    <section className="sv-promise">
      <div className="sv-wrap">
        <div className="sv-promise-head">
          <p className="sv-eyebrow sv-eyebrow-center"><span />Every booking includes<span /></p>
          <h2>Good photographs start with a <em>good feeling.</em></h2>
        </div>
        <div className="sv-promise-grid">
          {promises.map(({ icon: Icon, title, text }) => <div key={title} className="sv-promise-card">
            <span className="sv-promise-icon"><Icon size={24} strokeWidth={1.5} /></span>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>)}
        </div>
        <div className="sv-promise-cta">
          <Link to="/contact#enquiry" className="sv-btn sv-btn-gold">Talk about your plans <ArrowUpRight size={17} /></Link>
          <a href="https://wa.me/917084861647" target="_blank" rel="noreferrer" className="sv-btn sv-btn-ghost"><MessageCircle size={17} /> WhatsApp us</a>
        </div>
      </div>
    </section>
  </main>
}
