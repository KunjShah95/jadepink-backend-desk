import { Link } from 'react-router-dom'
import { ArrowRight, Check, ClipboardCheck, Command, HardDrive, Layers, Receipt, ScanLine, Server, ShieldAlert, Users } from 'lucide-react'
import { Eyebrow, GlowCard, Reveal } from './fx'

const GROUPS = [
  {
    no: '01',
    title: 'Receipt',
    icon: Layers,
    items: ['Blind count before the challan', 'Courier, tracking and box count', 'PO and challan quantities side by side', 'Difference note when counts disagree'],
  },
  {
    no: '02',
    title: 'QC & price hold',
    icon: ShieldAlert,
    items: ['Per-piece accept or reject, with a reason', 'Price-hold date when a tag disagrees', 'Rejected pieces set aside, never lost'],
  },
  {
    no: '03–04',
    title: 'Ironing & tagging',
    icon: ScanLine,
    items: ['Ironed count must match accepted count', 'Scan each piece, mint the barcode', 'Destination: floor or storeroom'],
  },
  {
    no: '05–06',
    title: 'Display & designer accept',
    icon: Users,
    items: ['Rack, mannequin or numbered box', 'Designer review date agreed in advance', 'Marketing approval recorded, not verbal'],
  },
  {
    no: '07',
    title: 'Return to vendor',
    icon: ClipboardCheck,
    items: ['Pull pieces into a numbered box', 'Challan, courier and tracking', 'Acknowledgement count and date'],
  },
  {
    no: '08',
    title: 'Settlement',
    icon: Receipt,
    items: ['Sell bill number', 'Acknowledged back by the designer', 'Payment note', 'Signed by accounts and management'],
  },
]

const PLATFORM = [
  { icon: Command, title: 'Keyboard first', body: 'Press ⌘K anywhere to jump to a lot, a hold or a gate. Every action has a shortcut.' },
  { icon: HardDrive, title: 'Works on one tablet', body: 'Local mode keeps the whole desk in the browser. No server, no setup, no waiting.' },
  { icon: Server, title: 'Grows into a server', body: 'Switch to API mode and the same desk runs against your Express backend and database.' },
]

export function Features() {
  return (
    <>
      <section className="mx-page-hero">
        <div className="mx-page-hero__grid" aria-hidden="true" />
        <div className="mx-container">
          <Reveal className="mx-head mx-head--center">
            <Eyebrow>Features</Eyebrow>
            <h1 className="mx-h1">
              Everything the desk does,
              <br />
              <em className="mx-serif">gate by gate.</em>
            </h1>
            <p className="mx-sub">
              Six groups of work under one lot number. Every action is written into the record with a
              name and a time.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-section mx-section--tight">
        <div className="mx-container">
          <div className="mx-grid3">
            {GROUPS.map(({ no, title, icon: Icon, items }, i) => (
              <Reveal key={title} delay={(i % 3) * 70}>
                <GlowCard className="mx-card mx-card--feature">
                  <div className="mx-card__top">
                    <span className="mx-card__icon">
                      <Icon size={16} />
                    </span>
                    <span className="mx-mono mx-dim">Gate {no}</span>
                  </div>
                  <h3>{title}</h3>
                  <ul className="mx-checks">
                    {items.map((it) => (
                      <li key={it}>
                        <Check size={14} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-section mx-section--line">
        <div className="mx-container">
          <Reveal className="mx-head">
            <Eyebrow>Under the desk</Eyebrow>
            <h2 className="mx-h2">Built for the back room.</h2>
          </Reveal>
          <div className="mx-facts">
            {PLATFORM.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} className="mx-fact" delay={i * 80}>
                <Icon size={18} />
                <h3>{title}</h3>
                <p>{body}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mx-inline-cta">
            <p>See it with real-shaped data.</p>
            <Link to="/app" className="mx-btn mx-btn--light">
              Open the demo desk
              <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
