import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Plus } from 'lucide-react'
import { Eyebrow, MovingBorder, Reveal } from './fx'

type Tier = {
  name: string
  monthly: number | null
  note: string
  cta: string
  to: string
  features: string[]
  featured?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Solo',
    monthly: 0,
    note: 'One store, one tablet.',
    cta: 'Start free',
    to: '/register',
    features: ['Up to 50 lots a month', 'All eight gates', 'Daily close', 'Local data in this browser', 'Email support'],
  },
  {
    name: 'Store',
    monthly: 2999,
    note: 'Per store. Everyone on the shift included.',
    cta: 'Start 14-day trial',
    to: '/register',
    featured: true,
    features: ['Unlimited lots', 'Multi-user roles', 'Holds and queries', 'API mode with Express backend', 'Priority support'],
  },
  {
    name: 'Chain',
    monthly: null,
    note: 'Many stores, one view.',
    cta: 'Talk to us',
    to: '/contact',
    features: ['Multi-store roll-up', 'SSO and audit log', 'Dedicated onboarding', 'SLA and phone support', 'Custom integrations'],
  },
]

const FAQ = [
  ['Do I pay per person?', 'No. The desk is shared across shifts, so you pay per store. Add as many profiles as the store needs.'],
  ['Where does my data live?', 'In Solo, inside the browser on the tablet. In Store and Chain, on your own server in API mode — we never host your records.'],
  ['Can I move from Solo to Store later?', 'Yes. Export from Setup and import into API mode. Lot numbers, holds and history come with you.'],
  ['What happens after the trial?', 'You choose a plan or drop back to Solo. Nothing is deleted.'],
]

const inr = (n: number) => '₹' + n.toLocaleString('en-IN')

export function Pricing() {
  const [yearly, setYearly] = useState(true)

  return (
    <>
      <section className="mx-page-hero">
        <div className="mx-page-hero__grid" aria-hidden="true" />
        <div className="mx-container">
          <Reveal className="mx-head mx-head--center">
            <Eyebrow>Pricing</Eyebrow>
            <h1 className="mx-h1">
              Pay for the desk,
              <br />
              <em className="mx-serif">not the seats.</em>
            </h1>
            <p className="mx-sub">One price per store, however many people work the tablet.</p>

            <div className="mx-toggle" role="radiogroup" aria-label="Billing period">
              <button type="button" role="radio" aria-checked={!yearly} data-on={!yearly || undefined} onClick={() => setYearly(false)}>
                Monthly
              </button>
              <button type="button" role="radio" aria-checked={yearly} data-on={yearly || undefined} onClick={() => setYearly(true)}>
                Yearly <span className="mx-toggle__save">2 months free</span>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-section mx-section--tight">
        <div className="mx-container mx-tiers">
          {TIERS.map((t, i) => {
            const price =
              t.monthly === null ? 'Custom' : t.monthly === 0 ? 'Free' : inr(yearly ? Math.round((t.monthly * 10) / 12) : t.monthly)
            const body = (
              <div className="mx-tier" data-featured={t.featured || undefined}>
                <div className="mx-tier__head">
                  <h3>{t.name}</h3>
                  {t.featured ? <span className="mx-chip mx-chip--live">Most chosen</span> : null}
                </div>
                <div className="mx-tier__price">
                  <span className="mx-tier__amount">{price}</span>
                  {t.monthly ? <span className="mx-dim">/ store / mo</span> : null}
                </div>
                <p className="mx-tier__note">
                  {t.monthly && yearly ? `Billed ${inr(t.monthly * 10)} yearly. ` : ''}
                  {t.note}
                </p>
                <Link to={t.to} className={`mx-btn mx-btn--block mx-btn--lg ${t.featured ? 'mx-btn--light' : 'mx-btn--ghost'}`}>
                  {t.cta}
                  <ArrowRight size={16} />
                </Link>
                <ul className="mx-checks">
                  {t.features.map((f) => (
                    <li key={f}>
                      <Check size={14} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
            return (
              <Reveal key={t.name} delay={i * 80}>
                {t.featured ? <MovingBorder radius={22}>{body}</MovingBorder> : body}
              </Reveal>
            )
          })}
        </div>
      </section>

      <section className="mx-section mx-section--line">
        <div className="mx-container mx-faq">
          <Reveal className="mx-head">
            <Eyebrow>Questions</Eyebrow>
            <h2 className="mx-h2">Asked at every store.</h2>
            <p className="mx-sub">
              Something else? <Link to="/contact" className="mx-link">Write to us</Link>
            </p>
          </Reveal>
          <div className="mx-faq__list">
            {FAQ.map(([q, a]) => (
              <details key={q} className="mx-faq__item">
                <summary>
                  {q}
                  <Plus size={16} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
