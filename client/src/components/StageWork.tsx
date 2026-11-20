import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  CheckCheck,
  MessageSquarePlus,
  RotateCcw,
  ScanLine,
  ShieldAlert,
} from 'lucide-react'
import { useDesk } from '../state/desk'
import {
  APPROVAL_LABEL,
  STAGE_BY_ID,
  canPassGate,
  checkProgress,
  gateRoleLabel,
} from '../lib/stages'
import type { ApprovalKind, Lot, LotBundle, Piece, StageId } from '../lib/types'
import { formatDate, formatDateTime } from '../lib/format'
import { Button, Field, Modal, Severity, Stamp } from './ui'

const box = (n: number) => `BOX-${String(n).padStart(2, '0')}`

/* -------------------------------------------------------------------------- */
/* Field primitives that write straight to the lot                            */
/* -------------------------------------------------------------------------- */

function useLotWriter(lot: Lot) {
  const { store, run, user } = useDesk()
  return (patch: Partial<Lot>, message = 'Saved') =>
    run(() => store.updateLot(lot.id, patch, user.id), message)
}

function LotText({
  lot,
  field,
  label,
  hint,
  mono,
  type = 'text',
  placeholder,
}: {
  lot: Lot
  field: keyof Lot
  label: string
  hint?: string
  mono?: boolean
  type?: 'text' | 'number'
  placeholder?: string
}) {
  const write = useLotWriter(lot)
  const current = (lot as unknown as Record<string, unknown>)[field]
  const [value, setValue] = useState(current == null ? '' : String(current))

  useEffect(() => {
    setValue(current == null ? '' : String(current))
  }, [current])

  const commit = () => {
    const next = type === 'number' ? (value === '' ? null : Number(value)) : value
    if (next === current) return
    write({ [field]: next } as Partial<Lot>)
  }

  return (
    <Field label={label} hint={hint} htmlFor={`lot-${field}`}>
      <input
        id={`lot-${field}`}
        className={mono ? 'input mono' : 'input'}
        type={type}
        inputMode={type === 'number' ? 'numeric' : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
    </Field>
  )
}

function LotSelect({
  lot,
  field,
  label,
  options,
  hint,
}: {
  lot: Lot
  field: keyof Lot
  label: string
  options: Array<{ value: string; label: string }>
  hint?: string
}) {
  const write = useLotWriter(lot)
  const current = (lot as unknown as Record<string, unknown>)[field]
  return (
    <Field label={label} hint={hint} htmlFor={`lot-${field}`}>
      <select
        id={`lot-${field}`}
        className="select"
        value={current == null ? '' : String(current)}
        onChange={(e) => write({ [field]: e.target.value || null } as Partial<Lot>)}
      >
        <option value="">Not set</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

function LotDate({
  lot,
  field,
  label,
  hint,
  timestamp,
}: {
  lot: Lot
  field: keyof Lot
  label: string
  hint?: string
  timestamp?: boolean
}) {
  const write = useLotWriter(lot)
  const current = (lot as unknown as Record<string, unknown>)[field] as string | null
  const value = current ? current.slice(0, 10) : ''
  return (
    <Field label={label} hint={hint} htmlFor={`lot-${field}`}>
      <input
        id={`lot-${field}`}
        className="input mono"
        type="date"
        value={value}
        onChange={(e) => {
          const v = e.target.value
          if (!v) {
            write({ [field]: null } as Partial<Lot>)
            return
          }
          write({
            [field]: timestamp ? new Date(`${v}T10:00:00`).toISOString() : v,
          } as Partial<Lot>)
        }}
      />
    </Field>
  )
}

function LotNote({
  lot,
  field,
  label,
  hint,
  placeholder,
}: {
  lot: Lot
  field: keyof Lot
  label: string
  hint?: string
  placeholder?: string
}) {
  const write = useLotWriter(lot)
  const current = (lot as unknown as Record<string, unknown>)[field] as string | null
  const [value, setValue] = useState(current ?? '')
  useEffect(() => {
    setValue(current ?? '')
  }, [current])

  return (
    <Field label={label} hint={hint} htmlFor={`lot-${field}`}>
      <textarea
        id={`lot-${field}`}
        className="textarea"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value !== (current ?? '')) write({ [field]: value || null } as Partial<Lot>)
        }}
      />
    </Field>
  )
}

/* -------------------------------------------------------------------------- */
/* Stage work                                                                 */
/* -------------------------------------------------------------------------- */

