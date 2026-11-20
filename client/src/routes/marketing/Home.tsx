import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, ScanLine, ShieldAlert, Scale, Users, Route as RouteIcon } from 'lucide-react'
import { Barcode, Eyebrow, GlowCard, Marquee, MovingBorder, Reveal, TextGenerate, TracingBeam, trackPointer } from './fx'

const GATES = ['Receive', 'Check', 'Iron', 'Tag', 'Display', 'Approval', 'Return', 'Payment']

const TICKER = [
  ['IN-261114-D1L', 'QC passed', 'Neha K.', '11:42'],
  ['IN-261115-A7K', 'Parcel received · 4 boxes', 'Arjun P.', '11:47'],
  ['IN-261113-R2P', 'Hold B cleared', 'Fatima S.', '11:51'],
  ['IN-261112-M9C', 'Designer accepted', 'Ananya B.', '12:03'],
  ['IN-261110-T4Q', 'RTV box #14 sealed', 'Divya N.', '12:10'],
  ['IN-261116-Q4V', 'Tagged 24 / 24', 'Fatima S.', '12:18'],
  ['IN-261109-B3H', 'Settlement note sent', 'Prateek J.', '12:26'],
]

const STEPS = [
  ['Receive the parcel', 'Blind count before the challan is read. A difference is noted, never ignored.', 'Receiver'],
  ['Check quality & price', 'Each piece accepted or rejected with a reason. A tag that disagrees stops the lot.', 'QC'],
  ['Iron the pieces', 'Ironed count must equal the accepted count. The ledger proves it.', 'Inward team'],
  ['Tag the pieces', 'Scan the piece, print the barcode, send it to the floor or the storeroom.', 'Inward team'],
  ['Put on display', 'Rack, mannequin or box. Designer review date agreed before the walk.', 'Floor team'],
  ['Designer approval', 'Marketing signs off presentation and price. Queries recorded, never verbal.', 'Marketing'],
  ['Send back to designer', 'Pull pieces into a numbered box: challan, courier, acknowledgement.', 'Merchandiser'],
  ['Settle the payment', 'Sell bill, acknowledged back, payment note. Accounts and management both sign.', 'Accounts'],
]

export function Home() {
  return (
    <>
      <Hero />
      <Ticker />
      <Bento />
      <Lifecycle />
      <Closing />
    </>
  )
}

/* ---------------------------------------------------------------- Hero */

function Hero() {
  return (
    <section className="mx-hero" onPointerMove={trackPointer}>
      <div className="mx-hero__grid" aria-hidden="true" />
      <div className="mx-hero__grid mx-hero__grid--lit" aria-hidden="true" />
      <div className="mx-hero__aura" aria-hidden="true" />

      <div className="mx-container mx-hero__copy">
        <Link to="/features" className="mx-pill">
          <span className="mx-pill__tag">New</span>
          Daily close with per-location variance
          <ChevronRight size={14} />
        </Link>

        <h1 className="mx-display">
          <TextGenerate text="From parcel to settlement," accent="on one ticket." start={120} />
        </h1>

        <p className="mx-lede mx-fade" style={{ '--d': '700ms' } as React.CSSProperties}>
          The back-room desk for designer-wear stores. Eight gates, one lot number, and a record
          that matches the shop floor at the end of every day.
        </p>

        <div className="mx-hero__cta mx-fade" style={{ '--d': '820ms' } as React.CSSProperties}>
          <Link to="/register" className="mx-btn mx-btn--light mx-btn--lg">
            Start free
            <ArrowRight size={16} />
          </Link>
          <Link to="/app" className="mx-btn mx-btn--ghost mx-btn--lg">
            Open the demo desk
          </Link>
        </div>
        <p className="mx-hero__note mx-fade" style={{ '--d': '900ms' } as React.CSSProperties}>
          No card. Seeded with twelve real-shaped lots across all eight gates.
        </p>
      </div>

      <div className="mx-container">
        <DeskPreview />
      </div>
    </section>
  )
}

