import { useMemo, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { useDesk } from '../state/desk'
import { formatDate, formatDateTime, todayISO } from '../lib/format'
import { Button, Field, SectionHead } from '../components/ui'

const IN_STORE = new Set(['on_floor', 'stored', 'tagged', 'boxed', 'pulled', 'loan'])

export function DailyClose() {
  const { snap, store, run, user, busy } = useDesk()

  const physical = useMemo(() => snap.pieces.filter((p) => IN_STORE.has(p.state)), [snap.pieces])

  const byLocation = useMemo(() => {
    const map = new Map<string, number>()
    physical.forEach((p) => {
      const key = p.location ?? 'No location'
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [physical])

  const today = todayISO()
  const existing = snap.dailyClose.find((d) => d.date === today)

  const [scanned, setScanned] = useState<string>(existing?.scanned_qty?.toString() ?? '')
  const [openNotes, setOpenNotes] = useState(existing?.open_notes ?? 'None open')
  const [holdShelf, setHoldShelf] = useState(existing?.hold_shelf ?? 'Cleared or every hold has an owner')
  const [manager, setManager] = useState(existing?.manager ?? user.id)
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const systemQty = physical.length
  const scannedQty = scanned === '' ? null : Number(scanned)
  const variance = scannedQty == null ? null : scannedQty - systemQty

  const save = () =>
    run(
      () =>
        store.saveClose(
          {
            date: today,
            locations: Object.fromEntries(byLocation),
            system_qty: systemQty,
            scanned_qty: scannedQty,
            open_notes: openNotes,
            hold_shelf: holdShelf,
            manager,
            notes,
          },
          user.id,
        ),
      'Daily close recorded',
    )

  const lookup = (name: string) =>
    snap.lookups.filter((l) => l.list_name === name && l.active).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h2 className="page-title">Day-end count</h2>
          <p className="page-sub">
            Before closing, count the pieces in the store and enter the number. The desk compares it with
            what it expects, so missing pieces are spotted the same day.
          </p>
        </div>
        <span className="spacer" />
        <span className="chip chip--jade">{formatDate(new Date().toISOString())}</span>
      </div>

      <div className="close">
        <section className="panel" aria-labelledby="close-form">
          <div className="panel__head">
            <h3 className="panel__title" id="close-form">
              Tonight’s count
            </h3>
            <span className="spacer" />
            {existing ? <span className="chip chip--moss">Already recorded</span> : <span className="chip">Not recorded</span>}
          </div>
          <div className="panel__body">
            <div className="field-grid">
              <Field label="System quantity" hint="Pieces the record says are in the store.">
                <input className="input mono" value={systemQty} readOnly aria-readonly="true" />
              </Field>

              <Field label="Scanned quantity" required htmlFor="dc-scanned" hint="What the closing round found.">
                <input
                  id="dc-scanned"
                  className="input mono"
                  type="number"
                  min={0}
                  value={scanned}
                  onChange={(e) => setScanned(e.target.value)}
                  placeholder={String(systemQty)}
                />
              </Field>

              <Field label="Open notes" htmlFor="dc-notes">
                <select id="dc-notes" className="select" value={openNotes} onChange={(e) => setOpenNotes(e.target.value)}>
                  {lookup('open_notes').map((l) => (
                    <option key={l.id} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Hold shelf" htmlFor="dc-shelf">
                <select id="dc-shelf" className="select" value={holdShelf} onChange={(e) => setHoldShelf(e.target.value)}>
                  {lookup('hold_shelf').map((l) => (
                    <option key={l.id} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Closing manager" htmlFor="dc-manager">
                <select id="dc-manager" className="select" value={manager} onChange={(e) => setManager(e.target.value)}>
                  {snap.profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div style={{ paddingBlock: 'var(--sp-4)' }}>
              <Field
                label="Notes"
                htmlFor="dc-note"
                hint="Anything the morning shift needs to know. One piece found, one still missing."
              >
                <textarea
                  id="dc-note"
                  className="textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="One piece could not be scanned at RACK-03. Found at the ironing table the next morning."
                />
              </Field>
            </div>

            <div className="row" style={{ gap: 'var(--sp-3)' }}>
              <Button variant="primary" onClick={save} loading={busy}>
                <ClipboardCheck size={16} strokeWidth={1.9} />
                {existing ? 'Update tonight’s close' : 'Record the close'}
              </Button>
              <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-3)' }}>
                Recorded against {user.name}
              </span>
            </div>
          </div>
        </section>

        <div className="stack" style={{ gap: 'var(--sp-5)' }}>
          <section className="panel" aria-labelledby="variance-title">
            <div className="panel__head">
              <h3 className="panel__title" id="variance-title">
                Variance
              </h3>
            </div>
            <div className="panel__body">
              <div className="variance" style={{ paddingBlock: 0 }}>
                <div className="variance__cell">
                  <span className="variance__label">System</span>
                  <span className="variance__value">{systemQty}</span>
                  <span className="variance__note">in the store</span>
                </div>
                <div className="variance__cell">
                  <span className="variance__label">Scanned</span>
                  <span className="variance__value">{scannedQty ?? '—'}</span>
                  <span className="variance__note">found tonight</span>
                </div>
                <div
                  className="variance__cell"
                  data-tone={variance == null ? undefined : variance === 0 ? 'moss' : 'oxblood'}
                >
                  <span className="variance__label">Difference</span>
                  <span className="variance__value">
                    {variance == null ? '—' : variance > 0 ? `+${variance}` : variance}
                  </span>
                  <span className="variance__note">
                    {variance == null ? 'enter a count' : variance === 0 ? 'matches' : 'needs a note'}
                  </span>
                </div>
              </div>

              <hr style={{ marginBlock: 'var(--sp-4)' }} />

              <div className="ledger">
                {byLocation.map(([loc, count]) => (
                  <div key={loc} className="ledger__row" style={{ paddingBlock: 'var(--sp-2)' }}>
                    <span className="ledger__key mono">{loc}</span>
                    <span className="ledger__val" style={{ fontSize: 'var(--fs-sm)' }}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="history-title">
            <div className="panel__head">
              <h3 className="panel__title" id="history-title">
                Previous closes
              </h3>
            </div>
            <div className="panel__body panel__body--tight">
              <div className="feed">
                {snap.dailyClose.map((d) => (
                  <div key={d.date} className="feed__item">
                    <span className="feed__time mono">{d.date.slice(5)}</span>
                    <span className="feed__text">
                      {d.scanned_qty ?? '—'} of {d.system_qty ?? '—'} scanned
                      {d.scanned_qty != null && d.system_qty != null && d.scanned_qty !== d.system_qty ? (
                        <b style={{ color: 'var(--oxblood)' }}> · difference {d.scanned_qty - d.system_qty}</b>
                      ) : (
                        <b style={{ color: 'var(--moss)' }}> · matched</b>
                      )}
                      <br />
                      <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--ink-3)' }}>
                        {snap.profiles.find((p) => p.id === d.by)?.name ?? '—'} ·{' '}
                        {formatDateTime(d.at)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <SectionHead title="Where the pieces are" note={`${physical.length} pieces physically in the store`} />
      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Location</th>
                <th scope="col">Pieces</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {byLocation.map(([loc, count]) => (
                <tr key={loc}>
                  <td data-label="Location" className="cell-mono">
                    {loc}
                  </td>
                  <td data-label="Pieces" className="cell-num">
                    {count}
                  </td>
                  <td data-label="Share" style={{ minWidth: '10rem' }}>
                    <div className="meter">
                      <div
                        className="meter__fill"
                        style={{ inlineSize: `${Math.round((count / Math.max(1, physical.length)) * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
