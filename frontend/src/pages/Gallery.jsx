import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Images, Play, X } from 'lucide-react'
import { Link } from 'react-router'
import { getPublicGallery } from '../admin/adminApi.js'
import { getVideoPoster, getYouTubeEmbedUrl, getYouTubeThumbnail } from '../utils/youtube.js'
import { sizedImage } from '../utils/media.js'
import '../../styles/gallery-editorial.css'

const heroSlides = [
  { src: '/hero/gallery-exhibition.jpg', label: 'THE EXHIBITION' },
  { src: '/hero/gallery-darkroom.jpg', label: 'THE DARKROOM' },
]
const ALL = 'All work'
const PAGE = 12

const imageOf = (item, width) => (item.type === 'video' ? getVideoPoster(item) || getYouTubeThumbnail(item.video) : sizedImage(item.image, width))

function HeroSlides() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % heroSlides.length), 7000)
    return () => clearInterval(timer)
  }, [])
  return <div className="gl-hero-media" aria-hidden="true">
    {heroSlides.map((slide, i) => <img key={slide.src} className={'gl-hero-slide' + (i === index ? ' is-active' : '')} src={slide.src} alt="" fetchPriority={i === 0 ? 'high' : 'low'} />)}
    <span className="gl-hero-label">{String(index + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')} · {heroSlides[index].label}</span>
  </div>
}

function Viewer({ items, start, onClose }) {
  const [position, setPosition] = useState({ item: start, photo: 0 })
  const item = items[position.item]
  const photos = item?.type === 'video' ? [] : (item?.images?.length ? item.images : [item?.image]).filter(Boolean)

  const next = useCallback(() => setPosition(({ item: i, photo }) => {
    const current = items[i]
    const count = current.type === 'video' ? 1 : (current.images?.length || 1)
    return photo < count - 1 ? { item: i, photo: photo + 1 } : { item: (i + 1) % items.length, photo: 0 }
  }), [items])
  const previous = useCallback(() => setPosition(({ item: i, photo }) => {
    if (photo > 0) return { item: i, photo: photo - 1 }
    const target = (i - 1 + items.length) % items.length
    const prev = items[target]
    return { item: target, photo: prev.type === 'video' ? 0 : Math.max((prev.images?.length || 1) - 1, 0) }
  }), [items])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') next()
      if (event.key === 'ArrowLeft') previous()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [next, previous, onClose])

  if (!item) return null
  const embed = item.type === 'video' && getYouTubeEmbedUrl(item.video, true)
  return createPortal(<div className="gl-viewer" role="dialog" aria-modal="true" aria-label={item.title} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <button type="button" className="gl-viewer-close" onClick={onClose} aria-label="Close"><X size={22} /></button>
    <button type="button" className="gl-viewer-arrow is-prev" onClick={previous} aria-label="Previous"><ArrowLeft size={22} /></button>
    <div className="gl-viewer-stage">
      {item.type === 'video'
        ? (embed
          ? <iframe key={item.id} src={embed} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
          : <video key={item.id} src={item.video} poster={getVideoPoster(item) || undefined} controls autoPlay playsInline />)
        : <img key={photos[position.photo]} src={sizedImage(photos[position.photo], 2000)} alt={`${item.title}, photo ${position.photo + 1}`} />}
    </div>
    <button type="button" className="gl-viewer-arrow is-next" onClick={next} aria-label="Next"><ArrowRight size={22} /></button>
    <div className="gl-viewer-caption">
      <div><small>{item.category}{item.location ? ' · ' + item.location : ''}</small><strong>{item.title}</strong></div>
      <span>{item.type === 'video' ? 'FILM' : `${String(position.photo + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`} · {String(position.item + 1).padStart(2, '0')} of {String(items.length).padStart(2, '0')}</span>
    </div>
  </div>, document.body)
}

