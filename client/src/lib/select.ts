import { STAGES, currentStage, stageStates } from './stages'
import type {
  Hold,
  Lot,
  LotBundle,
  LotQuery,
  Piece,
  Snapshot,
  StageId,
} from './types'

export function bundleOf(snap: Snapshot, lotId: string): LotBundle | null {
  const lot = snap.lots.find((l) => l.id === lotId)
  if (!lot) return null
  return {
    lot,
    checks: snap.checks.filter((c) => c.lot_id === lotId),
    gates: snap.gates.filter((g) => g.lot_id === lotId),
    approvals: snap.approvals.filter((a) => a.lot_id === lotId),
    queries: snap.queries.filter((q) => q.lot_id === lotId),
    photos: snap.photos.filter((p) => p.lot_id === lotId),
    pieces: snap.pieces.filter((p) => p.lot_id === lotId),
    holds: snap.holds.filter((h) => h.lot_id === lotId),
  }
}

export function piecesOf(snap: Snapshot, lotId: string) {
  return snap.pieces.filter((p) => p.lot_id === lotId)
}

export function openHoldsOf(snap: Snapshot, lotId: string) {
  return snap.holds.filter((h) => h.lot_id === lotId && h.status === 'open')
}

export function openQueriesOf(snap: Snapshot, lotId: string) {
  return snap.queries.filter((q) => q.lot_id === lotId && q.status === 'open')
}

export function stageOf(snap: Snapshot, lot: Lot): StageId {
  return currentStage({ gates: snap.gates.filter((g) => g.lot_id === lot.id) })
}

export function lotStates(snap: Snapshot, lot: Lot) {
  return stageStates({ gates: snap.gates.filter((g) => g.lot_id === lot.id) })
}

export function isBlocked(snap: Snapshot, lot: Lot) {
  return snap.holds.some((h) => h.lot_id === lot.id && h.status === 'open' && h.sev === 'A')
}

export function gateCount(snap: Snapshot, lot: Lot) {
  return snap.gates.filter((g) => g.lot_id === lot.id).length
}

/** Pieces still needing a decision at QC. */
export function pendingQc(snap: Snapshot, lotId: string) {
  return snap.pieces.filter((p) => p.lot_id === lotId && !p.qc).length
}

/** Accepted pieces without a scanned tag. */
export function pendingTags(snap: Snapshot, lotId: string) {
  return snap.pieces.filter((p) => p.lot_id === lotId && p.qc === 'accept' && !p.tag_scanned).length
}

/** Accepted pieces with no location. */
export function pendingPlacement(snap: Snapshot, lotId: string) {
  return snap.pieces.filter(
    (p) => p.lot_id === lotId && p.qc === 'accept' && p.tag_scanned && !p.location,
  ).length
}

export interface StageCount {
  id: StageId
  no: string
  short: string
  name: string
  count: number
  blocked: number
  oldestDays: number
}

/** How many open lots sit at each gate right now. */
export function pipeline(snap: Snapshot): StageCount[] {
  const open = snap.lots.filter((l) => !l.closed_at)
  return STAGES.map((stage) => {
    const here = open.filter((l) => stageOf(snap, l) === stage.id)
    const oldest = here.reduce((max, l) => {
      const d = Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86_400_000)
      return Math.max(max, d)
    }, 0)
    return {
      id: stage.id,
      no: stage.no,
      short: stage.short,
      name: stage.name,
      count: here.length,
      blocked: here.filter((l) => isBlocked(snap, l)).length,
      oldestDays: oldest,
    }
  })
}

export type AttentionKind = 'hold' | 'query' | 'stale' | 'blocked'

export interface AttentionItem {
  id: string
  kind: AttentionKind
  lotId: string
  lotNo: string
  title: string
  meta: string
  sev?: 'A' | 'B' | 'C'
}

