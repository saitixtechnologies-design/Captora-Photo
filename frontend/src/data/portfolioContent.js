// Default text of the Portfolio page. Admin → Portfolio → Page content edits a copy of this,
// saved in the database; anything the admin leaves out falls back to these values.
// Photos for each section come from Admin → Portfolio → Photos & films (matched by category).

export const sectionLayouts = [
  { value: 'photos-left', label: 'Photos left, text right' },
  { value: 'photos-right', label: 'Text left, photos right' },
  { value: 'banner', label: 'Title centred, photo strip below' },
]

export const defaultPortfolioContent = {
  signature: 'Abhishek',
  hero: {
    title: 'PORTFOLIO',
    sideTop: 'PHOTOGRAPHY &',
    sideBottom: 'VIDEOGRAPHY',
    metaName: 'Abhishek Pratap Singh',
    metaRole: 'Photographer & Filmmaker',
    metaStudio: 'Captora Photography & Films',
    metaLocation: 'Lucknow · India',
    photo: '',
    banner: '',
  },
  about: {
    heading: 'WHO I AM?',
    name: 'ABHISHEK PRATAP SINGH',
    role: 'Photographer & Videographer',
    facts: [
      { label: 'Based in', value: 'Lucknow, Uttar Pradesh' },
      { label: 'Studio', value: 'Captora Photography & Films' },
      { label: 'Work', value: 'Weddings · Food · Travel · Product · Films' },
    ],
    body: 'I’m Abhishek Pratap Singh, a photographer and videographer from Lucknow. Through Captora Photography & Films I tell stories of people, places, food and celebrations — honestly, warmly and with an eye for the small details that make each one personal.\n\nWhether it is a wedding, a restaurant menu, a hotel interior or a product launch, I plan every shoot around the story it needs to tell, and I stay with it until the last frame is right.\n\nMy goal is simple: photographs and films you will still want to look at years from now.',
    photo: '',
    caption: 'ABHISHEK · CAPTORA',
  },
  highlights: {
    heading: 'PORTFOLIO HIGHLIGHTS',
  },
  sections: [
    {
      id: 'food-beverage', show: true, category: 'Food & Beverage', title: 'FOOD & BEVERAGE', layout: 'photos-left',
      intro: 'Food photography for restaurants, cafés, hotels and brands — styled, lit and shot to make every dish look as good as it tastes.',
      detailHeading: 'MENU & BRAND SHOOTS',
      detailText: 'From single-dish close-ups to full menu shoots and kitchen stories, every frame is planned with the chef and styled on set.',
      tags: 'Restaurants · Cafés · Hotels · Brands',
    },
    {
      id: 'travel', show: true, category: 'Travel', title: 'TRAVEL', layout: 'banner',
      intro: 'Places, people and light from the road — landscapes, cityscapes and quiet moments collected across India and beyond.',
      detailHeading: 'DESTINATION STORIES',
      detailText: 'Travel series for tourism boards, hotels and personal journeys, captured in natural light.',
      tags: 'Landscapes · Cities · Culture',
    },
    {
      id: 'wedding', show: true, category: 'Wedding', title: 'WEDDING', layout: 'photos-right',
      intro: 'Weddings told as they really happened — the rituals, the laughter, the glances and the quiet moments in between.',
      detailHeading: 'THE BIG DAY',
      detailText: 'Pre-wedding shoots, ceremonies and receptions, documented with a calm, unobtrusive approach.',
      tags: 'Pre-wedding · Ceremony · Reception',
    },
    {
      id: 'interior', show: true, category: 'Interior', title: 'INTERIOR', layout: 'photos-left',
      intro: 'Architecture and interiors photographed with clean lines and natural light, so every space feels as welcoming in a photo as it does in person.',
      detailHeading: 'SPACES & ARCHITECTURE',
      detailText: 'Homes, hotels, restaurants and offices — shot for designers, architects and hospitality brands.',
      tags: 'Homes · Hotels · Restaurants',
    },
    {
      id: 'street', show: true, category: 'Street', title: 'STREET', layout: 'photos-right',
      intro: 'Everyday life in the streets — light, shadow and the unplanned moments that make a city feel alive.',
      detailHeading: 'CITY STORIES',
      detailText: 'A personal series from the lanes of Lucknow and the cities I travel through.',
      tags: 'Candid · Black & white · Colour',
    },
    {
      id: 'product', show: true, category: 'Product', title: 'PRODUCT', layout: 'photos-right',
      intro: 'Product photography for brands and online stores — bold colour, careful styling and images ready for any campaign.',
      detailHeading: 'BRAND & E-COMMERCE',
      detailText: 'Studio and lifestyle product shoots, from catalogue images to social media campaigns.',
      tags: 'Studio · Lifestyle · E-commerce',
    },
  ],
  films: {
    show: true,
  },
  behind: {
    show: true,
    category: 'Behind the Scenes',
    title: 'BEHIND THE SCENES',
    body: 'Every photograph starts long before the shutter clicks — scouting the location, setting the light, and making the people in front of the camera feel at ease. Here is a look at how the work comes together.',
  },
  contact: {
    titleTop: 'CONTACT',
    titleBottom: 'ME',
    name: 'Abhishek Pratap Singh',
    role: 'Photographer & Videographer',
    phone: '+91 70848 61647',
    email: 'captoraphotography@gmail.com',
    whatsapp: '917084861647',
    instagram: '',
    location: 'Lucknow, Uttar Pradesh, India',
    tagline: 'LET’S WORK TOGETHER',
    photo: '',
  },
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

// Saved values win; missing keys come from the defaults. Lists (sections, facts) are taken as saved.
export function mergePortfolioContent(saved, defaults = defaultPortfolioContent) {
  if (!isPlainObject(saved)) return structuredClone(defaults)
  const out = {}
  for (const [key, value] of Object.entries(defaults)) {
    const savedValue = saved[key]
    if (isPlainObject(value)) out[key] = mergePortfolioContent(savedValue, value)
    else if (Array.isArray(value)) out[key] = Array.isArray(savedValue) ? savedValue : structuredClone(value)
    else out[key] = savedValue === undefined || savedValue === null ? value : savedValue
  }
  return out
}

export function newSection() {
  return {
    id: 'section-' + Math.random().toString(36).slice(2, 8),
    show: true, category: '', title: 'NEW SECTION', layout: 'photos-right',
    intro: '', detailHeading: '', detailText: '', tags: '',
  }
}

// Only web, mail, phone and WhatsApp links are allowed in the contact block.
export function safeLink(url) {
  return /^(https?:|mailto:|tel:)/i.test(url || '') ? url : ''
}
