import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ArrowUpRight, Mail, Phone } from 'lucide-react'
import { FaInstagram, FaWhatsapp, FaYoutube } from 'react-icons/fa'
import '../styles/navbar.css'

const links = [
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Services', to: '/services' },
  { label: 'About', to: '/about' },
  { label: 'Feedback', to: '/feedback' },
]
// No separate "Contact" link: the "Book a shoot" button already opens the contact page.

// The header is a floating "camera dock": the links sit in a mode dial with a gold pill that slides to
// the link you point at (and rests on the current page), and "Book a shoot" is a shutter button.
function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'
  const dialRef = useRef(null)
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu whenever the page changes.
  const routeKey = location.pathname + location.hash
  const [lastRoute, setLastRoute] = useState(routeKey)
  if (lastRoute !== routeKey) {
    setLastRoute(routeKey)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return undefined
    document.body.style.overflow = 'hidden'
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey) }
  }, [open])

  // Move the gold pill under the hovered link, or back to the current page's link.
  const activeIndex = links.findIndex((item) => location.pathname.startsWith(item.to))
  const target = hovered ?? (activeIndex >= 0 ? activeIndex : null)
  const placePill = useCallback(() => {
    const dial = dialRef.current
    if (!dial) return
    const link = target === null ? null : dial.querySelectorAll('.cn-link')[target]
    if (!link) { dial.style.setProperty('--pill-o', '0'); return }
    dial.style.setProperty('--pill-x', link.offsetLeft + 'px')
    dial.style.setProperty('--pill-w', link.offsetWidth + 'px')
    dial.style.setProperty('--pill-o', '1')
  }, [target])
  useLayoutEffect(() => { placePill() }, [placePill, scrolled])
  useEffect(() => {
    window.addEventListener('resize', placePill)
    document.fonts?.ready.then(placePill).catch(() => {})
    return () => window.removeEventListener('resize', placePill)
  }, [placePill])

  const solid = scrolled || !isHome || open
  // "Book a shoot" opens the contact page from the top, even when you are already on it.
  const toTop = () => { setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <header className={'cn-header' + (solid ? ' is-solid' : ' is-clear') + (scrolled ? ' is-scrolled' : '') + (open ? ' is-open' : '')}>
      <div className="cn-shell">
        <Link to="/" className="cn-logo" aria-label="Captora Photography and Films home">
          <span className="cn-logo-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48">
              <path className="cn-vf" d="M3 13V5a2 2 0 0 1 2-2h8M35 3h8a2 2 0 0 1 2 2v8M45 35v8a2 2 0 0 1-2 2h-8M13 45H5a2 2 0 0 1-2-2v-8" />
              <text x="24" y="33" textAnchor="middle">C</text>
              <circle className="cn-rec" cx="38" cy="10" r="2.6" />
            </svg>
          </span>
          <span className="cn-logo-text">
            <span className="cn-logo-name">captora<i>.</i></span>
            <span className="cn-logo-caption">Photography &amp; Films</span>
          </span>
        </Link>

        <nav className="cn-links" aria-label="Main navigation" ref={dialRef} onMouseLeave={() => setHovered(null)}>
          <span className="cn-pill" aria-hidden="true" />
          {links.map((item, index) => (
            <NavLink key={item.to} to={item.to} onMouseEnter={() => setHovered(index)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)}
              className={({ isActive }) => 'cn-link' + (isActive ? ' is-active' : '') + (target === index ? ' is-lit' : '')}>
              <sup>{String(index + 1).padStart(2, '0')}</sup>{item.label}
            </NavLink>
          ))}
        </nav>

        <div className="cn-actions">
          <a className="cn-phone" href="tel:+917084861647" aria-label="Call +91 70848 61647"><Phone size={16} strokeWidth={1.8} /></a>
          <Link to="/contact" className="cn-book" onClick={toTop}>
            <span className="cn-shutter" aria-hidden="true"><i /></span>
            <span>Book a shoot</span>
          </Link>
        </div>

        <button type="button" className="cn-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <span className="cn-toggle-label">{open ? 'Close' : 'Menu'}</span>
          <span className="cn-toggle-icon" aria-hidden="true"><span /><span /></span>
        </button>
      </div>

      <div className={'cn-menu' + (open ? ' is-open' : '')} aria-hidden={!open}>
        <span className="cn-menu-frame" aria-hidden="true" />
        <p className="cn-menu-hud" aria-hidden="true"><b />REC · Menu</p>
        <nav className="cn-menu-links" aria-label="Mobile navigation">
          {[{ label: 'Home', to: '/' }, ...links].map((item, index) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} tabIndex={open ? 0 : -1} style={{ '--i': index }}
              className={({ isActive }) => 'cn-menu-link' + (isActive ? ' is-active' : '')}>
              <sup>{String(index).padStart(2, '0')}</sup><span>{item.label}</span><ArrowUpRight className="cn-menu-arrow" size={20} />
            </NavLink>
          ))}
        </nav>
        <div className="cn-menu-foot">
          <Link to="/contact" className="cn-book cn-book-wide" tabIndex={open ? 0 : -1} onClick={toTop}>
            <span className="cn-shutter" aria-hidden="true"><i /></span>
            <span>Book a shoot</span>
          </Link>
          <div className="cn-menu-contact">
            <a href="tel:+917084861647" tabIndex={open ? 0 : -1}><Phone size={16} strokeWidth={1.6} />+91 70848 61647</a>
            <a href="mailto:captoraphotography@gmail.com" tabIndex={open ? 0 : -1}><Mail size={16} strokeWidth={1.6} />captoraphotography@gmail.com</a>
          </div>
          <div className="cn-menu-social">
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram" tabIndex={open ? 0 : -1}><FaInstagram size={17} /></a>
            <a href="https://www.youtube.com/@Captora" target="_blank" rel="noreferrer" aria-label="YouTube" tabIndex={open ? 0 : -1}><FaYoutube size={17} /></a>
            <a href="https://wa.me/917084861647" target="_blank" rel="noreferrer" aria-label="WhatsApp" tabIndex={open ? 0 : -1}><FaWhatsapp size={17} /></a>
          </div>
          <p>Lucknow, Uttar Pradesh · India</p>
        </div>
      </div>
    </header>
  )
}

export default Navbar
