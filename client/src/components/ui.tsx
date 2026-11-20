import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { STAGES, stageStates } from '../lib/stages'
import type { LotBundle, Severity, StageId } from '../lib/types'
import { initials } from '../lib/format'
import { useDesk } from '../state/desk'

/* -------------------------------------------------------------------------- */
/* Modal — native <dialog>, so focus trapping and Escape come from the browser */
/* -------------------------------------------------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  desc,
  wide,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  desc?: string
  wide?: boolean
  children: ReactNode
  footer?: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={wide ? 'dialog dialog--wide' : 'dialog'}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      aria-labelledby="modal-title"
    >
      <div className="dialog__head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 className="dialog__title" id="modal-title">
            {title}
          </h2>
          {desc ? <p className="dialog__desc">{desc}</p> : null}
        </div>
        <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>
      <div className="dialog__body">{children}</div>
      {footer ? <div className="dialog__foot">{footer}</div> : null}
    </dialog>
  )
}

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  error?: string | null
  required?: boolean
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="field__req" aria-hidden="true">
            required
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* The spine — one rail, eight gates, state carried by line form               */
/* -------------------------------------------------------------------------- */

export function Spine({
  bundle,
  active,
  onSelect,
  blockedStages,
}: {
  bundle: LotBundle
  active: StageId | null
  onSelect: (stage: StageId) => void
  blockedStages?: Set<StageId>
}) {
  const states = stageStates(bundle)
  const checksFor = (stage: StageId) => bundle.checks.filter((c) => c.stage === stage).length

  return (
    <nav className="spine" aria-label="Stages">
      {states.map(({ stage, state, gate }) => {
        const ticked = checksFor(stage.id)
        const blocked = blockedStages?.has(stage.id) ?? false
        const meta =
          state === 'done'
            ? gate
              ? new Date(gate.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
              : 'passed'
            : state === 'current'
              ? `${ticked}/${stage.checklist.length}`
              : '—'

        return (
          <button
            key={stage.id}
            type="button"
            className="spine__item"
            data-state={blocked ? 'blocked' : state}
            data-attention={blocked || undefined}
            aria-current={active === stage.id ? 'step' : undefined}
            onClick={() => onSelect(stage.id)}
          >
            <span className="spine__no" aria-hidden="true">
              {stage.no}
            </span>
            <span className="spine__label">{stage.short}</span>
            <span className="spine__meta">{meta}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function MiniSpine({
  bundle,
  blocked,
}: {
  bundle: Pick<LotBundle, 'gates'>
  blocked?: boolean
}) {
  const states = stageStates(bundle)
  return (
    <span className="mini-spine" aria-hidden="true">
      {states.map(({ stage, state }) => (
        <span
          key={stage.id}
          className="mini-spine__tick"
          data-done={state === 'done' || undefined}
          data-current={state === 'current' && !blocked ? true : undefined}
          data-blocked={state === 'current' && blocked ? true : undefined}
        />
      ))}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Stamp, severity, meter, empty                                             */
/* -------------------------------------------------------------------------- */

export function Stamp({ label, who }: { label: string; who?: string | null }) {
  return (
    <span className="stamp">
      {label}
      {who ? <span className="stamp__who">{who}</span> : null}
    </span>
  )
}

export function Severity({ sev }: { sev: Severity }) {
  return (
    <span className={`sev sev--${sev}`} aria-label={`Severity ${sev}`}>
      {sev}
    </span>
  )
}

export function Meter({
  value,
  tone,
  label,
}: {
  value: number
  tone?: 'amber' | 'oxblood'
  label: string
}) {
  return (
    <div className="meter" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="meter__fill" style={{ inlineSize: `${value}%` }} data-tone={tone} />
    </div>
  )
}

export function Empty({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      {icon ? <div className="empty__icon">{icon}</div> : null}
      <p className="empty__title">{title}</p>
      {body ? <p className="empty__body">{body}</p> : null}
      {action}
    </div>
  )
}

export function Avatar({ name, tone }: { name: string | null | undefined; tone?: 'rose' }) {
  return <span className={tone === 'rose' ? 'avatar avatar--rose' : 'avatar'}>{initials(name)}</span>
}

/* -------------------------------------------------------------------------- */
/* Buttons — a thin wrapper so every control has the same states              */
/* -------------------------------------------------------------------------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'

export function Button({
  variant = 'secondary',
  size,
  block,
  loading,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'sm' | 'lg'
  block?: boolean
  loading?: boolean
}) {
  const cls = [
    'btn',
    `btn--${variant}`,
    size === 'sm' ? 'btn--sm' : '',
    size === 'lg' ? 'btn--lg' : '',
    block ? 'btn--block' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={cls}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Toaster                                                                    */
/* -------------------------------------------------------------------------- */

export function Toaster() {
  const { toasts, dismiss } = useDesk()
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast" data-tone={t.tone}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="toast__title">{t.title}</p>
            {t.msg ? <p className="toast__msg">{t.msg}</p> : null}
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            style={{ width: '1.75rem', height: '1.75rem', flex: 'none' }}
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Section heading                                                            */
/* -------------------------------------------------------------------------- */

export function SectionHead({
  title,
  note,
  action,
}: {
  title: string
  note?: string
  action?: ReactNode
}) {
  return (
    <div className="section-head">
      <h2 className="section-title">{title}</h2>
      {note ? <span className="section-note">{note}</span> : null}
      <span className="spacer" />
      {action}
    </div>
  )
}

export const STAGE_NAMES = STAGES.map((s) => s.name)
