// Ask for a photo at the width a spot needs, so a phone never downloads the full-size file.
// Works for photos stored in the database (/api/media/:id) and Unsplash links; other URLs are unchanged.
// Never ask for a photo wider than this screen can show (rounded to steps of 200px so the server can reuse sizes).
// Phones then download and decode far smaller files, which keeps scrolling smooth.
function screenCap() {
  if (typeof window === 'undefined') return Infinity
  const needed = Math.min(window.innerWidth || 1200, 1400) * Math.min(window.devicePixelRatio || 1, 2)
  return Math.max(600, Math.ceil(needed / 200) * 200)
}

export function sizedImage(url, requested = 1200) {
  if (!url) return ''
  const width = Math.min(requested, screenCap())
  if (url.startsWith('/api/media/')) return `${url.split('?')[0]}?w=${width}`
  if (url.startsWith('https://images.unsplash.com/')) {
    try {
      const link = new URL(url)
      link.searchParams.set('w', String(width))
      return link.toString()
    } catch { return url }
  }
  return url
}
