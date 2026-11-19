import { useEffect, useRef, useState } from 'react'
import { sizedImage } from '../utils/media.js'

const rituals = [
  { name: 'Haldi', colour: '#d99a1e', text: 'Turmeric, laughter and a little chaos — the warmest, brightest morning of the wedding.' },
  { name: 'Mehendi', colour: '#5d7a2c', text: 'Hours of patient henna, songs from the aunties and the first quiet nerves.' },
  { name: 'Sangeet', colour: '#6a2f7d', text: 'Rehearsed dances, unrehearsed moments and a family that finally lets go.' },
  { name: 'Pheras', colour: '#a32e1d', text: 'Seven rounds of the sacred fire — the vows, the glances, the stillness.' },
  { name: 'Vidaai', colour: '#b5566d', text: 'Rice over the shoulder, tight hugs and the tears that say everything.' },
]

// Ritual by ritual: the screen holds still while scrolling moves through each ceremony,
// changing the colour, the photograph and the marigold progress line.
export default function RitualStory({ photos }) {
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const box = el.getBoundingClientRect()
      const travel = Math.max(box.height - window.innerHeight, 1)
      const p = Math.min(Math.max(-box.top / travel, 0), 1)
      setProgress(p)
      setActive(Math.min(rituals.length - 1, Math.floor(p * rituals.length)))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame) }
  }, [])

  const current = rituals[active]
  return <section className="rs" ref={ref} style={{ '--rs-colour': current.colour }} aria-label="The wedding, ritual by ritual">
    <div className="rs-sticky">
      <div className="rs-wrap">
        <div className="rs-copy">
          <p className="rs-eyebrow">Ritual by ritual</p>
          <ol className="rs-list">
            {rituals.map((ritual, i) => <li key={ritual.name} className={i === active ? 'is-active' : i < active ? 'is-done' : ''}>
              <span className="rs-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="rs-name">{ritual.name}</span>
            </li>)}
          </ol>
          <p className="rs-text" key={current.name}>{current.text}</p>
        </div>
        <div className="rs-photos" aria-hidden="true">
          {rituals.map((ritual, i) => {
            const src = photos[i % Math.max(photos.length, 1)]
            return src ? <figure key={ritual.name} className={'rs-photo' + (i === active ? ' is-active' : '')} style={{ '--tilt': `${(i % 2 ? 1 : -1) * (2 + i)}deg` }}>
              <img src={sizedImage(src, 900)} alt="" loading="lazy" />
              <figcaption>{ritual.name}</figcaption>
            </figure> : null
          })}
        </div>
      </div>
      <div className="rs-garland" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} />{rituals.map((ritual, i) => <i key={ritual.name} className={i <= active ? 'is-on' : ''} style={{ left: `${(i / (rituals.length - 1)) * 100}%` }} />)}</div>
    </div>
  </section>
}
