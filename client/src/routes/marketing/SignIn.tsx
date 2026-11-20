import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useDesk } from '../../state/desk'
import { AuthFrame } from './AuthFrame'

const initials = (n: string) =>
  n
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export function SignIn() {
  const { snap, setUser } = useDesk()
  const navigate = useNavigate()
  const profiles = snap.profiles.filter((p) => p.active)
  const [picked, setPicked] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const chosen = profiles.find((p) => p.id === picked)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (chosen) {
      setUser(chosen.id)
      navigate('/app')
      return
    }
    if (!email) {
      setError('Pick who is working this tablet, or enter your email.')
      return
    }
    // Local mode has no password store: match the email's name part to a profile.
    const local = email.split('@')[0].toLowerCase().replace(/[^a-z]/g, '')
    const match = profiles.find((p) => p.name.toLowerCase().replace(/[^a-z]/g, '').startsWith(local.slice(0, 4)))
    if (!match) {
      setError('No profile on this desk matches that email. Pick one below or create an account.')
      return
    }
    setUser(match.id)
    navigate('/app')
  }

  return (
    <AuthFrame aside={{ quote: 'A count at the end of the day that matches the floor, without anyone opening the notebook.', by: 'What the desk is for' }}>
      <div className="mx-auth__card">
        <h1 className="mx-h3">Welcome back</h1>
        <p className="mx-sub mx-sub--sm">The desk is shared across shifts. Pick who is working this tablet.</p>

        <form className="mx-form" onSubmit={submit} noValidate>
          <div className="mx-people" role="radiogroup" aria-label="Profiles on this device">
            {profiles.slice(0, 6).map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={picked === p.id}
                className="mx-person"
                data-on={picked === p.id || undefined}
                onClick={() => {
                  setPicked(picked === p.id ? null : p.id)
                  setError(null)
                }}
              >
                <span className="mx-avatar">{initials(p.name)}</span>
                <span className="mx-person__text">
                  <span className="mx-person__name">{p.name}</span>
                  <span className="mx-person__role">{p.roles.join(' · ')}</span>
                </span>
                {picked === p.id ? <Check size={15} className="mx-person__tick" /> : null}
              </button>
            ))}
          </div>

          <div className="mx-divider">
            <span>or with email</span>
          </div>

          <label className="mx-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              placeholder="you@store.com"
              autoComplete="email"
            />
          </label>
          <label className="mx-field">
            <span>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </label>

          {error ? (
            <p className="mx-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="mx-btn mx-btn--light mx-btn--lg mx-btn--block">
            {chosen ? `Enter as ${chosen.name.split(' ')[0]}` : 'Enter the desk'}
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="mx-auth__foot">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </AuthFrame>
  )
}
