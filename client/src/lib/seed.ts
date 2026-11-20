import type {
  DailyClose,
  Designer,
  EventRow,
  Hold,
  Lot,
  LotApproval,
  LotCheck,
  LotGate,
  LotPhoto,
  LotQuery,
  Lookup,
  Piece,
  Profile,
  Settings,
  Snapshot,
  StageId,
  Upcoming,
} from './types'
import { STAGES } from './stages'
import { isoAt } from './format'

/* Deterministic PRNG so a reload never reshuffles the demo. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20261116)
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))

const uid = (() => {
  let n = 0
  return (prefix: string) => `${prefix}-${String(++n).padStart(4, '0')}`
})()

/* -------------------------------------------------------------------------- */
/* People                                                                      */
/* -------------------------------------------------------------------------- */

const PROFILES: Array<Pick<Profile, 'name' | 'phone' | 'roles'>> = [
  { name: 'Ridham Shah', phone: '+91 98200 11452', roles: ['Admin', 'Store manager'] },
  { name: 'Prateek Jain', phone: '+91 98200 11877', roles: ['Admin', 'Management'] },
  { name: 'Divya Nair', phone: '+91 98200 22109', roles: ['Store manager'] },
  { name: 'Smit Shah', phone: '+91 98200 33044', roles: ['Merchandiser'] },
  { name: 'Ananya Bose', phone: '+91 98200 33071', roles: ['Merchandiser', 'HO team'] },
  { name: 'Neha Kulkarni', phone: '+91 98200 44120', roles: ['QC', 'Buyer'] },
  { name: 'Arjun Pillai', phone: '+91 98200 55210', roles: ['Receiver', 'Inward team'] },
  { name: 'Fatima Shaikh', phone: '+91 98200 55288', roles: ['Inward team', 'Floor team'] },
  { name: 'Rohan Desai', phone: '+91 98200 66310', roles: ['Floor team'] },
  { name: 'Imran Qureshi', phone: '+91 98200 66377', roles: ['Floor team'] },
  { name: 'Meera Iyer', phone: '+91 98200 77420', roles: ['Marketing', 'HO team'] },
  { name: 'Vikram Rao', phone: '+91 98200 88530', roles: ['Accounts'] },
  { name: 'Tanvi Joshi', phone: '+91 98200 88599', roles: ['Accounts'] },
]

const profiles: Profile[] = PROFILES.map((p, i) => ({
  id: `usr-${String(i + 1).padStart(3, '0')}`,
  name: p.name,
  phone: p.phone,
  roles: p.roles,
  active: true,
  created_at: isoAt(220 - i, 9, 0),
}))

const byName = (name: string) => profiles.find((p) => p.name === name)?.id ?? null

/* -------------------------------------------------------------------------- */
/* Designers                                                                   */
/* -------------------------------------------------------------------------- */

const DESIGNER_ROWS = [
  {
    name: 'Aarohi Mehta',
    legal_name: 'Aarohi Mehta Design LLP',
    gst_reg: 'Maharashtra',
    gst_no: '27AABCA1234M1Z5',
    pan: 'AABCA1234M',
    alpha_vendor_code: 'AMD',
    whatsapp_group: 'AMD — Backend Desk',
  },
  {
    name: 'Kavya Sethi',
    legal_name: 'Kavya Sethi Couture Pvt Ltd',
    gst_reg: 'Delhi',
    gst_no: '07AACCK5678P1Z2',
    pan: 'AACCK5678P',
    alpha_vendor_code: 'KSC',
    whatsapp_group: 'Kavya Sethi — Store Ops',
  },
  {
    name: 'Nirvaan Label',
    legal_name: 'Nirvaan Apparel',
    gst_reg: 'Gujarat',
    gst_no: '24AADCN9012R1Z8',
    pan: 'AADCN9012R',
    alpha_vendor_code: 'NVL',
    whatsapp_group: 'Nirvaan Label',
  },
  {
    name: 'Rasa by Devika',
    legal_name: 'Devika Rasa Studio',
    gst_reg: 'Karnataka',
    gst_no: '29AAECD3456S1Z4',
    pan: 'AAECD3456S',
    alpha_vendor_code: 'RSD',
    whatsapp_group: 'Rasa — Weekly',
  },
  {
    name: 'Tara & Co.',
    legal_name: 'Tara and Company',
    gst_reg: 'Rajasthan',
    gst_no: '08AAECT7890T1Z1',
    pan: 'AAECT7890T',
    alpha_vendor_code: 'TCO',
    whatsapp_group: 'Tara & Co. Backend',
  },
  {
    name: 'Zohra Studio',
    legal_name: 'Zohra Atelier',
    gst_reg: 'Telangana',
    gst_no: '36AADCZ2345U1Z7',
    pan: 'AADCZ2345U',
    alpha_vendor_code: 'ZST',
    whatsapp_group: 'Zohra Studio',
  },
]

