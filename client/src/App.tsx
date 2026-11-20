import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import { DeskProvider } from './state/desk'
import { CommandPalette, HelpDialog, IdentityDialog, Rail, TopBar, useShortcuts } from './components/shell'
import { Toaster } from './components/ui'
import { Dashboard } from './routes/Dashboard'
import { Lots } from './routes/Lots'
import { LotDetail } from './routes/LotDetail'
import { Holds } from './routes/Holds'
import { DailyClose } from './routes/DailyClose'
import { Setup } from './routes/Setup'
import { MarketingLayout } from './routes/marketing/MarketingLayout'
import { Home } from './routes/marketing/Home'
import { Features } from './routes/marketing/Features'
import { Pricing } from './routes/marketing/Pricing'
import { About } from './routes/marketing/About'
import { Contact } from './routes/marketing/Contact'
import { SignIn } from './routes/marketing/SignIn'
import { Register } from './routes/marketing/Register'
import { Legal } from './routes/marketing/Legal'

const TITLES: Array<{ match: (p: string) => boolean; title: string; crumb: string }> = [
  { match: (p) => p === '/app' || p === '/app/', title: 'Home', crumb: 'Jade Pink' },
  { match: (p) => p.startsWith('/app/lots/'), title: 'Parcel', crumb: 'Parcels' },
  { match: (p) => p.startsWith('/app/lots'), title: 'Parcels', crumb: 'Jade Pink' },
  { match: (p) => p.startsWith('/app/holds'), title: 'Problems', crumb: 'Jade Pink' },
  { match: (p) => p.startsWith('/app/close'), title: 'Day-end count', crumb: 'Jade Pink' },
  { match: (p) => p.startsWith('/app/setup'), title: 'People & settings', crumb: 'Jade Pink' },
]

function Shell() {
  const { pathname } = useLocation()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [identityOpen, setIdentityOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    const open = () => setHelpOpen(true)
    window.addEventListener('jp:help', open)
    return () => window.removeEventListener('jp:help', open)
  }, [])

  useShortcuts(
    () => setPaletteOpen(true),
    () => setIdentityOpen(true),
  )

  const meta = TITLES.find((t) => t.match(pathname)) ?? { title: 'Home', crumb: 'Jade Pink' }

  return (
    <div className="app">
      <Rail onIdentity={() => setIdentityOpen(true)} />
      <div className="main">
        <TopBar title={meta.title} crumb={meta.crumb} onSearch={() => setPaletteOpen(true)} onHelp={() => setHelpOpen(true)} />
        <main className="content" id="main">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="lots" element={<Lots />} />
            <Route path="lots/:lotId" element={<LotDetail />} />
            <Route path="holds" element={<Holds />} />
            <Route path="close" element={<DailyClose />} />
            <Route path="setup" element={<Setup />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <IdentityDialog open={identityOpen} onClose={() => setIdentityOpen(false)} />
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Toaster />
    </div>
  )
}

function NotFound() {
  return (
    <div className="empty" style={{ paddingBlock: 'var(--sp-20)' }}>
      <p className="empty__title">This page doesn’t exist</p>
      <p className="empty__body">Use the menu on the left, or go back home.</p>
      <Link to="/app" className="btn btn--secondary">
        Go home
      </Link>
    </div>
  )
}

function MarketingNotFound() {
  return (
    <section className="mx-page-hero mx-404">
      <div className="mx-page-hero__grid" aria-hidden="true" />
      <div className="mx-container mx-head mx-head--center">
        <p className="mx-mono mx-dim">404 · no such gate</p>
        <h1 className="mx-h1">This page skipped a step.</h1>
        <p className="mx-sub">The link may be old. Everything else is one click away.</p>
        <div className="mx-hero__cta">
          <Link to="/" className="mx-btn mx-btn--light mx-btn--lg">Back home</Link>
          <Link to="/app" className="mx-btn mx-btn--ghost mx-btn--lg">Open the desk</Link>
        </div>
      </div>
    </section>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <DeskProvider>
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/register" element={<Register />} />
            <Route path="/terms" element={<Legal kind="terms" />} />
            <Route path="/privacy" element={<Legal kind="privacy" />} />
            <Route path="*" element={<MarketingNotFound />} />
          </Route>
          <Route path="/app/*" element={<Shell />} />
        </Routes>
      </DeskProvider>
    </BrowserRouter>
  )
}
