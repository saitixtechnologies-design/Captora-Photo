import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, Heart, Play, Quote, Star, X } from 'lucide-react'
import { getPublicFeedback, getPublicGallery, getPublicServices } from '../admin/adminApi.js'
import { sizedImage } from '../utils/media.js'
import { getVideoPoster, getYouTubeEmbedUrl } from '../utils/youtube.js'
import RitualStory from '../components/RitualStory.jsx'
import '../../styles/wedding-editorial.css'
import '../../styles/signature.css'

// Used only until the studio's own wedding photos load from Admin → Gallery.
const fallbackPhotos = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?auto=format&fit=crop&w=1200&q=85',
]

const chapters = [
  { number: '01', title: 'The anticipation', text: 'The quiet details, the getting-ready moments and the nerves before everything begins.' },
  { number: '02', title: 'The celebration', text: 'The rituals, the people, the laughter — and the moments you might otherwise miss.' },
  { number: '03', title: 'The forever after', text: 'Honest portraits and photographs that bring you back to how it all felt.' },
]

const isWedding = (item) => /wedding/i.test(item.category || '')

function useReveal(key) {
  useEffect(() => {
    const elements = [...document.querySelectorAll('.wd-page [data-reveal]:not(.is-in)')]
    if (!('IntersectionObserver' in window)) { elements.forEach((el) => el.classList.add('is-in')); return undefined }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); observer.unobserve(entry.target) } })
    }, { threshold: 0.12 })
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [key])
}

function Viewer({ photos, start, onClose }) {
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
  const photo = photos[index]
  return createPortal(<div className="wd-viewer" role="dialog" aria-modal="true" aria-label={photo.title} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <button type="button" className="wd-viewer-close" onClick={onClose} aria-label="Close"><X size={22} /></button>
    {photos.length > 1 && <button type="button" className="wd-viewer-arrow is-prev" onClick={() => move(-1)} aria-label="Previous photo"><ArrowLeft size={22} /></button>}
    <img key={photo.src} src={sizedImage(photo.src, 2000)} alt={photo.title} />
    {photos.length > 1 && <button type="button" className="wd-viewer-arrow is-next" onClick={() => move(1)} aria-label="Next photo"><ArrowRight size={22} /></button>}
    <div className="wd-viewer-caption"><strong>{photo.title}</strong><span>{String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span></div>
  </div>, document.body)
}

function FilmModal({ film, onClose }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])
  const embed = getYouTubeEmbedUrl(film.video, true)
  return createPortal(<div className="wd-viewer" role="dialog" aria-modal="true" aria-label={film.title} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <button type="button" className="wd-viewer-close" onClick={onClose} aria-label="Close film"><X size={22} /></button>
    {embed
      ? <iframe className="wd-viewer-film" src={embed} title={film.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      : <video className="wd-viewer-film" src={film.video} poster={getVideoPoster(film) || undefined} controls autoPlay playsInline />}
  </div>, document.body)
}

// A paragraph whose words light up one by one as it scrolls through the screen.
function LitText({ text }) {
  const ref = useRef(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    let frame = 0
    const update = () => {
      frame = 0
      const box = node.getBoundingClientRect()
      const progress = (window.innerHeight * 0.85 - box.top) / (window.innerHeight * 0.5 + box.height)
      node.style.setProperty('--p', Math.min(1.05, Math.max(0, progress)).toFixed(3))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame) }
  }, [])
  const words = text.split(' ')
  return <p className="sg-lit" ref={ref}>{words.map((word, index) => <span key={index} style={{ '--w': (index / words.length).toFixed(3) }}>{word} </span>)}</p>
}

