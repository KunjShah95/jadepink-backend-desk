import type { ReactNode } from 'react'
import { trackPointer } from './fx'

const GATES = ['Receipt', 'QC & price', 'Ironing', 'Tagging', 'Display', 'Accept', 'RTV', 'Settle']

/** Split auth screen: form on the left, a lit slice of the ledger on the right. */
export function AuthFrame({ children, aside }: { children: ReactNode; aside: { quote: string; by: string } }) {
  return (
    <section className="mx-auth">
      <div className="mx-auth__form">{children}</div>

      <aside className="mx-auth__art" onPointerMove={trackPointer} aria-hidden="true">
        <div className="mx-hero__grid" />
        <div className="mx-hero__grid mx-hero__grid--lit" />
        <div className="mx-auth__ticket">
          <div className="mx-auth__ticket-head">
            <span className="mx-mono">IN-261116-Q4V</span>
            <span className="mx-chip mx-chip--live">Gate 04</span>
          </div>
          <ol>
            {GATES.map((g, i) => (
              <li key={g} data-state={i < 3 ? 'done' : i === 3 ? 'live' : 'todo'}>
                <span className="mx-gates__bead" />
                <span>{g}</span>
                <span className="mx-mono mx-dim">{i < 3 ? `${String(9 + i).padStart(2, "0")}:1${i}` : i === 3 ? 'now' : '—'}</span>
              </li>
            ))}
          </ol>
        </div>
        <figure className="mx-auth__quote">
          <blockquote>“{aside.quote}”</blockquote>
          <figcaption>{aside.by}</figcaption>
        </figure>
      </aside>
    </section>
  )
}