export function StageWork({
  bundle,
  stage,
  onStage,
}: {
  bundle: LotBundle
  stage: StageId
  onStage: (s: StageId) => void
}) {
  const { snap, store, run, user, has } = useDesk()
  const def = STAGE_BY_ID[stage]
  const lot = bundle.lot
  const gate = bundle.gates.find((g) => g.stage === stage)
  const ticked = new Set(bundle.checks.filter((c) => c.stage === stage).map((c) => c.item_key))
  const progress = checkProgress(bundle, stage)
  const mayPass = canPassGate(user.roles, stage)
  const allTicked = progress.ticked === progress.total
  const [confirm, setConfirm] = useState(false)
  const [queryOpen, setQueryOpen] = useState(false)
  const [holdOpen, setHoldOpen] = useState(false)
  const [pieceDialog, setPieceDialog] = useState<{ piece: Piece; mode: PieceMode } | null>(null)

  const lookup = (name: string) =>
    snap.lookups
      .filter((l) => l.list_name === name && l.active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((l) => ({ value: l.value, label: l.label }))

  const accepted = bundle.pieces.filter((p) => p.qc === 'accept')
  const rejected = bundle.pieces.filter((p) => p.qc === 'reject')
  const pendingQc = bundle.pieces.filter((p) => !p.qc)
  const pendingTag = accepted.filter((p) => !p.tag_scanned)
  const pendingPlace = accepted.filter((p) => p.tag_scanned && !p.location)
  const boxCount = snap.settings.box_count

  const approve = (kind: ApprovalKind) =>
    run(() => store.addApproval(lot.id, kind, 'Approved at the desk.', user.id), `${APPROVAL_LABEL[kind]} approval recorded`)

  return (
    <>
      <div className="stage-head">
        <span className="stage-head__no">{Number(def.no)}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="stage-head__kicker">Step {Number(def.no)} of 8</p>
          <h3 className="stage-head__title">{def.name}</h3>
          <p className="stage-head__purpose">{def.purpose}</p>
        </div>
        {gate ? <Stamp label="Step done" who={formatDate(gate.at)} /> : null}
      </div>

      {stage === 's1' ? (
        <div className="field-grid">
          <LotText lot={lot} field="courier" label="Courier" />
          <LotText lot={lot} field="tracking" label="Tracking number" mono />
          <LotText lot={lot} field="boxes" label="Boxes" type="number" />
          <LotSelect lot={lot} field="stock_type" label="Stock type" options={lookup('stock_type')} />
          <LotSelect lot={lot} field="condition_" label="Box condition" options={lookup('box_condition')} />
          <LotSelect lot={lot} field="expected_" label="Was it expected?" options={lookup('expected')} />
          <LotText lot={lot} field="po_ref" label="PO reference" mono />
          <LotText lot={lot} field="challan_no" label="Challan number" mono />
          <LotText lot={lot} field="blind_count" label="Blind count" type="number" hint="Counted before reading the challan." />
          <LotText lot={lot} field="challan_qty" label="Challan qty" type="number" />
          <LotText lot={lot} field="po_qty" label="PO qty" type="number" />
          <LotSelect lot={lot} field="tags_match" label="Tags match the agreed price?" options={lookup('tags_match')} />
          <div style={{ gridColumn: '1 / -1' }}>
            <LotNote
              lot={lot}
              field="diff_note"
              label="Difference note"
              hint="Required whenever the blind count and the challan disagree."
              placeholder="Blind count is one higher than the challan. Piece held for QC."
            />
          </div>
        </div>
      ) : null}

      {stage === 's2' ? (
        <>
          <div className="field-grid">
            <LotText lot={lot} field="blind_count" label="Blind count" type="number" />
            <LotText lot={lot} field="challan_qty" label="Challan qty" type="number" />
            <LotText lot={lot} field="po_qty" label="PO qty" type="number" />
            <LotDate lot={lot} field="price_hold_at" label="Price hold raised" timestamp hint="Only if a tag disagrees with the agreed price." />
            <LotSelect lot={lot} field="tags_match" label="Tags match the agreed price?" options={lookup('tags_match')} />
          </div>

          <div className="section-head" style={{ paddingBlock: 'var(--sp-2) var(--sp-3)' }}>
            <h4 className="section-title">Piece QC</h4>
            <span className="section-note">
              {accepted.length} accepted · {rejected.length} rejected · {pendingQc.length} not checked
            </span>
            <span className="spacer" />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setHoldOpen(true)}
              disabled={bundle.pieces.length === 0}
            >
              <ShieldAlert size={14} strokeWidth={1.9} />
              Report a problem
            </Button>
          </div>

          <PieceGrid
            pieces={bundle.pieces}
            mode="qc"
            onPick={(piece) => setPieceDialog({ piece, mode: 'qc' })}
          />
        </>
      ) : null}

      {stage === 's3' ? (
        <>
          <div className="field-grid">
            <LotText
              lot={lot}
              field="iron_count"
              label="Ironed count"
              type="number"
              hint={`Must equal ${accepted.length} accepted pieces.`}
            />
          </div>
          <div className="panel panel--flush" style={{ marginBlock: 'var(--sp-2) var(--sp-4)' }}>
            <div className="panel__body">
              <div className="ledger">
                <div className="ledger__row">
                  <span className="ledger__key">Accepted at QC</span>
                  <span className="ledger__val">{accepted.length}</span>
                </div>
                <div className="ledger__row">
                  <span className="ledger__key">Rejected, set aside</span>
                  <span className="ledger__val">{rejected.length}</span>
                </div>
                <div className="ledger__row">
                  <span className="ledger__key">Difference</span>
                  <span
                    className="ledger__val"
                    style={{ color: lot.iron_count === accepted.length ? 'var(--moss)' : 'var(--oxblood)' }}
                  >
                    {lot.iron_count == null ? '—' : accepted.length - lot.iron_count}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {stage === 's4' ? (
        <>
          <div className="field-grid">
            <LotText lot={lot} field="tag_count" label="Tagged count" type="number" hint={`${pendingTag.length} accepted pieces still need a tag.`} />
            <LotSelect lot={lot} field="tag_dest" label="Default destination" options={lookup('tag_dest')} />
            <LotText lot={lot} field="ho_done_by" label="HO done by" placeholder="Who confirmed inward" />
          </div>

          <div className="section-head" style={{ paddingBlock: 'var(--sp-2) var(--sp-3)' }}>
            <h4 className="section-title">Scan each piece</h4>
            <span className="section-note">
              {accepted.length - pendingTag.length} of {accepted.length} scanned
            </span>
          </div>

          <PieceGrid
            pieces={accepted}
            mode="tag"
            onPick={(piece) => setPieceDialog({ piece, mode: 'tag' })}
          />
        </>
      ) : null}

      {stage === 's5' ? (
        <>
          <div className="field-grid">
            <LotDate lot={lot} field="display_start" label="Display start" />
            <LotDate lot={lot} field="review_date" label="Designer review date" hint="Agreed with the designer before the walk." />
            <LotText lot={lot} field="rack_no" label="Primary rack" mono placeholder="RACK-01" />
          </div>

          <div className="section-head" style={{ paddingBlock: 'var(--sp-2) var(--sp-3)' }}>
            <h4 className="section-title">Place every piece</h4>
            <span className="section-note">{pendingPlace.length} still without a location</span>
          </div>

          <PieceGrid
            pieces={accepted}
            mode="place"
            onPick={(piece) => setPieceDialog({ piece, mode: 'place' })}
          />
        </>
      ) : null}

      {stage === 's6' ? (
        <>
          <div className="field-grid">
            <LotDate lot={lot} field="designer_accept_at" label="Designer walked the display" timestamp />
          </div>

          <div className="section-head" style={{ paddingBlock: 'var(--sp-4) var(--sp-3)' }}>
            <h4 className="section-title">Approvals</h4>
            <span className="section-note">Marketing approves the display and price</span>
          </div>

          <ApprovalRow
            bundle={bundle}
            kind="mkt"
            onApprove={() => approve('mkt')}
            disabled={!has('Marketing', 'Management')}
          />

          <Queries bundle={bundle} onAdd={() => setQueryOpen(true)} />
        </>
      ) : null}

      {stage === 's7' ? (
        <>
          <div className="field-grid">
            <LotText lot={lot} field="rtv_box" label="Box number" mono placeholder="BOX-04" />
            <LotText lot={lot} field="rtv_no" label="RTV number" mono placeholder="RTV/2026/41" />
            <LotText lot={lot} field="rtv_challan" label="RTV challan" mono />
            <LotText lot={lot} field="rtv_courier" label="Courier" />
            <LotText lot={lot} field="rtv_tracking" label="Tracking" mono />
            <LotText lot={lot} field="ack_count" label="Acknowledgement count" type="number" hint="What the designer says they received back." />
            <LotDate lot={lot} field="ack_date" label="Acknowledgement date" />
          </div>

          <div className="section-head" style={{ paddingBlock: 'var(--sp-2) var(--sp-3)' }}>
            <h4 className="section-title">Pull pieces into the box</h4>
            <span className="section-note">
              {bundle.pieces.filter((p) => p.state === 'boxed').length} boxed of{' '}
              {bundle.pieces.filter((p) => ['on_floor', 'boxed', 'pulled'].includes(p.state)).length} on floor
            </span>
          </div>

          <PieceGrid
            pieces={bundle.pieces.filter((p) => ['on_floor', 'boxed', 'pulled'].includes(p.state))}
            mode="pull"
            onPick={(piece) => setPieceDialog({ piece, mode: 'pull' })}
          />
        </>
      ) : null}

      {stage === 's8' ? (
        <>
          <div className="field-grid">
            <LotText lot={lot} field="sell_bill_no" label="Sell bill number" mono />
            <LotText lot={lot} field="ack_count" label="Acknowledged back" type="number" />
            <LotDate lot={lot} field="ack_date" label="Acknowledgement date" />
          </div>
          <div style={{ paddingBlock: 'var(--sp-4)' }}>
            <LotNote
              lot={lot}
              field="pay_note"
              label="Payment note"
              hint="How the settlement is paid, and when."
              placeholder="Net of 12% commission, settled by NEFT on the 7th."
            />
          </div>

          <div className="section-head" style={{ paddingBlock: 'var(--sp-2) var(--sp-3)' }}>
            <h4 className="section-title">Settlement approvals</h4>
            <span className="section-note">Accounts and management, both recorded</span>
          </div>

          <div className="stack" style={{ gap: 'var(--sp-2)' }}>
            <ApprovalRow
              bundle={bundle}
              kind="acct"
              onApprove={() => approve('acct')}
              disabled={!has('Accounts', 'Management')}
            />
            <ApprovalRow
              bundle={bundle}
              kind="mgmt"
              onApprove={() => approve('mgmt')}
              disabled={!has('Management')}
            />
          </div>

          <div className="panel panel--flush" style={{ marginBlock: 'var(--sp-5) 0' }}>
            <div className="panel__body">
              <div className="ledger">
                <div className="ledger__row">
                  <span className="ledger__key">Sold</span>
                  <span className="ledger__val">{bundle.pieces.filter((p) => p.state === 'sold').length}</span>
                </div>
                <div className="ledger__row">
                  <span className="ledger__key">Returned to designer</span>
                  <span className="ledger__val">{bundle.pieces.filter((p) => p.state === 'boxed' || p.state === 'returned').length}</span>
                </div>
                <div className="ledger__row">
                  <span className="ledger__key">Written off</span>
                  <span className="ledger__val">{bundle.pieces.filter((p) => p.state === 'written_off').length}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Checklist */}
      <div className="section-head" style={{ paddingBlock: 'var(--sp-6) var(--sp-2)' }}>
        <h4 className="section-title">Before you finish, tick each item</h4>
        <span className="section-note">
          {progress.ticked} of {progress.total} done
        </span>
      </div>

      <div className="checklist">
        {def.checklist.map((item) => {
          const done = ticked.has(item.key)
          return (
            <div key={item.key} className="checklist__row">
              <label className="check">
                <input
                  type="checkbox"
                  className="check__input"
                  checked={done}
                  onChange={() =>
                    run(
                      () => store.toggleCheck(lot.id, stage, item.key, user.id),

                    )
                  }
                />
                <span className="check__text" data-done={done || undefined}>
                  <span>{item.label}</span>
                  {item.hint ? <span className="check__note">{item.hint}</span> : null}
                </span>
              </label>
            </div>
          )
        })}
      </div>

      {/* Gate */}
      <div className="gate-row">
        {gate ? (
          <>
            <Stamp label="Step done" who={`${formatDateTime(gate.at)}`} />
            <span className="gate-row__reason">
              This step is finished and saved with the name and time. Undoing it also undoes every step after it.
            </span>
            <span className="spacer" />
            <Button
              variant="danger"
              size="sm"
              disabled={!has('Admin', 'Management')}
              onClick={() =>
                run(
                  () => store.removeGate(lot.id, stage, user.id),
                  'Step undone',
                )
              }
            >
              <RotateCcw size={14} strokeWidth={1.9} />
              Undo this step
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              disabled={!allTicked || !mayPass}
              onClick={() => setConfirm(true)}
            >
              <CheckCheck size={18} strokeWidth={1.9} />
              Finish this step
            </Button>
            <span className="gate-row__reason" data-blocked={!allTicked || !mayPass || undefined}>
              {!mayPass
                ? `This step is for ${gateRoleLabel(stage)}. If that is you, tap your name at the bottom-left to switch.`
                : !allTicked
                  ? `Tick the ${progress.total - progress.ticked} remaining ${progress.total - progress.ticked === 1 ? 'item' : 'items'} above to finish this step.`
                  : 'All done. Press “Finish this step” to save it with your name and the time.'}
            </span>
          </>
        )}
      </div>

      {/* Confirm gate */}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Finish step ${Number(def.no)}: ${def.name}?`}
        desc="Your name and the time will be saved. The parcel then moves on to the next step."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Go back
            </Button>
            <span className="spacer" />
            <Button
              variant="primary"
              onClick={async () => {
                const ok = await run(
                  () => store.passGate(lot.id, stage, user.id),
                  `Step ${Number(def.no)} finished`,
                )
                setConfirm(false)
                if (ok) {
                  const order = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'] as StageId[]
                  const next = order[order.indexOf(stage) + 1]
                  if (next) onStage(next)
                }
              }}
            >
              <Check size={16} strokeWidth={2.2} />
              Yes, finish step
            </Button>
          </>
        }
      >
        <div className="dl">
          <dt>Parcel no.</dt>
          <dd className="mono">{lot.lot_no}</dd>
          <dt>Designer</dt>
          <dd>{lot.designer ?? '—'}</dd>
          <dt>Ticked</dt>
          <dd>
            {progress.ticked} of {progress.total} done
          </dd>
          <dt>Finished by</dt>
          <dd>{user.name}</dd>
        </div>
      </Modal>

      <PieceDialog
        piece={pieceDialog?.piece ?? null}
        mode={pieceDialog?.mode ?? 'qc'}
        onClose={() => setPieceDialog(null)}
      />

      <RaiseQueryDialog
        open={queryOpen}
        onClose={() => setQueryOpen(false)}
        lotId={lot.id}
        onSaved={() => setQueryOpen(false)}
      />

      <RaiseHoldDialog
        open={holdOpen}
        onClose={() => setHoldOpen(false)}
        bundle={bundle}
        stage={stage}
        onSaved={() => setHoldOpen(false)}
      />

      <p style={{ marginBlockStart: 'var(--sp-8)', fontSize: 'var(--fs-3xs)', color: 'var(--ink-3)' }}>
        {bundle.pieces.length} pieces in this parcel · {boxCount} storeroom boxes ·{' '}
        {bundle.holds.filter((h) => h.status === 'open').length} open problems
      </p>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Piece grid                                                                 */
/* -------------------------------------------------------------------------- */

type PieceMode = 'qc' | 'tag' | 'place' | 'pull'

function PieceGrid({
  pieces,
  mode,
  onPick,
}: {
  pieces: Piece[]
  mode: PieceMode
  onPick: (p: Piece) => void
}) {
  if (pieces.length === 0) {
    return (
      <p style={{ padding: 'var(--sp-4) 0', fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>
        No pieces on this lot yet.
      </p>
    )
  }

  return (
    <div className="piece-grid">
      {pieces.map((p) => {
        const state =
          mode === 'qc'
            ? p.qc === 'accept'
              ? 'accept'
              : p.qc === 'reject'
                ? 'reject'
                : undefined
            : mode === 'tag'
              ? p.tag_scanned
                ? 'tagged'
                : undefined
              : undefined
        return (
          <button key={p.id} type="button" className="piece" data-state={state} onClick={() => onPick(p)}>
            <span className="piece__label">{p.id}</span>
            <span className="piece__product">
              {p.product ?? '—'} · {p.size ?? '—'}
            </span>
            <span className="piece__meta">
              {mode === 'qc'
                ? p.qc === 'reject'
                  ? p.reject_reason ?? 'rejected'
                  : p.qc === 'accept'
                    ? 'accepted'
                    : 'not checked'
                : mode === 'tag'
                  ? p.tag_scanned
                    ? `tagged · ${p.tag_dest ?? 'floor'}`
                    : 'no tag yet'
                  : mode === 'place'
                    ? p.location ?? 'no location'
                    : `${p.state} · ${p.box_no ?? 'no box'}`}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Piece dialog                                                               */
/* -------------------------------------------------------------------------- */

function PieceDialog({
  piece,
  mode,
  onClose,
}: {
  piece: Piece | null
  mode: PieceMode
  onClose: () => void
}) {
  const { snap, store, run, user } = useDesk()
  const [decision, setDecision] = useState<'accept' | 'reject'>('accept')
  const [reason, setReason] = useState('')
  const [dest, setDest] = useState('Floor')
  const [location, setLocation] = useState('')
  const [boxNo, setBoxNo] = useState('BOX-01')

  useEffect(() => {
    if (!piece) return
    setDecision(piece.qc === 'reject' ? 'reject' : 'accept')
    setReason(piece.reject_reason ?? '')
    setDest(piece.tag_dest ?? 'Floor')
    setLocation(piece.location ?? '')
    setBoxNo(piece.box_no ?? box(1))
  }, [piece])

  const reasons = useMemo(
    () =>
      snap.lookups
        .filter((l) => l.list_name === 'reject_reason' && l.active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [snap.lookups],
  )

  const locations = useMemo(() => {
    const racks = ['RACK-01', 'RACK-02', 'RACK-03', 'RACK-04']
    const mannequins = ['M01', 'M02', 'M03']
    const boxes = Array.from({ length: snap.settings.box_count }, (_, i) => box(i + 1))
    return [...racks, ...mannequins, ...boxes]
  }, [snap.settings.box_count])

  if (!piece) return null

  const title =
    mode === 'qc'
      ? `QC ${piece.id}`
      : mode === 'tag'
        ? `Tag ${piece.id}`
        : mode === 'place'
          ? `Place ${piece.id}`
          : `Pull ${piece.id}`

  const save = async () => {
    if (mode === 'qc') {
      if (decision === 'reject' && !reason) return
      await run(
        () => store.setPieceQc(piece.id, decision, decision === 'reject' ? reason : null, user.id),
        decision === 'reject' ? `${piece.id} rejected` : `${piece.id} accepted`,
      )
    }
    if (mode === 'tag') {
      await run(() => store.tagPiece(piece.id, dest, user.id), `${piece.id} tagged → ${dest}`)
    }
    if (mode === 'place') {
      if (!location) return
      await run(() => store.setPieceLocation(piece.id, location, user.id), `${piece.id} → ${location}`)
    }
    if (mode === 'pull') {
      await run(() => store.pullPiece(piece.id, boxNo, user.id), `${piece.id} boxed in ${boxNo}`)
    }
    onClose()
  }

  return (
    <Modal
      open={Boolean(piece)}
      onClose={onClose}
      title={title}
      desc={`${piece.product ?? 'Piece'} · ${piece.colour ?? '—'} · size ${piece.size ?? '—'} · MRP ${piece.tag_mrp ?? '—'}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <span className="spacer" />
          <Button
            variant="primary"
            onClick={save}
            disabled={mode === 'qc' && decision === 'reject' && !reason}
          >
            {mode === 'qc' ? (decision === 'reject' ? 'Reject piece' : 'Accept piece') : 'Save'}
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 'var(--sp-4)' }}>
        <div className="dl">
          <dt>Piece</dt>
          <dd className="mono">{piece.id}</dd>
          <dt>Style</dt>
          <dd className="mono">{piece.style_code ?? '—'}</dd>
          <dt>Barcode</dt>
          <dd className="mono">{piece.barcode ?? 'not printed'}</dd>
          <dt>State</dt>
          <dd>{piece.state}</dd>
        </div>

        {mode === 'qc' ? (
          <>
            <div className="segmented" role="group" aria-label="QC result">
              <button
                type="button"
                className="segmented__opt"
                aria-pressed={decision === 'accept'}
                onClick={() => setDecision('accept')}
              >
                Accept
              </button>
              <button
                type="button"
                className="segmented__opt"
                aria-pressed={decision === 'reject'}
                onClick={() => setDecision('reject')}
              >
                Reject
              </button>
            </div>

            {decision === 'reject' ? (
              <Field label="Reject reason" required htmlFor="qc-reason">
                <select
                  id="qc-reason"
                  className="select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="">Choose a reason…</option>
                  {reasons.map((r) => (
                    <option key={r.id} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
          </>
        ) : null}

        {mode === 'tag' ? (
          <>
            <Field label="Destination" htmlFor="tag-dest">
              <select id="tag-dest" className="select" value={dest} onChange={(e) => setDest(e.target.value)}>
                <option value="Floor">Floor</option>
                <option value="Storeroom">Storeroom</option>
              </select>
            </Field>
            <p className="field__hint">
              Scanning prints the barcode into the record. The physical tag is applied at the bench.
            </p>
            <div className="row" style={{ gap: 'var(--sp-2)', color: 'var(--ink-3)', fontSize: 'var(--fs-xs)' }}>
              <ScanLine size={16} strokeWidth={1.75} />
              <span className="mono">{piece.barcode ?? 'barcode will be minted on save'}</span>
            </div>
          </>
        ) : null}

        {mode === 'place' ? (
          <Field label="Location" required htmlFor="place-loc" hint="Racks, mannequins, or a numbered storeroom box.">
            <select
              id="place-loc"
              className="select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Choose…</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        {mode === 'pull' ? (
          <Field label="Box" required htmlFor="pull-box">
            <select id="pull-box" className="select" value={boxNo} onChange={(e) => setBoxNo(e.target.value)}>
              {Array.from({ length: snap.settings.box_count }, (_, i) => box(i + 1)).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Approvals                                                                  */
/* -------------------------------------------------------------------------- */

function ApprovalRow({
  bundle,
  kind,
  onApprove,
  disabled,
}: {
  bundle: LotBundle
  kind: ApprovalKind
  onApprove: () => void
  disabled?: boolean
}) {
  const { snap } = useDesk()
  const approval = bundle.approvals.find((a) => a.kind === kind)
  const name = (id: string | null) => snap.profiles.find((p) => p.id === id)?.name ?? 'Someone'

  return (
    <div className="ledger__row" style={{ alignItems: 'center' }}>
      <span className="stack" style={{ gap: 2 }}>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{APPROVAL_LABEL[kind]}</span>
        <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-3)' }}>
          {approval
            ? `${name(approval.by)} · ${formatDateTime(approval.at)}`
            : 'Not yet recorded'}
        </span>
        {approval?.note ? (
          <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-3)' }}>“{approval.note}”</span>
        ) : null}
      </span>
      <span className="spacer" />
      {approval ? (
        <span className="chip chip--moss">Approved</span>
      ) : (
        <Button size="sm" variant="secondary" onClick={onApprove} disabled={disabled}>
          <Check size={14} strokeWidth={2} />
          Record approval
        </Button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

function Queries({ bundle, onAdd }: { bundle: LotBundle; onAdd: () => void }) {
  const { snap, store, run, user } = useDesk()
  const [answerFor, setAnswerFor] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const name = (id: string | null) => snap.profiles.find((p) => p.id === id)?.name ?? 'Someone'

  return (
    <>
      <div className="section-head" style={{ paddingBlock: 'var(--sp-6) var(--sp-3)' }}>
        <h4 className="section-title">Questions</h4>
        <span className="section-note">Write feedback here so nothing is lost</span>
        <span className="spacer" />
        <Button size="sm" variant="secondary" onClick={onAdd}>
          <MessageSquarePlus size={14} strokeWidth={1.9} />
          Ask a question
        </Button>
      </div>

      {bundle.queries.length === 0 ? (
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--ink-3)' }}>No questions yet for this parcel.</p>
      ) : (
        <div className="stack" style={{ gap: 'var(--sp-3)' }}>
          {bundle.queries.map((q) => (
            <div key={q.id} className="panel panel--flush">
              <div className="panel__body">
                <div className="row" style={{ gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
                  <span className={q.status === 'open' ? 'chip chip--amber' : 'chip chip--moss'}>
                    {q.status === 'open' ? 'Open' : 'Answered'}
                  </span>
                  <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--ink-3)' }}>
                    {name(q.by)} · {formatDateTime(q.at)}
                  </span>
                </div>
                <p style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.55 }}>{q.text}</p>

                {q.status === 'answered' ? (
                  <div style={{ marginTop: 'var(--sp-3)', paddingLeft: 'var(--sp-3)', borderLeft: '1px solid var(--rule-strong)' }}>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink-2)' }}>{q.answer}</p>
                    <p style={{ fontSize: 'var(--fs-3xs)', color: 'var(--ink-3)', marginTop: 2 }}>
                      {name(q.answered_by)} · {formatDateTime(q.answered_at)}
                    </p>
                  </div>
                ) : answerFor === q.id ? (
                  <div style={{ marginTop: 'var(--sp-3)' }}>
                    <textarea
                      className="textarea"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="What was agreed, and by whom."
                      aria-label="Answer"
                    />
                    <div className="row" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!answer.trim()}
                        onClick={async () => {
                          await run(() => store.answerQuery(bundle.lot.id, q.id, answer.trim(), user.id), 'Query answered')
                          setAnswer('')
                          setAnswerFor(null)
                        }}
                      >
                        Save answer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setAnswerFor(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    style={{ marginTop: 'var(--sp-3)' }}
                    onClick={() => {
                      setAnswerFor(q.id)
                      setAnswer('')
                    }}
                  >
                    Answer this
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Dialogs: query and hold                                                    */
/* -------------------------------------------------------------------------- */

function RaiseQueryDialog({
  open,
  onClose,
  lotId,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  lotId: string
  onSaved: () => void
}) {
  const { store, run, user } = useDesk()
  const [text, setText] = useState('')

  useEffect(() => {
    if (open) setText('')
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ask the designer or head office a question"
      desc="Anything that needs a decision from the designer, HO or accounts — written down, with a name against it."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <span className="spacer" />
          <Button
            variant="primary"
            disabled={!text.trim()}
            onClick={async () => {
              await run(() => store.addQuery(lotId, text.trim(), user.id), 'Query raised')
              onSaved()
            }}
          >
            Send question
          </Button>
        </>
      }
    >
      <Field label="The query" required htmlFor="q-text">
        <textarea
          id="q-text"
          className="textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Two pieces arrived with a different MRP sticker than the agreed price. Accept at the old price, or return?"
          style={{ minHeight: '8rem' }}
        />
      </Field>
    </Modal>
  )
}

function RaiseHoldDialog({
  open,
  onClose,
  bundle,
  stage,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  bundle: LotBundle
  stage: StageId
  onSaved: () => void
}) {
  const { store, run, user } = useDesk()
  const [error, setError] = useState('')
  const [sev, setSev] = useState<'A' | 'B' | 'C'>('A')
  const [pieceId, setPieceId] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setSev('A')
      setPieceId('')
      setNote('')
    }
  }, [open])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report a problem with a piece"
      desc="Say what is wrong and how serious it is. Urgent problems stop the piece until someone fixes it."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <span className="spacer" />
          <Button
            variant="primary"
            disabled={!error.trim()}
            onClick={async () => {
              await run(
                () =>
                  store.createHold(
                    {
                      lot_id: bundle.lot.id,
                      piece_id: pieceId || null,
                      error: error.trim(),
                      home_stage: stage,
                      sev,
                      note: note.trim(),
                    },
                    user.id,
                  ),
                'Problem saved',
              )
              onSaved()
            }}
          >
            <ShieldAlert size={15} strokeWidth={1.9} />
            Save problem
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 'var(--sp-4)' }}>
        <Field label="What is wrong" required htmlFor="h-error">
          <input
            id="h-error"
            className="input"
            value={error}
            onChange={(e) => setError(e.target.value)}
            placeholder="Stain on the front panel"
          />
        </Field>

        <Field label="Piece" htmlFor="h-piece" hint="Leave as “Whole parcel” if the problem is not about one piece.">
          <select id="h-piece" className="select" value={pieceId} onChange={(e) => setPieceId(e.target.value)}>
            <option value="">Whole parcel</option>
            {bundle.pieces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} — {p.product ?? 'piece'} {p.size ?? ''}
              </option>
            ))}
          </select>
        </Field>

        <Field label="How serious is it?" htmlFor="h-sev">
          <div className="segmented" role="group" aria-label="Severity">
            {(['A', 'B', 'C'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className="segmented__opt"
                aria-pressed={sev === s}
                onClick={() => setSev(s)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Severity sev={s} />
                  {s === 'A' ? 'Urgent — stop the piece' : s === 'B' ? 'Fix soon — piece can keep moving' : 'Small — just note it'}
                </span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Note" htmlFor="h-note" hint="What you saw, who you told, what happens next.">
          <textarea
            id="h-note"
            className="textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Visible under the light. Sent for dry clean before the designer walk."
          />
        </Field>
      </div>
    </Modal>
  )
}
