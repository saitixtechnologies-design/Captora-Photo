import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Quote, Star } from 'lucide-react'
import { getPublicFeedback } from '../admin/adminApi.js'
import { sizedImage } from '../utils/media.js'

export default function TestimonialSlider() {
  const [items, setItems] = useState([])
  const [active, setActive] = useState(0)
  useEffect(() => { let mounted = true; getPublicFeedback().then((rows) => { if (mounted) setItems(rows) }).catch(() => {}); return () => { mounted = false } }, [])
  if (!items.length) return null
  const current = items[active % items.length]
  const change = (direction) => setActive((index) => (index + direction + items.length) % items.length)
  return (
    <section className="testimonial-section testimonial-dynamic">
      <div className="testimonial-mark"><Quote size={23} /></div>
      <p className="eyebrow">KIND WORDS, KEPT CLOSE</p>
      <div className="testimonial-stars" aria-label={`${current.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill={index < current.rating ? 'currentColor' : 'none'} />)}</div>
      <blockquote>“{current.message}”</blockquote>
      <div className="testimonial-author testimonial-dynamic-author">{current.image_url && <img src={sizedImage(current.image_url, 160)} alt="" loading="lazy" />}<div><strong>{current.name}</strong><span>Captora client</span></div></div>
      {items.length > 1 && <div className="testimonial-controls"><button type="button" onClick={() => change(-1)} aria-label="Previous testimonial"><ArrowLeft size={17} /></button><span>{String((active % items.length) + 1).padStart(2, '0')} <i>/</i> {String(items.length).padStart(2, '0')}</span><button type="button" onClick={() => change(1)} aria-label="Next testimonial"><ArrowRight size={17} /></button></div>}
    </section>
  )
}
