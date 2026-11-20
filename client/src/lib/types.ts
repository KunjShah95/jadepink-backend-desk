/** Domain types. Mirrors schema-supabase.sql field for field. */

export type Role =
  | 'Receiver'
  | 'Marketing'
  | 'QC'
  | 'Buyer'
  | 'Accounts'
  | 'Management'
  | 'Floor team'
  | 'HO team'
  | 'Inward team'
  | 'Merchandiser'
  | 'Store manager'
  | 'Ridham'
  | 'Prateek'
  | 'Admin'

export const ALL_ROLES: Role[] = [
  'Receiver',
  'QC',
  'Inward team',
  'Floor team',
  'HO team',
  'Merchandiser',
  'Store manager',
  'Buyer',
  'Marketing',
  'Accounts',
  'Management',
  'Ridham',
  'Prateek',
  'Admin',
]

export type StageId = 's1' | 's2' | 's3' | 's4' | 's5' | 's6' | 's7' | 's8'

export type PieceState =
  | 'new'
  | 'accepted'
  | 'rejected'
  | 'tagged'
  | 'stored'
  | 'on_floor'
  | 'sold'
  | 'loan'
  | 'pulled'
  | 'boxed'
  | 'returned'
  | 'written_off'

export type Severity = 'A' | 'B' | 'C'
export type HoldStatus = 'open' | 'resolved' | 'noted'
export type HoldOutcome = 'fixed' | 'written_off'
export type ApprovalKind = 'mkt' | 'acct' | 'mgmt'

export interface Profile {
  id: string
  name: string
  phone: string | null
  roles: Role[]
  active: boolean
  created_at: string
}

export interface Designer {
  id: string
  name: string
  legal_name: string | null
  gst_reg: string | null
  gst_no: string | null
  pan: string | null
  alpha_vendor_code: string | null
  whatsapp_group: string | null
  active: boolean
}

export interface Lookup {
  id: string
  list_name: string
  value: string
  label: string
  sort_order: number
  active: boolean
}

export interface Lot {
  id: string
  lot_no: string
  example: boolean
  created_by: string | null
  created_at: string
  closed_at: string | null
  designer: string | null
  courier: string | null
  tracking: string | null
  boxes: number | null
  stock_type: string | null
  condition_: string | null
  expected_: string | null
  po_ref: string | null
  upcoming_id: string | null
  blind_count: number | null
  challan_qty: number | null
  po_qty: number | null
  diff_note: string | null
  tags_match: string | null
  price_hold_at: string | null
  iron_count: number | null
  ho_done_by: string | null
  ho_done_at: string | null
  tag_count: number | null
  tag_dest: string | null
  display_start: string | null
  review_date: string | null
  designer_accept_at: string | null
  rtv_box: string | null
  rtv_no: string | null
  rtv_challan: string | null
  rtv_courier: string | null
  rtv_tracking: string | null
  ack_count: number | null
  ack_date: string | null
  sell_bill_no: string | null
  pay_note: string | null
  legal_name: string | null
  gst_reg: string | null
  gst_no: string | null
  pan: string | null
  doc_type: string | null
  challan_no: string | null
  maker: string | null
  maker_at: string | null
  checker: string | null
  checker_at: string | null
  rack_no: string | null
  buyer: string | null
  tn_out_by: string | null
  tn_out_count: number | null
  tn_in_by: string | null
  tn_in_count: number | null
}

export interface LotCheck {
  id: string
  lot_id: string
  stage: StageId
  item_key: string
  by: string | null
  at: string
}

export interface LotGate {
  id: string
  lot_id: string
  stage: StageId
  by: string | null
  at: string
  test: boolean
}

export interface LotApproval {
  id: string
  lot_id: string
  kind: ApprovalKind
  approver: string | null
  note: string | null
  by: string | null
  at: string
}

export interface LotQuery {
  id: string
  lot_id: string
  text: string
  by: string | null
  at: string
  status: 'open' | 'answered'
  answer: string | null
  answered_by: string | null
  answered_at: string | null
}

export interface LotPhoto {
  id: string
  asset_id: string
  lot_id: string
  by: string | null
  at: string
}

export interface Piece {
  id: string
  lot_id: string
  idx: number
  style_code: string | null
  product: string | null
  colour: string | null
  size: string | null
  tag_mrp: number | null
  category: string | null
  hsn: string | null
  gst_pct: number | null
  cost: number | null
  margin: number | null
  qc: 'accept' | 'reject' | '' | null
  reject_reason: string | null
  barcode: string | null
  tag_scanned: boolean
  tag_dest: string | null
  location: string | null
  stored_at: string | null
  refilled_at: string | null
  refill_from: string | null
  refill_to: string | null
  state: PieceState
  sold_bill: string | null
  sold_at: string | null
  loan_to: string | null
  loan_at: string | null
  box_no: string | null
  hold_id: string | null
}

export interface Hold {
  id: string
  lot_id: string | null
  piece_id: string | null
  error: string
  err_key: string | null
  home_stage: StageId | null
  found_at: string
  sev: Severity
  note: string | null
  by: string | null
  at: string
  status: HoldStatus
  outcome: HoldOutcome | null
  fix: string | null
  fix_by: string | null
  fix_at: string | null
}

export interface EventRow {
  id: string
  lot_id: string | null
  action: string
  entity: string
  entity_id: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  text: string | null
  by: string | null
  at: string
}

export interface Upcoming {
  id: string
  designer: string
  expected_date: string | null
  boxes: number | null
  pieces: number | null
  courier: string | null
  tracking: string | null
  po_ref: string | null
  status: 'expected' | 'received'
  lot_id: string | null
  received_at: string | null
  source: 'manual' | 'portal'
  added_by: string | null
  added_at: string
}

export interface DailyClose {
  id?: string
  date: string
  locations: Record<string, number> | null
  system_qty: number | null
  scanned_qty: number | null
  open_notes: string | null
  hold_shelf: string | null
  manager: string | null
  notes: string | null
  by: string | null
  at: string
}

export interface Settings {
  id: number
  box_count: number
  updated_by: string | null
  updated_at: string
}

/** A lot plus every child record. */
export interface LotBundle {
  lot: Lot
  checks: LotCheck[]
  gates: LotGate[]
  approvals: LotApproval[]
  queries: LotQuery[]
  photos: LotPhoto[]
  pieces: Piece[]
  holds: Hold[]
}

/** Everything the app needs on boot. */
export interface Snapshot {
  profiles: Profile[]
  designers: Designer[]
  lookups: Lookup[]
  lots: Lot[]
  pieces: Piece[]
  checks: LotCheck[]
  gates: LotGate[]
  approvals: LotApproval[]
  queries: LotQuery[]
  photos: LotPhoto[]
  holds: Hold[]
  events: EventRow[]
  upcoming: Upcoming[]
  dailyClose: DailyClose[]
  settings: Settings
}

export interface NewLotInput {
  designer: string
  courier: string
  tracking: string
  boxes: number
  stock_type: string
  condition_: string
  expected_: string
  po_ref: string
  upcoming_id: string | null
  blind_count: number
  challan_qty: number
  po_qty: number
  diff_note: string | null
  tags_match: string
}
