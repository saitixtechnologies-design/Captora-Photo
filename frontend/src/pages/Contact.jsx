import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { ArrowDown, ArrowUpRight, CalendarCheck, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import { FaInstagram, FaYoutube } from 'react-icons/fa'
import BookingForm from '../components/BookingForm.jsx'
import '../../styles/contact-editorial.css'

const channels = [
  { icon: MessageCircle, label: 'WhatsApp', value: '+91 70848 61647', note: 'Quickest way to reach us', href: 'https://wa.me/917084861647?text=Hello%20Captora%2C%20I%20would%20like%20to%20enquire%20about%20a%20shoot.', external: true },
  { icon: Phone, label: 'Call', value: '+91 70848 61647', note: 'Talk to us directly', href: 'tel:+917084861647' },
  { icon: Mail, label: 'Email', value: 'captoraphotography@gmail.com', note: 'For detailed briefs', href: 'mailto:captoraphotography@gmail.com?subject=Photography%20enquiry' },
]

const nextSteps = [
  { icon: Send, title: 'You send a note', text: 'Share your date, place and what you have in mind.' },
  { icon: MessageCircle, title: 'We reply', text: 'With availability, ideas and a few questions.' },
  { icon: CalendarCheck, title: 'We plan together', text: 'A quick call, a clear plan, and your date is booked.' },
]

function Contact() {
  const { hash } = useLocation()
  useEffect(() => {
    if (hash !== '#enquiry') return undefined
    const timer = window.setTimeout(() => document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    return () => window.clearTimeout(timer)
  }, [hash])

  return <main className="ct-page">
    <section className="ct-hero">
      <img className="ct-hero-img" src="/hero/contact-desk.jpg" alt="" fetchPriority="high" />
      <div className="ct-hero-shade" aria-hidden="true" />
      <div className="ct-frame" aria-hidden="true"><i className="tl" /><i className="tr" /><i className="bl" /><i className="br" /></div>
      <div className="ct-wrap ct-hero-copy">
        <p className="ct-eyebrow ct-rise"><span />The first hello</p>
        <h1 className="ct-rise ct-rise-2">Tell us what<br /><em>you’re dreaming of.</em></h1>
        <p className="ct-hero-text ct-rise ct-rise-3">Big plans, little questions, half-formed ideas — we’re here for all of it.</p>
        <div className="ct-hero-actions ct-rise ct-rise-4">
          <a href="#enquiry" className="ct-btn ct-btn-gold">Send an enquiry <ArrowDown size={17} /></a>
          <a href="https://wa.me/917084861647" target="_blank" rel="noreferrer" className="ct-btn ct-btn-ghost"><MessageCircle size={17} /> WhatsApp us</a>
        </div>
      </div>
    </section>

    <section className="ct-main ct-wrap">
      <aside className="ct-side">
        <p className="ct-eyebrow"><span />Reach us directly</p>
        <h2>Every good story starts with <em>hello.</em></h2>
        <div className="ct-channels">
          {channels.map(({ icon: Icon, label, value, note, href, external }) => <a key={label} className="ct-channel" href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
            <span className="ct-channel-icon"><Icon size={20} strokeWidth={1.6} /></span>
            <span className="ct-channel-text"><small>{label}</small><strong>{value}</strong><em>{note}</em></span>
            <ArrowUpRight className="ct-channel-arrow" size={18} />
          </a>)}
          <div className="ct-channel is-static">
            <span className="ct-channel-icon"><MapPin size={20} strokeWidth={1.6} /></span>
            <span className="ct-channel-text"><small>Based in</small><strong>Lucknow, Uttar Pradesh</strong><em>Available across India &amp; worldwide</em></span>
          </div>
        </div>
        <div className="ct-social">
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Captora on Instagram"><FaInstagram size={18} /></a>
          <a href="https://www.youtube.com/@Captora" target="_blank" rel="noreferrer" aria-label="Captora on YouTube"><FaYoutube size={18} /></a>
          <span>Follow the latest stories</span>
        </div>
      </aside>

      <div className="ct-form-card" id="enquiry">
        <p className="ct-eyebrow"><span />Your enquiry</p>
        <h2>Let’s make it <em>personal.</em></h2>
        <BookingForm />
      </div>
    </section>

    <section className="ct-steps">
      <div className="ct-wrap">
        <p className="ct-eyebrow ct-eyebrow-center"><span />What happens next<span /></p>
        <ol>
          {nextSteps.map(({ icon: Icon, title, text }, index) => <li key={title}>
            <span className="ct-step-icon"><Icon size={22} strokeWidth={1.5} /></span>
            <span className="ct-step-num">{String(index + 1).padStart(2, '0')}</span>
            <strong>{title}</strong>
            <p>{text}</p>
          </li>)}
        </ol>
      </div>
    </section>
  </main>
}

export default Contact
