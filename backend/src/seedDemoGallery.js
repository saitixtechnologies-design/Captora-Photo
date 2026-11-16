// Fills the gallery/portfolio and the services list with placeholder photos from Unsplash (linked, not uploaded) so every
// category looks complete until real work is added.
//   npm run demo-gallery            add the demo stories and services (skips any that already exist)
//   npm run demo-gallery -- --remove   delete every demo story and service again
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDb, createWithId, GalleryMedia, Service } from './db.js'

const photo = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=2000&q=80`
const DEMO_PREFIX = 'https://images.unsplash.com/photo-'

// [title, category, location, grid size, Unsplash photo ids]
const stories = [
  ['Moments in Bloom', 'Portfolio Highlights', '', 'wide', ['1583939003579-730e3918a45a']],
  ['Monuments at Dawn', 'Portfolio Highlights', 'Agra', 'normal', ['1524492412937-b28074a5d7da']],
  ['Plated with Care', 'Portfolio Highlights', '', 'normal', ['1504674900247-0877df9cc836']],
  ['Light at Home', 'Portfolio Highlights', '', 'tall', ['1618221195710-dd6b41faaea6']],

  ['Vows by the Lake', 'Wedding', '', 'wide', ['1591604466107-ec97de577aff', '1519741497674-611481863552']],
  ['The Celebration', 'Wedding', '', 'normal', ['1511285560929-80b456fea0bc', '1583939003579-730e3918a45a']],
  ['Details That Matter', 'Wedding', '', 'tall', ['1515934751635-c81c6bc9a2d8', '1522673607200-164d1b6ce486', '1523438885200-e635ba2c371e']],
  ['Reception Evening', 'Wedding', '', 'normal', ['1464366400600-7168b8af9bc3', '1511795409834-ef04bbd61622']],

  ['Golden Hour Walk', 'Pre-Wedding', '', 'wide', ['1532712938310-34cb3982ef74']],
  ['By the Sea', 'Pre-Wedding', '', 'tall', ['1537633552985-df8429e8048b', '1529636798458-92182e662485']],

  ['Quiet Confidence', 'Portraits', '', 'tall', ['1534528741775-53994a69daeb']],
  ['Studio Light', 'Portraits', '', 'normal', ['1524504388940-b1c1722653e1', '1494790108377-be9c29b29330']],
  ['Colour & Character', 'Portraits', '', 'normal', ['1529139574466-a303027c1d8b', '1507003211169-0a1dd7228f2d']],

  ['Monuments of India', 'Travel', 'Agra · Jaipur', 'wide', ['1524492412937-b28074a5d7da', '1477587458883-47145ed94245']],
  ['Backwaters', 'Travel', 'Kerala', 'normal', ['1506461883276-594a12b11cf3']],
  ['Mountain Lakes', 'Travel', '', 'tall', ['1501785888041-af3ef285b470', '1476514525535-07fb3b4ae5f1']],
  ['Open Roads', 'Travel', '', 'normal', ['1469854523086-cc02fe5d8800', '1507525428034-b723cf961d3e', '1470252649378-9c29740c9fa8']],

  ['Plated Stories', 'Food & Beverage', '', 'wide', ['1504674900247-0877df9cc836', '1540189549336-e6e99c3679fe', '1546069901-ba9599a7e63c']],
  ['Café Mornings', 'Food & Beverage', '', 'normal', ['1495474472287-4d71bcdd2085']],
  ['Dinner Service', 'Food & Beverage', '', 'tall', ['1414235077428-338989a2e8c0', '1565299624946-b28f40a0ae38']],

  ['Modern Living', 'Interior', '', 'wide', ['1618221195710-dd6b41faaea6', '1600210492486-724fe5c67fb0']],
  ['Corners of Calm', 'Interior', '', 'tall', ['1586023492125-27b2c045efd7']],

  ['City in Motion', 'Street', '', 'tall', ['1519501025264-65ba15a82390', '1449824913935-59a10b8d2000']],
  ['Skylines', 'Street', '', 'wide', ['1477959858617-67f85cf4f1df', '1514565131-fce0801e5785']],

  ['Timepieces', 'Product', '', 'normal', ['1523275335684-37898b6baf30']],
  ['Sound & Colour', 'Product', '', 'wide', ['1505740420928-5e560c06d30e', '1526170375885-4d8ecf77b99f']],

  ['On Set', 'Behind the Scenes', '', 'wide', ['1554048612-b6a482bc67e5', '1471341971476-ae15ff5dd4ea']],
  ['The Kit', 'Behind the Scenes', '', 'normal', ['1516035069371-29a1b244cc32', '1452587925148-ce544e77e70d']],
  ['Chasing Light', 'Behind the Scenes', '', 'tall', ['1492691527719-9d1e07e534b4']],
]

// [title, description, coverage details, Unsplash photo ids]
const services = [
  ['Wedding Stories', 'Honest, artful documentation of your day, from the quiet getting-ready moments to the dance floor at midnight.', 'Full-day coverage · Curated online gallery · Heirloom album options', ['1519741497674-611481863552', '1511285560929-80b456fea0bc', '1591604466107-ec97de577aff']],
  ['Pre-wedding', 'A little adventure before the big day. Relaxed, personal photographs that feel unmistakably like the two of you.', 'Location planning · Styling guidance · Digital gallery', ['1532712938310-34cb3982ef74', '1537633552985-df8429e8048b']],
  ['Portraits & Editorial', 'For people, creatives and brands who want imagery with a point of view and a little soul.', 'Creative direction · Studio or on-location · Personal usage licence', ['1534528741775-53994a69daeb', '1524504388940-b1c1722653e1', '1507003211169-0a1dd7228f2d']],
  ['Films & Celebrations', 'Atmosphere, voices and all the in-between details, woven into a film you will return to for years.', 'Cinematic highlight film · Event coverage · Social cutdowns', ['1464366400600-7168b8af9bc3', '1511795409834-ef04bbd61622']],
  ['Food & Beverage', 'Menus, launches and the mood of a dining room, photographed so every plate looks as good as it tastes.', 'Menu & dish photography · Restaurant ambience · Social-ready edits', ['1504674900247-0877df9cc836', '1414235077428-338989a2e8c0', '1495474472287-4d71bcdd2085']],
  ['Interiors & Architecture', 'Spaces shown the way they feel to stand in: light, proportion and the details that make them yours.', 'Homes, hotels & offices · Natural-light styling · Listing-ready images', ['1618221195710-dd6b41faaea6', '1600210492486-724fe5c67fb0', '1586023492125-27b2c045efd7']],
  ['Product & Brand', 'Clean, considered product imagery for catalogues, marketplaces and campaigns.', 'Studio & lifestyle setups · E-commerce ready · Brand shoots', ['1523275335684-37898b6baf30', '1505740420928-5e560c06d30e', '1526170375885-4d8ecf77b99f']],
  ['Travel & Destination', 'Stories from the road, for travellers, hotels and tourism brands who want a sense of place.', 'Destination shoots · Hotel & resort coverage · Travel campaigns', ['1524492412937-b28074a5d7da', '1506461883276-594a12b11cf3', '1501785888041-af3ef285b470']],
]
const demoPattern = '^' + DEMO_PREFIX.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
const isDemoService = { image_url: { $regex: demoPattern } }
const isDemo = { media_url: { $regex: demoPattern } }

try {
  await connectDb()
  if (process.argv.includes('--remove')) {
    const result = await GalleryMedia.deleteMany(isDemo)
    const removedServices = await Service.deleteMany(isDemoService)
    console.log(`Removed ${result.deletedCount} demo stories and ${removedServices.deletedCount} demo services.`)
  } else {
    let added = 0
    for (const [index, [title, category, location, size, ids]] of stories.entries()) {
      if (await GalleryMedia.exists({ ...isDemo, title, category })) continue
      const urls = ids.map(photo)
      // Demo stories sort after real work (sort order 0) and are mixed across categories.
      await createWithId(GalleryMedia, {
        title, category, location, size, media_type: 'image', media_url: urls[0], media_urls: urls, thumbnail_url: urls[0],
        sort_order: 100 + index, is_active: true,
      })
      added++
    }
    console.log(`Added ${added} demo stories (${stories.length - added} were already there).`)
    let addedServices = 0
    for (const [index, [title, description, detail, ids]] of services.entries()) {
      if (await Service.exists({ ...isDemoService, title })) continue
      const urls = ids.map(photo)
      await createWithId(Service, { title, description, detail, image_url: urls[0], media_type: 'image', gallery_urls: urls, sort_order: index + 1, is_active: true })
      addedServices++
    }
    console.log(`Added ${addedServices} demo services (${services.length - addedServices} were already there).`)
  }
  await mongoose.disconnect()
  process.exit(0)
} catch (error) {
  console.error('Could not update the demo gallery:', error.message)
  process.exit(1)
}