const designers: Designer[] = DESIGNER_ROWS.map((d, i) => ({
  id: `dsg-${String(i + 1).padStart(3, '0')}`,
  ...d,
  active: true,
}))

/* -------------------------------------------------------------------------- */
/* Lookups — the store's exact wording                                         */
/* -------------------------------------------------------------------------- */

const LOOKUP_SEED: Array<[string, Array<[string, string]>]> = [
  ['stock_type', [['SOR', 'Stock (SOR)'], ['Order piece', 'Order piece']]],
  [
    'box_condition',
    [['Intact', 'Intact'], ['Damaged — noted on slip', 'Damaged — noted on slip']],
  ],
  [
    'expected',
    [['Expected dispatch / PO', 'Expected dispatch / PO'], ['Unexpected — kept unopened', 'Unexpected — kept unopened']],
  ],
  [
    'tags_match',
    [
      ['All tags match the agreed price', 'All tags match the agreed price'],
      ['Some tags do not match', 'Some tags do not match'],
    ],
  ],
  ['qc_result', [['accept', 'Accept'], ['reject', 'Reject']]],
  [
    'reject_reason',
    [
      ['Not as per PO / selection', 'Not as per PO / selection'],
      ['Wrong size', 'Wrong size'],
      ['Wrong colour', 'Wrong colour'],
      ['Stain or damage', 'Stain or damage'],
      ['Stitching defect', 'Stitching defect'],
      ['Missing part (dupatta, belt, lining)', 'Missing part (dupatta, belt, lining)'],
      ['MRP not as agreed', 'MRP not as agreed'],
      ['Other', 'Other'],
    ],
  ],
  [
    'category',
    [
      ['Kurta set', 'Kurta set'],
      ['Co-ord set', 'Co-ord set'],
      ['Dress', 'Dress'],
      ['Saree', 'Saree'],
      ['Lehenga', 'Lehenga'],
      ['Anarkali', 'Anarkali'],
      ['Shirt', 'Shirt'],
      ['Top', 'Top'],
      ['Blouse', 'Blouse'],
      ['Pant', 'Pant'],
      ['Skirt', 'Skirt'],
      ['Jacket', 'Jacket'],
      ['Dupatta', 'Dupatta'],
      ['Other', 'Other'],
    ],
  ],
  ['severity', [['A', 'A Stops the piece'], ['B', 'B Fixed in parallel'], ['C', 'C Noted only']]],
  [
    'hold_outcome',
    [['fixed', 'Fixed — rejoins lot'], ['written_off', 'Write off (Prateek approved)']],
  ],
  ['hold_filter', [['open', 'Open'], ['resolved', 'Resolved and noted']]],
  ['open_notes', [['None open', 'None open'], ['Some open', 'Some open — listed in notes']]],
  [
    'hold_shelf',
    [['Cleared', 'Cleared or every hold has an owner'], ['Not checked', 'Not checked']],
  ],
  ['tag_dest', [['Floor', 'Floor'], ['Storeroom', 'Storeroom']]],
  [
    'piece_state',
    [
      ['new', 'Not checked'],
      ['accepted', 'Accepted'],
      ['rejected', 'Rejected'],
      ['tagged', 'Tagged'],
      ['stored', 'Storeroom'],
      ['on_floor', 'On floor'],
      ['sold', 'Sold'],
      ['loan', 'On loan'],
      ['pulled', 'At RTV bench'],
      ['boxed', 'In RTV box'],
      ['returned', 'Returned'],
      ['written_off', 'Written off'],
    ],
  ],
]

