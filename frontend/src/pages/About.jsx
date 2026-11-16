import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUpRight, Camera, Heart, MapPin, MessageCircle, Sparkles, Sun } from 'lucide-react'
import { Link } from 'react-router'
import { getPublicGallery } from '../admin/adminApi.js'
import { sizedImage } from '../utils/media.js'
import '../../styles/about-editorial.css'

// Used until the studio's own photos load from the gallery.
const fallback = {
  portrait: 'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=85',
  story: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
  detail: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
  quote: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=2000&q=85',
}

const values = [
  { icon: Heart, title: 'People before poses.', text: 'The most beautiful photographs happen when you forget the camera is even there.' },
  { icon: Sun, title: 'Chasing the light.', text: 'We follow the warmth, the shadows and the fleeting light that makes every story unique.' },
  { icon: Sparkles, title: 'Made to be kept.', text: 'Thoughtful compositions and timeless editing create memories you will return to for years.' },
]

const facts = [
  { label: 'Based in', value: 'Lucknow, Uttar Pradesh' },
  { label: 'Available', value: 'Across India & worldwide' },
  { label: 'We photograph', value: 'Weddings · Portraits · Food · Travel · Brands · Films' },
]

const specialities = ['Weddings', 'Pre-Wedding', 'Portraits', 'Films', 'Food & Beverage', 'Interiors', 'Product', 'Travel']

function useRevealOnScroll(key) {
  useEffect(() => {
    const elements = [...document.querySelectorAll('.ab-page [data-reveal]:not(.is-in)')]
    if (!('IntersectionObserver' in window)) { elements.forEach((el) => el.classList.add('is-in')); return undefined }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); observer.unobserve(entry.target) } })
    }, { threshold: 0.15 })
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [key])
}

