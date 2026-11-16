import { useState } from 'react'
import { Link, useParams } from 'react-router'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { portfolio } from '../data/portfolio.js'

function ProjectDetails() {
  const { id } = useParams()
  const project = portfolio.find((item) => item.id === id) || portfolio[0]
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)
  const slides = project.images.map((src) => ({ src }))
  return (
    <div className="light-page project-page">
      <section className="project-intro wrap"><Link to="/portfolio" className="back-link"><ArrowLeft size={16} /> All stories</Link><div className="project-title-row"><div><p className="eyebrow">{project.category} · {project.year}</p><h1>{project.title}<span>.</span></h1></div><p>{project.description}</p></div><div className="project-facts"><span>{project.location}</span><span>CAPTORA PHOTO JOURNAL</span></div></section>
      <button type="button" className="project-cover" onClick={() => { setImageIndex(0); setLightboxOpen(true) }} aria-label="Open project photos"><img src={project.cover} alt={`${project.title} cover photograph`} /><span>VIEW STORY ↗</span></button>
      <section className="project-gallery wrap"><div className="project-gallery-heading"><p className="eyebrow">THE MOMENTS BETWEEN</p><p>A few frames from this story. Select any image to see it up close.</p></div><div className="project-image-grid">{project.images.map((image, index) => <button type="button" key={image} onClick={() => { setImageIndex(index); setLightboxOpen(true) }}><img src={image} alt={`${project.title} photograph ${index + 1}`} loading="lazy" /><span>0{index + 1}</span></button>)}</div></section>
      <section className="page-end-cta"><p className="eyebrow">LET’S TELL YOUR STORY NEXT</p><h2>Your moments, <em>your way.</em></h2><Link to="/contact" className="text-link">Enquire about your date <ArrowUpRight size={16} /></Link></section>
      <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)} slides={slides} index={imageIndex} on={{ view: ({ index }) => setImageIndex(index) }} />
    </div>
  )
}

export default ProjectDetails
