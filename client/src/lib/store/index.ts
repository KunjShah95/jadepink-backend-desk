import { ApiStore } from './api'
import { LocalStore, type Store } from './local'

export type { Store, HoldInput, UpcomingInput } from './local'
export { ApiStore, LocalStore }

export type DataMode = 'local' | 'api'

const MODE = (import.meta.env.VITE_DATA_MODE ?? 'local') as DataMode

export const DATA_MODE: DataMode = MODE === 'api' ? 'api' : 'local'

/**
 * Local is the default because it always works — no server, no credentials.
 * Switch to `api` by setting VITE_DATA_MODE=api and pointing the dev proxy at
 * the Express server.
 */
export function createStore(identity?: { id: string; roles: string[] }): Store {
  if (DATA_MODE === 'api') {
    return new ApiStore(identity?.id ?? 'usr-001', (identity?.roles ?? []) as never)
  }
  return new LocalStore()
}
