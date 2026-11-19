import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, CalendarCheck, Camera, Heart, Images, MessageCircle, Play, Quote, Sparkles, Star, X } from 'lucide-react'
import { Link } from 'react-router'
import { getPublicFeedback, getPublicGallery, getPublicPageContent, getPublicServices } from '../admin/adminApi.js'
import { defaultHomeContent, isActive, mergeHomeContent, safeHref } from '../data/homeContent.js'
import { sizedImage } from '../utils/media.js'
import { getStoryCover, getVideoPoster, getYouTubeBackgroundUrl, getYouTubeEmbedUrl, handleCoverError } from '../utils/youtube.js'
import TunnelHero from '../components/TunnelHero.jsx'
import '../../styles/home-editorial.css'

const icons = { message: MessageCircle, calendar: CalendarCheck, camera: Camera, images: Images, heart: Heart, sparkles: Sparkles }
const isDrive = (url) => /drive\.google\.com|docs\.google\.com/.test(url || '')

// "Line one\nthat *glows*" → two lines, with the starred words in gold italics.
function Rich({ text }) {
  return (text || '').split('\n').map((line, lineIndex) => <Fragment key={lineIndex}>
    {lineIndex > 0 && <br />}
    {line.split(/\*([^*]+)\*/).map((part, index) => (index % 2 ? <em key={index}>{part}</em> : <Fragment key={index}>{part}</Fragment>))}
  </Fragment>)
}

// Site paths use the router; web links open normally.
function SmartLink({ to, fallback = '/', className, children, ...rest }) {
  const href = safeHref(to, fallback)
  if (href.startsWith('/')) return <Link to={href} className={className} {...rest}>{children}</Link>
  return <a href={href} className={className} target="_blank" rel="noreferrer" {...rest}>{children}</a>
}

function Eyebrow({ text, center }) {
  if (!text) return null
  return <p className={'hm-eyebrow' + (center ? ' hm-eyebrow-center' : '')}><span />{text}{center && <span />}</p>
}

// Adds "is-in" to elements with data-reveal as they scroll into view.
function useReveal(key) {
  useEffect(() => {
    const elements = [...document.querySelectorAll('.hm-page [data-reveal]:not(.is-in)')]
    if (!('IntersectionObserver' in window)) { elements.forEach((el) => el.classList.add('is-in')); return undefined }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); observer.unobserve(entry.target) } })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [key])
}

function BackgroundVideo({ src, poster }) {
  const youtube = getYouTubeBackgroundUrl(src)
  return <div className="hm-hero-media">
    {poster && <img className="hm-hero-still" src={sizedImage(poster, 2000)} alt="" onError={handleCoverError} />}
    {youtube && !isDrive(src)
      ? <iframe className="hm-hero-embed" src={youtube} title="Captora film" allow="autoplay; encrypted-media; picture-in-picture" tabIndex={-1} aria-hidden="true" />
      : !isDrive(src) && <video className="hm-hero-still" src={src} poster={poster ? sizedImage(poster, 2000) : undefined} autoPlay muted loop playsInline />}
  </div>
}

function Slides({ slides, seconds }) {
  const [index, setIndex] = useState(0)
  const count = slides.length
  useEffect(() => {
    if (count < 2) return undefined
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), Math.max(3, Number(seconds) || 6.5) * 1000)
    return () => clearInterval(timer)
  }, [count, seconds])
  const current = index % Math.max(count, 1)
  return <div className="hm-hero-media">
    {slides.map((slide, i) => <img key={slide.id || i} className={'hm-hero-slide' + (i === current ? ' is-active' : '')} src={sizedImage(slide.image, 2200)} alt="" fetchPriority={i === 0 ? 'high' : 'low'} />)}
    {count > 1 && <div className="hm-hero-counter" aria-hidden="true">
      <span>{String(current + 1).padStart(2, '0')}</span><i /><span>{String(count).padStart(2, '0')}</span>
      {slides[current]?.label && <em>{slides[current].label}</em>}
    </div>}
  </div>
}

