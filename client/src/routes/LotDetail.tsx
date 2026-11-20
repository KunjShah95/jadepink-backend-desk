import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Copy, Printer, ShieldAlert } from 'lucide-react'
import { useDesk } from '../state/desk'
import { bundleOf, isBlocked, openQueriesOf, stageOf } from '../lib/select'
import { STAGES, STAGE_BY_ID } from '../lib/stages'
import type { StageId } from '../lib/types'
import { formatDate, ageLabel } from '../lib/format'
import { Button, Empty, MiniSpine, Spine, Stamp } from '../components/ui'
import { StageWork } from '../components/StageWork'

export function LotDetail() {
  const { lotId } = useParams<{ lotId: string }>()
  const { snap, toast } = useDesk()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const bundle = useMemo(() => (lotId ? bundleOf(snap, lotId) : null), [snap, lotId])

  const current = useMemo(() => (bundle ? stageOf(snap, bundle.lot) : 's1'), [snap, bundle])
  const [active, setActive] = useState<StageId>((params.get('stage') as StageId) ?? current)

  useEffect(() => {
    setActive((params.get('stage') as StageId) ?? current)
  }, [params, current, lotId])

  const pieceParam = params.get('piece')
  useEffect(() => {
    if (!pieceParam || !bundle) return
    const piece = bundle.pieces.find((p) => p.id === pieceParam)
    if (!piece) return
    const map: Record<string, StageId> = {
      new: 's2',
      accepted: 's4',
      rejected: 's2',
      tagged: 's5',
      stored: 's5',
      on_floor: 's5',
      boxed: 's7',
      pulled: 's7',
      returned: 's8',
      written_off: 's8',
      sold: 's8',
      loan: 's5',
      on_hold: 's2',
    }
    setActive(map[piece.state] ?? current)
    params.delete('piece')
    setParams(params, { replace: true })
  }, [pieceParam, bundle, params, setParams, current])

  if (!bundle) {
    return (
      <Empty
        title="That lot is not on the desk"
        body="It may have been closed and archived, or the link is wrong."
        action={
          <Button variant="secondary" onClick={() => navigate('/app/lots')}>
            Back to lots
          </Button>
        }
      />
    )
  }

  const { lot, pieces, holds } = bundle
  const blocked = isBlocked(snap, lot)
  const openHolds = holds.filter((h) => h.status === 'open')
  const openQueries = openQueriesOf(snap, lot.id)
  const stageDef = STAGE_BY_ID[active]
  const accepted = pieces.filter((p) => p.qc === 'accept').length
  const rejected = pieces.filter((p) => p.qc === 'reject').length

  const blockedStages = new Set<StageId>(
    openHolds.filter((h) => h.sev === 'A' && h.home_stage).map((h) => h.home_stage as StageId),
  )

  const goStage = (s: StageId) => {
    setActive(s)
    const next = new URLSearchParams(params)
    next.set('stage', s)
    setParams(next, { replace: true })
  }

  return (
    <>
      <div className="row" style={{ gap: 'var(--sp-3)', paddingBlockEnd: 'var(--sp-4)' }}>
        <Link to="/app/lots" className="btn btn--ghost btn--sm">
          <ArrowLeft size={14} strokeWidth={1.9} />
          All parcels
        </Link>
        <span className="spacer" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href)
            toast({ tone: 'success', title: 'Lot link copied' })
          }}
        >
          <Copy size={14} strokeWidth={1.9} />
          Copy link
        </Button>
        <Button variant="ghost" size="sm" onClick={() => window.print()}>
          <Printer size={14} strokeWidth={1.9} />
          Print
        </Button>
      </div>

      {blocked ? (
        <div
          className="panel"
          style={{
            padding: 'var(--sp-3) var(--sp-4)',
            marginBlockEnd: 'var(--sp-4)',
            background: 'var(--oxblood-tint)',
            borderColor: 'color-mix(in oklab, var(--oxblood) 30%, var(--rule))',
            display: 'flex',
            gap: 'var(--sp-3)',
            alignItems: 'center',
          }}
          role="status"
        >
          <ShieldAlert size={16} strokeWidth={1.9} style={{ color: 'var(--oxblood)', flex: 'none' }} />
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--ink)' }}>
            <b>This parcel has an urgent problem.</b> {pieces.filter((p) => p.hold_id).length} piece(s) are
            stopped until it is fixed.
          </span>
          <span className="spacer" />
          <Link to="/app/holds" className="btn btn--quiet btn--sm" style={{ color: 'var(--oxblood)' }}>
            See the problem
          </Link>
        </div>
      ) : null}

      <header className="lot-head">
        <div className="lot-head__top">
          <div className="lot-head__id">
            <span className="lot-head__no">{lot.lot_no}</span>
            <h2 className="lot-head__designer">{lot.designer ?? 'Unnamed lot'}</h2>
          </div>
          <span className="spacer" />
          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            {lot.closed_at ? <Stamp label="Lot closed" who={formatDate(lot.closed_at)} /> : null}
            <span className={blocked ? 'chip chip--oxblood' : 'chip chip--jade'}>
              Step {Number(stageDef.no)} · {stageDef.name}
            </span>
            <span className="chip">{lot.stock_type ?? '—'}</span>
          </div>
        </div>

        <div className="lot-head__facts">
          <span className="lot-head__fact">
            Received <b>{formatDate(lot.created_at)}</b>
          </span>
          <span className="lot-head__fact">
            Age <b>{ageLabel(lot.created_at)}</b>
          </span>
          <span className="lot-head__fact">
            Boxes <b>{lot.boxes ?? '—'}</b>
          </span>
          <span className="lot-head__fact">
            {lot.courier ?? 'Courier'} <b className="mono">{lot.tracking ?? '—'}</b>
          </span>
          <span className="lot-head__fact">
            PO <b className="mono">{lot.po_ref ?? '—'}</b>
          </span>
          <span className="lot-head__fact">
            Pieces <b>{pieces.length}</b> · accepted <b>{accepted}</b> · rejected <b>{rejected}</b>
          </span>
          {openQueries.length > 0 ? (
            <span className="lot-head__fact">
              <span className="chip chip--amber">{openQueries.length} open queries</span>
            </span>
          ) : null}
        </div>
      </header>

      <div className="lot-body">
        <div className="lot-body__spine">
          <div className="lot-spine-head">
            <span className="caps">The 8 steps</span>
            <MiniSpine bundle={bundle} blocked={blocked} />
          </div>
          <Spine bundle={bundle} active={active} onSelect={goStage} blockedStages={blockedStages} />

          <div style={{ marginBlockStart: 'var(--sp-5)', paddingBlockStart: 'var(--sp-4)', borderBlockStart: '1px solid var(--rule)' }}>
            <div className="dl" style={{ gridTemplateColumns: '1fr', gap: 'var(--sp-3)' }}>
              <div>
                <dt>Display start</dt>
                <dd className="mono">{lot.display_start ?? '—'}</dd>
              </div>
              <div>
                <dt>Review with designer</dt>
                <dd className="mono">{lot.review_date ?? '—'}</dd>
              </div>
              <div>
                <dt>Primary rack</dt>
                <dd className="mono">{lot.rack_no ?? '—'}</dd>
              </div>
            </div>
          </div>
        </div>

        <div className="lot-body__work">
          <StageWork bundle={bundle} stage={active} onStage={goStage} />
        </div>
      </div>

      <div className="row" style={{ gap: 'var(--sp-2)', paddingBlockStart: 'var(--sp-5)', flexWrap: 'wrap' }}>
        <span className="caps">Go to step</span>
        {STAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="chip chip-btn"
            aria-pressed={active === s.id}
            onClick={() => goStage(s.id)}
          >
            {Number(s.no)}. {s.short}
          </button>
        ))}
      </div>
    </>
  )
}
