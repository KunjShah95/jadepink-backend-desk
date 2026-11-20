import type { ApprovalKind, LotBundle, Role, StageId } from './types'

export interface ChecklistItem {
  key: string
  label: string
  hint?: string
}

export interface StageDef {
  id: StageId
  no: string
  name: string
  short: string
  purpose: string
  /** Who may pass the gate. Admin always may. */
  gateRoles: Role[]
  checklist: ChecklistItem[]
  approvals?: ApprovalKind[]
}

/**
 * The eight gates. Wording is the store's, not ours: challan, HO, RTV, SOR.
 */
export const STAGES: StageDef[] = [
  {
    id: 's1',
    no: '01',
    name: 'Receive the parcel',
    short: 'Receive',
    purpose:
      'Write down the parcel as soon as the courier hands it over — before you open it. The desk gives it a lot number that stays with it for good.',
    gateRoles: ['Receiver', 'Inward team'],
    checklist: [
      { key: 'label', label: 'Courier label and tracking match the dispatch note' },
      { key: 'boxes', label: 'Box count matches the challan' },
      { key: 'condition', label: 'Box condition photographed before opening' },
      { key: 'stock', label: 'Stock type confirmed — sale-or-return (SOR) or ordered piece' },
      {
        key: 'unopened',
        label: 'If the parcel was not expected, leave it closed until head office confirms',
        hint: 'Skip this tick if the parcel was expected',
      },
    ],
  },
  {
    id: 's2',
    no: '02',
    name: 'Check quality & price',
    short: 'Check',
    purpose:
      'Count the pieces first, then compare with the challan. Look at every piece and accept it or reject it with a reason. If a price tag is wrong, raise a price problem.',
    gateRoles: ['QC', 'Buyer'],
    checklist: [
      { key: 'blind', label: 'Pieces counted before reading the challan (delivery note)' },
      { key: 'match', label: 'Challan count matches the order (PO), or the difference is written down' },
      { key: 'tags', label: 'Price on every tag (MRP) matches the agreed price' },
      { key: 'pieces', label: 'Every piece checked — accepted, or rejected with a reason' },
      { key: 'photos', label: 'Photo taken of each rejected piece and its tag' },
      { key: 'hold', label: 'If any price is wrong, a price problem has been raised' },
    ],
  },
  {
    id: 's3',
    no: '03',
    name: 'Iron the pieces',
    short: 'Iron',
    purpose:
      'Count the pieces as they come off the ironing table. The number should match the pieces you accepted in the last step.',
    gateRoles: ['Floor team', 'Inward team'],
    checklist: [
      { key: 'count', label: 'Number of ironed pieces equals the number accepted' },
      { key: 'damage', label: 'No new damage from ironing' },
      { key: 'ready', label: 'All pieces ready to be tagged' },
    ],
  },
  {
    id: 's4',
    no: '04',
    name: 'Tag the pieces',
    short: 'Tag',
    purpose:
      'Print a barcode for every accepted piece and scan it once. Then choose where each piece goes: the shop floor or the storeroom.',
    gateRoles: ['Inward team', 'HO team'],
    checklist: [
      { key: 'barcodes', label: 'Every accepted piece has a printed barcode' },
      { key: 'scanned', label: 'Every barcode scanned once to confirm' },
      { key: 'dest', label: 'Each piece marked for the shop floor or the storeroom' },
      { key: 'count', label: 'Number of tagged pieces equals the number ironed' },
      { key: 'ho', label: 'Name of the head office person who finished it is recorded' },
    ],
  },
  {
    id: 's5',
    no: '05',
    name: 'Put on display',
    short: 'Display',
    purpose:
      'Choose where each piece sits — a rack, a mannequin or a numbered box. Also agree the date the designer will come to see the display.',
    gateRoles: ['Floor team', 'Merchandiser', 'Store manager'],
    checklist: [
      { key: 'locations', label: 'Every piece assigned a rack, mannequin or box' },
      { key: 'planogram', label: 'Pieces are placed as per the agreed display layout' },
      { key: 'photos', label: 'Floor set photographed' },
      { key: 'review', label: 'Review date agreed with the designer' },
    ],
  },
  {
    id: 's6',
    no: '06',
    name: 'Designer approval',
    short: 'Approval',
    purpose:
      'The designer looks at the display and approves it, or asks for more time. Write their feedback down here so nothing is lost.',
    gateRoles: ['Merchandiser', 'Store manager'],
    approvals: ['mkt'],
    checklist: [
      { key: 'presentation', label: 'Designer walked the display' },
      { key: 'count', label: 'Designer’s count agrees with the system count' },
      { key: 'feedback', label: 'Feedback recorded as a query' },
      { key: 'decision', label: 'Accepted, or display extended with a new review date' },
    ],
  },
  {
    id: 's7',
    no: '07',
    name: 'Send back to designer',
    short: 'Return',
    purpose:
      'Pack the pieces going back to the designer, note the box, challan and courier, and record how many the designer says they received.',
    gateRoles: ['Floor team', 'Store manager'],
    checklist: [
      { key: 'pulled', label: 'Every piece going back is pulled out and marked' },
      { key: 'count', label: 'Return count matches the designer’s list' },
      { key: 'box', label: 'Box number and return number written down' },
      { key: 'challan', label: 'Return challan (delivery note) signed' },
      { key: 'courier', label: 'Courier and tracking recorded' },
      { key: 'ack', label: 'Designer acknowledgement count received' },
    ],
  },
  {
    id: 's8',
    no: '08',
    name: 'Settle the payment',
    short: 'Payment',
    purpose:
      'Check that sold, returned and written-off pieces add up. Record the bill and payment note. Finishing this step closes the parcel for good.',
    gateRoles: ['Accounts', 'Management'],
    approvals: ['acct', 'mgmt'],
    checklist: [
      { key: 'bill', label: 'Sell bill number recorded' },
      { key: 'recon', label: 'Sold + returned + written-off pieces add up to the total' },
      { key: 'approvals', label: 'Accounts and management approvals recorded' },
      { key: 'paynote', label: 'Payment note agreed with the designer' },
      { key: 'close', label: 'Lot closed and locked' },
    ],
  },
]