export default function Gallery() {
  const [items, setItems] = useState([])
  const [category, setCategory] = useState(ALL)
  const [visible, setVisible] = useState(PAGE)
  const [viewer, setViewer] = useState(null)

  useEffect(() => {
    let active = true
    getPublicGallery().then((rows) => {
      if (active) setItems(rows.filter((row) => row.isActive !== false && !/photographer portrait|homepage hero/i.test(row.category || '')))
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const counts = useMemo(() => {
    const map = new Map()
    items.forEach((item) => { if (item.category) map.set(item.category, (map.get(item.category) || 0) + 1) })
    return map
  }, [items])
  const filtered = category === ALL ? items : items.filter((item) => item.category === category)
  const shown = filtered.slice(0, visible)
  const photoCount = items.reduce((sum, item) => sum + (item.type === 'video' ? 0 : item.images?.length || 1), 0)
  const filmCount = items.filter((item) => item.type === 'video').length
  const film = items.find((item) => item.type === 'video' && item.video)

  function choose(next) {
    setCategory(next)
    setVisible(PAGE)
  }

  return <main className="gl-page">
    <section className="gl-hero">
      <HeroSlides />
      <div className="gl-hero-shade" aria-hidden="true" />
      <div className="gl-frame" aria-hidden="true"><i className="tl" /><i className="tr" /><i className="bl" /><i className="br" /></div>
      <div className="gl-wrap gl-hero-copy">
        <p className="gl-eyebrow gl-rise"><span />The Captora collection</p>
        <h1 className="gl-rise gl-rise-2">Every frame,<br /><em>a feeling.</em></h1>
        <p className="gl-hero-text gl-rise gl-rise-3">Photographs and films from weddings, portraits, food, travel and brands — gathered in one quiet place.</p>
        <div className="gl-stats gl-rise gl-rise-4">
          <span><strong>{photoCount || '—'}</strong>Photographs</span>
          <span><strong>{filmCount || '—'}</strong>Films</span>
          <span><strong>{counts.size || '—'}</strong>Categories</span>
        </div>
      </div>
      <a href="#gl-collection" className="gl-scroll" aria-label="Go to the collection"><ArrowDown size={18} /></a>
    </section>

    <section className="gl-collection" id="gl-collection">
      <div className="gl-wrap gl-head">
        <div><p className="gl-eyebrow"><span />Browse the collection</p><h2>Stories, <em>frame by frame.</em></h2></div>
        <p className="gl-head-text">Choose a category, then open any story to see every photograph or play the film.</p>
      </div>

      <div className="gl-filters-bar">
        <div className="gl-wrap">
          <div className="gl-filters" role="toolbar" aria-label="Filter by category">
            {[ALL, ...counts.keys()].map((name) => <button key={name} type="button" className={'gl-chip' + (category === name ? ' is-active' : '')} aria-pressed={category === name} onClick={() => choose(name)}>
              {name}<small>{name === ALL ? items.length : counts.get(name)}</small>
            </button>)}
          </div>
        </div>
      </div>

      <div className="gl-wrap">
        {shown.length > 0 ? <div className="gl-masonry" key={category}>
          {shown.map((item, index) => {
            const isVideo = item.type === 'video'
            const photos = isVideo ? 0 : item.images?.length || 1
            return <button type="button" key={item.id} className={'gl-card' + (item.size === 'tall' ? ' is-tall' : item.size === 'wide' ? ' is-wide' : '')} style={{ animationDelay: `${(index % PAGE) * 40}ms` }} onClick={() => setViewer(filtered.indexOf(item))} aria-label={`Open ${item.title}`}>
              {isVideo && item.video && !getYouTubeEmbedUrl(item.video)
                ? <video src={item.video} poster={sizedImage(getVideoPoster(item), 800) || undefined} muted autoPlay loop playsInline preload="metadata" />
                : <img src={imageOf(item, 900)} alt={item.title} loading="lazy" />}
              <span className="gl-card-shade" />
              {isVideo && <span className="gl-card-play"><Play size={20} fill="currentColor" /></span>}
              <span className="gl-card-badge">{isVideo ? 'Film' : <><Images size={13} /> {photos}</>}</span>
              <span className="gl-card-info">
                <small>{item.category}{item.location ? ' · ' + item.location : ''}</small>
                <strong>{item.title}</strong>
              </span>
            </button>
          })}
        </div> : <p className="gl-empty">{items.length ? 'Nothing in this category yet.' : 'The collection is being prepared. Please check back soon.'}</p>}

        {visible < filtered.length && <div className="gl-more"><button type="button" onClick={() => setVisible((count) => count + PAGE)}>Show more stories <ArrowDown size={16} /></button><span>{shown.length} of {filtered.length}</span></div>}
      </div>
    </section>

    {film && <section className="gl-film">
      <div className="gl-film-media">
        {getYouTubeEmbedUrl(film.video) ? <img src={sizedImage(getVideoPoster(film), 1600)} alt="" loading="lazy" /> : <video src={film.video} poster={getVideoPoster(film) || undefined} muted autoPlay loop playsInline />}
      </div>
      <div className="gl-film-copy">
        <p className="gl-eyebrow"><span />Beyond the still frame</p>
        <h2>{film.title} <em>in motion.</em></h2>
        <p>{film.category}{film.location ? ' · ' + film.location : ''}</p>
        <div className="gl-film-actions">
          <button type="button" className="gl-btn gl-btn-gold" onClick={() => { if (category !== ALL) choose(ALL); setViewer(items.indexOf(film)) }}><Play size={16} fill="currentColor" /> Play the film</button>
          <Link to="/portfolio" className="gl-btn gl-btn-ghost">View portfolio <ArrowUpRight size={16} /></Link>
        </div>
      </div>
    </section>}

    {viewer !== null && filtered[viewer] && <Viewer items={filtered} start={viewer} onClose={() => setViewer(null)} />}
  </main>
}
