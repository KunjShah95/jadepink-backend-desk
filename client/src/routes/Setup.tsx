import { useState } from 'react'
import { Database, Plus, RotateCcw, Users } from 'lucide-react'
import { useDesk } from '../state/desk'
import { ALL_ROLES, type Profile, type Role } from '../lib/types'
import { formatDate } from '../lib/format'
import { Avatar, Button, Field, Modal } from '../components/ui'

export function Setup() {
  const { snap, store, run, user, reset, mode, toast } = useDesk()
  const [editing, setEditing] = useState<Profile | null>(null)
  const [designerOpen, setDesignerOpen] = useState(false)
  const [designerName, setDesignerName] = useState('')
  const [boxes, setBoxes] = useState(String(snap.settings.box_count))
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h2 className="page-title">People &amp; settings</h2>
          <p className="page-sub">
            Add the people who use the desk and choose what each person does. You can also add designers
            and set how many storeroom boxes you have.
          </p>
        </div>
      </div>

      <div className="setup-grid">
        <section className="panel" aria-labelledby="people-title">
          <div className="panel__head">
            <Users size={15} strokeWidth={1.8} style={{ color: 'var(--ink-3)' }} />
            <h3 className="panel__title" id="people-title">
              People and roles
            </h3>
            <span className="spacer" />
            <span className="section-note">{snap.profiles.length} profiles</span>
          </div>
          <div className="panel__body panel__body--tight">
            {snap.profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                className="check"
                style={{ alignItems: 'center', width: '100%' }}
                onClick={() => setEditing(p)}
              >
                <Avatar name={p.name} tone={p.id === user.id ? undefined : 'rose'} />
                <span className="check__text" style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                    {p.name}
                    {p.id === user.id ? (
                      <span style={{ marginLeft: 8, fontSize: 'var(--fs-3xs)', color: 'var(--jade)' }}>
                        you
                      </span>
                    ) : null}
                  </span>
                  <span className="check__note" style={{ fontFamily: 'var(--font-ui)' }}>
                    {p.roles.join(' · ')}
                  </span>
                </span>
                <span className="chip">Edit</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel" aria-labelledby="designers-title">
          <div className="panel__head">
            <h3 className="panel__title" id="designers-title">
              Designers
            </h3>
            <span className="spacer" />
            <Button variant="secondary" size="sm" onClick={() => setDesignerOpen(true)}>
              <Plus size={14} strokeWidth={2} />
              Add
            </Button>
          </div>
          <div className="panel__body panel__body--tight">
            <div className="table-wrap">
              <table className="table" style={{ minInlineSize: '0' }}>
                <thead>
                  <tr>
                    <th scope="col">Designer</th>
                    <th scope="col">GST</th>
                    <th scope="col">Code</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.designers.map((d) => (
                    <tr key={d.id}>
                      <td data-label="Designer">
                        <span className="stack" style={{ gap: 1 }}>
                          <span>{d.name}</span>
                          <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--ink-3)' }}>
                            {d.legal_name ?? '—'}
                          </span>
                        </span>
                      </td>
                      <td data-label="GST" className="cell-mono">
                        {d.gst_no ?? '—'}
                      </td>
                      <td data-label="Code" className="cell-mono">
                        {d.alpha_vendor_code ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="store-title">
          <div className="panel__head">
            <h3 className="panel__title" id="store-title">
              The store
            </h3>
          </div>
          <div className="panel__body">
            <div className="stack" style={{ gap: 'var(--sp-4)' }}>
              <Field
                label="Storeroom boxes"
                htmlFor="box-count"
                hint="Numbered boxes used for placement and RTV. Changing this changes the placement picker."
              >
                <div className="row" style={{ gap: 'var(--sp-2)' }}>
                  <input
                    id="box-count"
                    className="input mono"
                    type="number"
                    min={1}
                    max={200}
                    value={boxes}
                    onChange={(e) => setBoxes(e.target.value)}
                    style={{ maxWidth: '8rem' }}
                  />
                  <Button
                    variant="secondary"
                    disabled={Number(boxes) === snap.settings.box_count || Number(boxes) < 1}
                    onClick={async () => {
                      await run(() => store.updateSettings(Number(boxes), user.id), 'Store settings saved')
                      toast({ tone: 'success', title: `Storeroom now has ${boxes} boxes` })
                    }}
                  >
                    Save
                  </Button>
                </div>
              </Field>

              <div className="dl">
                <dt>Last changed</dt>
                <dd>
                  {snap.settings.updated_by
                    ? snap.profiles.find((p) => p.id === snap.settings.updated_by)?.name ?? '—'
                    : '—'}
                </dd>
                <dt>On</dt>
                <dd className="mono">{formatDate(snap.settings.updated_at)}</dd>
              </div>
            </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="data-title">
          <div className="panel__head">
            <Database size={15} strokeWidth={1.8} style={{ color: 'var(--ink-3)' }} />
            <h3 className="panel__title" id="data-title">
              Where the data lives
            </h3>
          </div>
          <div className="panel__body">
            <div className="stack" style={{ gap: 'var(--sp-4)' }}>
              <div className="dl">
                <dt>Mode</dt>
                <dd>
                  <span className={mode === 'local' ? 'chip chip--amber' : 'chip chip--moss'}>
                    {mode === 'local' ? 'Local — this browser' : 'API — Express server'}
                  </span>
                </dd>
                <dt>Records</dt>
                <dd>
                  {snap.lots.length} lots · {snap.pieces.length} pieces · {snap.holds.length} holds
                </dd>
              </div>

              <p style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-3)', lineHeight: 1.6 }}>
                {mode === 'local'
                  ? 'Everything you do is saved in this browser. Rebuilding the demo replaces your changes with the seeded store — useful before a client walkthrough.'
                  : 'Every action is written to the Express API with your user id and roles in the request headers.'}
              </p>

              <Button variant="danger" onClick={() => setResetOpen(true)}>
                <RotateCcw size={15} strokeWidth={1.9} />
                Rebuild the demo data
              </Button>
            </div>
          </div>
        </section>

        <section className="panel" id="shortcut-help" aria-labelledby="keys-title">
          <div className="panel__head">
            <h3 className="panel__title" id="keys-title">
              Keyboard
            </h3>
          </div>
          <div className="panel__body">
            <div className="ledger">
              {[
                ['⌘K / Ctrl K', 'Search lots, pieces, screens'],
                ['⌘I / Ctrl I', 'Switch who is working'],
                ['G then D', 'Desk'],
                ['G then L', 'Lots'],
                ['G then H', 'Holds'],
                ['G then C', 'Daily close'],
                ['N', 'Receive a parcel'],
              ].map(([k, label]) => (
                <div key={k} className="ledger__row" style={{ paddingBlock: 'var(--sp-2)' }}>
                  <span className="ledger__key">{label}</span>
                  <span className="kbd">{k}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <RolesDialog profile={editing} onClose={() => setEditing(null)} />

      <Modal
        open={designerOpen}
        onClose={() => setDesignerOpen(false)}
        title="Add a designer"
        desc="The name is what appears on every lot and settlement sheet."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDesignerOpen(false)}>
              Cancel
            </Button>
            <span className="spacer" />
            <Button
              variant="primary"
              disabled={!designerName.trim()}
              onClick={async () => {
                await run(() => store.addDesigner(designerName.trim(), user.id), 'Designer added')
                setDesignerName('')
                setDesignerOpen(false)
              }}
            >
              Add designer
            </Button>
          </>
        }
      >
        <Field label="Designer name" required htmlFor="d-name">
          <input
            id="d-name"
            className="input"
            value={designerName}
            onChange={(e) => setDesignerName(e.target.value)}
            placeholder="Aarohi Mehta"
          />
        </Field>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Rebuild the demo data?"
        desc="Every change you have made in this browser is replaced by the seeded store. This cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Keep my data
            </Button>
            <span className="spacer" />
            <Button
              variant="danger"
              onClick={async () => {
                await reset()
                setResetOpen(false)
              }}
            >
              Rebuild
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6, color: 'var(--ink-2)' }}>
          The seeded store has 12 lots spread across all eight gates, 3 open holds, 2 open queries and three
          previous daily closes. It is the state a client walkthrough should start from.
        </p>
      </Modal>
    </>
  )
}

