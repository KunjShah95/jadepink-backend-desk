import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, CircleAlert, CircleHelp, MessageSquare, PackagePlus, Timer, X } from 'lucide-react'
import { useDesk } from '../state/desk'
import { attention, pipeline, totals, isBlocked, stageOf } from '../lib/select'
import { STAGE_BY_ID, STAGES, canPassGate, checkProgress } from '../lib/stages'
import { formatRelative, formatTime, ageLabel } from '../lib/format'
import { MiniSpine, SectionHead, Severity } from '../components/ui'
import { bundleOf } from '../lib/select'

export function Dashboard() {
  const { snap, user } = useDesk()
  const navigate = useNavigate()

  const stages = useMemo(() => pipeline(snap), [snap])
  const t = useMemo(() => totals(snap), [snap])
  const items = useMemo(() => attention(snap), [snap])
  const feed = useMemo(() => snap.events.slice(0, 9), [snap])

  const peak = Math.max(1, ...stages.map((s) => s.count))

  const openLots = snap.lots.filter((l) => !l.closed_at)
  const needsYou = openLots
    .filter((l) => isBlocked(snap, l) || l.designer === null)
    .slice(0, 3)

  const profileName = (id: string | null) =>
    snap.profiles.find((p) => p.id === id)?.name ?? 'Someone'

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h2 className="page-title">
            {greeting()}, {user.name.split(' ')[0]}.
          </h2>
          <p className="page-sub">
            {plural(t.openLots, 'parcel is', 'parcels are')} in progress.{' '}
            {t.openHolds > 0 ? `${plural(t.openHolds, 'problem needs', 'problems need')} fixing. ` : 'No problems to fix. '}
            {t.openQueries > 0 ? `${plural(t.openQueries, 'question is', 'questions are')} waiting for an answer.` : ''}
          </p>
        </div>
        <Link to="/app/lots?new=1" className="btn btn--primary btn--lg">
          <PackagePlus size={18} strokeWidth={1.9} />
          Receive a parcel
        </Link>
      </div>

      <Welcome />
      <NextSteps />

      <div className="desk">
        <section className="panel desk__span" aria-labelledby="pipeline-title">
          <div className="pipeline">
            <div className="row" style={{ gap: 'var(--sp-3)' }}>
              <h3 className="panel__title" id="pipeline-title">
                Where the parcels are
              </h3>
              <span className="section-note">Every parcel goes through these 8 steps in order. Tap a step to see its parcels.</span>
            </div>

            <div className="pipeline__strip">
              {stages.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="pipeline__step"
                  data-blocked={s.blocked > 0 || undefined}
                  onClick={() => navigate(`/app/lots?stage=${s.id}`)}
                >
                  <span className="pipeline__no">{s.no}</span>
                  <span className="pipeline__count">{s.count}</span>
                  <span className="pipeline__label">{s.short}</span>
                  <span
                    className="pipeline__bar"
                    style={{ '--fill': `${Math.round((s.count / peak) * 100)}%` } as React.CSSProperties}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="attention-title">
          <div className="panel__head">
            <h3 className="panel__title" id="attention-title">
              Problems &amp; questions
            </h3>
            <span className="spacer" />
            <Link to="/app/holds" className="btn btn--quiet btn--sm">
              See all problems
            </Link>
          </div>
          <div className="attention">
            {items.length === 0 ? (
              <p className="panel__body" style={{ color: 'var(--ink-3)', fontSize: 'var(--fs-sm)' }}>
                Nothing is stuck. There are no problems to fix.
              </p>
            ) : (
              items.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="attention__row"
                  onClick={() => navigate(item.lotId ? `/app/lots/${item.lotId}` : '/app/holds')}
                >
                  {item.sev ? (
                    <Severity sev={item.sev} />
                  ) : item.kind === 'query' ? (
                    <MessageSquare size={15} strokeWidth={1.75} style={{ color: 'var(--amber)' }} />
                  ) : (
                    <Timer size={15} strokeWidth={1.75} style={{ color: 'var(--ink-3)' }} />
                  )}
                  <span className="attention__body">
                    <span className="attention__title">{item.title}</span>
                    <span className="attention__meta">
                      <span className="mono">{item.lotNo}</span> · {item.meta}
                    </span>
                  </span>
                  <ArrowUpRight size={14} strokeWidth={1.75} className="attention__chev" />
                </button>
              ))
            )}
          </div>
        </section>

        <section className="panel" aria-labelledby="ledger-title">
          <div className="panel__head">
            <h3 className="panel__title" id="ledger-title">
              Stock right now
            </h3>
            <span className="spacer" />
            <span className="section-note">Updates as you work</span>
          </div>
          <div className="panel__body">
            <div className="ledger">
              <div className="ledger__row">
                <span className="ledger__key">On the shop floor</span>
                <span className="ledger__val">
                  {t.onFloor} <small>pieces</small>
                </span>
              </div>
              <div className="ledger__row">
                <span className="ledger__key">In the storeroom</span>
                <span className="ledger__val">
                  {t.stored} <small>pieces</small>
                </span>
              </div>
              <div className="ledger__row">
                <span className="ledger__key">Sold this season</span>
                <span className="ledger__val">
                  {t.sold} <small>pieces</small>
                </span>
              </div>
              <div className="ledger__row">
                <span className="ledger__key">Parcels stopped by a problem</span>
                <span className="ledger__val" style={{ color: t.blockedLots ? 'var(--oxblood)' : undefined }}>
                  {t.blockedLots} <small>parcels</small>
                </span>
              </div>
              <div className="ledger__row">
                <span className="ledger__key">Waiting to be checked</span>
                <span className="ledger__val">
                  {t.awaitingQc} <small>pieces</small>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel" aria-labelledby="upcoming-title">
          <div className="panel__head">
            <h3 className="panel__title" id="upcoming-title">
              Parcels on the way
            </h3>
            <span className="spacer" />
            <Link to="/app/lots?tab=upcoming" className="btn btn--quiet btn--sm">
              Manage
            </Link>
          </div>
          <div className="panel__body panel__body--tight">
            {snap.upcoming.filter((u) => u.status === 'expected').length === 0 ? (
              <p style={{ padding: 'var(--sp-3)', fontSize: 'var(--fs-xs)', color: 'var(--ink-3)' }}>
                No parcels on the way. Add one when a designer tells you they have sent it.
              </p>
            ) : (
              snap.upcoming
                .filter((u) => u.status === 'expected')
                .slice(0, 4)
                .map((u) => (
                  <div key={u.id} className="ledger__row" style={{ paddingBlock: 'var(--sp-3)' }}>
                    <span className="stack" style={{ gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>{u.designer}</span>
                      <span style={{ fontSize: 'var(--fs-3xs)', color: 'var(--ink-3)' }}>
                        {u.boxes ?? 1} {u.boxes === 1 ? 'box' : 'boxes'} · {u.courier ?? 'courier TBC'}
                      </span>
                    </span>
                    <span className="mono" style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-3)' }}>
                      {u.expected_date ?? '—'}
                    </span>
                  </div>
                ))
            )}
          </div>
        </section>

        <section className="panel desk__span" aria-labelledby="feed-title">
          <div className="panel__head">
            <h3 className="panel__title" id="feed-title">
              Recent activity
            </h3>
            <span className="spacer" />
            <span className="section-note">Newest at the top</span>
          </div>
          <div className="panel__body">
            <div className="feed">
              {feed.map((e) => (
                <div key={e.id} className="feed__item">
                  <span className="feed__time">{formatTime(e.at)}</span>
                  <span className="feed__text">
                    {e.text ?? `${e.action} on ${e.entity}`} <b>{profileName(e.by)}</b>
                    {e.lot_id ? (
                      <>
                        {' · '}
                        <Link
                          to={`/app/lots/${e.lot_id}`}
                          className="mono"
                          style={{ fontSize: '0.6875rem', textDecoration: 'underline', textUnderlineOffset: '0.2em' }}
                        >
                          {snap.lots.find((l) => l.id === e.lot_id)?.lot_no ?? 'lot'}
                        </Link>
                      </>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {needsYou.length > 0 ? (
          <section className="panel desk__span" aria-labelledby="needs-title">
            <div className="panel__head">
              <CircleAlert size={15} strokeWidth={1.75} style={{ color: 'var(--amber)' }} />
              <h3 className="panel__title" id="needs-title">
                Parcels that are stuck
              </h3>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Parcel no.</th>
                    <th scope="col">Designer</th>
                    <th scope="col">Step</th>
                    <th scope="col">Age</th>
                    <th scope="col">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {needsYou.map((lot) => {
                    const b = bundleOf(snap, lot.id)
                    const stage = STAGE_BY_ID[stageOf(snap, lot)]
                    return (
                      <tr
                        key={lot.id}
                        data-clickable="true"
                        onClick={() => navigate(`/app/lots/${lot.id}`)}
                      >
                        <td data-label="Parcel no." className="cell-mono">
                          {lot.lot_no}
                        </td>
                        <td data-label="Designer">{lot.designer ?? '—'}</td>
                        <td data-label="Step">{stage.short}</td>
                        <td data-label="Age">{ageLabel(lot.created_at)}</td>
                        <td data-label="Progress">{b ? <MiniSpine bundle={b} blocked={isBlocked(snap, lot)} /> : null}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>

      <SectionHead title="Recently received" note={`${snap.lots.length} parcels on record`} />
      <div className="ledger">
        {snap.lots
          .filter((l) => !l.closed_at)
          .slice(0, 4)
          .map((lot) => (
            <div key={lot.id} className="ledger__row">
              <span className="row" style={{ gap: 'var(--sp-3)', minWidth: 0 }}>
                <span className="mono" style={{ fontSize: 'var(--fs-2xs)' }}>
                  {lot.lot_no}
                </span>
                <span style={{ fontSize: 'var(--fs-xs)' }}>{lot.designer}</span>
              </span>
              <span className="row" style={{ gap: 'var(--sp-4)' }}>
                <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--ink-3)' }}>
                  {formatRelative(lot.created_at)}
                </span>
                <Link to={`/app/lots/${lot.id}`} className="btn btn--quiet btn--sm">
                  Open
                </Link>
              </span>
            </div>
          ))}
      </div>
    </>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

const WELCOME_KEY = 'jp.desk.welcomed'

/** First visit only: a short, dismissible pointer to the help. */
function Welcome() {
  const [show, setShow] = useState(() => {
    try {
      return localStorage.getItem(WELCOME_KEY) !== '1'
    } catch {
      return true
    }
  })
  if (!show) return null
  const dismiss = () => {
    setShow(false)
    try {
      localStorage.setItem(WELCOME_KEY, '1')
    } catch {
      /* private mode — it simply shows again next time */
    }
  }
  return (
    <section className="welcome" aria-labelledby="welcome-title">
      <div className="welcome__text">
        <h3 id="welcome-title">New here? It takes three taps.</h3>
        <ol>
          <li>Check it is your name on the desk — tap it to change.</li>
          <li>Open a parcel from “Your next steps” below.</li>
          <li>Tick each item, then press “Finish this step”.</li>
        </ol>
      </div>
      <div className="welcome__actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => window.dispatchEvent(new CustomEvent('jp:help'))}
        >
          <CircleHelp size={16} strokeWidth={1.9} />
          Show me how
        </button>
        <button type="button" className="btn btn--ghost" onClick={dismiss}>
          Got it
        </button>
      </div>
      <button type="button" className="btn-icon welcome__close" onClick={dismiss} aria-label="Hide this message">
        <X size={16} />
      </button>
    </section>
  )
}

/** The parcels waiting on a step the person at the tablet is allowed to finish. */
function NextSteps() {
  const { snap, user } = useDesk()
  const navigate = useNavigate()

  const mine = useMemo(() => {
    return snap.lots
      .filter((l) => !l.closed_at)
      .map((lot) => {
        const stage = stageOf(snap, lot)
        const bundle = bundleOf(snap, lot.id)
        return {
          lot,
          stage,
          def: STAGE_BY_ID[stage],
          index: STAGES.findIndex((s) => s.id === stage),
          progress: bundle ? checkProgress(bundle, stage) : { ticked: 0, total: 0, pct: 0 },
          blocked: isBlocked(snap, lot),
        }
      })
      .filter((r) => canPassGate(user.roles, r.stage))
      .sort((a, b) => a.lot.created_at.localeCompare(b.lot.created_at))
  }, [snap, user])

  return (
    <section className="panel next" aria-labelledby="next-title">
      <div className="panel__head">
        <h3 className="panel__title" id="next-title">
          Your next steps
        </h3>
        <span className="section-note">
          {mine.length === 0
            ? 'Nothing is waiting for you'
            : `${plural(mine.length, 'parcel is', 'parcels are')} waiting for you · oldest first`}
        </span>
      </div>
      {mine.length === 0 ? (
        <p className="next__empty">
          You are all caught up. Parcels will appear here when they reach a step your job covers ({user.roles.join(', ')}).
        </p>
      ) : (
        <div className="next__list">
          {mine.slice(0, 5).map(({ lot, stage, def, index, progress, blocked }) => (
            <button
              key={lot.id}
              type="button"
              className="next__row"
              data-blocked={blocked || undefined}
              onClick={() => navigate(`/app/lots/${lot.id}?stage=${stage}`)}
            >
              <span className="next__step">
                <span className="next__step-no">{index + 1}</span>
                <span className="next__step-of">of 8</span>
              </span>
              <span className="next__body">
                <span className="next__title">
                  {def.name} — {lot.designer ?? 'Unnamed parcel'}
                </span>
                <span className="next__meta">
                  <span className="mono">{lot.lot_no}</span> · {ageLabel(lot.created_at)} old
                  {progress.total > 0 ? ` · ${progress.ticked} of ${progress.total} ticked` : ''}
                  {blocked ? ' · has a problem' : ''}
                </span>
                <span className="next__bar" aria-hidden="true">
                  <span style={{ inlineSize: `${progress.pct}%` }} />
                </span>
              </span>
              <span className="next__go">
                {progress.ticked > 0 ? 'Continue' : 'Start'}
                <ArrowRight size={16} strokeWidth={2} />
              </span>
            </button>
          ))}
          {mine.length > 5 ? (
            <Link to="/app/lots" className="next__more">
              See all {mine.length} parcels waiting for you
            </Link>
          ) : null}
        </div>
      )}
    </section>
  )
}
