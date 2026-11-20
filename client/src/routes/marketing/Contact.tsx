import { useState } from 'react'
import { ArrowRight, Check, Clock, Copy, Mail, MessageCircle } from 'lucide-react'
import { Eyebrow, Reveal } from './fx'

const TOPICS = ['Rollout', 'Migration', 'Pricing', 'Feature request', 'Something else']
const EMAIL = 'hello@jadepink.desk'

export function Contact() {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [topic, setTopic] = useState(TOPICS[0])
  const [form, setForm] = useState({ name: '', email: '', store: '', message: '' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    // No mail backend in the demo: hand off to the visitor's mail client with everything prefilled.
    const body = `${form.message}\n\n— ${form.name}${form.store ? `, ${form.store}` : ''} (${form.email})`
    window.setTimeout(() => {
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`[${topic}] from ${form.name}`)}&body=${encodeURIComponent(body)}`
      setBusy(false)
      setSent(true)
    }, 350)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked — the address is still visible */
    }
  }

  return (
    <>
      <section className="mx-page-hero">
        <div className="mx-page-hero__grid" aria-hidden="true" />
        <div className="mx-container">
          <Reveal className="mx-head">
            <Eyebrow>Contact</Eyebrow>
            <h1 className="mx-h1">
              Talk to <em className="mx-serif">the desk.</em>
            </h1>
            <p className="mx-sub">A rollout, a migration, or a gate that works differently in your store. We reply within one working day.</p>
          </Reveal>
        </div>
      </section>

      <section className="mx-section mx-section--tight">
        <div className="mx-container mx-contact">
          <Reveal className="mx-panel">
            {sent ? (
              <div className="mx-done" role="status">
                <span className="mx-done__icon">
                  <Check size={20} />
                </span>
                <h2>Your mail app has the message.</h2>
                <p>Press send there and it reaches us. If nothing opened, write to {EMAIL} directly.</p>
                <button type="button" className="mx-btn mx-btn--ghost" onClick={() => setSent(false)}>
                  Write another
                </button>
              </div>
            ) : (
              <form className="mx-form" onSubmit={submit}>
                <fieldset className="mx-field">
                  <legend>What is it about?</legend>
                  <div className="mx-seg">
                    {TOPICS.map((t) => (
                      <button key={t} type="button" data-on={topic === t || undefined} aria-pressed={topic === t} onClick={() => setTopic(t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div className="mx-form__row">
                  <label className="mx-field">
                    <span>Name</span>
                    <input value={form.name} onChange={set('name')} placeholder="Divya Nair" autoComplete="name" required />
                  </label>
                  <label className="mx-field">
                    <span>Email</span>
                    <input type="email" value={form.email} onChange={set('email')} placeholder="you@store.com" autoComplete="email" required />
                  </label>
                </div>
                <label className="mx-field">
                  <span>
                    Store <em className="mx-dim">optional</em>
                  </span>
                  <input value={form.store} onChange={set('store')} placeholder="Store name and city" />
                </label>
                <label className="mx-field">
                  <span>Message</span>
                  <textarea value={form.message} onChange={set('message')} placeholder="Tell us how lots move in your store today." rows={5} required />
                </label>
                <button type="submit" className="mx-btn mx-btn--light mx-btn--lg" data-busy={busy || undefined} disabled={busy}>
                  {busy ? 'Preparing…' : 'Send message'}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </Reveal>

          <div className="mx-contact__aside">
            <Reveal className="mx-tile" delay={80}>
              <Mail size={18} />
              <div>
                <p className="mx-tile__h">Email</p>
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              </div>
              <button type="button" className="mx-icon-btn" onClick={copy} aria-label="Copy email address">
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </Reveal>
            <Reveal className="mx-tile" delay={140}>
              <MessageCircle size={18} />
              <div>
                <p className="mx-tile__h">WhatsApp</p>
                <a href="https://wa.me/919800000000" target="_blank" rel="noreferrer">
                  +91 98 0000 0000
                </a>
              </div>
            </Reveal>
            <Reveal className="mx-tile" delay={200}>
              <Clock size={18} />
              <div>
                <p className="mx-tile__h">Hours</p>
                <span>Mon–Sat, 10:00–19:00 IST</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