function RolesDialog({ profile, onClose }: { profile: Profile | null; onClose: () => void }) {
  const { store, run, user } = useDesk()
  const [roles, setRoles] = useState<Role[]>(profile?.roles ?? [])

  if (!profile) return null

  const toggle = (role: Role) =>
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))

  return (
    <Modal
      open
      onClose={onClose}
      title={`Roles for ${profile.name}`}
      desc="A gate opens for the roles the person on the tablet holds. Admin can pass every gate."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <span className="spacer" />
          <Button
            variant="primary"
            disabled={roles.length === 0}
            onClick={async () => {
              await run(() => store.setProfileRoles(profile.id, roles, user.id), 'Roles updated')
              onClose()
            }}
          >
            Save roles
          </Button>
        </>
      }
    >
      <div className="role-picker">
        {ALL_ROLES.map((role) => {
          const on = roles.includes(role)
          return (
            <button
              key={role}
              type="button"
              className="chip chip-btn"
              aria-pressed={on}
              onClick={() => toggle(role)}
            >
              {role}
            </button>
          )
        })}
      </div>
      <p style={{ marginTop: 'var(--sp-4)', fontSize: 'var(--fs-2xs)', color: 'var(--ink-3)', lineHeight: 1.6 }}>
        {roles.length === 0
          ? 'Choose at least one job so this person can finish steps.'
          : `${profile.name} can pass the gates opened to ${roles.join(', ')}.`}
      </p>
    </Modal>
  )
}
