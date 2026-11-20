import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createStore, DATA_MODE, type Store } from '../lib/store'
import type { Profile, Role, Snapshot } from '../lib/types'

export interface Toast {
  id: string
  tone: 'success' | 'error' | 'warn' | 'info'
  title: string
  msg?: string
}

interface DeskValue {
  store: Store
  snap: Snapshot
  mode: string
  busy: boolean
  toasts: Toast[]
  user: Profile
  roles: Role[]
  setUser: (id: string) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
  run: (fn: (s: Store) => Promise<unknown>, success?: string) => Promise<boolean>
  reset: () => Promise<void>
  has: (...roles: Role[]) => boolean
}

const DeskContext = createContext<DeskValue | null>(null)

const IDENTITY_KEY = 'jp.desk.identity'

export function DeskProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => createStore(), [])
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [busy, setBusy] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [userId, setUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(IDENTITY_KEY)
    } catch {
      return null
    }
  })

  useEffect(() => {
    let alive = true
    store
      .load()
      .then((next) => {
        if (alive) setSnap(next)
      })
      .catch((err: Error) => {
        if (!alive) return
        setToasts((prev) => [
          ...prev,
          { id: 'boot', tone: 'error', title: 'Could not open the desk', msg: err.message },
        ])
      })
    return () => {
      alive = false
    }
  }, [store])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev.slice(-1), { ...t, id }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, t.tone === 'error' ? 8000 : 4500)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const user = useMemo<Profile | null>(() => {
    if (!snap) return null
    const found = userId ? snap.profiles.find((p) => p.id === userId) : null
    return found ?? snap.profiles[0] ?? null
  }, [snap, userId])

  const setUser = useCallback((id: string) => {
    setUserId(id)
    try {
      localStorage.setItem(IDENTITY_KEY, id)
    } catch {
      /* ignore */
    }
  }, [])

  const run = useCallback(
    async (fn: (s: Store) => Promise<unknown>, success?: string) => {
      setBusy(true)
      try {
        await fn(store)
        const next = await store.load()
        setSnap(next)
        if (success) toast({ tone: 'success', title: success })
        return true
      } catch (err) {
        toast({
          tone: 'error',
          title: 'That did not save',
          msg: err instanceof Error ? err.message : 'Unknown error',
        })
        return false
      } finally {
        setBusy(false)
      }
    },
    [store, toast],
  )

  const reset = useCallback(async () => {
    setBusy(true)
    try {
      const next = await store.reset()
      setSnap(next)
      toast({ tone: 'success', title: 'Demo data rebuilt', msg: 'Every record is back to its starting state.' })
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not rebuild',
        msg: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setBusy(false)
    }
  }, [store, toast])

  const value = useMemo<DeskValue | null>(() => {
    if (!snap || !user) return null
    const roles = user.roles
    return {
      store,
      snap,
      mode: DATA_MODE,
      busy,
      toasts,
      user,
      roles,
      setUser,
      toast,
      dismiss,
      run,
      reset,
      has: (...wanted: Role[]) => roles.includes('Admin') || wanted.some((r) => roles.includes(r)),
    }
  }, [snap, user, store, busy, toasts, setUser, toast, dismiss, run, reset])

  if (!value) {
    return (
      <div className="boot">
        <div className="boot__mark display">Jade Pink</div>
        <p className="boot__note">Opening the desk…</p>
      </div>
    )
  }

  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>
}

export function useDesk() {
  const ctx = useContext(DeskContext)
  if (!ctx) throw new Error('useDesk must be used inside DeskProvider')
  return ctx
}
