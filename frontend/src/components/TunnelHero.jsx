import { useEffect, useRef } from 'react'
import { ArrowDown } from 'lucide-react'
import { sizedImage } from '../utils/media.js'

const GOLDEN_ANGLE = 137.508 * (Math.PI / 180)

// A scroll-driven 3D tunnel: photos sit on a golden-angle spiral that runs into the screen,
// and scrolling flies the camera through it so the photos burst out toward the viewer.
export default function TunnelHero({ photos: allPhotos, children }) {
  // Phones get a shorter tunnel with smaller photos so it stays smooth.
  const small = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(max-width: 760px), (pointer: coarse)').matches)
  const photos = small ? allPhotos.slice(0, 10) : allPhotos
  const sectionRef = useRef(null)
  const cardRefs = useRef([])
  const copyRef = useRef(null)
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduceMotion) return undefined
    const section = sectionRef.current
    if (!section) return undefined
    let frame = 0
    const spacing = 340
    const depth = photos.length * spacing

    function layout() {
      frame = 0
      const rect = section.getBoundingClientRect()
      const travel = Math.max(rect.height - window.innerHeight, 1)
      const progress = Math.min(Math.max(-rect.top / travel, 0), 1)
      const small = window.innerWidth < 700
      const radius = Math.min(window.innerWidth, window.innerHeight) * (small ? 0.42 : 0.36)
      const camera = progress * (depth + 600)
      cardRefs.current.forEach((card, i) => {
        if (!card) return
        const angle = i * GOLDEN_ANGLE
        const r = radius * (0.75 + (i % 4) * 0.12)
        const z = -i * spacing - 400 + camera
        const fadeIn = Math.min(Math.max((z + 3200) / 1400, 0), 1)
        const fadeOut = Math.min(Math.max((700 - z) / 500, 0), 1)
        card.style.transform = `translate(-50%, -50%) translate3d(${(Math.cos(angle) * r).toFixed(1)}px, ${(Math.sin(angle) * r * 0.7).toFixed(1)}px, ${z.toFixed(1)}px) rotate(${((i % 2 ? 1 : -1) * (4 + (i % 5))).toFixed(1)}deg)`
        const opacity = fadeIn * fadeOut
        card.style.opacity = opacity.toFixed(3)
        // Cards that cannot be seen are left out of drawing entirely.
        card.style.visibility = opacity > 0.01 ? 'visible' : 'hidden'
      })
      if (copyRef.current) {
        copyRef.current.style.opacity = String(Math.max(1 - progress * 1.6, 0))
        copyRef.current.style.transform = `translateY(${(-progress * 60).toFixed(1)}px) scale(${(1 - progress * 0.08).toFixed(3)})`
      }
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(layout) }
    layout()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame) }
  }, [photos.length, reduceMotion])

  return <section className={'tn' + (reduceMotion ? ' is-static' : '')} ref={sectionRef} aria-label="Captora — photography and films">
    <div className="tn-sticky">
      <div className="tn-scene" aria-hidden="true">
        {photos.map((src, i) => <figure key={src + i} className="tn-card" ref={(el) => { cardRefs.current[i] = el }}>
          <img src={sizedImage(src, small ? 420 : 700)} alt="" loading={i < 6 ? 'eager' : 'lazy'} />
        </figure>)}
      </div>
      <div className="tn-vignette" aria-hidden="true" />
      <div className="tn-copy" ref={copyRef}>{children}</div>
      <span className="tn-hint" aria-hidden="true">Scroll to fly through <ArrowDown size={15} /></span>
    </div>
  </section>
}