function Timecode() {
  const [frames, setFrames] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setFrames((value) => value + 1), 1000 / 24)
    return () => clearInterval(timer)
  }, [])
  const total = Math.floor(frames / 24)
  const pad = (n) => String(n).padStart(2, '0')
  return <>{pad(Math.floor(total / 3600))}:{pad(Math.floor(total / 60) % 60)}:{pad(total % 60)}:{pad(frames % 24)}</>
}

function FilmModal({ film, onClose }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])
  const embed = getYouTubeEmbedUrl(film.video, true)
  return createPortal(<div className="hm-modal" role="dialog" aria-modal="true" aria-label={film.title} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <button type="button" className="hm-modal-close" onClick={onClose} aria-label="Close film"><X size={22} /></button>
    {embed
      ? <iframe className="hm-modal-media" src={embed} title={film.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      : <video className="hm-modal-media" src={film.video} poster={film.poster || undefined} controls autoPlay playsInline />}
  </div>, document.body)
}

function Reviews({ items, copy }) {
  const [active, setActive] = useState(0)
  if (!items.length) return null
  const current = items[active % items.length]
  const move = (step) => setActive((index) => (index + step + items.length) % items.length)
  return <section className="hm-reviews" data-reveal>
    <div className="hm-wrap hm-reviews-inner">
      <div className="hm-reviews-head">
        <Eyebrow text={copy.eyebrow} />
        <h2><Rich text={copy.title} /></h2>
        {items.length > 1 && <div className="hm-reviews-nav">
          <button type="button" onClick={() => move(-1)} aria-label="Previous review"><ArrowLeft size={18} /></button>
          <span>{String((active % items.length) + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => move(1)} aria-label="Next review"><ArrowRight size={18} /></button>
        </div>}
      </div>
      <figure className="hm-review" key={current.id || active}>
        <Quote className="hm-review-mark" size={44} strokeWidth={1.2} />
        <div className="hm-review-stars" aria-label={`${current.rating || 5} out of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={18} fill={i < (current.rating || 5) ? 'currentColor' : 'none'} />)}</div>
        <blockquote>{current.message}</blockquote>
        <figcaption>
          {current.image_url && <img src={sizedImage(current.image_url, 160)} alt="" loading="lazy" />}
          <span><strong>{current.name}</strong><small>Captora client</small></span>
        </figcaption>
      </figure>
    </div>
  </section>
}

// Warp carousel: each frame bends, shrinks and sinks back the further it is from the centre of the strip.
// Drag with the mouse or swipe to move it.
function useWarpCarousel(ref, count) {
  useEffect(() => {
    const strip = ref.current
    if (!strip || !count) return undefined
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const warp = () => {
      frame = 0
      if (reduce) return
      const box = strip.getBoundingClientRect()
      const centre = box.left + box.width / 2
      for (const card of strip.children) {
        const r = card.getBoundingClientRect()
        const offset = Math.max(-1.6, Math.min(1.6, (r.left + r.width / 2 - centre) / (box.width / 2)))
        const a = Math.abs(offset)
        card.style.transform = `perspective(1100px) rotateY(${(-offset * 26).toFixed(2)}deg) translateZ(${(-a * 110).toFixed(1)}px) scale(${(1 - a * 0.08).toFixed(3)})`
        card.style.filter = `brightness(${(1 - a * 0.28).toFixed(3)})`
      }
    }
    const onMove = () => { if (!frame) frame = requestAnimationFrame(warp) }
    let dragging = false
    let startX = 0
    let startLeft = 0
    const down = (event) => { if (event.pointerType !== 'mouse') return; dragging = true; startX = event.clientX; startLeft = strip.scrollLeft; strip.classList.add('is-dragging') }
    const move = (event) => { if (dragging) strip.scrollLeft = startLeft - (event.clientX - startX) }
    const up = () => { dragging = false; strip.classList.remove('is-dragging') }
    warp()
    strip.addEventListener('scroll', onMove, { passive: true })
    window.addEventListener('resize', onMove)
    strip.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      strip.removeEventListener('scroll', onMove)
      window.removeEventListener('resize', onMove)
      strip.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      cancelAnimationFrame(frame)
    }
  }, [ref, count])
}

// "What we photograph": a big type index on one side and an arched photo stage on the other.
// Hovering (or tapping through) a row wipes its photo into the arch; when nobody hovers it plays through on its own.
function CategoryIndex({ cards }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || cards.length < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = window.setInterval(() => setActive((current) => (current + 1) % cards.length), 3200)
    return () => window.clearInterval(timer)
  }, [paused, cards.length])
  const current = cards[Math.min(active, cards.length - 1)]
  return <div className="hm-cx" onMouseLeave={() => setPaused(false)}>
    <div className="hm-cx-stage" aria-hidden="true">
      <div className="hm-cx-arch">
        {cards.map((card, index) => <span key={card.id || index} className={'hm-cx-shot' + (index === active ? ' is-on' : '')}>
          {card.image ? <img src={sizedImage(card.image, 900)} alt="" loading="lazy" /> : <i />}
        </span>)}
      </div>
      <svg className="hm-cx-stamp" viewBox="0 0 120 120"><defs><path id="hm-cx-ring" d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0" /></defs><text fontSize="11.2"><textPath href="#hm-cx-ring">captora · every kind of story · </textPath></text><circle cx="60" cy="60" r="4" /></svg>
      <span className="hm-cx-tag"><b>{String(active + 1).padStart(2, '0')}</b><span>/ {String(cards.length).padStart(2, '0')}</span><em key={active}>{current?.name}</em></span>
    </div>
    <ol className="hm-cx-list">
      {cards.map((card, index) => <li key={card.id || index}>
        <SmartLink to={card.link} fallback="/portfolio" className={'hm-cx-row' + (index === active ? ' is-on' : '')} onMouseEnter={() => { setActive(index); setPaused(true) }} onFocus={() => { setActive(index); setPaused(true) }}>
          <span className="hm-cx-num">{String(index + 1).padStart(2, '0')}</span>
          <span className="hm-cx-name">{card.name}</span>
          {card.image && <img className="hm-cx-thumb" src={sizedImage(card.image, 200)} alt="" loading="lazy" />}
          <span className="hm-cx-go"><ArrowUpRight size={20} /></span>
        </SmartLink>
      </li>)}
    </ol>
  </div>
}

// "What we do": photo strips side by side; the one you hover (or tap) opens wide with its story,
// the rest stay as slim dark slices with their names standing upright. On phones the strips stack.
function ServiceStrips({ items }) {
  const [active, setActive] = useState(0)
  return <div className="hm-sx">
    {items.map((service, index) => {
      const image = service.mediaType === 'video' ? getVideoPoster({ video: service.video, image: service.image }) : service.images?.[0] || service.image
      const on = index === active
      return <Link to="/services" key={service.id || index} className={'hm-sx-item' + (on ? ' is-on' : '')} aria-label={service.title}
        onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)}
        onClick={(event) => { if (!on) { event.preventDefault(); setActive(index) } }}>
        {image ? <img src={sizedImage(image, 1100)} alt="" loading="lazy" onError={handleCoverError} /> : <i />}
        <span className="hm-sx-shade" />
        <span className="hm-sx-num">{String(index + 1).padStart(2, '0')}</span>
        <span className="hm-sx-vert" aria-hidden="true">{service.title}</span>
        <span className="hm-sx-body">
          <span className="hm-sx-title">{service.title}</span>
          {service.description && <span className="hm-sx-text">{service.description}</span>}
          <span className="hm-sx-more">Discover <ArrowUpRight size={16} /></span>
        </span>
      </Link>
    })}
  </div>
}

export default function Home() {
  const [saved, setSaved] = useState(null)
  const [gallery, setGallery] = useState([])
  const [services, setServices] = useState([])
  const [reviewItems, setReviewItems] = useState([])
  const [film, setFilm] = useState(null)
  const strip = useRef(null)
  const content = useMemo(() => mergeHomeContent(saved, defaultHomeContent), [saved])

  useEffect(() => {
    let active = true
    getPublicPageContent('home').then((data) => { if (active) setSaved(data) }).catch(() => {})
    getPublicGallery().then((items) => { if (active) setGallery(items) }).catch(() => {})
    getPublicServices().then((items) => { if (active) setServices(items.filter((item) => item.isActive !== false)) }).catch(() => {})
    getPublicFeedback().then((items) => { if (active) setReviewItems(items) }).catch(() => {})
    return () => { active = false }
  }, [])

  useReveal(`${saved ? 1 : 0}-${gallery.length}-${services.length}-${reviewItems.length}`)

  const { hero, marquee, intro, work, categories, film: filmCopy, services: servicesCopy, process, reviews, clients } = content
  const portrait = gallery.find((item) => /photographer portrait/i.test(item.category || ''))
  const stories = gallery.filter((item) => item !== portrait && !/homepage hero/i.test(item.category || ''))
  const photoStories = stories.filter((item) => item.type !== 'video' && item.image)

  const slides = hero.slides.filter((slide) => isActive(slide) && slide.image)
  const galleryHeroVideo = gallery.find((item) => item.type === 'video' && item.video && /homepage hero/i.test(item.category || ''))
  const heroVideo = hero.mode === 'video' ? (hero.video || galleryHeroVideo?.video) : ''
  const heroPoster = hero.videoPoster || (galleryHeroVideo && getStoryCover(galleryHeroVideo)) || slides[0]?.image

  // Tunnel hero: up to 18 photos from the gallery, or the hero slides when the gallery is empty.
  const tunnelPhotos = (photoStories.length ? photoStories.flatMap((item) => (item.images?.length ? item.images : [item.image])) : slides.map((slide) => slide.image)).filter(Boolean).slice(0, 18)
  const words = marquee.words.filter((word) => isActive(word) && word.text)
  const workItems = work.source === 'custom'
    ? work.items.filter((item) => isActive(item) && item.image).map((item) => ({ ...item, link: item.link || '/portfolio' }))
    : photoStories.slice(0, Math.max(1, Number(work.galleryCount) || 10)).map((item) => ({ id: item.id, image: item.image, title: item.title, category: item.category, link: '/portfolio' }))
  const categoryCards = categories.items.filter(isActive).map((card) => {
    const name = (card.name || '').toLowerCase()
    const match = card.image ? null : photoStories.find((item) => (item.category || '').toLowerCase() === name) || photoStories.find((item) => name && (item.category || '').toLowerCase().includes(name.split(' ')[0]))
    return { ...card, image: card.image || match?.image || '' }
  })
  const galleryFilm = stories.find((item) => item.type === 'video' && item.video)
  const featuredFilm = filmCopy.video
    ? { video: filmCopy.video, title: filmCopy.title || 'Captora film', poster: filmCopy.poster || getVideoPoster({ video: filmCopy.video }) }
    : galleryFilm && { video: galleryFilm.video, title: filmCopy.title || galleryFilm.title, poster: filmCopy.poster || getVideoPoster(galleryFilm) }
  const steps = process.steps.filter((step) => isActive(step) && (step.title || step.text))
  const introPhoto = intro.photo || portrait?.image || photoStories[0]?.image
  const bodyParagraphs = (intro.body || '').split(/\n\s*\n/).filter((line) => line.trim())

  useWarpCarousel(strip, workItems.length)

  function scrollStrip(direction) {
    const el = strip.current
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return <div className="hm-page">
    {hero.show !== false && hero.mode === 'tunnel' && <TunnelHero photos={tunnelPhotos}>
        {hero.eyebrow && <p className="hm-eyebrow hm-rise"><span />{hero.eyebrow}</p>}
        <h1 className="hm-rise hm-rise-2"><Rich text={hero.title} /></h1>
        {hero.text && <p className="hm-hero-text hm-rise hm-rise-3">{hero.text}</p>}
        <div className="hm-hero-actions hm-rise hm-rise-4">
          {hero.primaryLabel && <SmartLink to={hero.primaryLink} fallback="/portfolio" className="hm-btn hm-btn-gold">{hero.primaryLabel} <ArrowUpRight size={18} /></SmartLink>}
          {hero.secondaryLabel && <SmartLink to={hero.secondaryLink} fallback="/contact" className="hm-btn hm-btn-ghost">{hero.secondaryLabel}</SmartLink>}
        </div>
    </TunnelHero>}

    {hero.show !== false && hero.mode !== 'tunnel' && <section className="hm-hero">
      {heroVideo ? <BackgroundVideo src={heroVideo} poster={heroPoster} /> : <Slides slides={slides.length ? slides : defaultHomeContent.hero.slides} seconds={hero.slideSeconds} />}
      <div className="hm-hero-shade" aria-hidden="true" />
      <div className="hm-viewfinder" aria-hidden="true">
        <i className="tl" /><i className="tr" /><i className="bl" /><i className="br" />
        {hero.showHud !== false && <>
          <span className="hm-hud hm-hud-tl"><b className="hm-rec" />REC <Timecode /></span>
          {hero.hudRight && <span className="hm-hud hm-hud-tr">{hero.hudRight}</span>}
        </>}
      </div>
      <div className="hm-wrap hm-hero-copy">
        {hero.eyebrow && <p className="hm-eyebrow hm-rise"><span />{hero.eyebrow}</p>}
        <h1 className="hm-rise hm-rise-2"><Rich text={hero.title} /></h1>
        {hero.text && <p className="hm-hero-text hm-rise hm-rise-3">{hero.text}</p>}
        <div className="hm-hero-actions hm-rise hm-rise-4">
          {hero.primaryLabel && <SmartLink to={hero.primaryLink} fallback="/portfolio" className="hm-btn hm-btn-gold">{hero.primaryLabel} <ArrowUpRight size={18} /></SmartLink>}
          {hero.secondaryLabel && <SmartLink to={hero.secondaryLink} fallback="/contact" className="hm-btn hm-btn-ghost">{hero.secondaryLabel}</SmartLink>}
        </div>
      </div>
      <a className="hm-scroll" href="#hm-next" aria-label="Scroll to discover"><span>Scroll</span><ArrowDown size={16} /></a>
    </section>}

    <span id="hm-next" />

    {marquee.show !== false && words.length > 0 && <div className="hm-marquee" aria-hidden="true">
      <div className="hm-marquee-track">
        {[0, 1].map((copy) => <span key={copy}>{words.map((word) => <em key={word.id}>{word.text}<i>✦</i></em>)}</span>)}
      </div>
    </div>}

    {intro.show !== false && <section className="hm-intro hm-wrap">
      <div className="hm-intro-photo" data-reveal>
        {introPhoto && <img src={sizedImage(introPhoto, 900)} alt="Behind the lens at Captora" loading="lazy" />}
        {intro.badge && <span className="hm-intro-badge"><Camera size={18} strokeWidth={1.5} /> {intro.badge}</span>}
      </div>
      <div className="hm-intro-copy" data-reveal>
        <Eyebrow text={intro.eyebrow} />
        <h2><Rich text={intro.title} /></h2>
        {bodyParagraphs.map((line, index) => <p key={index}>{line}</p>)}
        <div className="hm-intro-foot">
          {intro.signature && <span className="hm-signature">{intro.signature}</span>}
          {intro.linkLabel && <SmartLink to={intro.linkTo} fallback="/about" className="hm-link">{intro.linkLabel} <ArrowUpRight size={17} /></SmartLink>}
          {intro.secondLinkLabel && <SmartLink to={intro.secondLinkTo} fallback="/work/wedding-photography" className="hm-link">{intro.secondLinkLabel} <ArrowUpRight size={17} /></SmartLink>}
        </div>
      </div>
    </section>}

    {work.show !== false && workItems.length > 0 && <section className="hm-work" data-reveal>
      <div className="hm-wrap hm-section-head">
        <div><Eyebrow text={work.eyebrow} /><h2><Rich text={work.title} /></h2></div>
        <div className="hm-strip-nav">
          <button type="button" onClick={() => scrollStrip(-1)} aria-label="Scroll work left"><ArrowLeft size={20} /></button>
          <button type="button" onClick={() => scrollStrip(1)} aria-label="Scroll work right"><ArrowRight size={20} /></button>
        </div>
      </div>
      <div className="hm-strip" ref={strip}>
        {workItems.map((item, index) => <SmartLink to={item.link} fallback="/portfolio" className="hm-frame" key={item.id || index}>
          <span className="hm-frame-img"><img src={sizedImage(item.image, 1000)} alt={item.title || 'Captora photograph'} loading="lazy" /></span>
          <span className="hm-frame-meta"><small>{String(index + 1).padStart(2, '0')}{item.category ? ' · ' + item.category : ''}</small>{item.title && <strong>{item.title}</strong>}</span>
        </SmartLink>)}
        {work.moreLabel && <Link to="/portfolio" className="hm-frame hm-frame-more"><span><Rich text={work.moreLabel} /></span><ArrowUpRight size={30} strokeWidth={1.4} /></Link>}
      </div>
    </section>}

    {categories.show !== false && categoryCards.length > 0 && <section className="hm-cats hm-wrap" data-reveal>
      <div className="hm-section-head hm-section-head-center">
        <div><Eyebrow text={categories.eyebrow} center /><h2><Rich text={categories.title} /></h2></div>
      </div>
      <CategoryIndex cards={categoryCards} />
    </section>}

    {filmCopy.show !== false && featuredFilm && <section className="hm-film" data-reveal>
      <button type="button" className="hm-film-frame" onClick={() => setFilm(featuredFilm)} aria-label={'Play film: ' + featuredFilm.title}>
        {featuredFilm.poster && <img src={sizedImage(featuredFilm.poster, 2000)} alt="" loading="lazy" onError={handleCoverError} />}
        <span className="hm-film-shade" />
        <span className="hm-film-copy">
          {filmCopy.eyebrow && <span className="hm-eyebrow hm-eyebrow-center"><span />{filmCopy.eyebrow}<span /></span>}
          <strong>{featuredFilm.title}</strong>
          <span className="hm-film-play"><Play size={30} fill="currentColor" /></span>
          {filmCopy.buttonLabel && <small>{filmCopy.buttonLabel}</small>}
        </span>
      </button>
    </section>}

    {servicesCopy.show !== false && services.length > 0 && <section className="hm-services hm-wrap" data-reveal>
      <div className="hm-section-head">
        <div><Eyebrow text={servicesCopy.eyebrow} /><h2><Rich text={servicesCopy.title} /></h2></div>
        {servicesCopy.linkLabel && <Link to="/services" className="hm-link">{servicesCopy.linkLabel} <ArrowUpRight size={17} /></Link>}
      </div>
      <ServiceStrips items={services.slice(0, Math.max(1, Number(servicesCopy.count) || 6))} />
    </section>}

    {process.show !== false && steps.length > 0 && <section className="hm-process" data-reveal>
      <div className="hm-wrap">
        <div className="hm-section-head hm-section-head-center">
          <div><Eyebrow text={process.eyebrow} center /><h2><Rich text={process.title} /></h2></div>
        </div>
        <ol className={'hm-steps count-' + steps.length}>
          {steps.map((step, index) => {
            const Icon = icons[step.icon] || Camera
            return <li key={step.id || index}>
              <span className="hm-step-num">{String(index + 1).padStart(2, '0')}</span>
              <span className="hm-step-icon"><Icon size={24} strokeWidth={1.4} /></span>
              <strong>{step.title}</strong>
              <p>{step.text}</p>
            </li>
          })}
        </ol>
      </div>
    </section>}

    {reviews.show !== false && <Reviews items={reviewItems} copy={reviews} />}

    {clients.show !== false && clients.image && <section className="hm-clients" data-reveal>
      <Eyebrow text={clients.eyebrow} center />
      <div className="hm-clients-img"><img src={sizedImage(clients.image, 2000)} alt={clients.alt || 'Brands and clients photographed by Captora'} loading="lazy" /></div>
    </section>}

    {film && <FilmModal film={film} onClose={() => setFilm(null)} />}
  </div>
}
