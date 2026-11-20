import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useDesk } from '../../state/desk'
import { ALL_ROLES, type Role } from '../../lib/types'
import { AuthFrame } from './AuthFrame'

export function Register() {
  const { store, run, setUser } = useDesk()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [roles, setRoles] = useState<Role[]>(['Receiver'])
  const [busy, setBusy] = useState(false)

  const toggle = (r: Role) => setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
  const ready = name.trim().length > 1 && roles.length > 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setBusy(true)
    try {
      const id = await run(() => store.addProfile(name.trim(), roles, 'self'), 'Profile created')
      if (id) setUser(String(id))
      navigate('/app')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame aside={{ quote: 'Every gate has a name against it. When a designer calls, the answer is one search away.', by: 'Why every stamp carries a name' }}>
      <div className="mx-auth__card">
        <h1 className="mx-h3">Set up your desk</h1>
        <p className="mx-sub mx-sub--sm">Create a profile for the person running this tablet. Roles decide which gates they can pass.</p>

        <form className="mx-form" onSubmit={submit}>
          <label className="mx-field">
            <span>Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meera Nair" autoComplete="name" required />
          </label>
          <label className="mx-field">
            <span>
              Email <em className="mx-dim">optional</em>
            </span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@store.com" autoComplete="email" />
          </label>

          <fieldset className="mx-field">
            <legend>
              Roles <em className="mx-dim">{roles.length} selected</em>
            </legend>
            <div className="mx-roles">
              {ALL_ROLES.map((r) => {
                const on = roles.includes(r)
                return (
                  <button key={r} type="button" className="mx-role" data-on={on || undefined} aria-pressed={on} onClick={() => toggle(r)}>
                    {on ? <Check size={12} /> : null}
                    {r}
                  </button>
                )
              })}
            </div>
            <span className="mx-hint">A gate opens for the roles a person holds. Admin passes every gate.</span>
          </fieldset>

          <button type="submit" className="mx-btn mx-btn--light mx-btn--lg mx-btn--block" disabled={busy || !ready}>
            {busy ? 'Creating…' : 'Create account'}
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="mx-auth__foot">
          Already have a profile? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </AuthFrame>
  )
}
