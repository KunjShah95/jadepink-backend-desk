import { buildSeed } from '../seed'
import { STAGE_BY_ID } from '../stages'
import type {
  ApprovalKind,
  DailyClose,
  Hold,
  Lot,
  NewLotInput,
  Piece,
  Role,
  Severity,
  Snapshot,
  StageId,
  Upcoming,
} from '../types'

const KEY = 'jp.desk.v2'

export interface Store {
  readonly mode: 'local' | 'api' | 'supabase'
  load(): Promise<Snapshot>
  reset(): Promise<Snapshot>

  createLot(input: NewLotInput, by: string): Promise<Lot>
  updateLot(id: string, patch: Partial<Lot>, by: string): Promise<void>

  toggleCheck(lotId: string, stage: StageId, key: string, by: string): Promise<void>
  passGate(lotId: string, stage: StageId, by: string): Promise<void>
  removeGate(lotId: string, stage: StageId, by: string): Promise<void>

  addApproval(lotId: string, kind: ApprovalKind, note: string, by: string): Promise<void>
  addQuery(lotId: string, text: string, by: string): Promise<void>
  answerQuery(lotId: string, queryId: string, answer: string, by: string): Promise<void>

  setPieceQc(pieceId: string, qc: 'accept' | 'reject', reason: string | null, by: string): Promise<void>
  tagPiece(pieceId: string, dest: string, by: string): Promise<void>
  setPieceLocation(pieceId: string, location: string, by: string): Promise<void>
  pullPiece(pieceId: string, box: string, by: string): Promise<void>

  createHold(input: HoldInput, by: string): Promise<void>
  resolveHold(id: string, outcome: 'fixed' | 'written_off', fix: string, by: string): Promise<void>

  addUpcoming(input: UpcomingInput, by: string): Promise<void>
  receiveUpcoming(id: string, by: string): Promise<Lot | null>

  saveClose(entry: Omit<DailyClose, 'by' | 'at'>, by: string): Promise<void>
  updateSettings(boxCount: number, by: string): Promise<void>
  setProfileRoles(profileId: string, roles: Role[], by: string): Promise<void>
  addDesigner(name: string, by: string): Promise<void>
  addProfile(name: string, roles: Role[], by: string): Promise<string>
}

export interface HoldInput {
  lot_id: string | null
  piece_id: string | null
  error: string
  home_stage: StageId
  sev: Severity
  note: string
}