export default function WeddingPhotography() {
  const [gallery, setGallery] = useState([])
  const [service, setService] = useState(null)
  const [reviews, setReviews] = useState([])
  const [viewer, setViewer] = useState(null)
  const [film, setFilm] = useState(null)
  const [review, setReview] = useState(0)

  useEffect(() => {
    let active = true
    getPublicGallery().then((items) => { if (active) setGallery(items) }).catch(() => {})
    getPublicServices().then((items) => { if (active) setService(items.find((item) => item.isActive !== false && /wedding/i.test(item.title || '')) || null) }).catch(() => {})
    getPublicFeedback().then((items) => { if (active) setReviews(items) }).catch(() => {})
    return () => { active = false }
  }, [])
  useReveal(`${gallery.length}-${reviews.length}-${service ? 1 : 0}`)

  // Every wedding and pre-wedding photo from Admin → Gallery, one entry per photo.
  const weddingPhotos = gallery.filter((item) => item.type !== 'video' && isWedding(item))
    .flatMap((item) => (item.images?.length ? item.images : [item.image]).filter(Boolean).map((src) => ({ src, title: item.title, category: item.category, location: item.location })))
  const photos = weddingPhotos.length ? weddingPhotos : fallbackPhotos.map((src, i) => ({ src, title: 'Captora wedding story ' + (i + 1), category: 'Wedding', location: '' }))
  const stories = photos.slice(0, 7)
  const chapterPhotos = [photos[3] || photos[0], photos[4] || photos[1], photos[5] || photos[2]]
  const floating = [photos[1], photos[2]].filter(Boolean)
  const weddingFilm = gallery.find((item) => item.type === 'video' && item.video && isWedding(item))
  const details = (service?.detail || '').split(/\s*[·•|,]\s*/).map((item) => item.trim()).filter(Boolean)
  const current = reviews.length ? reviews[review % reviews.length] : null

  return <main className="wd-page">
    <section className="wd-hero">
      <img className="wd-hero-img" src="/hero/wedding-mandap.jpg" alt="" fetchPriority="high" />
      <div className="wd-hero-shade" aria-hidden="true" />
      <div className="wd-frame" aria-hidden="true"><i className="tl" /><i className="tr" /><i className="bl" /><i className="br" /></div>
      <div className="wd-wrap wd-hero-copy">
        <p className="wd-eyebrow wd-rise"><span />Captora · Wedding photography &amp; films</p>
        <h1 className="wd-rise wd-rise-2">A love story,<br /><em>beautifully</em> remembered.</h1>
        <p className="wd-hero-text wd-rise wd-rise-3">The fleeting glances, the happy tears and the moments that become your forever — photographed and filmed with care.</p>
        <div className="wd-hero-actions wd-rise wd-rise-4">
          <Link to="/contact" className="wd-btn wd-btn-gold">Plan your wedding <ArrowUpRight size={17} /></Link>
          <a href="#wd-stories" className="wd-btn wd-btn-ghost">See wedding stories <ArrowDown size={17} /></a>
        </div>
      </div>
      <div className="wd-polaroids" aria-hidden="true">
        {floating.map((photo, i) => <figure key={photo.src} className={'wd-polaroid wd-polaroid-' + (i + 1)}><img src={sizedImage(photo.src, 500)} alt="" /></figure>)}
      </div>
    </section>

    <section className="wd-intro wd-wrap" data-reveal>
      <p className="wd-eyebrow"><span />Our approach</p>
      <div className="wd-intro-grid">
        <h2>Not just how it looked.<br /><em>How it felt.</em></h2>
        <div>
          <LitText text="Your wedding is made of a thousand little moments — some grand, some wonderfully ordinary. We photograph them quietly and with care, so the collection feels unmistakably yours." />
          <ul className="wd-points">
            <li><Heart size={16} /> Candid moments, gently guided portraits</li>
            <li><Heart size={16} /> Every ritual and every family face</li>
            <li><Heart size={16} /> Photographs and films made to last</li>
          </ul>
        </div>
      </div>
    </section>

    <section className="wd-stories" id="wd-stories">
      <div className="wd-wrap">
        <div className="wd-head" data-reveal>
          <div><p className="wd-eyebrow"><span />A collection of memories</p><h2>Love, in every <em>frame.</em></h2></div>
          <Link to="/gallery" className="wd-link">See all in the gallery <ArrowUpRight size={16} /></Link>
        </div>
        <div className="wd-mosaic" data-reveal>
          {stories.map((photo, index) => <button type="button" key={photo.src + index} className={'wd-tile wd-tile-' + (index + 1)} onClick={() => setViewer(index)} aria-label={'Open ' + photo.title}>
            <img src={sizedImage(photo.src, index === 0 ? 1400 : 800)} alt={photo.title} loading="lazy" />
            <span className="wd-tile-info"><small>{photo.category}{photo.location ? ' · ' + photo.location : ''}</small><strong>{photo.title}</strong></span>
          </button>)}
        </div>
      </div>
    </section>

    <section className="wd-chapters wd-wrap">
      <div className="wd-head wd-head-center" data-reveal>
        <div><p className="wd-eyebrow wd-eyebrow-center"><span />The experience<span /></p><h2>Every chapter <em>matters.</em></h2></div>
      </div>
      <div className="wd-chapter-grid">
        {chapters.map((chapter, index) => <article key={chapter.number} className="wd-chapter" data-reveal style={{ transitionDelay: `${index * 120}ms` }}>
          <div className="wd-chapter-img"><img src={sizedImage(chapterPhotos[index].src, 800)} alt={chapter.title} loading="lazy" /><span>{chapter.number}</span></div>
          <strong>{chapter.title}</strong>
          <p>{chapter.text}</p>
        </article>)}
      </div>
    </section>

    <RitualStory photos={photos.map((photo) => photo.src)} />

    <section className="wd-film" data-reveal>
      {weddingFilm
        ? <button type="button" className="wd-film-frame" onClick={() => setFilm(weddingFilm)} aria-label={'Play ' + weddingFilm.title}>
          {getVideoPoster(weddingFilm) && <img src={sizedImage(getVideoPoster(weddingFilm), 2000)} alt="" loading="lazy" />}
          <span className="wd-film-shade" />
          <span className="wd-film-copy">
            <span className="wd-eyebrow wd-eyebrow-center"><span />Beyond the still frame<span /></span>
            <strong>Some memories deserve to <em>move.</em></strong>
            <span className="wd-play"><Play size={28} fill="currentColor" /></span>
            <small>Watch “{weddingFilm.title}”</small>
          </span>
        </button>
        : <div className="wd-film-frame is-static">
          <img src={sizedImage(photos[0].src, 2000)} alt="" loading="lazy" />
          <span className="wd-film-shade" />
          <span className="wd-film-copy">
            <span className="wd-eyebrow wd-eyebrow-center"><span />Beyond the still frame<span /></span>
            <strong>Some memories deserve to <em>move.</em></strong>
            <Link to="/services" className="wd-btn wd-btn-gold">Discover wedding films <Play size={15} /></Link>
          </span>
        </div>}
    </section>

    {service && <section className="wd-package wd-wrap" data-reveal>
      <div className="wd-package-card">
        <div className="wd-package-img">{(service.images?.[0] || service.image) && <img src={sizedImage(service.images?.[0] || service.image, 1000)} alt={service.title} loading="lazy" />}</div>
        <div className="wd-package-copy">
          <p className="wd-eyebrow"><span />What’s included</p>
          <h2>{service.title}</h2>
          <p>{service.description}</p>
          {details.length > 0 && <ul className="wd-details">{details.map((item) => <li key={item}><Check size={16} strokeWidth={2.2} />{item}</li>)}</ul>}
          <Link to="/contact" className="wd-btn wd-btn-dark">Check your date <ArrowUpRight size={17} /></Link>
        </div>
      </div>
    </section>}

    {current && <section className="wd-review" data-reveal>
      <div className="wd-wrap wd-review-inner">
        <Quote className="wd-review-mark" size={46} strokeWidth={1.2} />
        <div className="wd-review-stars" aria-label={`${current.rating || 5} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={17} fill={i < (current.rating || 5) ? 'currentColor' : 'none'} />)}</div>
        <blockquote key={current.id}>{current.message}</blockquote>
        <p className="wd-review-name">{current.name}</p>
        {reviews.length > 1 && <div className="wd-review-nav">
          <button type="button" onClick={() => setReview((i) => (i - 1 + reviews.length) % reviews.length)} aria-label="Previous review"><ArrowLeft size={17} /></button>
          <span>{String((review % reviews.length) + 1).padStart(2, '0')} / {String(reviews.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => setReview((i) => (i + 1) % reviews.length)} aria-label="Next review"><ArrowRight size={17} /></button>
        </div>}
      </div>
    </section>}

    <section className="wd-cta wd-wrap" data-reveal>
      <span className="sg-seal" aria-hidden="true"><span>C</span></span>
      <p className="wd-eyebrow wd-eyebrow-center"><span />Your story starts here<span /></p>
      <h2>Shall we make something <em>timeless?</em></h2>
      <p>Tell us about your date, your people and the moments you want to remember.</p>
      <div className="wd-cta-actions">
        <Link to="/contact" className="wd-btn wd-btn-dark">Tell us your story <ArrowUpRight size={17} /></Link>
        <a href="https://wa.me/917084861647" target="_blank" rel="noreferrer" className="wd-link">Chat on WhatsApp</a>
      </div>
    </section>

    {viewer !== null && <Viewer photos={photos} start={viewer} onClose={() => setViewer(null)} />}
    {film && <FilmModal film={film} onClose={() => setFilm(null)} />}
  </main>
}