const lookups: Lookup[] = LOOKUP_SEED.flatMap(([list_name, rows]) =>
  rows.map(([value, label], i) => ({
    id: uid('lkp'),
    list_name,
    value,
    label,
    sort_order: i + 1,
    active: true,
  })),
)

/* -------------------------------------------------------------------------- */
/* Lots                                                                        */
/* -------------------------------------------------------------------------- */

interface LotSpec {
  designer: string
  createdDaysAgo: number
  gatesPassed: number
  pieces: number
  product: string
  category: string
  colour: string
  mrp: number
  stockType?: string
  hasHold?: boolean
  hasQuery?: boolean
  rtv?: boolean
}

const SPECS: LotSpec[] = [
  {
    designer: 'Aarohi Mehta',
    createdDaysAgo: 0,
    gatesPassed: 1,
    pieces: 18,
    product: 'Chanderi kurta set',
    category: 'Kurta set',
    colour: 'Ivory',
    mrp: 14500,
    stockType: 'SOR',
    hasQuery: true,
  },
  {
    designer: 'Nirvaan Label',
    createdDaysAgo: 0,
    gatesPassed: 0,
    pieces: 0,
    product: 'Handloom co-ord set',
    category: 'Co-ord set',
    colour: 'Indigo',
    mrp: 11200,
    stockType: 'SOR',
  },
  {
    designer: 'Kavya Sethi',
    createdDaysAgo: 1,
    gatesPassed: 2,
    pieces: 24,
    product: 'Silk Anarkali',
    category: 'Anarkali',
    colour: 'Wine',
    mrp: 38500,
    stockType: 'Order piece',
    hasHold: true,
  },
  {
    designer: 'Rasa by Devika',
    createdDaysAgo: 2,
    gatesPassed: 3,
    pieces: 16,
    product: 'Linen saree with blouse',
    category: 'Saree',
    colour: 'Sage',
    mrp: 18700,
    stockType: 'SOR',
    hasQuery: true,
  },
  {
    designer: 'Tara & Co.',
    createdDaysAgo: 3,
    gatesPassed: 4,
    pieces: 22,
    product: 'Bandhani lehenga',
    category: 'Lehenga',
    colour: 'Marigold',
    mrp: 56000,
    stockType: 'Order piece',
    hasHold: true,
  },
  {
    designer: 'Zohra Studio',
    createdDaysAgo: 4,
    gatesPassed: 5,
    pieces: 12,
    product: 'Organza dress',
    category: 'Dress',
    colour: 'Rose',
    mrp: 24900,
    stockType: 'SOR',
  },
  {
    designer: 'Aarohi Mehta',
    createdDaysAgo: 6,
    gatesPassed: 6,
    pieces: 20,
    product: 'Mul cotton kurta set',
    category: 'Kurta set',
    colour: 'Charcoal',
    mrp: 9800,
    stockType: 'SOR',
    rtv: true,
    hasHold: true,
  },
  {
    designer: 'Kavya Sethi',
    createdDaysAgo: 9,
    gatesPassed: 7,
    pieces: 14,
    product: 'Velvet blouse',
    category: 'Blouse',
    colour: 'Wine',
    mrp: 8900,
    stockType: 'SOR',
    rtv: true,
  },
  {
    designer: 'Nirvaan Label',
    createdDaysAgo: 12,
    gatesPassed: 8,
    pieces: 26,
    product: 'Khadi shirt',
    category: 'Shirt',
    colour: 'Ivory',
    mrp: 6400,
    stockType: 'SOR',
  },
  {
    designer: 'Rasa by Devika',
    createdDaysAgo: 15,
    gatesPassed: 8,
    pieces: 11,
    product: 'Hand-painted dupatta',
    category: 'Dupatta',
    colour: 'Indigo',
    mrp: 5200,
    stockType: 'SOR',
  },
  {
    designer: 'Tara & Co.',
    createdDaysAgo: 2,
    gatesPassed: 2,
    pieces: 9,
    product: 'Chikankari top',
    category: 'Top',
    colour: 'Ivory',
    mrp: 7300,
    stockType: 'SOR',
  },
  {
    designer: 'Zohra Studio',
    createdDaysAgo: 1,
    gatesPassed: 1,
    pieces: 15,
    product: 'Pleated midi skirt',
    category: 'Skirt',
    colour: 'Sage',
    mrp: 8600,
    stockType: 'Order piece',
  },
]