export interface UpcomingInput {
  designer: string
  expected_date: string
  boxes: number
  pieces: number
  courier: string
  tracking: string
  po_ref: string
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T

let seq = 0
const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${(++seq).toString(36).padStart(2, '0')}`

function loadPersisted(): Snapshot | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Snapshot
    if (!parsed || !Array.isArray(parsed.lots) || !parsed.settings) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * The default adapter. Everything lives in localStorage, seeded with a full
 * working store, so the desk is usable the moment the page loads.
 */
export class LocalStore implements Store {
  readonly mode = 'local' as const
  private db: Snapshot

  constructor() {
    this.db = loadPersisted() ?? buildSeed()
    this.persist()
  }

  private persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.db))
    } catch {
      /* Quota or private mode — the in-memory copy still works. */
    }
  }

  private event(
    action: string,
    entity: string,
    entityId: string | null,
    text: string,
    by: string,
    lotId: string | null,
    after: Record<string, unknown> | null = null,
  ) {
    this.db.events.unshift({
      id: nextId('evt'),
      lot_id: lotId,
      action,
      entity,
      entity_id: entityId,
      before: null,
      after,
      text,
      by,
      at: new Date().toISOString(),
    })
  }

  private commit() {
    this.persist()
  }

  async load() {
    return clone(this.db)
  }

  async reset() {
    this.db = buildSeed()
    this.persist()
    return clone(this.db)
  }

  /* ---- Lots ------------------------------------------------------------- */

  async createLot(input: NewLotInput, by: string) {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const sameDay = this.db.lots.filter((l) => l.lot_no.startsWith(`IN-${yy}${mm}${dd}-`)).length
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const suffix =
      alphabet[sameDay % 24] + alphabet[(sameDay * 7) % 24] + alphabet[(sameDay * 13) % 24]

    const lot: Lot = {
      id: nextId('lot'),
      lot_no: `IN-${yy}${mm}${dd}-${suffix}`,
      example: false,
      created_by: by,
      created_at: now.toISOString(),
      closed_at: null,
      designer: input.designer,
      courier: input.courier,
      tracking: input.tracking,
      boxes: input.boxes,
      stock_type: input.stock_type,
      condition_: input.condition_,
      expected_: input.expected_,
      po_ref: input.po_ref,
      upcoming_id: input.upcoming_id,
      blind_count: input.blind_count,
      challan_qty: input.challan_qty,
      po_qty: input.po_qty,
      diff_note: input.diff_note,
      tags_match: input.tags_match,
      price_hold_at: null,
      iron_count: null,
      ho_done_by: null,
      ho_done_at: null,
      tag_count: null,
      tag_dest: null,
      display_start: null,
      review_date: null,
      designer_accept_at: null,
      rtv_box: null,
      rtv_no: null,
      rtv_challan: null,
      rtv_courier: null,
      rtv_tracking: null,
      ack_count: null,
      ack_date: null,
      sell_bill_no: null,
      pay_note: null,
      legal_name: null,
      gst_reg: null,
      gst_no: null,
      pan: null,
      doc_type: 'Challan',
      challan_no: input.po_ref ? input.po_ref.replace('PO', 'CH') : null,
      maker: by,
      maker_at: now.toISOString(),
      checker: null,
      checker_at: null,
      rack_no: null,
      buyer: null,
      tn_out_by: null,
      tn_out_count: null,
      tn_in_by: null,
      tn_in_count: null,
    }

    this.db.lots.unshift(lot)

    if (input.upcoming_id) {
      const up = this.db.upcoming.find((u) => u.id === input.upcoming_id)
      if (up) {
        up.status = 'received'
        up.lot_id = lot.id
        up.received_at = now.toISOString()
      }
    }

    this.event(
      'created',
      'lot',
      lot.lot_no,
      `Parcel received from ${input.designer}`,
      by,
      lot.id,
      { lot_no: lot.lot_no, boxes: input.boxes },
    )
    this.commit()
    return clone(lot)
  }

  async updateLot(id: string, patch: Partial<Lot>, by: string) {
    const lot = this.db.lots.find((l) => l.id === id)
    if (!lot) throw new Error('Lot not found')
    const before = clone(lot)
    Object.assign(lot, patch)
    if (patch.closed_at) {
      lot.closed_at = patch.closed_at
    }
    const changed = Object.keys(patch).filter(
      (k) => (before as unknown as Record<string, unknown>)[k] !== (patch as unknown as Record<string, unknown>)[k],
    )
    this.event(
      'updated',
      'lot',
      lot.lot_no,
      `Updated ${changed.slice(0, 3).join(', ')}${changed.length > 3 ? ` +${changed.length - 3}` : ''}`,
      by,
      lot.id,
      patch as Record<string, unknown>,
    )
    this.commit()
  }

  /* ---- Gates and checks ------------------------------------------------- */

  async toggleCheck(lotId: string, stage: StageId, key: string, by: string) {
    const existing = this.db.checks.find(
      (c) => c.lot_id === lotId && c.stage === stage && c.item_key === key,
    )
    if (existing) {
      this.db.checks = this.db.checks.filter((c) => c.id !== existing.id)
      this.commit()
      return
    }
    this.db.checks.push({
      id: nextId('chk'),
      lot_id: lotId,
      stage,
      item_key: key,
      by,
      at: new Date().toISOString(),
    })
    this.commit()
  }

  async passGate(lotId: string, stage: StageId, by: string) {
    if (this.db.gates.some((g) => g.lot_id === lotId && g.stage === stage)) return
    const now = new Date().toISOString()
    this.db.gates.push({ id: nextId('gat'), lot_id: lotId, stage, by, at: now, test: false })

    const lot = this.db.lots.find((l) => l.id === lotId)
    if (lot) {
      if (stage === 's1') {
        lot.challan_qty ??= lot.blind_count
      }
      if (stage === 's3') {
        lot.iron_count = this.db.pieces.filter(
          (p) => p.lot_id === lotId && p.qc === 'accept',
        ).length
      }
      if (stage === 's4') {
        lot.ho_done_by = by
        lot.ho_done_at = now
        lot.tag_count = this.db.pieces.filter(
          (p) => p.lot_id === lotId && p.tag_scanned,
        ).length
      }
      if (stage === 's5') {
        lot.display_start ??= now.slice(0, 10)
      }
      if (stage === 's6') {
        lot.designer_accept_at = now
      }
      if (stage === 's8') {
        lot.closed_at = now
      }
    }

    this.event(
      'gate_pass',
      'lot_gate',
      stage,
      `Passed gate ${STAGE_BY_ID[stage].no} — ${STAGE_BY_ID[stage].name}`,
      by,
      lotId,
      { stage },
    )
    this.commit()
  }

  async removeGate(lotId: string, stage: StageId, by: string) {
    const gate = this.db.gates.find((g) => g.lot_id === lotId && g.stage === stage)
    if (!gate) return
    this.db.gates = this.db.gates.filter((g) => g.id !== gate.id)
    const later = this.db.gates.filter((g) => g.lot_id === lotId && g.at > gate.at)
    this.db.gates = this.db.gates.filter((g) => !later.some((l) => l.id === g.id))
    const lot = this.db.lots.find((l) => l.id === lotId)
    if (lot) lot.closed_at = null
    this.event(
      'gate_reopen',
      'lot_gate',
      stage,
      `Reopened gate ${STAGE_BY_ID[stage].no} — ${STAGE_BY_ID[stage].name}`,
      by,
      lotId,
      { stage },
    )
    this.commit()
  }

  /* ---- Approvals and queries -------------------------------------------- */

  async addApproval(lotId: string, kind: ApprovalKind, note: string, by: string) {
    this.db.approvals.push({
      id: nextId('apr'),
      lot_id: lotId,
      kind,
      approver: by,
      note,
      by,
      at: new Date().toISOString(),
    })
    this.event('approval', 'lot_approval', kind, `Approved — ${note}`, by, lotId, { kind })
    this.commit()
  }

  async addQuery(lotId: string, text: string, by: string) {
    this.db.queries.unshift({
      id: nextId('qry'),
      lot_id: lotId,
      text,
      by,
      at: new Date().toISOString(),
      status: 'open',
      answer: null,
      answered_by: null,
      answered_at: null,
    })
    this.event('query', 'lot_query', null, `Query raised: ${text.slice(0, 60)}`, by, lotId)
    this.commit()
  }

  async answerQuery(lotId: string, queryId: string, answer: string, by: string) {
    const q = this.db.queries.find((x) => x.id === queryId)
    if (!q) return
    q.status = 'answered'
    q.answer = answer
    q.answered_by = by
    q.answered_at = new Date().toISOString()
    this.event('query_answer', 'lot_query', queryId, `Query answered: ${answer.slice(0, 60)}`, by, lotId)
    this.commit()
  }

  /* ---- Pieces ----------------------------------------------------------- */

  async setPieceQc(pieceId: string, qc: 'accept' | 'reject', reason: string | null, by: string) {
    const p = this.db.pieces.find((x) => x.id === pieceId)
    if (!p) return
    p.qc = qc
    p.reject_reason = qc === 'reject' ? reason : null
    p.state = qc === 'reject' ? 'rejected' : p.state === 'rejected' || p.state === 'new' ? 'accepted' : p.state
    this.event(
      'qc',
      'piece',
      pieceId,
      qc === 'reject' ? `Rejected ${pieceId} — ${reason ?? 'no reason given'}` : `Accepted ${pieceId}`,
      by,
      p.lot_id,
    )
    this.commit()
  }

  async tagPiece(pieceId: string, dest: string, by: string) {
    const p = this.db.pieces.find((x) => x.id === pieceId)
    if (!p) return
    p.barcode ??= `JP${pieceId.replace(/\D/g, '').slice(-8).padStart(8, '0')}`
    p.tag_scanned = true
    p.tag_dest = dest
    if (p.state === 'accepted' || p.state === 'new') p.state = 'tagged'
    this.event('tag', 'piece', pieceId, `Tagged ${pieceId} → ${dest}`, by, p.lot_id)
    this.commit()
  }

  async setPieceLocation(pieceId: string, location: string, by: string) {
    const p = this.db.pieces.find((x) => x.id === pieceId)
    if (!p) return
    const from = p.location
    p.location = location
    p.stored_at = new Date().toISOString()
    p.refilled_at = null
    p.refill_from = from
    p.refill_to = location
    if (location.startsWith('BOX')) p.state = 'stored'
    else if (p.state === 'tagged' || p.state === 'stored' || p.state === 'accepted') p.state = 'on_floor'
    this.event('location', 'piece', pieceId, `Moved ${pieceId} → ${location}`, by, p.lot_id)
    this.commit()
  }

  async pullPiece(pieceId: string, box: string, by: string) {
    const p = this.db.pieces.find((x) => x.id === pieceId)
    if (!p) return
    p.box_no = box
    p.location = box
    p.state = 'boxed'
    this.event('rtv_pull', 'piece', pieceId, `Pulled ${pieceId} into ${box}`, by, p.lot_id)
    this.commit()
  }

  /* ---- Holds ------------------------------------------------------------ */
  async createHold(input: HoldInput, by: string) {
    const hold: Hold = {
      id: nextId('hld'),
      lot_id: input.lot_id,
      piece_id: input.piece_id,
      error: input.error,
      err_key: null,
      home_stage: input.home_stage,
      found_at: new Date().toISOString(),
      sev: input.sev,
      note: input.note,
      by,
      at: new Date().toISOString(),
      status: 'open',
      outcome: null,
      fix: null,
      fix_by: null,
      fix_at: null,
    }
    this.db.holds.unshift(hold)
    if (input.piece_id) {
      const p = this.db.pieces.find((x) => x.id === input.piece_id)
      if (p) {
        p.hold_id = hold.id
        if (input.sev === 'A') p.state = 'on_hold' as Piece['state']
      }
    }
    this.event(
      'hold_create',
      'hold',
      hold.id,
      `Hold raised — ${input.error} (severity ${input.sev})`,
      by,
      input.lot_id,
      { sev: input.sev },
    )
    this.commit()
  }

  async resolveHold(id: string, outcome: 'fixed' | 'written_off', fix: string, by: string) {
    const h = this.db.holds.find((x) => x.id === id)
    if (!h) return
    h.status = outcome === 'fixed' ? 'resolved' : 'resolved'
    h.outcome = outcome
    h.fix = fix
    h.fix_by = by
    h.fix_at = new Date().toISOString()
    if (h.piece_id) {
      const p = this.db.pieces.find((x) => x.id === h.piece_id)
      if (p) {
        p.hold_id = null
        p.state = outcome === 'written_off' ? 'written_off' : 'accepted'
      }
    }
    this.event(
      'hold_resolve',
      'hold',
      id,
      outcome === 'written_off' ? `Written off — ${fix}` : `Hold fixed — ${fix}`,
      by,
      h.lot_id,
    )
    this.commit()
  }

  /* ---- Upcoming --------------------------------------------------------- */

  async addUpcoming(input: UpcomingInput, by: string) {
    const row: Upcoming = {
      id: nextId('upc'),
      ...input,
      status: 'expected',
      lot_id: null,
      received_at: null,
      source: 'manual',
      added_by: by,
      added_at: new Date().toISOString(),
    }
    this.db.upcoming.unshift(row)
    this.event(
      'upcoming',
      'upcoming',
      row.id,
      `Expected parcel logged — ${input.designer}`,
      by,
      null,
    )
    this.commit()
  }

  async receiveUpcoming(id: string, by: string) {
    const up = this.db.upcoming.find((u) => u.id === id)
    if (!up) return null
    const lot = await this.createLot(
      {
        designer: up.designer,
        courier: up.courier ?? '',
        tracking: up.tracking ?? '',
        boxes: up.boxes ?? 1,
        stock_type: 'SOR',
        condition_: 'Intact',
        expected_: 'Expected dispatch / PO',
        po_ref: up.po_ref ?? '',
        upcoming_id: up.id,
        blind_count: 0,
        challan_qty: up.pieces ?? 0,
        po_qty: up.pieces ?? 0,
        diff_note: null,
        tags_match: 'All tags match the agreed price',
      },
      by,
    )
    return lot
  }

  /* ---- Close, settings, people ------------------------------------------ */

  async saveClose(entry: Omit<DailyClose, 'by' | 'at'>, by: string) {
    const at = new Date().toISOString()
    const existing = this.db.dailyClose.findIndex((d) => d.date === entry.date)
    const row: DailyClose = { ...entry, by, at }
    if (existing >= 0) this.db.dailyClose[existing] = row
    else this.db.dailyClose.unshift(row)
    this.event('daily_close', 'daily_close', entry.date, `Daily close recorded for ${entry.date}`, by, null)
    this.commit()
  }

  async updateSettings(boxCount: number, by: string) {
    this.db.settings = {
      id: 1,
      box_count: boxCount,
      updated_by: by,
      updated_at: new Date().toISOString(),
    }
    this.event('settings', 'settings', '1', `Storeroom box count set to ${boxCount}`, by, null)
    this.commit()
  }

  async setProfileRoles(profileId: string, roles: Role[], by: string) {
    const p = this.db.profiles.find((x) => x.id === profileId)
    if (!p) return
    p.roles = roles
    this.event('roles', 'profile', profileId, `Roles updated for ${p.name}`, by, null, {
      roles,
    })
    this.commit()
  }

  async addDesigner(name: string, by: string) {
    this.db.designers.push({
      id: nextId('dsg'),
      name,
      legal_name: null,
      gst_reg: null,
      gst_no: null,
      pan: null,
      alpha_vendor_code: null,
      whatsapp_group: null,
      active: true,
    })
    this.event('designer', 'designer', name, `Designer added — ${name}`, by, null)
    this.commit()
  }

  async addProfile(name: string, roles: Role[], by: string): Promise<string> {
    const id = nextId('usr')
    this.db.profiles.push({
      id,
      name,
      phone: null,
      roles: roles.length ? roles : ['Receiver'],
      active: true,
      created_at: new Date().toISOString(),
    })
    this.event('profile', 'profile', id, `Profile created — ${name}`, by, null)
    this.commit()
    return id
  }
}
