const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

export function getYouTubeVideoId(value) {
  if (!value) return ''
  try {
    const url = new URL(value.trim())
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0] || ''
      return YOUTUBE_ID_PATTERN.test(id) ? id : ''
    }
    if (!['youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'music.youtube.com'].includes(host)) return ''
    const parts = url.pathname.split('/').filter(Boolean)
    const id = url.pathname === '/watch'
      ? url.searchParams.get('v') || ''
      : ['embed', 'shorts', 'live', 'v'].includes(parts[0]) ? parts[1] || '' : ''
    return YOUTUBE_ID_PATTERN.test(id) ? id : ''
  } catch {
    return ''
  }
}

// Google Drive share links (drive.google.com/file/d/ID/view) are web pages, not media files.
export function getDriveFileId(value) {
  const match = String(value || '').trim().match(/^https:\/\/(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]{20,})/)
  return match ? match[1] : ''
}
// Direct image address for a Drive photo link; other URLs are returned unchanged.
export function getDrivePhotoUrl(value, width = 2560) {
  const id = getDriveFileId(value)
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${width}` : value
}

// Embeddable player for YouTube links, and for Google Drive video links.
export function getYouTubeEmbedUrl(value, autoplay = false) {
  const driveId = getDriveFileId(value)
  if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`
  const id = getYouTubeVideoId(value)
  if (!id) return ''
  const params = new URLSearchParams({ playsinline: '1', rel: '0' })
  if (autoplay) params.set('autoplay', '1')
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`
}

export function getYouTubeThumbnail(value) {
  if (getDriveFileId(value)) return getDrivePhotoUrl(value, 1200)
  const id = getYouTubeVideoId(value)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
}

export function getVideoPoster(item) {
  if (item?.thumbnail) return item.thumbnail
  const youtubeThumbnail = getYouTubeThumbnail(item?.video)
  if (youtubeThumbnail) return youtubeThumbnail
  return item?.image || ''
}

// Large YouTube thumbnail (no black bars). Not every video has one: YouTube then sends a tiny
// 120px grey placeholder (not an error), so handleCoverError runs on load too and swaps to the
// always-available smaller thumbnail.
export function getYouTubeLargeThumbnail(value) {
  const id = getYouTubeVideoId(value)
  return id ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : ''
}
export function handleCoverError(event) {
  const img = event.currentTarget
  if (!img.src.includes('/maxresdefault.jpg')) return
  if (event.type === 'error' || img.naturalWidth <= 120) {
    // sddefault is 4:3 with black bars above and below a 16:9 video; the yt-thumb class crops them off.
    img.classList.add('yt-thumb')
    img.src = img.src.replace('/maxresdefault.jpg', '/sddefault.jpg')
  }
}

// The picture to show for a story: the photo, or for a video its poster / YouTube or Drive thumbnail.
// Never returns a video address, which would show as a broken image.
export function getStoryCover(item) {
  if (!item) return ''
  if (item.type !== 'video') return item.image || ''
  if (item.thumbnail) return item.thumbnail
  return getYouTubeLargeThumbnail(item.video) || getYouTubeThumbnail(item.video) || ''
}

// Muted, looping, control-free YouTube player for use as a moving background.
export function getYouTubeBackgroundUrl(value) {
  const id = getYouTubeVideoId(value)
  if (!id) return ''
  const params = new URLSearchParams({ autoplay: '1', mute: '1', loop: '1', playlist: id, controls: '0', playsinline: '1', rel: '0', modestbranding: '1', iv_load_policy: '3', disablekb: '1' })
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`
}