const COURIERS = ['Delhivery', 'Blue Dart', 'VRL Logistics', 'DTDC', 'Professional Couriers']
const SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const
const LOCATIONS = ['RACK-01', 'RACK-02', 'RACK-03', 'RACK-04', 'M01', 'M02', 'BOX-01', 'BOX-02', 'BOX-03']

const lots: Lot[] = []
const pieces: Piece[] = []
const checks: LotCheck[] = []
const gates: LotGate[] = []
const approvals: LotApproval[] = []
const queries: LotQuery[] = []
const photos: LotPhoto[] = []
const holds: Hold[] = []
const events: EventRow[] = []

const RECEIVER = byName('Arjun Pillai')
const QC = byName('Neha Kulkarni')
const FLOOR = byName('Fatima Shaikh')
const INWARD = byName('Fatima Shaikh')
const MERCH = byName('Smit Shah')
const ACCOUNTS = byName('Vikram Rao')
const MANAGER = byName('Divya Nair')
const MGMT = byName('Prateek Jain')
const MKT = byName('Meera Iyer')

const stageActor = (stage: StageId) =>
  ({
    s1: RECEIVER,
    s2: QC,
    s3: FLOOR,
    s4: INWARD,
    s5: FLOOR,
    s6: MERCH,
    s7: FLOOR,
    s8: ACCOUNTS,
  })[stage]

