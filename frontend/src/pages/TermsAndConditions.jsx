
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, FileText } from 'lucide-react'
import { Link } from 'react-router'
import '../styles/legal.css'

const sections = [
  {
    title: '01. About These Terms',
    paragraphs: [
      'These Terms & Conditions apply to your use of the Captora Photography & Films website and your enquiries about our photography and filmmaking services.',
      'By using this website, you agree to use it lawfully. A specific photography booking may also be governed by a separate quotation, agreement or booking confirmation.',
    ],
  },
  {
    title: '02. Services & Enquiries',
    paragraphs: [
      'We offer photography and visual storytelling services that may include wedding photography, pre-wedding shoots, portraits, events, food, travel, interior, street and product photography, and films.',
      'Website descriptions and portfolio examples are provided to help you understand our work. Availability, scope, deliverables and pricing are confirmed individually.',
      'Submitting an enquiry does not guarantee availability or create a confirmed booking.',
    ],
  },
  {
    title: '03. Booking & Payment',
    paragraphs: [
      'A booking is considered confirmed only after the agreed booking requirements have been communicated and accepted by both parties. These may include a written confirmation, signed agreement, advance payment or other agreed conditions.',
      'Prices, payment schedules, deliverables, travel expenses and any additional charges will be communicated as applicable before a booking is finalised.',
      'Please retain your booking confirmation and payment records for reference.',
    ],
  },
  {
    title: '04. Rescheduling & Cancellation',
    paragraphs: [
      'If you need to cancel or reschedule a session, please contact us as early as possible.',
      'Applicable cancellation charges, refunds, rescheduling availability and treatment of advance payments will depend on the terms agreed for your specific booking and applicable law.',
      'Any special arrangements for emergencies, delays, venue restrictions or circumstances beyond either party’s reasonable control should be discussed promptly.',
    ],
  },
  {
    title: '05. Client Responsibilities',
    paragraphs: [
      'Clients are responsible for providing accurate booking details, communicating important requirements and arranging any permissions or access needed at their chosen venue, where applicable.',
      'Clients should inform us in advance about relevant schedules, restrictions, special requests and changes that may affect the agreed services.',
    ],
  },
  {
    title: '06. Photographs, Films & Copyright',
    paragraphs: [
      'Unless otherwise agreed in writing, intellectual property rights in photographs, films and other creative work remain subject to applicable copyright law and the terms of the relevant booking agreement.',
      'Clients should not reproduce, resell, modify or commercially use delivered work beyond the permissions granted to them. Any extended commercial licence or other usage rights should be agreed in writing.',
      'Portfolio or promotional use of identifiable client work should be handled in accordance with the agreed permissions and applicable law.',
    ],
  },
  {
    title: '07. Portfolio & Website Content',
    paragraphs: [
      'Photographs, videos, text, branding and other creative content displayed on this website may be protected by intellectual property laws. You may not copy, republish, sell or commercially exploit this content without appropriate authorisation.',
      'Portfolio examples are illustrative and do not guarantee identical results in different locations, lighting conditions, venues or circumstances.',
    ],
  },
  {
    title: '08. Website Availability & External Links',
    paragraphs: [
      'We aim to keep the website available and information useful, but we do not guarantee uninterrupted access or that every page will always be error-free.',
      'Links to third-party platforms are provided for convenience. We are not responsible for the content, availability or policies of external websites and services.',
    ],
  },
  {
    title: '09. Liability & Unforeseen Events',
    paragraphs: [
      'We will make reasonable efforts to provide services as agreed. Photography and filmmaking may be affected by factors outside our reasonable control, including weather, venue rules, delays, access restrictions, technical failures or other unforeseen circumstances.',
      'Any remedies, limitations or responsibilities relating to a confirmed booking will be governed by its applicable agreement and the law. Nothing in these terms excludes rights or liabilities that cannot lawfully be excluded.',
    ],
  },
  {
    title: '10. Privacy',
    paragraphs: [
      'Personal information submitted through our website or communications is handled as described in our Privacy Policy.',
    ],
  },
  {
    title: '11. Changes to These Terms',
    paragraphs: [
      'We may update these website terms from time to time. The version published on this page applies to website use from its stated update date. Any separate booking agreement will be governed by its own terms.',
    ],
  },
  {
    title: '12. Applicable Law',
    paragraphs: [
      'These terms are intended to operate subject to the applicable laws of India. Any dispute will be addressed in accordance with applicable law and any valid agreement between the parties.',
    ],
  },
]

function TermsAndConditions() {
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <div className="legal-hero-top">
          <span>CAPTORA PHOTOGRAPHY & FILMS</span>
          <span>CLARITY IN EVERY DETAIL</span>
        </div>

        <motion.div
          className="legal-hero-content"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="legal-icon"><FileText size={25} /></span>
          <p className="legal-eyebrow">CLEAR EXPECTATIONS · BETTER STORIES</p>
          <h1>
            TERMS &
            <br />
            <em>CONDITIONS.</em>
          </h1>
          <p className="legal-hero-description">
            A little clarity goes a long way. Here is how we work together.
          </p>
        </motion.div>

        <div className="legal-hero-bottom">
          <span>LAST UPDATED: 27 OCTOBER 2026</span>
          <a href="#terms-content">READ THE TERMS ↓</a>
        </div>
      </section>

      <section className="legal-content" id="terms-content">
        <aside className="legal-sidebar">
          <p className="legal-eyebrow">IN THIS DOCUMENT</p>
          {sections.map((section) => (
            <a
              key={section.title}
              href={`#terms-${section.title.slice(0, 2)}`}
            >
              {section.title.replace(/^\d+\.\s*/, '')}
            </a>
          ))}
          <a href="#terms-contact">Contact us</a>
        </aside>

        <article className="legal-document">
          <p className="legal-lead">
            Welcome to Captora Photography & Films. These terms explain
            the general conditions for using our website and enquiring
            about our services. Please read them carefully before making
            a booking.
          </p>

          {sections.map((section) => {
            const number = section.title.slice(0, 2)

            return (
              <section
                className="legal-section"
                id={`terms-${number}`}
                key={section.title}
              >
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {number === '10' && (
                  <Link to="/privacy-policy" className="legal-inline-link">
                    Read our Privacy Policy <ArrowUpRight size={15} />
                  </Link>
                )}
              </section>
            )
          })}

          <section className="legal-contact-card" id="terms-contact">
            <p className="legal-eyebrow">NEED CLARIFICATION?</p>
            <h2>Let's talk it through.</h2>
            <p>
              If you have questions about these terms or a potential
              booking, contact our team before proceeding.
            </p>

            <a href="mailto:captoraphotography@gmail.com">
              captoraphotography@gmail.com <ArrowUpRight size={16} />
            </a>
            <a href="tel:+917084861647">
              +91 70848 61647 <ArrowUpRight size={16} />
            </a>
          </section>

          <Link to="/" className="legal-back-link">
            <ArrowLeft size={15} /> BACK TO HOME
          </Link>
        </article>
      </section>
    </main>
  )
}

export default TermsAndConditions