export const STAGE_BY_ID = Object.fromEntries(STAGES.map((s) => [s.id, s])) as Record<
  StageId,
  StageDef
>

export const APPROVAL_LABEL: Record<ApprovalKind, string> = {
  mkt: 'Marketing',
  acct: 'Accounts',
  mgmt: 'Management',
}

/** The stage a lot is working on right now: the first one without a passed gate. */
export function currentStage(bundle: Pick<LotBundle, 'gates'>): StageId {
  for (const stage of STAGES) {
    if (!bundle.gates.some((g) => g.stage === stage.id)) return stage.id
  }
  return 's8'
}

export type GateState = 'done' | 'current' | 'pending'

export function stageStates(bundle: Pick<LotBundle, 'gates'>) {
  const current = currentStage(bundle)
  const currentIndex = STAGES.findIndex((s) => s.id === current)
  return STAGES.map((stage, i) => {
    const gate = bundle.gates.find((g) => g.stage === stage.id)
    let state: GateState
    if (gate) state = 'done'
    else if (i === currentIndex) state = 'current'
    else state = 'pending'
    return { stage, state, gate, index: i }
  })
}

/** Fraction of the gate checklist ticked for one stage. */
export function checkProgress(bundle: Pick<LotBundle, 'checks'>, stage: StageId) {
  const def = STAGE_BY_ID[stage]
  const ticked = bundle.checks.filter((c) => c.stage === stage).length
  const total = def.checklist.length
  return { ticked, total, pct: total === 0 ? 0 : Math.round((ticked / total) * 100) }
}

export function passedCount(bundle: Pick<LotBundle, 'gates'>) {
  return STAGES.filter((s) => bundle.gates.some((g) => g.stage === s.id)).length
}

export function canPassGate(roles: Role[], stage: StageId) {
  if (roles.includes('Admin')) return true
  return STAGE_BY_ID[stage].gateRoles.some((r) => roles.includes(r))
}

/** Human sentence naming who may pass a gate, for the disabled state. */
export function gateRoleLabel(stage: StageId) {
  const roles = STAGE_BY_ID[stage].gateRoles
  if (roles.length === 1) return roles[0]
  return `${roles.slice(0, -1).join(', ')} or ${roles[roles.length - 1]}`
}