SPECS.forEach((spec, index) => {
  const created = isoAt(spec.createdDaysAgo, 9 + (index % 6), (index * 7) % 60)
  const d = new Date(created)
  const yy = String(d.getFullYear()).slice(-2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const suffix = ['Q4V', 'K7M', 'R2X', 'T9B', 'H3P', 'W6N', 'D1L', 'F8C', 'J5Y', 'V2G', 'B4S', 'N7E'][index]
  const lotNo = `IN-${yy}${mm}${dd}-${suffix}`
  const lotId = uid('lot')
  const closed = spec.gatesPassed === 8

  const lot: Lot = {
    id: lotId,
    lot_no: lotNo,
    example: false,
    created_by: RECEIVER,
    created_at: created,
    closed_at: closed ? isoAt(Math.max(0, spec.createdDaysAgo - 3), 18, 30) : null,
    designer: spec.designer,
    courier: COURIERS[index % COURIERS.length],
    tracking: `TRK${between(100000, 999999)}IN`,
    boxes: between(1, 4),
    stock_type: spec.stockType ?? 'SOR',
    condition_: index === 4 ? 'Damaged — noted on slip' : 'Intact',
    expected_: 'Expected dispatch / PO',
    po_ref: `PO/${d.getFullYear()}/${between(100, 999)}`,
    upcoming_id: null,
    blind_count: spec.gatesPassed >= 1 ? spec.pieces + (index % 3 === 0 ? 1 : 0) : null,
    challan_qty: spec.gatesPassed >= 1 ? spec.pieces : null,
    po_qty: spec.gatesPassed >= 1 ? spec.pieces : null,
    diff_note:
      spec.gatesPassed >= 1 && index % 3 === 0
        ? 'Blind count is one higher than the challan. Piece held for QC.'
        : null,
    tags_match:
      spec.gatesPassed >= 1
        ? index === 3
          ? 'Some tags do not match'
          : 'All tags match the agreed price'
        : null,
    price_hold_at: index === 3 ? isoAt(spec.createdDaysAgo - 1, 15, 10) : null,
    iron_count: spec.gatesPassed >= 2 ? spec.pieces : null,
    ho_done_by: spec.gatesPassed >= 3 ? byName('Ananya Bose') : null,
    ho_done_at: spec.gatesPassed >= 3 ? isoAt(spec.createdDaysAgo - 2, 16, 20) : null,
    tag_count: spec.gatesPassed >= 3 ? spec.pieces : null,
    tag_dest: spec.gatesPassed >= 3 ? 'Floor' : null,
    display_start: spec.gatesPassed >= 4 ? isoAt(spec.createdDaysAgo - 2, 11, 0).slice(0, 10) : null,
    review_date:
      spec.gatesPassed >= 4
        ? isoAt(Math.max(0, spec.createdDaysAgo - 30), 11, 0).slice(0, 10)
        : null,
    designer_accept_at: spec.gatesPassed >= 5 ? isoAt(spec.createdDaysAgo - 3, 12, 0) : null,
    rtv_box: spec.gatesPassed >= 6 && spec.rtv ? `BOX-${between(1, 9)}` : null,
    rtv_no: spec.gatesPassed >= 6 && spec.rtv ? `RTV/${d.getFullYear()}/${between(10, 99)}` : null,
    rtv_challan: spec.gatesPassed >= 6 && spec.rtv ? `CH-${between(1000, 9999)}` : null,
    rtv_courier: spec.gatesPassed >= 6 && spec.rtv ? 'Delhivery' : null,
    rtv_tracking: spec.gatesPassed >= 6 && spec.rtv ? `RTV${between(100000, 999999)}` : null,
    ack_count: spec.gatesPassed >= 7 ? spec.pieces : null,
    ack_date: spec.gatesPassed >= 7 ? isoAt(spec.createdDaysAgo - 5, 12, 0).slice(0, 10) : null,
    sell_bill_no: closed ? `SB/${d.getFullYear()}/${between(1000, 9999)}` : null,
    pay_note: closed ? 'Net of 12% commission, settled by NEFT on the 7th.' : null,
    legal_name: null,
    gst_reg: null,
    gst_no: null,
    pan: null,
    doc_type: 'Challan',
    challan_no: `CH-${between(10000, 99999)}`,
    maker: 'QC desk',
    maker_at: created,
    checker: spec.gatesPassed >= 1 ? 'Neha Kulkarni' : null,
    checker_at: spec.gatesPassed >= 1 ? isoAt(spec.createdDaysAgo, 12, 0) : null,
    rack_no: spec.gatesPassed >= 4 ? `RACK-0${(index % 4) + 1}` : null,
    buyer: 'Neha Kulkarni',
    tn_out_by: null,
    tn_out_count: null,
    tn_in_by: null,
    tn_in_count: null,
  }

  lots.push(lot)

  events.push({
    id: uid('evt'),
    lot_id: lotId,
    action: 'created',
    entity: 'lot',
    entity_id: lotNo,
    before: null,
    after: { lot_no: lotNo, designer: spec.designer },
    text: `Parcel received from ${spec.designer}`,
    by: RECEIVER,
    at: created,
  })

  // Gates + checklist ticks for every stage already passed.
  for (let s = 0; s < spec.gatesPassed && s < STAGES.length; s++) {
    const stage = STAGES[s]
    const at = isoAt(Math.max(0, spec.createdDaysAgo - s), 10 + s, (s * 11) % 60)
    gates.push({
      id: uid('gat'),
      lot_id: lotId,
      stage: stage.id,
      by: stageActor(stage.id),
      at,
      test: false,
    })
    stage.checklist.forEach((item) => {
      checks.push({
        id: uid('chk'),
        lot_id: lotId,
        stage: stage.id,
        item_key: item.key,
        by: stageActor(stage.id),
        at,
      })
    })
    events.push({
      id: uid('evt'),
      lot_id: lotId,
      action: 'gate_pass',
      entity: 'lot_gate',
      entity_id: stage.id,
      before: null,
      after: { stage: stage.id },
      text: `Passed gate ${stage.no} — ${stage.name}`,
      by: stageActor(stage.id),
      at,
    })
  }

  // Partial checklist on the current stage.
  const currentIdx = Math.min(spec.gatesPassed, STAGES.length - 1)
  const current = STAGES[currentIdx]
  const partial = spec.gatesPassed === 8 ? 0 : Math.min(current.checklist.length - 1, between(0, 4))
  for (let c = 0; c < partial; c++) {
    checks.push({
      id: uid('chk'),
      lot_id: lotId,
      stage: current.id,
      item_key: current.checklist[c].key,
      by: stageActor(current.id),
      at: isoAt(Math.max(0, spec.createdDaysAgo - 1), 14, c * 5),
    })
  }

  // Pieces
  if (spec.pieces > 0) {
    for (let i = 1; i <= spec.pieces; i++) {
      const qcState: Piece['qc'] =
        spec.gatesPassed >= 1 ? (i === 4 && index % 4 === 0 ? 'reject' : 'accept') : ''
      const rejected = qcState === 'reject'
      const tagged = spec.gatesPassed >= 3 && !rejected
      const onFloor = spec.gatesPassed >= 4 && !rejected
      const sold = closed && i <= Math.ceil(spec.pieces * 0.55)
      const state: Piece['state'] = rejected
        ? 'rejected'
        : sold
          ? 'sold'
          : spec.gatesPassed >= 6 && spec.rtv
            ? i % 3 === 0
              ? 'boxed'
              : 'pulled'
            : onFloor
              ? 'on_floor'
              : tagged
                ? 'tagged'
                : qcState === 'accept'
                  ? 'accepted'
                  : 'new'

      pieces.push({
        id: `${lotNo}-${i}`,
        lot_id: lotId,
        idx: i,
        style_code: `${spec.designer.split(' ')[0].slice(0, 3).toUpperCase()}-${String(index + 1).padStart(2, '0')}${String(i).padStart(2, '0')}`,
        product: spec.product,
        colour: spec.colour,
        size: SIZES[i % SIZES.length],
        tag_mrp: spec.mrp + (i % 3 === 0 ? 500 : 0),
        category: spec.category,
        hsn: '6211',
        gst_pct: 5,
        cost: Math.round(spec.mrp * 0.62),
        margin: 38,
        qc: qcState,
        reject_reason: rejected ? pick(['Stain or damage', 'Stitching defect', 'Wrong size']) : null,
        barcode: tagged ? `JP${lotNo.slice(3, 11)}${String(i).padStart(4, '0')}` : null,
        tag_scanned: tagged,
        tag_dest: tagged ? 'Floor' : null,
        location: onFloor ? LOCATIONS[(i + index) % LOCATIONS.length] : null,
        stored_at: onFloor ? isoAt(Math.max(0, spec.createdDaysAgo - 3), 15, 0) : null,
        refilled_at: null,
        refill_from: null,
        refill_to: null,
        state,
        sold_bill: sold ? (lot.sell_bill_no as string) : null,
        sold_at: sold ? isoAt(Math.max(0, spec.createdDaysAgo - 4), 17, 0) : null,
        loan_to: null,
        loan_at: null,
        box_no: state === 'boxed' ? lot.rtv_box : null,
        hold_id: null,
      })
    }
  }

  // Approvals
  if (spec.gatesPassed >= 5) {
    approvals.push({
      id: uid('apr'),
      lot_id: lotId,
      kind: 'mkt',
      approver: MKT,
      note: 'Display and price point approved for the season.',
      by: MKT,
      at: isoAt(Math.max(0, spec.createdDaysAgo - 3), 13, 0),
    })
  }
  if (closed) {
    approvals.push({
      id: uid('apr'),
      lot_id: lotId,
      kind: 'acct',
      approver: ACCOUNTS,
      note: 'Sell bills reconciled against the settlement sheet.',
      by: ACCOUNTS,
      at: isoAt(Math.max(0, spec.createdDaysAgo - 3), 17, 0),
    })
    approvals.push({
      id: uid('apr'),
      lot_id: lotId,
      kind: 'mgmt',
      approver: MGMT,
      note: 'Settlement cleared. Close the lot.',
      by: MGMT,
      at: isoAt(Math.max(0, spec.createdDaysAgo - 3), 18, 0),
    })
  }

  // Photos
  if (spec.gatesPassed >= 1) {
    photos.push({
      id: uid('pho'),
      asset_id: `demo/box-${index + 1}.jpg`,
      lot_id: lotId,
      by: RECEIVER,
      at: isoAt(spec.createdDaysAgo, 9, 30),
    })
  }

  // Queries
  if (spec.hasQuery) {
    const open = index === 0
    queries.push({
      id: uid('qry'),
      lot_id: lotId,
      text: open
        ? 'Two pieces arrived with a different MRP sticker than the agreed price. Confirm whether to accept at the old price or return.'
        : 'Designer asked whether the ivory can be re-ordered in a larger size run for December.',
      by: MERCH,
      at: isoAt(Math.max(0, spec.createdDaysAgo - 1), 15, 0),
      status: open ? 'open' : 'answered',
      answer: open
        ? null
        : 'Accept at the agreed price. Re-order window closes on the 28th.',
      answered_by: open ? null : MANAGER,
      answered_at: open ? null : isoAt(Math.max(0, spec.createdDaysAgo - 2), 11, 0),
    })
  }

  // Holds
  if (spec.hasHold && spec.pieces > 0) {
    const targetIdx = index === 2 ? 4 : index === 4 ? 7 : 3
    const target = pieces.find((p) => p.lot_id === lotId && p.idx === targetIdx)
    if (target) {
      const holdId = uid('hld')
      const sev = index === 4 ? 'B' : 'A'
      holds.push({
        id: holdId,
        lot_id: lotId,
        piece_id: target.id,
        error: index === 4 ? 'Missing dupatta' : 'Stain on the front panel',
        err_key: index === 4 ? 'missing_part' : 'stain',
        home_stage: index === 4 ? 's4' : 's2',
        found_at: isoAt(Math.max(0, spec.createdDaysAgo - 1), 12, 0),
        sev,
        note:
          index === 4
            ? 'Dupatta not in the box. Designer informed on WhatsApp, replacement promised.'
            : 'Visible under the light. Sent for dry clean before the designer walk.',
        by: QC,
        at: isoAt(Math.max(0, spec.createdDaysAgo - 1), 12, 0),
        status: 'open',
        outcome: null,
        fix: null,
        fix_by: null,
        fix_at: null,
      })
      target.hold_id = holdId
      if (sev === 'A') target.state = 'on_hold' as Piece['state']
      events.push({
        id: uid('evt'),
        lot_id: lotId,
        action: 'hold_create',
        entity: 'hold',
        entity_id: holdId,
        before: null,
        after: { error: holds[holds.length - 1].error, sev },
        text: `Hold raised — ${holds[holds.length - 1].error} (severity ${sev})`,
        by: QC,
        at: isoAt(Math.max(0, spec.createdDaysAgo - 1), 12, 0),
      })
    }
  }
})

/* A resolved hold, so the resolved view is not empty. */
{
  const lot = lots[5]
  const piece = pieces.find((p) => p.lot_id === lot.id)
  if (piece) {
    holds.push({
      id: uid('hld'),
      lot_id: lot.id,
      piece_id: piece.id,
      error: 'Wrong size tag',
      err_key: 'wrong_size',
      home_stage: 's2',
      found_at: isoAt(5, 11, 0),
      sev: 'C',
      note: 'Tag said M, garment measured S. Re-tagged at the bench.',
      by: QC,
      at: isoAt(5, 11, 0),
      status: 'resolved',
      outcome: 'fixed',
      fix: 'Re-tagged to S and re-scanned.',
      fix_by: FLOOR,
      fix_at: isoAt(5, 15, 0),
    })
  }
}

/* -------------------------------------------------------------------------- */
/* Upcoming parcels                                                            */
/* -------------------------------------------------------------------------- */

const upcoming: Upcoming[] = [
  {
    id: uid('upc'),
    designer: 'Kavya Sethi',
    expected_date: isoAt(-2, 10, 0).slice(0, 10),
    boxes: 3,
    pieces: 26,
    courier: 'Blue Dart',
    tracking: 'BD8891203IN',
    po_ref: 'PO/2026/441',
    status: 'expected',
    lot_id: null,
    received_at: null,
    source: 'portal',
    added_by: MERCH,
    added_at: isoAt(3, 12, 0),
  },
  {
    id: uid('upc'),
    designer: 'Tara & Co.',
    expected_date: isoAt(-4, 10, 0).slice(0, 10),
    boxes: 2,
    pieces: 14,
    courier: 'Delhivery',
    tracking: 'DL7712045IN',
    po_ref: 'PO/2026/452',
    status: 'expected',
    lot_id: null,
    received_at: null,
    source: 'manual',
    added_by: RECEIVER,
    added_at: isoAt(2, 16, 0),
  },
  {
    id: uid('upc'),
    designer: 'Zohra Studio',
    expected_date: isoAt(-6, 10, 0).slice(0, 10),
    boxes: 1,
    pieces: 8,
    courier: 'VRL Logistics',
    tracking: 'VRL3390021',
    po_ref: 'PO/2026/460',
    status: 'expected',
    lot_id: null,
    received_at: null,
    source: 'portal',
    added_by: MERCH,
    added_at: isoAt(1, 9, 30),
  },
]

/* -------------------------------------------------------------------------- */
/* Daily close                                                                 */
/* -------------------------------------------------------------------------- */

const dailyClose: DailyClose[] = [1, 2, 3].map((d) => ({
  date: isoAt(d, 19, 0).slice(0, 10),
  locations: { 'RACK-01': 34, 'RACK-02': 28, 'RACK-03': 19, 'M01': 6, 'M02': 4, Storeroom: 41 },
  system_qty: 132,
  scanned_qty: 132 - (d === 2 ? 1 : 0),
  open_notes: d === 2 ? 'Some open — listed in notes' : 'None open',
  hold_shelf: 'Cleared or every hold has an owner',
  manager: MANAGER,
  notes:
    d === 2
      ? 'One piece could not be scanned at RACK-03. Found at the ironing table the next morning.'
      : 'Floor set complete. Hold shelf cleared.',
  by: MANAGER,
  at: isoAt(d, 19, 0),
}))

const settings: Settings = {
  id: 1,
  box_count: 20,
  updated_by: byName('Ridham Shah'),
  updated_at: isoAt(30, 10, 0),
}

/* Events for holds and queries land last so the feed reads newest-first. */
events.sort((a, b) => (a.at < b.at ? 1 : -1))

export function buildSeed(): Snapshot {
  return {
    profiles,
    designers,
    lookups,
    lots,
    pieces,
    checks,
    gates,
    approvals,
    queries,
    photos,
    holds,
    events,
    upcoming,
    dailyClose,
    settings,
  }
}

export const DEMO_NOTICE =
  'Demo records. Every screen is live and editable; connect a database to replace this data.'
