export async function adminApi(path, options = {}) {
  const isForm = options.body instanceof FormData
  const response = await fetch('/api' + path, {
    credentials: 'include',
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  })

  if (response.status === 204) return null
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || payload.message || 'Something went wrong.')
  return payload
}

export async function getPublicServices() {
  const response = await fetch('/api/public/services')
  if (!response.ok) throw new Error('Could not load services.')
  return (await response.json()).items
}

export async function getPublicGallery() {
  const response = await fetch('/api/public/gallery')
  if (!response.ok) throw new Error('Could not load gallery.')
  return (await response.json()).items
}

export async function getPublicPortfolioContent() {
  const response = await fetch('/api/public/portfolio-content')
  if (!response.ok) throw new Error('Could not load the portfolio page.')
  return (await response.json()).content
}

export async function getPublicPageContent(page) {
  const response = await fetch('/api/public/page-content/' + encodeURIComponent(page))
  if (!response.ok) throw new Error('Could not load the page content.')
  return (await response.json()).content
}

export async function getPublicFeedback() {
  const response = await fetch('/api/public/feedback')
  if (!response.ok) throw new Error('Could not load client feedback.')
  return (await response.json()).items
}