export function attention(snap: Snapshot): AttentionItem[] {
  const items: AttentionItem[] = []
  const lotById = new Map(snap.lots.map((l) => [l.id, l]))

  for (const hold of snap.holds.filter((h) => h.status === 'open')) {
    const lot = hold.lot_id ? lotById.get(hold.lot_id) : undefined
    items.push({
      id: hold.id,
      kind: 'hold',
      lotId: hold.lot_id ?? '',
      lotNo: lot?.lot_no ?? '—',
      title: hold.error,
      meta: `${hold.piece_id ?? 'Lot-level'} · raised ${new Date(hold.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
      sev: hold.sev,
    })
  }

  for (const q of snap.queries.filter((x) => x.status === 'open')) {
    const lot = lotById.get(q.lot_id)
    items.push({
      id: q.id,
      kind: 'query',
      lotId: q.lot_id,
      lotNo: lot?.lot_no ?? '—',
      title: q.text,
      meta: 'Designer or HO query awaiting an answer',
    })
  }

  for (const lot of snap.lots) {
    if (lot.closed_at) continue
    const days = Math.floor((Date.now() - new Date(lot.created_at).getTime()) / 86_400_000)
    if (days >= 5) {
      items.push({
        id: `stale-${lot.id}`,
        kind: 'stale',
        lotId: lot.id,
        lotNo: lot.lot_no,
        title: `${lot.designer ?? 'Unnamed lot'} has been open ${days} days`,
        meta: `Sitting at ${STAGES.find((s) => s.id === stageOf(snap, lot))?.name ?? '—'}`,
      })
    }
  }

  return items.sort((a, b) => {
    const rank = (i: AttentionItem) => (i.sev === 'A' ? 0 : i.sev === 'B' ? 1 : i.kind === 'query' ? 2 : 3)
    return rank(a) - rank(b)
  })
}

export interface DeskTotals {
  openLots: number
  onFloor: number
  stored: number
  sold: number
  openHolds: number
  blockedLots: number
  openQueries: number
  awaitingQc: number
}

export function totals(snap: Snapshot): DeskTotals {
  const openLots = snap.lots.filter((l) => !l.closed_at)
  return {
    openLots: openLots.length,
    onFloor: snap.pieces.filter((p) => p.state === 'on_floor').length,
    stored: snap.pieces.filter((p) => p.state === 'stored').length,
    sold: snap.pieces.filter((p) => p.state === 'sold').length,
    openHolds: snap.holds.filter((h) => h.status === 'open').length,
    blockedLots: openLots.filter((l) => isBlocked(snap, l)).length,
    openQueries: snap.queries.filter((q) => q.status === 'open').length,
    awaitingQc: snap.pieces.filter((p) => !p.qc && !['sold', 'written_off'].includes(p.state)).length,
  }
}

export function searchLots(snap: Snapshot, term: string) {
  const t = term.trim().toLowerCase()
  if (!t) return snap.lots
  return snap.lots.filter((lot) => {
    if (lot.lot_no.toLowerCase().includes(t)) return true
    if ((lot.designer ?? '').toLowerCase().includes(t)) return true
    if ((lot.tracking ?? '').toLowerCase().includes(t)) return true
    if ((lot.po_ref ?? '').toLowerCase().includes(t)) return true
    return snap.pieces.some((p) => p.lot_id === lot.id && p.id.toLowerCase().includes(t))
  })
}

export function locatePiece(snap: Snapshot, term: string): Piece[] {
  const t = term.trim().toLowerCase()
  if (t.length < 2) return []
  return snap.pieces
    .filter(
      (p) =>
        p.id.toLowerCase().includes(t) ||
        (p.barcode ?? '').toLowerCase().includes(t) ||
        (p.style_code ?? '').toLowerCase().includes(t),
    )
    .slice(0, 8)
}

export function queryTone(q: LotQuery) {
  return q.status === 'open' ? 'amber' : 'moss'
}

export function holdTone(h: Hold) {
  return h.status === 'open' ? 'oxblood' : 'moss'
}
