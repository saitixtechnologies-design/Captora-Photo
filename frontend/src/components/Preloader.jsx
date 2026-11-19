import { useEffect, useState } from 'react'
import '../../styles/preloader.css'

const DEVELOP_MS = 2300 // polaroid slides out and develops
const EXIT_MS = 800 // polaroid is tossed aside and the curtain lifts

// An instant camera prints a polaroid: it slides out of the slot, the photo develops from dark to colour,
// "captora." writes itself on the border, then the print is tossed aside and the curtain lifts onto the site.
function Preloader() {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('develop')

  useEffect(() => {
    if (reduceMotion) {
      const timer = window.setTimeout(() => setPhase('done'), 400)
      return () => window.clearTimeout(timer)
    }
    let frame
    let start = null
    // The clock starts on the first painted frame, when the CSS animations start too,
    // so the counter and the polaroid stay in step even while the page is busy loading.
    const tick = (now) => {
      if (start === null) start = now
      const t = Math.min((now - start) / DEVELOP_MS, 1)
      setProgress(Math.round(t * t * (3 - 2 * t) * 100))
      if (t < 1) frame = requestAnimationFrame(tick)
      else setPhase('exit')
    }
    frame = requestAnimationFrame(tick)
    // Background tabs pause animation frames; this makes sure the loader always finishes.
    const safety = window.setTimeout(() => { setProgress(100); setPhase((current) => (current === 'develop' ? 'exit' : current)) }, DEVELOP_MS + 1500)
    return () => { cancelAnimationFrame(frame); window.clearTimeout(safety) }
  }, [reduceMotion])

  useEffect(() => {
    if (phase !== 'exit') return undefined
    const timer = window.setTimeout(() => setPhase('done'), EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase === 'done') return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [phase])

  if (phase === 'done') return null

  return (
    <div className={'ld is-' + phase} role="status" aria-label="Loading Captora Photography and Films">
      <div className="ld-curtain" />
      <div className="ld-stage">
        <div className="ld-camera" aria-hidden="true"><span className="ld-slot" /><span className="ld-lens" /><span className="ld-flash" /></div>
        <figure className="ld-print" aria-hidden="true">
          <div className="ld-photo" style={{ '--dev': progress / 100 }}>
            <img src="/hero/hero-couple-sm.jpg" alt="" />
          </div>
          <svg className="ld-sign" viewBox="0 0 300 70"><text x="150" y="52" textAnchor="middle">captora.</text></svg>
        </figure>
        <p className="ld-status" aria-hidden="true"><span>{progress < 100 ? 'Developing' : 'Ready'}</span><b>{String(progress).padStart(2, '0')}%</b></p>
      </div>
    </div>
  )
}

export default Preloader
