import { useState } from 'react'
import { ArrowUpRight, ExternalLink, Play, X } from 'lucide-react'
import { apiUrl } from '../api'
import type { PortfolioItem } from '../types'

type Filter = 'all' | 'post' | 'reel' | 'website' | 'branding' | 'other'

interface PortfolioShowcaseProps { items: PortfolioItem[] }

const filters: { label: string; value: Filter }[] = [
  { label: 'ALL', value: 'all' }, { label: 'POSTS', value: 'post' }, { label: 'REELS', value: 'reel' }, { label: 'WEBSITES', value: 'website' }, { label: 'BRANDING', value: 'branding' }, { label: 'OTHER', value: 'other' },
]

export function PortfolioShowcase({ items }: PortfolioShowcaseProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<PortfolioItem | null>(null)
  const visibleItems = items.filter((item) => filter === 'all' || item.type === filter)

  return (
    <>
      <div className="filter-row" aria-label="Filter portfolio work">
        {filters.map((option) => (
          <button key={option.value} className={`filter-button ${filter === option.value ? 'is-active' : ''}`} onClick={() => setFilter(option.value)} aria-pressed={filter === option.value}>
            {option.label}
          </button>
        ))}
      </div>
      {items.length === 0 ? <div className="empty-state"><h3>Selected work</h3><p>New BizzBuddy Consulting projects will appear here.</p></div> : visibleItems.length === 0 ? <div className="empty-state">No work in this category yet.</div> : <div className={`work-grid work-grid--${filter}`}>{visibleItems.map((item) => <WorkCard key={item.id} item={item} onOpen={setSelected} />)}</div>}
      {selected && <MediaModal item={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function WorkCard({ item, onOpen }: { item: PortfolioItem; onOpen: (item: PortfolioItem) => void }) {
  const isInteractive = item.type !== 'website'
  return (
    <article className={`work-card work-card--${item.type}`}>
      <button className="work-card__media" onClick={() => isInteractive && onOpen(item)} aria-label={`${item.type === 'post' ? 'Open' : 'Play'} ${item.title}`}>
        <img src={apiUrl(item.thumbnail_url)} alt="" loading="lazy" />
        {item.type === 'reel' && <span className="play-button"><Play size={18} fill="currentColor" /></span>}
        {item.type === 'post' && <span className="media-cue">View still <ArrowUpRight size={16} /></span>}
      </button>
      <div className="work-card__body"><div><span className="card-kicker">{item.type}</span><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div>{item.type === 'website' ? item.website_url ? <a className="text-link" href={item.website_url} target="_blank" rel="noreferrer noopener">View website <ExternalLink size={15} /></a> : null : <button className="text-link" onClick={() => onOpen(item)}>{item.type === 'reel' ? 'View reel' : 'Open project'} <ArrowUpRight size={15} /></button>}</div>
    </article>
  )
}

function MediaModal({ item, onClose }: { item: PortfolioItem; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`media-modal media-modal--${item.type}`} role="dialog" aria-modal="true" aria-label={item.title}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close media viewer"><X size={22} /></button>
        {item.type === 'reel' && item.media_url ? <video src={apiUrl(item.media_url)} poster={apiUrl(item.thumbnail_url)} controls autoPlay /> : <img src={apiUrl(item.media_url || item.thumbnail_url)} alt={item.title} />}
        <div className="modal-caption"><span className="card-kicker">{item.client} / {item.date}</span><h3>{item.title}</h3><p>{item.description}</p></div>
      </div>
    </div>
  )
}
