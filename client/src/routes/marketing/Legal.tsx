import { Link } from 'react-router-dom'
import { Eyebrow, Reveal } from './fx'

const TERMS = [
  ['Use of the desk', 'The desk is provided for managing designer-wear store operations. You are responsible for the accuracy of the records you enter.'],
  ['Accounts', 'Each store creates its own profiles. Roles decide which gates a person can pass. Admin can pass every gate.'],
  ['Data', 'In local mode, data lives in your browser. In API mode, data lives on your server. We do not host your store data.'],
  ['Availability', 'We aim for the desk to be available at all times, but we do not guarantee uninterrupted service.'],
  ['Changes', 'We may update these terms. Continued use after a change means you accept it.'],
]

const PRIVACY = [
  ['What we collect', 'Profile names, roles, and the records you enter into the desk. In local mode, none of this leaves your browser.'],
  ['What we do not collect', 'We do not track usage, sell data, or share records with third parties.'],
  ['Cookies', 'None. Only the theme preference and the working-as identity, stored in your browser.'],
  ['Your rights', 'You can rebuild or clear the demo data at any time from Setup. In API mode, your database is yours.'],
  ['Contact', 'Questions about privacy: hello@jadepink.desk.'],
]

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export function Legal({ kind = 'terms' }: { kind?: 'terms' | 'privacy' }) {
  const isPrivacy = kind === 'privacy'
  const items = isPrivacy ? PRIVACY : TERMS

  return (
    <>
      <section className="mx-page-hero mx-page-hero--short">
        <div className="mx-container">
          <Reveal className="mx-head">
            <Eyebrow>Legal</Eyebrow>
            <h1 className="mx-h1">{isPrivacy ? 'Privacy' : 'Terms of use'}</h1>
            <p className="mx-sub">Last updated 20 November 2026. Plain language, no surprises.</p>
            <div className="mx-toggle mx-toggle--left" role="tablist" aria-label="Legal documents">
              <Link to="/terms" role="tab" aria-selected={!isPrivacy} data-on={!isPrivacy || undefined}>
                Terms
              </Link>
              <Link to="/privacy" role="tab" aria-selected={isPrivacy} data-on={isPrivacy || undefined}>
                Privacy
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-section mx-section--tight">
        <div className="mx-container mx-legal">
          <nav className="mx-legal__toc" aria-label="On this page">
            <p className="mx-tile__h">On this page</p>
            {items.map(([h]) => (
              <a key={h} href={`#${slug(h)}`}>
                {h}
              </a>
            ))}
          </nav>
          <div className="mx-legal__body">
            {items.map(([h, b], i) => (
              <article key={h} id={slug(h)}>
                <span className="mx-mono mx-dim">{String(i + 1).padStart(2, '0')}</span>
                <h2>{h}</h2>
                <p>{b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
