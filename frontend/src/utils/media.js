// Ask for a photo at the width a spot needs, so a phone never downloads the full-size file.
// Works for photos stored in the database (/api/media/:id) and Unsplash links; other URLs are unchanged.
export function sizedImage(url, width = 1200) {
  if (!url) return ''
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
