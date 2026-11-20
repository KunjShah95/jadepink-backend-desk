import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useDesk } from '../state/desk'
import { STAGE_BY_ID } from '../lib/stages'
import type { Hold, Severity } from '../lib/types'
import { formatDateTime, formatRelative } from '../lib/format'
import { Button, Empty, Field, Modal, Severity as Sev } from '../components/ui'

const COLS: Array<{ sev: Severity; title: string; note: string }> = [
  { sev: 'A', title: 'Urgent', note: 'The piece is stopped. Fix it, or ask a manager to write it off.' },
  { sev: 'B', title: 'Fix soon', note: 'The piece keeps moving while someone fixes it.' },
  { sev: 'C', title: 'Small', note: 'Written down for the record. Nothing is stopped.' },
]

export function Holds() {
  const { snap } = useDesk()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Hold | null>(null)

  const open = snap.holds.filter((h) => h.status === 'open')
  const closed = snap.holds.filter((h) => h.status !== 'open')

  const lotOf = (h: Hold) => snap.lots.find((l) => l.id === h.lot_id)

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h2 className="page-title">Problems</h2>
          <p className="page-sub">
            Anything wrong with a piece — a stain, a missing item, a wrong price. Tap a problem to mark it
            fixed. Urgent problems stop the piece until they are fixed or written off.
          </p>
        </div>
      </div>

      <div className="board">
        {COLS.map((col) => {
          const items = open.filter((h) => h.sev === col.sev)
          return (
            <section key={col.sev} className="board__col" aria-label={col.title}>
              <div className="board__head">
                <Sev sev={col.sev} />
                <span className="board__title">{col.title}</span>
                <span className="board__count">{items.length}</span>
              </div>
              <p style={{ fontSize: 'var(--fs-3xs)', color: 'var(--ink-3)', lineHeight: 1.5 }}>
                {col.note}
              </p>

              {items.length === 0 ? (
                <p style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-3)', padding: 'var(--sp-3) 0' }}>
                  Nothing here.
                </p>
              ) : (
                items.map((h) => {
                  const lot = lotOf(h)
                  return (
                    <button key={h.id} type="button" className="hold-card" onClick={() => setSelected(h)}>
                      <span className="hold-card__top">
                        <span className="hold-card__lot mono">{lot?.lot_no ?? '—'}</span>
                        <span className="spacer" />
                        {h.home_stage ? (
                          <span className="chip">
                            {STAGE_BY_ID[h.home_stage].short}
                          </span>
                        ) : null}
                      </span>
                      <span className="hold-card__error">{h.error}</span>
                      <span className="hold-card__meta">
                        <span className="mono">{h.piece_id ?? 'lot-level'}</span>
                        <span>·</span>
                        <span>{formatRelative(h.at)}</span>
                      </span>
                      {h.note ? (
                        <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--ink-3)', lineHeight: 1.45 }}>
                          {h.note}
                        </span>
                      ) : null}
                    </button>
                  )
                })
              )}
            </section>
          )
        })}
      </div>

      <div className="section-head" style={{ paddingBlock: 'var(--sp-8) var(--sp-3)' }}>
        <h3 className="section-title">Cleared</h3>
        <span className="section-note">{closed.length} holds have an outcome on record</span>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Lot</th>
                <th scope="col">Piece</th>
                <th scope="col">Fault</th>
                <th scope="col">Severity</th>
                <th scope="col">Outcome</th>
                <th scope="col">Fixed by</th>
              </tr>
            </thead>
            <tbody>
              {closed.map((h) => {
                const lot = lotOf(h)
                const who = snap.profiles.find((p) => p.id === h.fix_by)?.name ?? '—'
                return (
                  <tr
                    key={h.id}
                    data-clickable="true"
                    onClick={() => lot && navigate(`/app/lots/${lot.id}`)}
                  >
                    <td data-label="Lot" className="cell-mono">
                      {lot?.lot_no ?? '—'}
                    </td>
                    <td data-label="Piece" className="cell-mono">
                      {h.piece_id ?? 'lot-level'}
                    </td>
                    <td data-label="Fault">{h.error}</td>
                    <td data-label="Severity">
                      <Sev sev={h.sev} />
                    </td>
                    <td data-label="Outcome">
                      <span className={h.outcome === 'written_off' ? 'chip chip--oxblood' : 'chip chip--moss'}>
                        {h.outcome === 'written_off' ? 'Written off' : 'Fixed'}
                      </span>
                    </td>
                    <td data-label="Fixed by">{who}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {closed.length === 0 ? <Empty title="No hold has been cleared yet" /> : null}
      </div>

      <ResolveDialog hold={selected} onClose={() => setSelected(null)} />
    </>
  )
}

function ResolveDialog({ hold, onClose }: { hold: Hold | null; onClose: () => void }) {
  const { snap, store, run, user, has } = useDesk()
  const [outcome, setOutcome] = useState<'fixed' | 'written_off'>('fixed')
  const [fix, setFix] = useState('')

  const lot = useMemo(() => (hold ? snap.lots.find((l) => l.id === hold.lot_id) : null), [snap, hold])
  const mayWriteOff = has('Prateek', 'Admin', 'Management')

  if (!hold) return null

  return (
    <Modal
      open
      onClose={onClose}
      title="Clear this hold"
      desc={`${hold.error} · ${lot?.lot_no ?? 'lot'} · ${hold.piece_id ?? 'whole parcel'}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <span className="spacer" />
          <Button
            variant="primary"
            disabled={!fix.trim() || (outcome === 'written_off' && !mayWriteOff)}
            onClick={async () => {
              await run(
                () => store.resolveHold(hold.id, outcome, fix.trim(), user.id),
                outcome === 'written_off' ? 'Written off' : 'Marked as fixed',
              )
              setFix('')
              onClose()
            }}
          >
            {outcome === 'written_off' ? 'Write off' : 'Mark as fixed'}
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 'var(--sp-4)' }}>
        <div className="dl">
          <dt>Raised</dt>
          <dd>{formatDateTime(hold.at)}</dd>
          <dt>By</dt>
          <dd>{snap.profiles.find((p) => p.id === hold.by)?.name ?? '—'}</dd>
          <dt>Stage</dt>
          <dd>{hold.home_stage ? STAGE_BY_ID[hold.home_stage].name : '—'}</dd>
        </div>

        {hold.note ? (
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-2)', lineHeight: 1.55 }}>{hold.note}</p>
        ) : null}

        <Field label="Outcome" htmlFor="h-outcome">
          <div className="segmented" role="group" aria-label="Outcome">
            <button
              type="button"
              className="segmented__opt"
              aria-pressed={outcome === 'fixed'}
              onClick={() => setOutcome('fixed')}
            >
              Fixed — rejoins the lot
            </button>
            <button
              type="button"
              className="segmented__opt"
              aria-pressed={outcome === 'written_off'}
              onClick={() => setOutcome('written_off')}
              disabled={!mayWriteOff}
            >
              Write off
            </button>
          </div>
        </Field>

        {outcome === 'written_off' && !mayWriteOff ? (
          <p className="field__error" role="alert">
            A write-off needs Prateek, management or an admin. You are working as {user.roles.join(', ')}.
          </p>
        ) : null}

        <Field
          label="What was done"
          required
          htmlFor="h-fix"
          hint={outcome === 'written_off' ? 'Who approved it, and why the piece cannot be sold.' : 'One line that a colleague could act on.'}
        >
          <textarea
            id="h-fix"
            className="textarea"
            value={fix}
            onChange={(e) => setFix(e.target.value)}
            placeholder={outcome === 'written_off' ? 'Stain would not lift. Prateek approved the write-off on WhatsApp.' : 'Re-tagged to S and re-scanned.'}
          />
        </Field>

        <div className="row" style={{ gap: 'var(--sp-2)', color: 'var(--ink-3)', fontSize: 'var(--fs-2xs)' }}>
          <ShieldAlert size={14} strokeWidth={1.8} />
          Marking an urgent problem as fixed lets the piece move again.
        </div>
      </div>
    </Modal>
  )
}
