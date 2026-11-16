import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { handleCoverError } from '../utils/youtube.js'

function PortfolioGrid({ items, compact = false }) {
  return (
    <div className={`portfolio-grid ${compact ? 'portfolio-grid-compact' : ''}`}>
      {items.map((item, index) => (
        <motion.article className={`portfolio-card portfolio-card-${index % 3}`} key={item.id} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.65, delay: (index % 2) * 0.08 }}>
          <Link to={item.href || `/portfolio/${item.id}`} className="portfolio-image-link" aria-label={`View ${item.title}`}>
            <div className="portfolio-image-wrap">{item.cover ? <img src={item.cover} alt={`${item.title} photography`} loading={index < 2 ? 'eager' : 'lazy'} onError={handleCoverError} onLoad={handleCoverError} /> : null}<span className="image-arrow"><ArrowUpRight size={19} /></span></div>
            <div className="portfolio-meta"><div><span className="portfolio-category">{item.category}</span><h3>{item.title}</h3></div><span className="portfolio-location">{item.location}</span></div>
          </Link>
        </motion.article>
      ))}
    </div>
  )
}

export default PortfolioGrid
