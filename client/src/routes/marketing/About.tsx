import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Eyebrow, Reveal } from './fx'

const PRINCIPLES = [
  ['The gate', 'Nothing skips a step. Each gate has a checklist and cannot pass until it is confirmed. The name and time are stamped into the record.'],
  ['The hold', 'A fault stops the piece, not the lot. Severity A stops the garment, B is fixed in parallel, C is noted. Every hold has a name and an outcome.'],
  ['The close', 'System quantity against scanned quantity, by location. The count that proves the record matches the shop, every evening.'],
]

export function About() {
  return (
    <>
      <section className="mx-page-hero">
        <div className="mx-page-hero__grid" aria-hidden="true" />
        <div className="mx-container">
          <Reveal className="mx-head">
            <Eyebrow>About</Eyebrow>
            <h1 className="mx-h1">
              Built for the <em className="mx-serif">cutting room,</em>
              <br />
              not the boardroom.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="mx-section mx-section--tight">
        <div className="mx-container mx-about">
          <Reveal className="mx-about__story">
            <p className="mx-quote">
              Every store we visited kept the same notebook: a lot number on the cover, ticks down the
              side, and a count that never quite matched the shop floor.
            </p>
            <p>
              Jade Pink is the desk we wished existed. It replaces the notebook without replacing the
              habit — the same lot number, the same ticks, the same people. What changes is that the
              ticks carry a name and a time, and the count at the end of the day is checked by the
              desk instead of by memory.
            </p>
            <p>
              We design for a tablet propped on a cutting table, under hard overhead light, used by
              someone holding a garment in the other hand. Large targets, few words, nothing that
              needs a keyboard.
            </p>
          </Reveal>

          <ol className="mx-principles">
            {PRINCIPLES.map(([h, b], i) => (
              <Reveal as="li" key={h} delay={i * 90} className="mx-principle">
                <span className="mx-mono mx-dim">{String(i + 1).padStart(2, '0')}</span>
                <h3>{h}</h3>
                <p>{b}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-section mx-section--line">
        <div className="mx-container">
          <Reveal className="mx-inline-cta">
            <p>See how a lot moves through the desk.</p>
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
