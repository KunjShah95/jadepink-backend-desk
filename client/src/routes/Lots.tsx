import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PackagePlus, Search } from 'lucide-react'
import { useDesk } from '../state/desk'
import { bundleOf, gateCount, isBlocked, openHoldsOf, searchLots, stageOf } from '../lib/select'
import { STAGES, STAGE_BY_ID } from '../lib/stages'
import type { NewLotInput, StageId } from '../lib/types'
import { formatDate } from '../lib/format'
import { Button, Empty, Field, MiniSpine, Modal } from '../components/ui'

type Status = 'open' | 'closed' | 'all'

export function Lots() {
  const { snap, store, run, toast, user } = useDesk()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const [term, setTerm] = useState('')
  const [stage, setStage] = useState<StageId | 'all'>((params.get('stage') as StageId) ?? 'all')
  const [status, setStatus] = useState<Status>('open')
  const [newOpen, setNewOpen] = useState(params.get('new') === '1')
  const [tab, setTab] = useState<'lots' | 'upcoming'>(params.get('tab') === 'upcoming' ? 'upcoming' : 'lots')

  useEffect(() => {
    if (params.get('new') === '1') {
      setNewOpen(true)
      params.delete('new')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const rows = useMemo(() => {
    let list = searchLots(snap, term)
    if (status === 'open') list = list.filter((l) => !l.closed_at)
    if (status === 'closed') list = list.filter((l) => l.closed_at)
    if (stage !== 'all') list = list.filter((l) => stageOf(snap, l) === stage)
    return list.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  }, [snap, term, status, stage])

  const expected = snap.upcoming.filter((u) => u.status === 'expected')

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h2 className="page-title">Parcels</h2>
          <p className="page-sub">
            Every parcel the store has received, and which step it is on. Tap a parcel to open it.
          </p>
        </div>
        <span className="spacer" />
        <Button variant="primary" onClick={() => setNewOpen(true)}>
          <PackagePlus size={15} strokeWidth={1.9} />
          Receive a parcel
        </Button>
      </div>

      <div className="tabs" role="tablist" aria-label="Lots view">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'lots'}
          className="tabs__tab"
          onClick={() => setTab('lots')}
        >
          Received<span className="tabs__count">{rows.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'upcoming'}
          className="tabs__tab"
          onClick={() => setTab('upcoming')}
        >
          On the way<span className="tabs__count">{expected.length}</span>
        </button>
      </div>

      {tab === 'lots' ? (
        <>
          <div className="filters" style={{ paddingTop: 'var(--sp-4)' }}>
            <div className="input-wrap filters__search">
              <span className="input-wrap__icon">
                <Search size={15} strokeWidth={1.75} />
              </span>
              <input
                className="input"
                placeholder="Search by designer, parcel number or piece code"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                aria-label="Search lots"
              />
            </div>

            <div className="segmented" role="group" aria-label="Status">
              {(['open', 'closed', 'all'] as Status[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="segmented__opt"
                  aria-pressed={status === s}
                  onClick={() => setStatus(s)}
                >
                  {s === 'open' ? 'Open' : s === 'closed' ? 'Closed' : 'All'}
                </button>
              ))}
            </div>

            <label className="row" style={{ gap: 'var(--sp-2)' }}>
              <span className="caps">Step</span>
              <select
                className="select"
                value={stage}
                onChange={(e) => setStage(e.target.value as StageId | 'all')}
                style={{ minWidth: '11rem' }}
              >
                <option value="all">All steps</option>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.no} · {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="panel">
            <div className="table-wrap">
              <table className="table">
                <caption>
                  {rows.length} {rows.length === 1 ? 'lot' : 'lots'}
                  {status !== 'all' ? ` · ${status}` : ''}
                  {stage !== 'all' ? ` · at ${STAGE_BY_ID[stage].name}` : ''}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Parcel no.</th>
                    <th scope="col">Designer</th>
                    <th scope="col">Step now</th>
                    <th scope="col">Pieces</th>
                    <th scope="col">Problems</th>
                    <th scope="col">Received</th>
                    <th scope="col">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((lot) => {
                    const b = bundleOf(snap, lot.id)
                    const stageDef = STAGE_BY_ID[stageOf(snap, lot)]
                    const holds = openHoldsOf(snap, lot.id)
                    const blocked = isBlocked(snap, lot)
                    const pieces = snap.pieces.filter((p) => p.lot_id === lot.id).length
                    return (
                      <tr
                        key={lot.id}
                        data-clickable="true"
                        onClick={() => navigate(`/app/lots/${lot.id}`)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/app/lots/${lot.id}`)
                        }}
                      >
                        <td data-label="Lot" className="cell-mono">
                          {lot.lot_no}
                        </td>
                        <td data-label="Designer">
                          <span className="stack" style={{ gap: 1 }}>
                            <span>{lot.designer ?? '—'}</span>
                            <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--ink-3)' }}>
                              {lot.stock_type ?? '—'} · {gateCount(snap, lot)}/8 gates
                            </span>
                          </span>
                        </td>
                        <td data-label="At gate">
                          <span className={blocked ? 'chip chip--oxblood' : 'chip'}>
                            {stageDef.no} {stageDef.short}
                          </span>
                        </td>
                        <td data-label="Pieces" className="cell-num">
                          {pieces || '—'}
                        </td>
                        <td data-label="Holds" className="cell-num">
                          {holds.length === 0 ? (
                            <span style={{ color: 'var(--ink-3)' }}>—</span>
                          ) : (
                            <span className={blocked ? 'chip chip--oxblood' : 'chip chip--amber'}>
                              {holds.length} open
                            </span>
                          )}
                        </td>
                        <td data-label="Received" className="cell-mono">
                          {formatDate(lot.created_at)}
                        </td>
                        <td data-label="Position">
                          {b ? <MiniSpine bundle={b} blocked={blocked} /> : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {rows.length === 0 ? (
              <Empty
                icon={<Search size={18} strokeWidth={1.6} />}
                title="No lot matches that"
                body="Clear the filters, or receive a new parcel to start a lot."
                action={
                  <Button variant="secondary" size="sm" onClick={() => { setTerm(''); setStage('all'); setStatus('all') }}>
                    Clear filters
                  </Button>
                }
              />
            ) : null}
          </div>
        </>
      ) : (
        <UpcomingTab
          onReceive={async (id) => {
            const ok = await run(async () => {
              const lot = await store.receiveUpcoming(id, user.id)
              if (lot) navigate(`/app/lots/${lot.id}`)
            }, 'Parcel received — now at step 1')
            if (!ok) toast({ tone: 'error', title: 'Could not open the lot' })
          }}
          onAdd={() => setNewOpen(true)}
        />
      )}

      <NewLotDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(lot) => {
          setNewOpen(false)
          navigate(`/app/lots/${lot.id}`)
        }}
      />
    </>
  )
}

/* -------------------------------------------------------------------------- */

function UpcomingTab({ onReceive, onAdd }: { onReceive: (id: string) => void; onAdd: () => void }) {
  const { snap } = useDesk()
  const rows = snap.upcoming

  return (
    <>
      <div className="section-head" style={{ paddingTop: 'var(--sp-4)' }}>
        <h3 className="section-title">Parcels on the way</h3>
        <span className="section-note">Log one when the designer confirms dispatch</span>
        <span className="spacer" />
        <Button variant="secondary" size="sm" onClick={onAdd}>
          Log a parcel
        </Button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Designer</th>
                <th scope="col">Expected</th>
                <th scope="col">Boxes</th>
                <th scope="col">Courier</th>
                <th scope="col">PO</th>
                <th scope="col">Status</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td data-label="Designer">{u.designer}</td>
                  <td data-label="Expected" className="cell-mono">
                    {u.expected_date ?? '—'}
                  </td>
                  <td data-label="Boxes" className="cell-num">
                    {u.boxes ?? '—'}
                  </td>
                  <td data-label="Courier">{u.courier ?? '—'}</td>
                  <td data-label="PO" className="cell-mono">
                    {u.po_ref ?? '—'}
                  </td>
                  <td data-label="Status">
                    <span className={u.status === 'received' ? 'chip chip--moss' : 'chip chip--amber'}>
                      {u.status === 'received' ? 'Received' : 'Expected'}
                    </span>
                  </td>
                  <td data-label="" style={{ textAlign: 'end' }}>
                    {u.status === 'expected' ? (
                      <Button variant="secondary" size="sm" onClick={() => onReceive(u.id)}>
                        Receive
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <Empty title="Nothing expected" body="No parcel has been logged as on its way." /> : null}
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */

export function NewLotDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (lot: { id: string }) => void
}) {
  const { snap, run, user } = useDesk()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<NewLotInput>({
    designer: '',
    courier: '',
    tracking: '',
    boxes: 1,
    stock_type: 'SOR',
    condition_: 'Intact',
    expected_: 'Expected dispatch / PO',
    po_ref: '',
    upcoming_id: null,
    blind_count: 0,
    challan_qty: 0,
    po_qty: 0,
    diff_note: null,
    tags_match: 'All tags match the agreed price',
  })

  useEffect(() => {
    if (open) {
      setError(null)
      setForm((f) => ({ ...f, designer: f.designer || (snap.designers[0]?.name ?? '') }))
    }
  }, [open, snap.designers])

  const set = <K extends keyof NewLotInput>(key: K, value: NewLotInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = async () => {
    if (!form.designer) {
      setError('Pick the designer this parcel belongs to.')
      return
    }
    if (form.boxes < 1) {
      setError('A parcel has at least one box.')
      return
    }
    setSaving(true)
    const ok = await run(async (s) => {
      const lot = await s.createLot(form, user.id)
      onCreated(lot)
    }, 'Parcel received — now at step 1')
    setSaving(false)
    if (!ok) setError('The lot could not be saved. Check the connection and try again.')
  }

  const lookup = (name: string) =>
    snap.lookups.filter((l) => l.list_name === name && l.active).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="Receive a parcel"
      desc="Log what the courier handed over, before anything is opened. The lot number is minted here."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <span className="spacer" />
          <Button variant="primary" loading={saving} onClick={submit}>
            Open the lot
          </Button>
        </>
      }
    >
      <div className="field-grid">
        <Field label="Designer" required htmlFor="nl-designer">
          <select
            id="nl-designer"
            className="select"
            value={form.designer}
            onChange={(e) => set('designer', e.target.value)}
          >
            <option value="">Choose…</option>
            {snap.designers
              .filter((d) => d.active)
              .map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
          </select>
        </Field>

        <Field label="Courier" htmlFor="nl-courier">
          <input
            id="nl-courier"
            className="input"
            value={form.courier}
            onChange={(e) => set('courier', e.target.value)}
            placeholder="Delhivery"
          />
        </Field>

        <Field label="Tracking number" htmlFor="nl-tracking">
          <input
            id="nl-tracking"
            className="input mono"
            value={form.tracking}
            onChange={(e) => set('tracking', e.target.value)}
            placeholder="TRK123456IN"
          />
        </Field>

        <Field label="Boxes" required htmlFor="nl-boxes">
          <input
            id="nl-boxes"
            className="input"
            type="number"
            min={1}
            value={form.boxes}
            onChange={(e) => set('boxes', Number(e.target.value))}
          />
        </Field>

        <Field label="Stock type" htmlFor="nl-stock">
          <select
            id="nl-stock"
            className="select"
            value={form.stock_type}
            onChange={(e) => set('stock_type', e.target.value)}
          >
            {lookup('stock_type').map((l) => (
              <option key={l.id} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Box condition" htmlFor="nl-condition">
          <select
            id="nl-condition"
            className="select"
            value={form.condition_}
            onChange={(e) => set('condition_', e.target.value)}
          >
            {lookup('box_condition').map((l) => (
              <option key={l.id} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Was it expected?" htmlFor="nl-expected" hint="An unexpected parcel stays unopened until HO confirms.">
          <select
            id="nl-expected"
            className="select"
            value={form.expected_}
            onChange={(e) => set('expected_', e.target.value)}
          >
            {lookup('expected').map((l) => (
              <option key={l.id} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="PO reference" htmlFor="nl-po">
          <input
            id="nl-po"
            className="input mono"
            value={form.po_ref}
            onChange={(e) => set('po_ref', e.target.value)}
            placeholder="PO/2026/441"
          />
        </Field>

        <Field label="Blind count" htmlFor="nl-blind" hint="Counted before the challan was read.">
          <input
            id="nl-blind"
            className="input"
            type="number"
            min={0}
            value={form.blind_count}
            onChange={(e) => set('blind_count', Number(e.target.value))}
          />
        </Field>

        <Field label="Challan qty" htmlFor="nl-challan">
          <input
            id="nl-challan"
            className="input"
            type="number"
            min={0}
            value={form.challan_qty}
            onChange={(e) => set('challan_qty', Number(e.target.value))}
          />
        </Field>

        <Field label="PO qty" htmlFor="nl-poqty">
          <input
            id="nl-poqty"
            className="input"
            type="number"
            min={0}
            value={form.po_qty}
            onChange={(e) => set('po_qty', Number(e.target.value))}
          />
        </Field>

        <Field label="Tags match the agreed price?" htmlFor="nl-tags">
          <select
            id="nl-tags"
            className="select"
            value={form.tags_match}
            onChange={(e) => set('tags_match', e.target.value)}
          >
            {lookup('tags_match').map((l) => (
              <option key={l.id} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {form.blind_count > 0 && form.challan_qty > 0 && form.blind_count !== form.challan_qty ? (
        <div style={{ paddingBottom: 'var(--sp-4)' }}>
          <Field
            label="Difference note"
            hint="Required when the blind count and the challan disagree."
            htmlFor="nl-diff"
          >
            <textarea
              id="nl-diff"
              className="textarea"
              value={form.diff_note ?? ''}
              onChange={(e) => set('diff_note', e.target.value || null)}
              placeholder="Blind count is one higher than the challan. Piece held for QC."
            />
          </Field>
        </div>
      ) : null}

      {error ? (
        <p className="field__error" role="alert" style={{ paddingBottom: 'var(--sp-2)' }}>
          {error}
        </p>
      ) : null}

      <p style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-3)', lineHeight: 1.55 }}>
        Opening the lot does not pass gate 1. It records the parcel, then gate 1 opens on the lot page —
        where you confirm the label, the box count and the condition photograph.
      </p>
      <p style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-3)', marginTop: 'var(--sp-2)' }}>
        <span className="mono">{formatDate(new Date().toISOString())}</span> · recorded against the person
        working the desk.
      </p>
    </Modal>
  )
}
