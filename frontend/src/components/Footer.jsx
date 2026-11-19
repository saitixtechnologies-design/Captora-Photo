import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaWhatsapp, FaYoutube } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { Link } from 'react-router'
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
  { to: '/feedback', label: 'Client Feedback' },
  { to: '/contact', label: 'Contact' },
]
const socials = [
  { href: 'https://www.instagram.com/', label: 'Instagram', icon: FaInstagram },
  { href: 'https://www.youtube.com/@Captora', label: 'YouTube', icon: FaYoutube },
  { href: 'https://www.facebook.com/Captora', label: 'Facebook', icon: FaFacebookF },
  { href: 'https://twitter.com/captora', label: 'X (Twitter)', icon: FaXTwitter },
]

// The giant script wordmark draws itself (stroke first, then fill) when it scrolls into view.
function useInView(ref) {
  const [seen, setSeen] = useState(() => typeof window === 'undefined' || !('IntersectionObserver' in window))
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return undefined
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setSeen(true); observer.disconnect() } }, { threshold: 0.35 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, seen])
  return seen
}

function Footer() {
  const year = new Date().getFullYear()
  const markRef = useRef(null)
  const drawn = useInView(markRef)

  return (
    <footer className="sf">
      <div className="sf-frame">
        <div className="sf-top">
          <Link to="/" className="sf-logo" aria-label="Captora home"><span className="sf-script">Captora</span><small>Photography &amp; Films</small></Link>
          <div className="sf-stickers">
            <a className="sf-bubble" href="https://wa.me/917084861647" target="_blank" rel="noreferrer">
              <FaWhatsapp size={18} /> Say hi on WhatsApp
            </a>
            <Link to="/contact" className="sf-star" aria-label="Book a shoot">
              <svg viewBox="0 0 200 200" aria-hidden="true" className="sf-star-shape">
                <path d="M100 4l14 30 31-12 1 33 33 3-13 31 28 19-28 19 13 31-33 3-1 33-31-12-14 30-14-30-31 12-1-33-33-3 13-31-28-19 28-19-13-31 33-3 1-33 31 12z" />
              </svg>
              <span className="sf-star-text">Book<br />a shoot<ArrowUpRight size={18} /></span>
            </Link>
          </div>
        </div>

        <h2 className="sf-headline">Have a story in mind? <em>Let’s make something that stays.</em></h2>

        <div className="sf-panel">
          <div className="sf-col">
            <h3>Explore</h3>
            {explore.map((link) => <Link key={link.to} to={link.to}>{link.label}</Link>)}
          </div>
          <div className="sf-col">
            <h3>Studio</h3>
            {studio.map((link) => <Link key={link.to} to={link.to}>{link.label}</Link>)}
          </div>
          <div className="sf-col sf-contact">
            <h3>Get in touch</h3>
            <a href="tel:+917084861647"><Phone size={16} />+91 70848 61647</a>
            <a href="mailto:captoraphotography@gmail.com"><Mail size={16} />captoraphotography@gmail.com</a>
            <span><MapPin size={16} />Lucknow, Uttar Pradesh · India</span>
          </div>
          <div className="sf-col">
            <h3>Follow</h3>
            <div className="sf-socials">
              {socials.map(({ href, label, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={'Captora on ' + label} title={label}><Icon size={17} /></a>)}
            </div>
          </div>
        </div>

        <div className={'sf-mark' + (drawn ? ' is-drawn' : '')} ref={markRef} aria-hidden="true">
          <svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid meet">
            <text x="600" y="215" textAnchor="middle">Captora</text>
          </svg>
        </div>

        <div className="sf-bottom">
          <span>© {year} Captora Photography &amp; Films</span>
          <div className="sf-legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
          </div>
          <button type="button" className="sf-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top <ArrowUp size={15} /></button>
        </div>
      </div>
    </footer>
  )
}

export default Footer
