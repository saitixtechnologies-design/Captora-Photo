import { ArrowUp, ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaWhatsapp, FaYoutube } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import { getPublicGallery } from '../admin/adminApi.js'
import { sizedImage } from '../utils/media.js'
import '../../styles/footer.css'

const explore = [
  { to: '/', label: 'Home' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
]

const studio = [
  { to: '/work/wedding-photography', label: 'Wedding Photography' },
  { to: '/contact', label: 'Contact' },
  { to: '/feedback', label: 'Client Feedback' },
]

const socials = [
  { href: 'https://www.instagram.com/', label: 'Instagram', icon: FaInstagram },
  { href: 'https://www.youtube.com/@Captora', label: 'YouTube', icon: FaYoutube },
  { href: 'https://www.facebook.com/Captora', label: 'Facebook', icon: FaFacebookF },
  { href: 'https://twitter.com/captora', label: 'X (Twitter)', icon: FaXTwitter },
]

// Used until the studio's own wedding photo loads from the gallery.
const fallbackPhoto = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85'

function Footer() {
  const year = new Date().getFullYear()
  const [photo, setPhoto] = useState(fallbackPhoto)

  useEffect(() => {
    let active = true
    getPublicGallery().then((items) => {
      const photos = items.filter((item) => item.type !== 'video' && item.image && item.category !== 'Photographer Portrait')
      const pick = photos.find((item) => /wedding/i.test(item.category)) || photos[0]
      if (active && pick) setPhoto(pick.image)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  return (
    <footer className="cf-footer">
      <section className="cf-shot" aria-labelledby="cf-shot-title">
        <img className="cf-shot-bg" src={sizedImage(photo, 2000)} alt="" loading="lazy" />
        <div className="cf-shot-shade" aria-hidden="true" />
        <div className="cf-viewfinder" aria-hidden="true">
          <i className="tl" /><i className="tr" /><i className="bl" /><i className="br" />
          <span className="cf-hud cf-hud-tl"><b className="cf-rec" />REC</span>
          <span className="cf-hud cf-hud-tr">4K · 24 FPS</span>
          <span className="cf-hud cf-hud-bl">ISO 400 · f/1.8 · 1/250</span>
          <span className="cf-hud cf-hud-br">CAPTORA · LUCKNOW</span>
          <span className="cf-focus" />
        </div>
        <div className="cf-shot-copy">
          <p className="cf-eyebrow"><span />Have a story in mind?<span /></p>
          <h2 id="cf-shot-title">Let’s make something <em>that stays.</em></h2>
          <p className="cf-cta-text">Weddings, portraits, films and brand stories — tell us what you are planning and we will shape the shoot around it.</p>
          <div className="cf-shot-actions">
            <Link to="/contact#enquiry" className="cf-btn cf-btn-gold">Plan your shoot <ArrowUpRight size={18} /></Link>
            <a href="https://wa.me/917084861647" target="_blank" rel="noreferrer" className="cf-btn cf-btn-ghost"><FaWhatsapp size={18} /> Chat on WhatsApp</a>
          </div>
        </div>
      </section>

      <div className="cf-wrap">

        <section className="cf-columns">
          <div className="cf-brand-col">
            <Link to="/" className="cf-brand">captora<span>.</span></Link>
            <p className="cf-tagline">Photographs &amp; films for the moments that matter.</p>
            <p className="cf-place"><MapPin size={17} strokeWidth={1.6} /> Lucknow, Uttar Pradesh · India</p>
          </div>

          <nav className="cf-col" aria-label="Explore">
            <h3>Explore</h3>
            {explore.map((link) => <Link key={link.to} to={link.to}>{link.label}</Link>)}
          </nav>

          <nav className="cf-col" aria-label="Studio">
            <h3>Studio</h3>
            {studio.map((link) => <Link key={link.to} to={link.to}>{link.label}</Link>)}
          </nav>

          <div className="cf-col cf-contact-col">
            <h3>Get in touch</h3>
            <a href="tel:+917084861647"><Phone size={17} strokeWidth={1.6} />+91 70848 61647</a>
            <a href="mailto:captoraphotography@gmail.com"><Mail size={17} strokeWidth={1.6} />captoraphotography@gmail.com</a>
            <a href="https://wa.me/917084861647" target="_blank" rel="noreferrer"><FaWhatsapp size={17} />WhatsApp us</a>
            <div className="cf-socials">
              {socials.map(({ href, label, icon: Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={'Captora on ' + label} title={label}><Icon size={17} /></a>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="cf-giant" aria-hidden="true">CAPTORA</div>

      <div className="cf-wrap">
        <div className="cf-bottom">
          <span>© {year} Captora Photography &amp; Films. All rights reserved.</span>
          <div className="cf-legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
          </div>
          <button type="button" className="cf-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Back to top <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer
