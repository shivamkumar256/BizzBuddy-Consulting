import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUpRight, Bot, Layers3, Menu, MoveUpRight, Palette, PenTool, X } from 'lucide-react'
import { ContactSection } from './components/ContactSection'
import { PortfolioShowcase } from './components/PortfolioShowcase'
import { SectionHeading } from './components/SectionHeading'
import { AdminApp } from './admin/AdminApp'
import type { PortfolioItem } from './types'

const navItems = [['Home', '#top'], ['About', '#about'], ['Services', '#services'], ['Our Work', '#work'], ['Contact', '#contact']]

export default function App() {
  if (window.location.pathname.startsWith('/admin')) return <AdminApp />
  return <PublicApp />
}

function PublicApp() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [portfolioState, setPortfolioState] = useState<'loading' | 'ready' | 'error'>('loading')
    useEffect(() => {
      document.body.classList.toggle('menu-open', menuOpen)
      return () => document.body.classList.remove('menu-open')
    }, [menuOpen])
    useEffect(() => {
      fetch('/api/public/items')
        .then((response) => { if (!response.ok) throw new Error('Unable to load portfolio'); return response.json() })
        .then((data: PortfolioItem[]) => { setItems(data.filter((item) => item.status === 'published')); setPortfolioState('ready') })
        .catch(() => { setItems([]); setPortfolioState('error') })
    }, [])
      useEffect(() => {
        const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')), { threshold: 0.12 })
        document.querySelectorAll('.reveal').forEach((element) => observer.observe(element))
        return () => observer.disconnect()
      }, [portfolioState])

    const publishedPortfolio = items.filter((item) => item.status === 'published')
    const featured = publishedPortfolio.filter((item) => item.featured)
    const services = [
      ['01', 'Social media management', 'A consistent content rhythm built around your audience and business goals.', Layers3],
      ['02', 'Social media post design', 'Clear, distinctive visual content for feeds that deserve attention.', Palette],
      ['03', 'Reels & short videos', 'Purposeful motion, edited for the way people discover brands now.', MoveUpRight],
      ['04', 'Website development', 'Responsive, considered websites that make the right next step obvious.', PenTool],
      ['05', 'Branding', 'A focused identity system that gives your business a recognisable point of view.', Palette],
      ['06', 'AI & automation', 'Practical systems that remove friction from recurring work.', Bot],
    ] as const
    const process = [
      ['01', 'Discover', 'Understand the opportunity, audience, and ambition.'],
      ['02', 'Strategize', 'Shape a clear direction and the right next move.'],
      ['03', 'Create', 'Turn the strategy into work people can feel and use.'],
      ['04', 'Launch', 'Bring every detail together and put it into motion.'],
      ['05', 'Grow', 'Keep learning, refining, and building momentum.'],
    ]
    return (
      <div className="app-shell">
        <header className="site-header">
          <a className="logo" href="#top" aria-label="BizzBuddy Consulting home">
            <img src="/assets/branding/bizzbuddy-logo.png" alt="BizzBuddy Consulting" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling?.removeAttribute('hidden') }} />
            <span className="logo-fallback" hidden><span className="logo-mark">✦</span><span>BIZZBUDDY<br /><small>CONSULTING</small></span></span>
          </a>
          <nav className={menuOpen ? 'nav is-open' : 'nav'}>{navItems.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}<a className="nav-cta" href="#contact" onClick={() => setMenuOpen(false)}>Let's talk <ArrowUpRight size={16} /></a></nav>
          <button className="icon-button menu-toggle" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
        </header>
        <main id="top">
          <section className="hero"><div className="hero-copy reveal"><div className="hero-brand"><img src="/assets/branding/bizzbuddy-logo.png" alt="BizzBuddy Consulting" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling?.removeAttribute('hidden') }} /><span className="logo-fallback" hidden><span className="logo-mark">✦</span><span>BIZZBUDDY<br /><small>CONSULTING</small></span></span></div><span className="eyebrow hero-eyebrow">GROW SMARTER / SCALE FASTER</span><h1>Business clarity.<br /><em>Digital momentum.</em></h1><p>Business and digital solutions for teams ready to turn good ideas into durable growth.</p><div className="hero-actions"><a className="button button--accent" href="#contact">Let's talk <ArrowUpRight size={17} /></a><a className="button button--quiet" href="#work">Explore our work <ArrowDown size={17} /></a></div></div><div className="hero-aside reveal"><div className="hero-visual-label"><span>BB / 001</span><span>Built for what is next</span></div><div className="grid-visual" aria-hidden="true"><span /><span /><span /><span /></div><p>Strategy / Creative / Systems</p></div></section>
          <section className="trust-strip reveal" aria-label="BizzBuddy capabilities"><span className="eyebrow">What moves us</span>{['Strategy', 'Creative', 'Digital', 'AI & Automation'].map((item, index) => <span className="trust-item" key={item}><i>0{index + 1}</i>{item}</span>)}</section>
          <section className="manifesto reveal" id="about"><div className="manifesto-label"><span className="eyebrow">01 / About</span><span className="line" /></div><div><p className="statement">Make the next move <em>make sense.</em></p><p className="body-copy">BizzBuddy Consulting brings practical business thinking and sharp digital craft together. We help ambitious businesses communicate clearly, work smarter, and create experiences that earn attention.</p></div></section>
          <section className="services-section reveal" id="services"><SectionHeading eyebrow="02 / Services" title="A better way forward." description="Focused support across the moments that shape how your business is understood and experienced." /><div className="service-list">{services.map(([number, title, copy, Icon]) => <div className="service-row" key={number}><span>{number}</span><div className="service-title"><span className="service-icon"><Icon size={18} /></span><h3>{title}</h3></div><p>{copy}</p><MoveUpRight size={22} /></div>)}</div></section>
          <section className="work-section reveal" id="work"><div className="work-header"><SectionHeading eyebrow="03 / Our work" title="Selected work" description="Selected work created by BizzBuddy Consulting." /></div>{portfolioState === 'loading' ? <div className="empty-state"><h3>Selected work</h3><p>New BizzBuddy Consulting projects will appear here.</p></div> : <PortfolioShowcase items={publishedPortfolio} />}</section>
          {featured.length > 0 && <section className="featured-section reveal"><div className="featured-top"><span className="eyebrow">Featured work</span><span>Selected highlights <ArrowUpRight size={16} /></span></div><div className="featured-track">{featured.map((item) => <a className="featured-card" href="#work" key={item.id}><img src={item.thumbnail_url} alt="" /><div><span className="card-kicker">{item.type}</span><h3>{item.title}</h3></div></a>)}</div></section>}
          <section className="process-section reveal"><div className="process-intro"><span className="eyebrow">04 / How we work</span><h2>Clarity at every <em>step.</em></h2><p>A considered process keeps the work focused, useful, and moving in the right direction.</p></div><div className="process-grid">{process.map(([number, title, copy]) => <article key={number}><span className="process-number">{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
          <ContactSection />
        </main>
        <footer className="site-footer"><div><a className="logo" href="#top"><img src="/assets/branding/bizzbuddy-logo.png" alt="BizzBuddy Consulting" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling?.removeAttribute('hidden') }} /><span className="logo-fallback" hidden><span className="logo-mark">✦</span><span>BIZZBUDDY<br /><small>CONSULTING</small></span></span></a><p>GROW SMARTER SCALE FASTER</p></div><div className="footer-column"><span className="card-kicker">Explore</span><a href="#about">About</a><a href="#services">Services</a><a href="#work">Our work</a><a href="#contact">Contact</a></div><div className="footer-column"><span className="card-kicker">Services</span><span>Social media</span><span>Websites</span><span>Branding & creative</span><span>AI & automation</span></div><div className="footer-column"><span className="card-kicker">Social</span><span>Social links coming soon</span></div><div className="footer-bottom"><span>© 2026 BizzBuddy Consulting. All rights reserved.</span><a href="#top">Back to top <ArrowUpRight size={15} /></a></div></footer>
      </div>
    )
}