/** A faithful miniature of the lot screen — the product is the hero image. */
function DeskPreview() {
  return (
    <div className="mx-preview" aria-label="Preview of a lot in the desk" role="img">
      <div className="mx-preview__glow" aria-hidden="true" />
      <div className="mx-window">
        <div className="mx-window__bar">
          <span className="mx-window__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="mx-window__url mx-mono">jadepink.desk/app/lots/IN-261114-D1L</span>
          <span className="mx-window__who">
            <span className="mx-avatar">NK</span>
            Neha · QC
          </span>
        </div>

        <div className="mx-window__body">
          <aside className="mx-window__rail" aria-hidden="true">
            {['Desk', 'Lots', 'Holds', 'Close', 'Setup'].map((r, i) => (
              <span key={r} data-on={i === 1 || undefined}>
                {r}
              </span>
            ))}
          </aside>

          <div className="mx-window__main">
            <div className="mx-lothead">
              <div>
                <p className="mx-mono mx-dim">LOT · SABYASACHI · AW26 CAPSULE</p>
                <p className="mx-lothead__id mx-mono">IN-261114-D1L</p>
              </div>
              <div className="mx-lothead__meta">
                <span className="mx-chip mx-chip--live">Step 7 · Return</span>
                <span className="mx-chip">24 pieces</span>
              </div>
            </div>

            <ol className="mx-gates">
              {GATES.map((g, i) => (
                <li key={g} data-state={i < 6 ? 'done' : i === 6 ? 'live' : 'todo'}>
                  <span className="mx-gates__bead" />
                  <span className="mx-gates__name">{g}</span>
                  <span className="mx-gates__stamp mx-mono">{i < 6 ? `${10 + i}:0${i}` : i === 6 ? 'now' : '—'}</span>
                </li>
              ))}
            </ol>

            <div className="mx-ptable">
              <div className="mx-ptable__row mx-ptable__row--head">
                <span>Piece</span>
                <span>Barcode</span>
                <span>Location</span>
                <span>Status</span>
              </div>
              {[
                ['Lehenga, ivory zardozi', 'JP-24-00871', 'Rack 3', 'Boxed'],
                ['Kurta set, sage', 'JP-24-00872', 'Rack 3', 'Boxed'],
                ['Saree, oxblood tissue', 'JP-24-00879', 'Storeroom B', 'Hold B'],
                ['Sherwani, midnight', 'JP-24-00880', 'Mannequin 2', 'Pull'],
              ].map(([p, b, l, s]) => (
                <div key={b} className="mx-ptable__row">
                  <span>{p}</span>
                  <span className="mx-mono mx-dim">{b}</span>
                  <span className="mx-dim">{l}</span>
                  <span>
                    <span className="mx-chip" data-tone={s === 'Hold B' ? 'warn' : s === 'Pull' ? 'live' : 'ok'}>
                      {s}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- Ticker */

function Ticker() {
  return (
    <section className="mx-ticker" aria-label="Example ledger activity">
      <p className="mx-ticker__label mx-mono">The ledger, live</p>
      <Marquee speed={60}>
        {TICKER.map(([lot, what, who, at]) => (
          <span key={lot + what} className="mx-ticker__item">
            <span className="mx-mono mx-ticker__lot">{lot}</span>
            <span>{what}</span>
            <span className="mx-dim">
              {who} · {at}
            </span>
          </span>
        ))}
      </Marquee>
    </section>
  )
}

/* --------------------------------------------------------------- Bento */

function Bento() {
  return (
    <section className="mx-section">
      <div className="mx-container">
        <Reveal className="mx-head">
          <Eyebrow>What the desk does</Eyebrow>
          <h2 className="mx-h2">
            A desk that <em className="mx-serif">refuses</em> to skip a step.
          </h2>
          <p className="mx-sub">
            Every lot carries its own ticket. It is stamped at each gate with a name and a time, and
            it cannot move forward until the checklist is confirmed.
          </p>
        </Reveal>

        <div className="mx-bento">
          <Reveal className="mx-bento__a">
            <GlowCard className="mx-card mx-card--tall">
              <div className="mx-card__text">
                <span className="mx-card__icon">
                  <RouteIcon size={16} />
                </span>
                <h3>Eight gates, one ticket</h3>
                <p>Receipt to settlement. Each gate names who passed it and when — so nobody has to ask.</p>
              </div>
              <div className="mx-viz-gates" aria-hidden="true">
                {GATES.map((g, i) => (
                  <div key={g} className="mx-viz-gates__row" data-state={i < 5 ? 'done' : i === 5 ? 'live' : 'todo'}>
                    <span className="mx-viz-gates__no mx-mono">{String(i + 1).padStart(2, '0')}</span>
                    <span className="mx-viz-gates__bar">
                      <span style={{ inlineSize: i < 5 ? '100%' : i === 5 ? '58%' : '0%' }} />
                    </span>
                    <span className="mx-viz-gates__name">{g}</span>
                  </div>
                ))}
              </div>
            </GlowCard>
          </Reveal>

          <Reveal className="mx-bento__b" delay={80}>
            <GlowCard className="mx-card">
              <div className="mx-card__text">
                <span className="mx-card__icon">
                  <ScanLine size={16} />
                </span>
                <h3>Scan, don’t type</h3>
                <p>The barcode mints itself. Rack, mannequin or box comes from a picker, not a keyboard.</p>
              </div>
              <div className="mx-viz-scan" aria-hidden="true">
                <Barcode value="JP-24-00871" />
                <span className="mx-viz-scan__beam" />
                <span className="mx-mono mx-viz-scan__code">JP-24-00871 · Rack 3</span>
              </div>
            </GlowCard>
          </Reveal>

          <Reveal className="mx-bento__c" delay={40}>
            <GlowCard className="mx-card">
              <div className="mx-card__text">
                <span className="mx-card__icon">
                  <ShieldAlert size={16} />
                </span>
                <h3>Holds stop the piece</h3>
                <p>Not the lot. Severity decides what waits.</p>
              </div>
              <ul className="mx-viz-holds" aria-hidden="true">
                <li data-sev="A">
                  <b>A</b> Stain on pallu <span>Stops piece</span>
                </li>
                <li data-sev="B">
                  <b>B</b> Loose hook <span>Fix in parallel</span>
                </li>
                <li data-sev="C">
                  <b>C</b> Crease, tag side <span>Noted</span>
                </li>
              </ul>
            </GlowCard>
          </Reveal>

          <Reveal className="mx-bento__d" delay={100}>
            <GlowCard className="mx-card">
              <div className="mx-card__text">
                <span className="mx-card__icon">
                  <Scale size={16} />
                </span>
                <h3>A close that proves it</h3>
                <p>System against scanned, by location.</p>
              </div>
              <div className="mx-viz-close" aria-hidden="true">
                {[
                  ['Floor · Rack 3', 42, 42],
                  ['Mannequins', 6, 6],
                  ['Storeroom B', 18, 17],
                ].map(([l, s, c]) => {
                  const v = Number(c) - Number(s)
                  return (
                    <div key={String(l)}>
                      <span>{l}</span>
                      <span className="mx-mono mx-dim">
                        {s} / {c}
                      </span>
                      <span className="mx-mono" data-v={v === 0 ? 'ok' : 'off'}>
                        {v === 0 ? '±0' : v}
                      </span>
                    </div>
                  )
                })}
              </div>
            </GlowCard>
          </Reveal>

          <Reveal className="mx-bento__e" delay={160}>
            <GlowCard className="mx-card">
              <div className="mx-card__text">
                <span className="mx-card__icon">
                  <Users size={16} />
                </span>
                <h3>No login on the tablet</h3>
                <p>Pick who’s working. Roles open their gates.</p>
              </div>
              <div className="mx-viz-people" aria-hidden="true">
                {[
                  ['AP', 'Receiver'],
                  ['NK', 'QC'],
                  ['FS', 'Inward'],
                  ['AB', 'Marketing'],
                ].map(([i, r], k) => (
                  <span key={i} className="mx-viz-people__p" data-on={k === 1 || undefined}>
                    <span className="mx-avatar">{i}</span>
                    {r}
                  </span>
                ))}
              </div>
            </GlowCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------- Lifecycle */

function Lifecycle() {
  return (
    <section className="mx-section mx-section--line">
      <div className="mx-container mx-life">
        <Reveal className="mx-head mx-life__head">
          <Eyebrow>How a lot moves</Eyebrow>
          <h2 className="mx-h2">
            Eight gates. <em className="mx-serif">No shortcuts.</em>
          </h2>
          <p className="mx-sub">
            Each gate belongs to a role. The ticket waits at the gate until that person confirms the
            checklist, then the next role sees it in their queue.
          </p>
          <Link to="/features" className="mx-link">
            Every checklist, in detail <ArrowRight size={14} />
          </Link>
        </Reveal>

        <TracingBeam>
          {(p) => (
            <ol className="mx-steps">
              {STEPS.map(([title, body, role], i) => (
                <li key={title} className="mx-step" data-on={p >= (i + 0.25) / STEPS.length || undefined}>
                  <span className="mx-step__no mx-mono">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                  <span className="mx-step__role">{role}</span>
                </li>
              ))}
            </ol>
          )}
        </TracingBeam>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- Closing */

function Closing() {
  return (
    <section className="mx-section">
      <div className="mx-container">
        <Reveal className="mx-final">
          <div className="mx-final__beams" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>
          <h2 className="mx-h2 mx-final__title">
            Retire the notebook.
            <br />
            <em className="mx-serif">Keep the habit.</em>
          </h2>
          <p className="mx-sub">
            The demo store is seeded with twelve lots across all eight gates. Open it, click around,
            break nothing.
          </p>
          <div className="mx-hero__cta">
            <MovingBorder radius={999}>
              <Link to="/register" className="mx-btn mx-btn--dark mx-btn--lg">
                Create your desk
                <ArrowRight size={16} />
              </Link>
            </MovingBorder>
            <Link to="/app" className="mx-btn mx-btn--ghost mx-btn--lg">
              Try the demo
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