export default function About() {
  const [gallery, setGallery] = useState([])
  useEffect(() => {
    let active = true
    getPublicGallery().then((items) => { if (active) setGallery(items) }).catch(() => {})
    return () => { active = false }
  }, [])
  useRevealOnScroll(gallery.length)

  const photos = gallery.filter((item) => item.type !== 'video' && item.image && !/homepage hero/i.test(item.category || ''))
  const portrait = photos.find((item) => /photographer portrait/i.test(item.category || ''))?.image
  const others = photos.filter((item) => !/photographer portrait/i.test(item.category || ''))
  const pick = (pattern, index) => others.find((item) => pattern.test(item.category || ''))?.image || others[index]?.image
  const storyPhoto = pick(/^wedding$/i, 0) || fallback.story
  const detailPhoto = pick(/pre-?wedding|portrait/i, 1) || fallback.detail
  const quotePhoto = pick(/travel/i, 2) || fallback.quote

  return <main className="ab-page">
    <section className="ab-hero">
      <img className="ab-hero-img" src="/hero/about-lucknow.jpg" alt="" fetchPriority="high" />
      <div className="ab-hero-shade" aria-hidden="true" />
      <div className="ab-frame" aria-hidden="true"><i className="tl" /><i className="tr" /><i className="bl" /><i className="br" /></div>
      <div className="ab-wrap ab-hero-copy">
        <p className="ab-eyebrow ab-rise"><span />About Captora</p>
        <h1 className="ab-rise ab-rise-2">We notice the<br /><em>little things.</em></h1>
        <p className="ab-hero-text ab-rise ab-rise-3">A Lucknow photography and film studio with a soft spot for honest moments, warm light and stories told beautifully.</p>
        <a href="#ab-meet" className="ab-btn ab-btn-ghost ab-rise ab-rise-4">Discover our story <ArrowDown size={17} /></a>
      </div>
      <span className="ab-hero-tag"><MapPin size={14} /> Rumi Darwaza · Lucknow</span>
    </section>

    <section className="ab-meet ab-wrap" id="ab-meet">
      <div className="ab-meet-photo" data-reveal>
        <img src={sizedImage(portrait || fallback.portrait, 1000)} alt="Abhishek Pratap Singh, founder of Captora" loading="lazy" />
        <span className="ab-meet-badge"><Camera size={18} strokeWidth={1.5} /> Founder &amp; lead photographer</span>
      </div>
      <div className="ab-meet-copy" data-reveal>
        <p className="ab-eyebrow"><span />Meet the photographer</p>
        <h2>Hi, I’m <em>Abhishek.</em></h2>
        <p>I’m Abhishek Pratap Singh, the photographer and filmmaker behind Captora Photography &amp; Films. For me, photography has always been about people — the emotions, the details and the in-between moments that make a story yours.</p>
        <p>From Lucknow, our small team photographs and films weddings, portraits, food, interiors, products and travel. Every shoot is planned around you, so the day feels relaxed and the photographs feel like you.</p>
        <dl className="ab-facts">
          {facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
        </dl>
        <span className="ab-signature">Abhishek</span>
      </div>
    </section>

    <section className="ab-philosophy">
      <div className="ab-wrap ab-philosophy-inner">
        <div className="ab-collage" data-reveal>
          <img className="ab-collage-main" src={sizedImage(storyPhoto, 1100)} alt="A quiet, genuine wedding moment" loading="lazy" />
          <img className="ab-collage-small" src={sizedImage(detailPhoto, 700)} alt="A detail from a Captora story" loading="lazy" />
          <span className="ab-collage-stamp">Capturing<br />what matters</span>
        </div>
        <div className="ab-philosophy-copy" data-reveal>
          <p className="ab-eyebrow"><span />Our philosophy</p>
          <h2>Less directing.<br /><em>More feeling.</em></h2>
          <p>You don’t need to know how to pose, and you don’t need to plan every second. You just need to be present with the people and moments that matter most.</p>
          <p>We take care of the details, find the right light and give your story room to unfold naturally — so the photographs feel personal, never forced.</p>
          <div className="ab-tags">{specialities.map((name) => <span key={name}>{name}</span>)}</div>
          <Link to="/portfolio" className="ab-link">Explore our work <ArrowUpRight size={17} /></Link>
        </div>
      </div>
    </section>

    <section className="ab-quote" data-reveal>
      <img src={sizedImage(quotePhoto, 2000)} alt="" loading="lazy" />
      <div className="ab-quote-shade" aria-hidden="true" />
      <div className="ab-quote-copy">
        <p className="ab-eyebrow ab-eyebrow-center"><span />A little note to you<span /></p>
        <blockquote>“You don’t need to know how to be photographed. <em>You just need to show up as yourself.</em>”</blockquote>
        <small>Your story · Your people · Your moments</small>
      </div>
    </section>

    <section className="ab-values ab-wrap">
      <div className="ab-values-head" data-reveal>
        <div><p className="ab-eyebrow"><span />The way we see it</p><h2>Our kind of <em>magic.</em></h2></div>
        <p>The little things we believe in, and bring to every story we have the privilege of telling.</p>
      </div>
      <div className="ab-values-grid">
        {values.map(({ icon: Icon, title, text }, index) => <article className="ab-value" key={title} data-reveal style={{ transitionDelay: `${index * 120}ms` }}>
          <span className="ab-value-num">{String(index + 1).padStart(2, '0')}</span>
          <span className="ab-value-icon"><Icon size={24} strokeWidth={1.4} /></span>
          <strong>{title}</strong>
          <p>{text}</p>
        </article>)}
      </div>
      <div className="ab-values-cta" data-reveal>
        <Link to="/contact#enquiry" className="ab-btn ab-btn-dark">Tell us about your story <ArrowUpRight size={17} /></Link>
        <a href="https://wa.me/917084861647" target="_blank" rel="noreferrer" className="ab-link"><MessageCircle size={17} /> Chat on WhatsApp</a>
      </div>
    </section>
  </main>
}
