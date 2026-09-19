export type PortfolioType = 'post' | 'reel' | 'website' | 'branding' | 'other'
export type PortfolioStatus = 'draft' | 'published'

export interface PortfolioItem {
  id: string
  type: PortfolioType
  title: string
  description: string
  thumbnail_url: string
  media_url: string
  client: string
  website_url: string
  category: string
  tags: string[]
  date: string
  featured: boolean
  status: PortfolioStatus
  created_at: string
  updated_at: string
}
