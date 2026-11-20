import type {
  ApprovalKind,
  DailyClose,
  Lot,
  NewLotInput,
  Role,
  Snapshot,
  StageId,
} from '../types'
import type { HoldInput, Store, UpcomingInput } from './local'

/**
 * Talks to the Express server in ../server.js. The server authenticates with
 * x-user-id / x-user-roles headers rather than a session cookie, because the
 * desk is shared across shifts.
 */
export class ApiStore implements Store {
  readonly mode = 'api' as const
  private userId: string
  private roles: Role[]

  constructor(userId: string, roles: Role[]) {
    this.userId = userId
    this.roles = roles
  }

  setIdentity(userId: string, roles: Role[]) {
    this.userId = userId
    this.roles = roles
  }

  private async req<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        'x-user-id': this.userId,
        'x-user-roles': this.roles.join(','),
        ...(init.headers ?? {}),
      },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(body || `${res.status} ${res.statusText}`)
    }
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  }

  /**
   * The server exposes resources individually rather than as one snapshot, so
   * boot fans out and assembles the same shape the local adapter returns.
   */
  async load(): Promise<Snapshot> {
    const [profiles, designers, lookups, lots, holds, upcoming, dailyClose, settings, events] =
      await Promise.all([
        this.req<Snapshot['profiles']>('/users'),
        this.req<Snapshot['designers']>('/designers'),
        this.req<Snapshot['lookups']>('/lookups'),
        this.req<Snapshot['lots']>('/lots'),
        this.req<Snapshot['holds']>('/holds'),
        this.req<Snapshot['upcoming']>('/upcoming'),
        this.req<Snapshot['dailyClose']>('/dailyclose'),
        this.req<Snapshot['settings']>('/settings'),
        this.req<Snapshot['events']>('/events?limit=80'),
      ])

    const bundles = await Promise.all(
      lots.map((lot) => this.req<Partial<Snapshot> & { lot?: Lot }>(`/lots/${lot.id}`)),
    )

    return {
      profiles,
      designers,
      lookups,
      lots,
      holds,
      upcoming,
      dailyClose,
      settings,
      events,
      pieces: bundles.flatMap((b) => b.pieces ?? []),
      checks: bundles.flatMap((b) => b.checks ?? []),
      gates: bundles.flatMap((b) => b.gates ?? []),
      approvals: bundles.flatMap((b) => b.approvals ?? []),
      queries: bundles.flatMap((b) => b.queries ?? []),
      photos: bundles.flatMap((b) => b.photos ?? []),
    }
  }

  async reset(): Promise<never> {
    throw new Error('Reset is only available in local mode.')
  }

  createLot(input: NewLotInput) {
    return this.req<Lot>('/lots', { method: 'POST', body: JSON.stringify(input) })
  }

  async updateLot(id: string, patch: Partial<Lot>) {
    await this.req(`/lots/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
  }

  async toggleCheck(lotId: string, stage: StageId, key: string) {
    await this.req(`/lots/${lotId}/checks`, {
      method: 'POST',
      body: JSON.stringify({ stage, item_key: key }),
    })
  }

  async passGate(lotId: string, stage: StageId) {
    await this.req(`/lots/${lotId}/gates`, { method: 'POST', body: JSON.stringify({ stage }) })
  }

  async removeGate(lotId: string, stage: StageId) {
    await this.req(`/lots/${lotId}/gates?stage=${stage}`, { method: 'DELETE' })
  }

  async addApproval(lotId: string, kind: ApprovalKind, note: string) {
    await this.req(`/lots/${lotId}/approvals`, {
      method: 'POST',
      body: JSON.stringify({ kind, note }),
    })
  }

  async addQuery(lotId: string, text: string) {
    await this.req(`/lots/${lotId}/queries`, { method: 'POST', body: JSON.stringify({ text }) })
  }

  async answerQuery(lotId: string, queryId: string, answer: string) {
    await this.req(`/lots/${lotId}/queries/${queryId}/answer`, {
      method: 'PATCH',
      body: JSON.stringify({ answer }),
    })
  }

  async setPieceQc(pieceId: string, qc: 'accept' | 'reject', reason: string | null) {
    await this.req(`/pieces/${pieceId}/qc`, {
      method: 'PATCH',
      body: JSON.stringify({ qc, reject_reason: reason }),
    })
  }

  async tagPiece(pieceId: string, dest: string) {
    await this.req(`/pieces/${pieceId}/tag`, { method: 'PATCH', body: JSON.stringify({ tag_dest: dest }) })
  }

  async setPieceLocation(pieceId: string, location: string) {
    await this.req(`/pieces/${pieceId}/location`, {
      method: 'PATCH',
      body: JSON.stringify({ location }),
    })
  }

  async pullPiece(pieceId: string, box: string) {
    await this.req(`/pieces/${pieceId}/location`, {
      method: 'PATCH',
      body: JSON.stringify({ location: box, box_no: box }),
    })
  }

  async createHold(input: HoldInput) {
    await this.req('/holds', { method: 'POST', body: JSON.stringify(input) })
  }

  async resolveHold(id: string, outcome: 'fixed' | 'written_off', fix: string) {
    await this.req(`/holds/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ outcome, fix }),
    })
  }

  async addUpcoming(input: UpcomingInput) {
    await this.req('/upcoming', { method: 'POST', body: JSON.stringify(input) })
  }

  async receiveUpcoming(id: string) {
    const lot = await this.req<Lot>(`/upcoming/${id}/receive`, { method: 'POST' })
    return lot ?? null
  }

  async saveClose(entry: Omit<DailyClose, 'by' | 'at'>) {
    await this.req('/dailyclose', { method: 'POST', body: JSON.stringify(entry) })
  }

  async updateSettings(boxCount: number) {
    await this.req('/settings', { method: 'PATCH', body: JSON.stringify({ box_count: boxCount }) })
  }

  async setProfileRoles(profileId: string, roles: Role[]) {
    await this.req(`/users/${profileId}`, { method: 'PATCH', body: JSON.stringify({ roles }) })
  }

  async addDesigner(name: string) {
    await this.req('/designers', { method: 'POST', body: JSON.stringify({ name }) })
  }

  async addProfile(name: string, roles: Role[]): Promise<string> {
    const data = await this.req<{ id: string | number }>('/users', {
      method: 'POST',
      body: JSON.stringify({ name, roles }),
    })
    return String(data.id)
  }
}
