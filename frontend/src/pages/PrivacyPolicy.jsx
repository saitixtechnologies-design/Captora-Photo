
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import '../styles/legal.css'

const sections = [
  {
    title: '01. Information We Collect',
    paragraphs: [
      'When you contact Captora Photography & Films or submit a photography enquiry, you may provide your name, email address, phone number, event date, event location, preferred service and any message you choose to share.',
      'We may also receive information you voluntarily share with us through WhatsApp, email or other communication channels.',
    ],
  },
  {
    title: '02. How We Use Your Information',
    paragraphs: [
      'We use your information to respond to enquiries, discuss photography requirements, check availability, communicate about bookings and provide the services you request.',
      'We may also use relevant booking details to coordinate a photoshoot, deliver agreed work and provide customer support.',
    ],
  },
  {
    title: '03. Communication & Enquiries',
    paragraphs: [
      'When you contact us by email, telephone or WhatsApp, your information may be processed by the respective service provider according to its own privacy policy and settings.',
      'Submitting an enquiry does not automatically confirm a booking. We will communicate the next steps and any applicable booking requirements separately.',
    ],
  },
  {
    title: '04. Photography, Films & Personal Images',
    paragraphs: [
      'Photography and filming may involve personal images, voices, event details and other information about identifiable individuals.',
      'We will handle client photographs and films according to the agreed service arrangements and applicable law. Public display, promotional use or portfolio publication of identifiable client work should be based on the appropriate permission or other valid legal basis.',
      'If you have a concern about an image or film featuring you, contact us so we can review your request.',
    ],
  },
  {
    title: '05. Sharing & Disclosure',
    paragraphs: [
      'We do not intend to sell your personal contact information. Information may be shared with service providers or collaborators where reasonably necessary to handle an enquiry, deliver an agreed service, store or transfer files, or operate our communications.',
      'Information may also be disclosed where required by applicable law or to protect legitimate rights and safety.',
    ],
  },
  {
    title: '06. Data Security & Retention',
    paragraphs: [
      'We take reasonable steps to protect information entrusted to us. However, no method of electronic transmission or storage can be guaranteed to be completely secure.',
      'Enquiry details, booking records, photographs and films may be retained for as long as reasonably necessary for the relevant service, business records, agreed deliverables or legal obligations.',
    ],
  },
  {
    title: '07. Your Choices & Requests',
    paragraphs: [
      'You may contact us to request access to, correction of, or deletion of personal information where applicable law permits. Some records may need to be retained to meet contractual or legal obligations.',
      'You can also choose not to provide optional information, although this may limit our ability to respond to certain requests or plan a booking.',
    ],
  },
  {
    title: '08. External Websites & Services',
    paragraphs: [
      'Our website may link to third-party platforms such as WhatsApp or other external websites. We do not control their privacy practices. Please review the relevant provider’s privacy information before sharing personal data with them.',
    ],
  },
  {
    title: '09. Updates to This Policy',
    paragraphs: [
      'We may update this Privacy Policy when our practices, services or legal requirements change. The latest version will be published on this page with its updated date.',
    ],
  },
]

function PrivacyPolicy() {
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <div className="legal-hero-top">
          <span>CAPTORA PHOTOGRAPHY & FILMS</span>
          <span>YOUR TRUST MATTERS</span>
        </div>

        <motion.div
          className="legal-hero-content"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="legal-icon"><ShieldCheck size={25} /></span>
          <p className="legal-eyebrow">TRANSPARENCY · TRUST · RESPECT</p>
          <h1>
            PRIVACY
            <br />
            <em>POLICY.</em>
          </h1>
          <p className="legal-hero-description">
            Your stories are personal. Your information should be treated
            with the same care.
          </p>
        </motion.div>

        <div className="legal-hero-bottom">
          <span>LAST UPDATED: 27 OCTOBER 2026</span>
          <a href="#privacy-content">READ THE POLICY ↓</a>
        </div>
      </section>

      <section className="legal-content" id="privacy-content">
        <aside className="legal-sidebar">
          <p className="legal-eyebrow">IN THIS DOCUMENT</p>
          <a href="#privacy-content">Overview</a>
          {sections.map((section) => (
            <a
              key={section.title}
              href={`#privacy-${section.title.slice(0, 2)}`}
            >
              {section.title.replace(/^\d+\.\s*/, '')}
            </a>
          ))}
          <a href="#privacy-contact">Contact us</a>
        </aside>

        <article className="legal-document">
          <p className="legal-lead">
            At Captora Photography & Films, based in Lucknow, Uttar Pradesh,
            we respect your privacy. This policy explains what information
            you may share with us, how we use it and how you can contact us
            about your personal information.
          </p>

          {sections.map((section) => {
            const number = section.title.slice(0, 2)

            return (
              <section
                className="legal-section"
                id={`privacy-${number}`}
                key={section.title}
              >
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            )
          })}

          <section className="legal-contact-card" id="privacy-contact">
            <p className="legal-eyebrow">QUESTIONS ABOUT YOUR PRIVACY?</p>
            <h2>We're here to help.</h2>
            <p>
              Contact us if you have questions about this policy or your
              personal information.
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

export default PrivacyPolicy
