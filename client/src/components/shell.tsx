import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AlertTriangle, Check, CircleHelp, ClipboardCheck, House, Moon, Package, Search, Settings, Sun, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { STAGES } from '../lib/stages'
import { useDesk } from '../state/desk'
import { pipeline, totals, locatePiece, searchLots } from '../lib/select'
import { Modal, Avatar } from './ui'
import { formatDate } from '../lib/format'
import { useTheme } from '../lib/theme'


/* -------------------------------------------------------------------------- */
/* Rail                                                                       */
/* -------------------------------------------------------------------------- */

const NAV: Array<{ to: string; icon: LucideIcon; label: string; short?: string; hint: string; end?: boolean }> = [
  { to: '/app', icon: House, label: 'Home', hint: 'What needs doing today', end: true },
  { to: '/app/lots', icon: Package, label: 'Parcels', hint: 'Every parcel and where it is' },
  { to: '/app/holds', icon: AlertTriangle, label: 'Problems', hint: 'Faults that need fixing' },
  { to: '/app/close', icon: ClipboardCheck, label: 'Day-end count', short: 'Count', hint: 'Count the stock before closing' },
  { to: '/app/setup', icon: Settings, label: 'People & settings', short: 'Settings', hint: 'Staff, roles and data' },
]

export function Rail({ onIdentity }: { onIdentity: () => void }) {
  const { snap, user } = useDesk()
  const stages = pipeline(snap)
  const t = totals(snap)

  // The right-hand number is the count the surface is about — the page number
  // of a contents page. It is never decorative.
  const count: Record<string, number> = {
    '/app': t.openLots,
    '/app/lots': snap.lots.length,
    '/app/holds': t.openHolds,
    '/app/close': snap.dailyClose.length,
    '/app/setup': snap.profiles.length,
  }

  return (
    <aside className="rail">
      <div className="rail__punch" aria-hidden="true">
        <span />
      </div>

      <div className="rail__brand">
        <span className="rail__name">Jade Pink</span>
        <span className="rail__sub">Backend desk</span>
      </div>

      <div className="rail__perf" aria-hidden="true" />

      <nav className="rail__index" aria-label="Sections">
        {NAV.map(({ to, icon: Icon, label, short, hint, end }) => (
          <NavLink key={to} to={to} end={end} className="rail__entry" title={hint}>
            <Icon size={17} strokeWidth={1.8} className="rail__entry-icon" aria-hidden="true" />
            <span className="rail__entry-label" data-short={short ?? label}>
              <span className="rail__entry-full">{label}</span>
            </span>
            <span className="rail__leader" aria-hidden="true" />
            <span
              className="rail__entry-count"
              data-attention={to === '/app/holds' && t.openHolds > 0 ? true : undefined}
            >
              {count[to]}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="rail__perf" aria-hidden="true" />

      <div className="rail__tape-wrap">
        <div className="rail__tape-head">
          <span className="caps">The 8 steps</span>
          <span className="rail__tape-frac">{t.openLots} active</span>
        </div>
        <nav className="rail__tape" aria-label="Stages">
          {stages.map((s) => (
            <NavLink
              key={s.id}
              to={`/app/lots?stage=${s.id}`}
              className="rail__gate"
              data-state={s.blocked > 0 ? 'blocked' : s.count > 0 ? 'live' : 'empty'}
            >
              <span className="rail__gate-no" aria-hidden="true">
                {s.no}
              </span>
              <span className="rail__gate-label">{s.short}</span>
              <span className="rail__gate-count">{s.count}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <button type="button" className="rail__user" onClick={onIdentity}>
        <Avatar name={user.name} />
        <span className="rail__user-meta">
          <span className="rail__user-name">{user.name}</span>
          <span className="rail__user-role">{user.roles.join(' · ')}</span>
        </span>
        <UserRound size={14} strokeWidth={1.75} style={{ marginLeft: 'auto', color: 'var(--rail-ink-3)' }} />
      </button>
    </aside>
  )
}

/* -------------------------------------------------------------------------- */
/* Top bar                                                                    */
/* -------------------------------------------------------------------------- */

export function TopBar({
  title,
  crumb,
  onSearch,
  onHelp,
}: {
  title: string
  crumb?: string
  onSearch: () => void
  onHelp: () => void
}) {
  const { theme, toggle } = useTheme()
  const { mode } = useDesk()

  return (
    <header className="topbar">
      <div className="topbar__crumb">
        {crumb ? (
          <>
            <span>{crumb}</span>
            <span className="topbar__sep" aria-hidden="true">
              /
            </span>
          </>
        ) : null}
        <h1 className="topbar__title">{title}</h1>
      </div>

      <span className="spacer" />

      <button type="button" className="topbar__search" onClick={onSearch}>
        <Search size={14} strokeWidth={1.75} aria-hidden="true" />
        <span className="topbar__search-label">Find a parcel or piece</span>
      </button>

      <button type="button" className="topbar__help" onClick={onHelp}>
        <CircleHelp size={16} strokeWidth={1.8} aria-hidden="true" />
        <span>Help</span>
      </button>

      <span className="sync" title={mode === 'local' ? 'Your work is saved on this device' : 'Your work is saved to the store server'}>
        <span className="sync__dot" data-mode={mode === 'local' ? 'local' : undefined} />
        {mode === 'local' ? 'Saved on this device' : 'Saved online'}
      </span>

      <button
        type="button"
        className="btn-icon"
        onClick={toggle}
        aria-label={theme === 'light' ? 'Switch to dark screen' : 'Switch to light screen'}
        title={theme === 'light' ? 'Dark screen' : 'Light screen'}
      >
        {theme === 'light' ? <Moon size={16} strokeWidth={1.75} /> : <Sun size={16} strokeWidth={1.75} />}
      </button>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* Command palette                                                            */
/* -------------------------------------------------------------------------- */

interface Command {
  id: string
  group: string
  label: string
  hint?: string
  run: () => void
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { snap } = useDesk()
  const navigate = useNavigate()
  const ref = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [term, setTerm] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      setTerm('')
      setActive(0)
      window.setTimeout(() => inputRef.current?.focus(), 20)
    }
    if (!open && el.open) el.close()
  }, [open])

  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => {
      navigate(to)
      onClose()
    }
    const base: Command[] = [
      { id: 'desk', group: 'Go to', label: 'Home', run: go('/app') },
      { id: 'lots', group: 'Go to', label: 'Parcels', run: go('/app/lots') },
      { id: 'holds', group: 'Go to', label: 'Problems', run: go('/app/holds') },
      { id: 'close', group: 'Go to', label: 'Day-end count', run: go('/app/close') },
      { id: 'setup', group: 'Go to', label: 'People & settings', run: go('/app/setup') },
      { id: 'new-lot', group: 'Do', label: 'Receive a new parcel', run: go('/app/lots?new=1') },
    ]

    for (const lot of searchLots(snap, term).slice(0, 6)) {
      base.push({
        id: `lot-${lot.id}`,
        group: 'Parcels',
        label: `${lot.lot_no} — ${lot.designer ?? 'Unnamed'}`,
        hint: formatDate(lot.created_at),
        run: go(`/app/lots/${lot.id}`),
      })
    }

    for (const piece of locatePiece(snap, term)) {
      base.push({
        id: `piece-${piece.id}`,
        group: 'Pieces',
        label: piece.id,
        hint: `${piece.product ?? '—'} · ${piece.location ?? 'no location'}`,
        run: go(`/app/lots/${piece.lot_id}?piece=${encodeURIComponent(piece.id)}`),
      })
    }

    return base
  }, [snap, term, navigate, onClose])

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase()
    if (!t) return commands.slice(0, 10)
    return commands.filter((c) => c.label.toLowerCase().includes(t) || c.group.toLowerCase().includes(t)).slice(0, 12)
  }, [commands, term])

  useEffect(() => {
    setActive(0)
  }, [term])

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>()
    filtered.forEach((c) => {
      const list = map.get(c.group) ?? []
      list.push(c)
      map.set(c.group, list)
    })
    return [...map.entries()]
  }, [filtered])

  let flatIndex = -1

  return (
    <dialog
      ref={ref}
      className="palette"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      aria-label="Command palette"
    >
      <input
        ref={inputRef}
        className="palette__input"
        placeholder="Type a parcel number, designer name or piece code…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((i) => Math.min(i + 1, filtered.length - 1))
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => Math.max(i - 1, 0))
          }
          if (e.key === 'Enter') {
            e.preventDefault()
            filtered[active]?.run()
          }
        }}
        aria-controls="palette-list"
        aria-activedescendant={filtered[active] ? `opt-${filtered[active].id}` : undefined}
      />
      <div className="palette__list" id="palette-list" role="listbox">
        {grouped.length === 0 ? (
          <p className="palette__group">Nothing found for “{term}”. Try part of the designer’s name or the lot number.</p>
        ) : (
          grouped.map(([group, items]) => (
            <div key={group}>
              <p className="palette__group">{group}</p>
              {items.map((c) => {
                flatIndex += 1
                const index = flatIndex
                return (
                  <button
                    key={c.id}
                    id={`opt-${c.id}`}
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    className="palette__opt"
                    data-active={index === active || undefined}
                    onMouseEnter={() => setActive(index)}
                    onClick={c.run}
                  >
                    <span className="palette__opt-label">{c.label}</span>
                    {c.hint ? <span className="palette__opt-hint">{c.hint}</span> : null}
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>
      <div className="palette__foot">
        <span>Tap a result to open it</span>
        <span className="spacer" />
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
          Close
        </button>
      </div>
    </dialog>
  )
}

/* -------------------------------------------------------------------------- */
/* Identity switcher — the desk is shared, so "who am I" is a control         */
/* -------------------------------------------------------------------------- */

export function IdentityDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { snap, user, setUser, toast } = useDesk()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Who is using the desk?"
      desc="Tap your name. The desk will show you the steps your job covers."
    >
      <div className="stack" style={{ gap: 'var(--sp-2)' }}>
        {snap.profiles
          .filter((p) => p.active)
          .map((p) => {
            const current = p.id === user.id
            return (
              <button
                key={p.id}
                type="button"
                className="check"
                onClick={() => {
                  setUser(p.id)
                  onClose()
                  toast({ tone: 'success', title: `Hello, ${p.name.split(' ')[0]}` })
                }}
                style={{ alignItems: 'center' }}
              >
                <Avatar name={p.name} tone={current ? undefined : 'rose'} />
                <span className="check__text" style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{p.name}</span>
                  <span className="check__note" style={{ fontFamily: 'var(--font-ui)' }}>
                    {p.roles.join(' · ')}
                  </span>
                </span>
                {current ? <Check size={16} strokeWidth={2} style={{ color: 'var(--jade)' }} /> : null}
              </button>
            )
          })}
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------------------- */
/* Keyboard shortcuts                                                         */
/* -------------------------------------------------------------------------- */

export function useShortcuts(openPalette: () => void, openIdentity: () => void) {
  const navigate = useNavigate()
  const seq = useRef<string>('')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openPalette()
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        openIdentity()
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return

      window.clearTimeout(timer.current)
      seq.current = (seq.current + e.key.toLowerCase()).slice(-2)
      timer.current = window.setTimeout(() => {
        seq.current = ''
      }, 900)

      const s = seq.current
      if (s === 'gd') navigate('/app')
      if (s === 'gl') navigate('/app/lots')
      if (s === 'gh') navigate('/app/holds')
      if (s === 'gc') navigate('/app/close')
      if (s === 'gs') navigate('/app/setup')
      if (e.key.toLowerCase() === 'n' && seq.current === 'n') navigate('/app/lots?new=1')
      if (e.key === '?') {
        document.getElementById('shortcut-help')?.scrollIntoView({ block: 'center' })
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(timer.current)
    }
  }, [navigate, openPalette, openIdentity])
}

/* -------------------------------------------------------------------------- */
/* Help — how the desk works, in plain words                                  */
/* -------------------------------------------------------------------------- */

const WORDS: Array<[string, string]> = [
  ['Lot / lot number', 'One parcel from one designer. Its number (like IN-261114-D1L) never changes.'],
  ['Piece', 'One garment inside a parcel. Each piece gets its own barcode.'],
  ['Step', 'One of the eight things that happen to every parcel, in order.'],
  ['Problem', 'Something wrong with a piece — a stain, a missing item, a wrong price.'],
  ['Challan', 'The delivery note that comes with the parcel.'],
  ['SOR', 'Sale-or-return: stock we send back to the designer if it does not sell.'],
]

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title="How the desk works"
      desc="Every parcel goes through the same eight steps. The desk shows which step is next and who should do it."
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              onClose()
              navigate('/app/lots?new=1')
            }}
          >
            Receive a parcel
          </button>
        </>
      }
    >
      <div className="help">
        <ol className="help__how">
          <li>
            <b>Pick your name</b>
            <span>Tap your name (your initials on a phone). The desk then shows the steps that are yours.</span>
          </li>
          <li>
            <b>Open a parcel</b>
            <span>On Home, tap a parcel under “Your next steps”, or find it with the search box at the top.</span>
          </li>
          <li>
            <b>Tick, then finish the step</b>
            <span>Do each thing on the list and tick it. When all are ticked, press the big “Finish this step” button.</span>
          </li>
        </ol>

        <p className="help__h">The eight steps</p>
        <ol className="help__steps">
          {STAGES.map((st, i) => (
            <li key={st.id}>
              <span className="help__no">{i + 1}</span>
              {st.name}
            </li>
          ))}
        </ol>

        <p className="help__h">Words you will see</p>
        <dl className="help__words">
          {WORDS.map(([w, d]) => (
            <div key={w}>
              <dt>{w}</dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  )
}
