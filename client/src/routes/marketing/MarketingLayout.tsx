import { Outlet, Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Menu, Moon, Sun, X } from 'lucide-react'
import { useTheme } from '../../lib/theme'
import { useEffect, useState } from 'react'

const NAV = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="mx-mark-g" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: 'var(--jade, #7DF0C4)' }} />
          <stop offset="1" style={{ stopColor: 'var(--pink, #F7A8CF)' }} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="7" style={{ fill: 'var(--bg-1, #0B0B0E)' }} stroke="url(#mx-mark-g)" strokeOpacity=".7" />
      {/* the ticket: punched hole + eight gate ticks */}
      <circle cx="7.4" cy="12" r="1.6" fill="url(#mx-mark-g)" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={11 + i * 2.4} y={8} width="1.1" height="8" rx=".55" fill="url(#mx-mark-g)" opacity={1 - i * 0.2} />
      ))}
    </svg>
  )
}

export function MarketingLayout() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { theme, toggle } = useTheme()
  const themeLabel = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'

  // Marketing is always the dark canvas — paint the root so overscroll never flashes paper.
  useEffect(() => {
    const html = document.documentElement
    html.dataset.surface = 'mkt'
    return () => {
      delete html.dataset.surface
    }
  }, [])

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  // New page → top of page, menu closed.
  useEffect(() => {
    setOpen(false)
    if (!window.location.hash) window.scrollTo({ top: 0 })
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="mx">
      <a href="#mx-main" className="mx-skip">
        Skip to content
      </a>

      <header className="mx-nav" data-scrolled={scrolled || undefined} data-open={open || undefined}>
        <div className="mx-nav__bar">
          <Link to="/" className="mx-brand" aria-label="Jade Pink home">
            <Mark />
            <span className="mx-brand__name">Jade Pink</span>
          </Link>

          <nav className="mx-nav__links" aria-label="Primary">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className="mx-nav__link">
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="mx-nav__cta">
            <button type="button" className="mx-theme" onClick={toggle} aria-label={themeLabel} title={themeLabel}>
              {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            <Link to="/signin" className="mx-nav__link">
              Sign in
            </Link>
            <Link to="/register" className="mx-btn mx-btn--light mx-btn--sm">
              Start free
            </Link>
          </div>

          <button
            type="button"
            className="mx-nav__menu"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mx-mobile"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div id="mx-mobile" className="mx-nav__mobile" hidden={!open}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="mx-nav__mlink">
              {n.label}
              <ArrowUpRight size={16} />
            </NavLink>
          ))}
          <NavLink to="/signin" className="mx-nav__mlink">
            Sign in
            <ArrowUpRight size={16} />
          </NavLink>
          <button type="button" className="mx-nav__mlink" onClick={toggle}>
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <Link to="/register" className="mx-btn mx-btn--light mx-btn--lg mx-btn--block">
            Start free
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main id="mx-main" className="mx-main">
        <Outlet />
      </main>

      <footer className="mx-footer">
        <div className="mx-container mx-footer__top">
          <div className="mx-footer__brand">
            <Link to="/" className="mx-brand">
              <Mark />
              <span className="mx-brand__name">Jade Pink</span>
            </Link>
            <p>The eight-gate desk for designer-wear stores. Parcel to settlement, on one ticket.</p>
            <span className="mx-status">
              <span className="mx-status__dot" aria-hidden="true" />
              Demo desk is live
            </span>
          </div>
          <div className="mx-footer__cols">
            <div>
              <p className="mx-footer__h">Product</p>
              <Link to="/features">Features</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/app">Open the demo desk</Link>
            </div>
            <div>
              <p className="mx-footer__h">Company</p>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
              <a href="mailto:hello@jadepink.desk">hello@jadepink.desk</a>
            </div>
            <div>
              <p className="mx-footer__h">Legal</p>
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
            </div>
          </div>
        </div>
        <div className="mx-container mx-footer__base">
          <span>© 2026 Jade Pink</span>
          <span className="mx-mono">Made for the back room, not the boardroom.</span>
        </div>
        <div className="mx-footer__word" aria-hidden="true">
          Jade Pink
        </div>
      </footer>
    </div>
  )
}
