// Default text, photos and lists of the homepage. Admin → Homepage edits a saved copy of this;
// anything missing from the saved copy falls back to these values.
// In titles, a new line starts a new line and *words in stars* show in gold italics.

export { mergePortfolioContent as mergeHomeContent } from './portfolioContent.js'

export const uid = (prefix = 'item') => prefix + '-' + Math.random().toString(36).slice(2, 9)

export const stepIcons = [
  { value: 'message', label: 'Message' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'camera', label: 'Camera' },
  { value: 'images', label: 'Photos' },
  { value: 'heart', label: 'Heart' },
  { value: 'sparkles', label: 'Sparkles' },
]

export const defaultHomeContent = {
  hero: {
    show: true,
    mode: 'tunnel',
    eyebrow: 'Captora Photography & Films · Lucknow',
    title: 'For the moments\nthat *become* memories.',
    text: 'Weddings, portraits and films — told honestly, warmly and beautifully, across Lucknow and beyond.',
    primaryLabel: 'View portfolio',
    primaryLink: '/portfolio',
    secondaryLabel: 'Book a shoot',
    secondaryLink: '/contact',
    showHud: true,
    hudRight: '4K · 24 FPS · RAW',
    slideSeconds: 6.5,
    video: '',
    videoPoster: '',
    slides: [
      { id: 'slide-couple', active: true, image: '/hero/hero-couple.jpg', label: 'THE WEDDING · GOLDEN HOUR' },
      { id: 'slide-photographer', active: true, image: '/hero/hero-photographer.jpg', label: 'THE RECEPTION · AFTER DARK' },
      { id: 'slide-details', active: true, image: '/hero/hero-details.jpg', label: 'THE DETAILS · MEHENDI & MARIGOLD' },
    ],
  },
  marquee: {
    show: true,
    words: ['Weddings', 'Pre-Wedding', 'Films', 'Portraits', 'Food & Beverage', 'Travel', 'Product', 'Interiors']
      .map((text, index) => ({ id: 'word-' + index, active: true, text })),
  },
  intro: {
    show: true,
    eyebrow: 'A little about us',
    title: 'Not just how it *looked.*\nHow it *felt.*',
    body: 'At Captora, the most beautiful photographs are rarely the planned ones. They are the unscripted laughs, the trembling hands, the people who show up — and the moments you almost miss.\n\nAbhishek Pratap Singh and the Captora team photograph and film weddings, portraits, food, travel and brands with a calm, unhurried eye.',
    photo: '',
    badge: 'Behind the lens',
    signature: 'Abhishek',
    linkLabel: 'Meet the studio',
    linkTo: '/about',
    secondLinkLabel: 'Wedding photography',
    secondLinkTo: '/work/wedding-photography',
  },
  work: {
    show: true,
    eyebrow: 'Selected work',
    title: 'Stories we have *told lately.*',
    source: 'gallery',
    galleryCount: 10,
    moreLabel: 'See the full\n*portfolio*',
    items: [],
  },
  categories: {
    show: true,
    eyebrow: 'What we photograph',
    title: 'Every kind of *story.*',
    items: ['Wedding', 'Pre-Wedding', 'Food & Beverage', 'Travel', 'Product', 'Interior']
      .map((name, index) => ({ id: 'cat-' + index, active: true, name, image: '', link: name === 'Wedding' ? '/work/wedding-photography' : '/portfolio' })),
  },
  film: {
    show: true,
    eyebrow: 'Featured film',
    title: '',
    video: '',
    poster: '',
    buttonLabel: 'Watch the film',
  },
  services: {
    show: true,
    eyebrow: 'Made around your story',
    title: 'What we *do.*',
    linkLabel: 'All services',
    count: 6,
  },
  process: {
    show: true,
    eyebrow: 'How it works',
    title: 'Simple, calm, *personal.*',
    steps: [
      { id: 'step-1', active: true, icon: 'message', title: 'Say hello', text: 'Share your date, place and the story you have in mind — on a call, WhatsApp or the enquiry form.' },
      { id: 'step-2', active: true, icon: 'calendar', title: 'Plan together', text: 'We shape the shot list, timings and mood around you, so the day feels easy and unhurried.' },
      { id: 'step-3', active: true, icon: 'camera', title: 'The shoot', text: 'A calm, quiet presence on the day — guiding gently, catching the moments you would otherwise miss.' },
      { id: 'step-4', active: true, icon: 'images', title: 'Your story, delivered', text: 'Carefully edited photographs and films, delivered in a private gallery made to share and keep.' },
    ],
  },
  reviews: {
    show: true,
    eyebrow: 'Kind words',
    title: 'Loved by the people *we photograph.*',
  },
  clients: {
    show: true,
    eyebrow: 'Trusted by brands & families',
    image: '/captora-client-logos.jpg',
    alt: 'Selected brands and clients: INOX, Hero, NY Cinemas, Purple Basil, Pepsi, MakeMyTrip, VIBGYOR Energy, MuscleBlaze, MovieMax, Jashn Realty, Magicbricks, Rajwada, 12 Realty, Zomato, Oscar and Omaxe.',
  },
}

// Only site paths and web links are used for buttons; anything else falls back to the given path.
export function safeHref(link, fallback = '/') {
  if (typeof link !== 'string' || !link.trim()) return fallback
  const value = link.trim()
  if (value.startsWith('/') && !value.startsWith('//')) return value
  return /^(https?:|mailto:|tel:)/i.test(value) ? value : fallback
}

export const isActive = (item) => item && item.active !== false
