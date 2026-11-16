import { useEffect, useState } from 'react'
import { Aperture } from 'lucide-react'
import '../../styles/preloader.css'

const LOAD_MS = 1500 // focus + counter
const SHUTTER_MS = 750 // flash and curtains opening
const RING = 2 * Math.PI * 54 // circumference of the progress ring (r = 54)

// A camera viewfinder: the lens focuses while a ring fills to 100%, then the shutter fires and the curtains open.
function Preloader() {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('focus')

  useEffect(() => {
    if (reduceMotion) {
      const timer = window.setTimeout(() => setPhase('done'), 400)
      return () => window.clearTimeout(timer)
    }
    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / LOAD_MS, 1)
      setProgress(Math.round((1 - Math.pow(1 - t, 3)) * 100))
      if (t < 1) frame = requestAnimationFrame(tick)
      else setPhase('shutter')
    }
    frame = requestAnimationFrame(tick)
    // Background tabs pause animation frames; this makes sure the loader always finishes.
    const safety = window.setTimeout(() => { setProgress(100); setPhase((current) => (current === 'focus' ? 'shutter' : current)) }, LOAD_MS + 400)
    return () => { cancelAnimationFrame(frame); window.clearTimeout(safety) }
  }, [reduceMotion])

  useEffect(() => {
    if (phase !== 'shutter') return undefined
    const timer = window.setTimeout(() => setPhase('done'), SHUTTER_MS)
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
    <div className={'pl is-' + phase} role="status" aria-label="Loading Captora Photography and Films">
      <div className="pl-curtain pl-curtain-top" />
      <div className="pl-curtain pl-curtain-bottom" />
      <div className="pl-flash" />

      <div className="pl-stage">
        <div className="pl-frame" aria-hidden="true"><i className="tl" /><i className="tr" /><i className="bl" /><i className="br" /></div>
        <span className="pl-hud pl-hud-tl" aria-hidden="true"><b className="pl-rec" />REC</span>
        <span className="pl-hud pl-hud-tr" aria-hidden="true">AF-C · 4K</span>
        <span className="pl-hud pl-hud-bl" aria-hidden="true">f/1.8 · 1/250 · ISO 400</span>
        <span className="pl-hud pl-hud-br" aria-hidden="true">{String(progress).padStart(3, '0')}%</span>

        <div className="pl-center">
          <div className="pl-lens" aria-hidden="true">
            <span className="pl-focus" />
            <svg viewBox="0 0 120 120" className="pl-ring">
              <circle cx="60" cy="60" r="54" className="pl-ring-track" />
              <circle cx="60" cy="60" r="54" className="pl-ring-fill" style={{ strokeDasharray: RING, strokeDashoffset: RING * (1 - progress / 100) }} />
            </svg>
            <Aperture className="pl-aperture" size={46} strokeWidth={1.1} style={{ transform: `rotate(${progress * 2.4}deg) scale(${0.82 + progress / 550})` }} />
          </div>
          <div className="pl-brand">captora<span>.</span></div>
          <p className="pl-caption">Photography &amp; Films</p>
          <p className="pl-status">{progress < 100 ? 'Focusing' : 'Captured'}</p>
        </div>
      </div>
    </div>
  )
}

export default Preloader
