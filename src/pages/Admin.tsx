import { useState, type FormEvent } from 'react'
import { Belt } from '../components/Belt'
import {
  AthleteEditForm,
  BeltPicker,
  ChampionshipForm,
  DeleteButton,
  Field,
  MatchForm,
  PinInput,
  PlacementForm,
  useSave,
} from '../components/forms'
import { Status } from '../components/Status'
import { changePin, setAthletePin } from '../lib/db'
import { byDateDesc, formatDate } from '../lib/stats'
import { useStore } from '../store'
import type { Athlete, Belt as BeltType } from '../types'

export function Admin() {
  const { session, isAdmin } = useStore()
  return (
    <Status>
      <header className="hero">
        <h1>Admin</h1>
        <p className="muted">Changes are live for the whole team instantly.</p>
      </header>
      {isAdmin ? <Panels /> : <Unlock athleteSession={Boolean(session)} />}
    </Status>
  )
}

function Unlock({ athleteSession }: { athleteSession: boolean }) {
  const { login, logout } = useStore()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (athleteSession) await logout()
      await login(value.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unlock')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Unlock admin</h2>
      <p className="muted">Enter the team admin PIN. This device stays unlocked afterwards.</p>
      {athleteSession && <p className="muted small">You are signed in as an athlete. Unlocking admin will switch this device to admin.</p>}
      <PinInput value={value} onChange={setValue} />
      {error ? <p className="error">{error}</p> : null}
      <button type="submit" disabled={busy}>
        {busy ? 'Checking…' : 'Unlock'}
      </button>
    </form>
  )
}

type Tab = 'match' | 'placement' | 'athletes' | 'events' | 'pin'

function Panels() {
  const { logout, reload } = useStore()
  const [tab, setTab] = useState<Tab>('match')
  const tabs: { key: Tab; label: string }[] = [
    { key: 'match', label: 'Match' },
    { key: 'placement', label: 'Podium' },
    { key: 'athletes', label: 'Athletes' },
    { key: 'events', label: 'Events' },
    { key: 'pin', label: 'PIN' },
  ]
  return (
    <>
      <div className="chips">
        {tabs.map((t) => (
          <button key={t.key} className={tab === t.key ? 'chip active' : 'chip'} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'match' && <Matches />}
      {tab === 'placement' && <Placements />}
      {tab === 'athletes' && <Athletes />}
      {tab === 'events' && <Events />}
      {tab === 'pin' && <ChangePin />}
      <div className="row gap">
        <button className="ghost" onClick={reload}>
          Refresh data
        </button>
        <button className="ghost danger" onClick={logout}>
          Lock admin
        </button>
      </div>
    </>
  )
}

function Matches() {
  const { db } = useStore()
  const { save } = useSave()
  const recent = [...db.matches].slice(-8).reverse()
  const nameOf = (id: string) => db.athletes.find((a) => a.id === id)?.name ?? '?'
  return (
    <>
      <MatchForm />
      {recent.length > 0 && (
        <section className="panel">
          <h2>Recent matches</h2>
          {recent.map((m) => (
            <div key={m.id} className="admin-row">
              <span>
                <span className={`result result-${m.result} inline`}>{m.result[0].toUpperCase()}</span> {nameOf(m.athleteId)}{' '}
                <span className="muted">vs {m.opponent}</span>
              </span>
              <DeleteButton label="Delete match" onConfirm={() => save({ op: 'delete', table: 'matches', row: { id: m.id } })} />
            </div>
          ))}
        </section>
      )}
    </>
  )
}

function Placements() {
  const { db } = useStore()
  const { save } = useSave()
  const recent = [...db.placements].slice(-8).reverse()
  const nameOf = (id: string) => db.athletes.find((a) => a.id === id)?.name ?? '?'
  const eventOf = (id: string) => db.championships.find((c) => c.id === id)?.name ?? '?'
  return (
    <>
      <PlacementForm />
      {recent.length > 0 && (
        <section className="panel">
          <h2>Recent podiums</h2>
          {recent.map((p) => (
            <div key={p.id} className="admin-row">
              <span>
                {p.place === 1 ? '🥇' : p.place === 2 ? '🥈' : '🥉'} {nameOf(p.athleteId)}{' '}
                <span className="muted">
                  {p.division} · {eventOf(p.championshipId)}
                </span>
              </span>
              <DeleteButton label="Delete podium" onConfirm={() => save({ op: 'delete', table: 'placements', row: { id: p.id } })} />
            </div>
          ))}
        </section>
      )}
    </>
  )
}

function Athletes() {
  const { db } = useStore()
  const { save, busy, feedback } = useSave()
  const [f, setF] = useState({ name: '', belt: 'white' as BeltType, stripes: 0, weight: '' })
  const [editing, setEditing] = useState<Athlete | null>(null)
  const [resetting, setResetting] = useState<Athlete | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save(
      { op: 'insert', table: 'athletes', row: { name: f.name.trim(), belt: f.belt, stripes: f.stripes, weight: f.weight.trim() || null } },
      () => setF({ name: '', belt: 'white', stripes: 0, weight: '' }),
    )
  }

  const sorted = [...db.athletes].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      {editing ? (
        <AthleteEditForm key={editing.id} athlete={editing} onDone={() => setEditing(null)} />
      ) : (
        <form className="panel" onSubmit={submit}>
          <h2>Add athlete</h2>
          <p className="muted small">Athletes can also register themselves from the Join tab and pick their own PIN.</p>
          <Field label="Name">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
          </Field>
          <Field label="Belt">
            <BeltPicker value={f.belt} onChange={(belt) => setF({ ...f, belt })} />
          </Field>
          <div className="row">
            <Field label="Stripes">
              <input type="number" min={0} max={4} value={f.stripes} onChange={(e) => setF({ ...f, stripes: Number(e.target.value) })} />
            </Field>
            <Field label="Weight class">
              <input value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })} placeholder="Middle, -76kg…" />
            </Field>
          </div>
          {feedback}
          <button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Add athlete'}
          </button>
        </form>
      )}
      {resetting && <ResetPin athlete={resetting} onDone={() => setResetting(null)} />}
      <section className="panel">
        <h2>Roster ({sorted.length})</h2>
        {sorted.map((a) => (
          <div key={a.id} className="admin-row">
            <span className="row gap center-y">
              <Belt belt={a.belt} stripes={a.stripes} size="sm" />
              {a.name}
            </span>
            <span className="row gap">
              <button className="ghost small" onClick={() => setEditing(a)}>
                Edit
              </button>
              <button className="ghost small" onClick={() => setResetting(a)}>
                PIN
              </button>
              <DeleteButton label="Delete athlete" onConfirm={() => save({ op: 'delete', table: 'athletes', row: { id: a.id } })} />
            </span>
          </div>
        ))}
      </section>
    </>
  )
}

function ResetPin({ athlete, onDone }: { athlete: Athlete; onDone: () => void }) {
  const { session } = useStore()
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await setAthletePin(session!.token, athlete.id, pin.trim())
      setMsg({ ok: true, text: `PIN set. Tell ${athlete.name} the new PIN.` })
      setPin('')
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Set PIN for {athlete.name}</h2>
      <p className="muted small">Use this when someone forgot their PIN or was added by an admin. Their other devices get signed out.</p>
      <PinInput value={pin} onChange={setPin} placeholder="New PIN" />
      {msg ? <p className={msg.ok ? 'success' : 'error'}>{msg.text}</p> : null}
      <div className="row gap">
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Set PIN'}
        </button>
        <button type="button" className="ghost" onClick={onDone}>
          Close
        </button>
      </div>
    </form>
  )
}

function Events() {
  const { db } = useStore()
  const { save } = useSave()
  const sorted = [...db.championships].sort(byDateDesc)
  return (
    <>
      <ChampionshipForm />
      <section className="panel">
        <h2>All championships ({sorted.length})</h2>
        {sorted.map((c) => (
          <div key={c.id} className="admin-row">
            <span>
              {c.name} <span className="muted">{formatDate(c.date)}</span>
            </span>
            <DeleteButton label="Delete championship" onConfirm={() => save({ op: 'delete', table: 'championships', row: { id: c.id } })} />
          </div>
        ))}
      </section>
    </>
  )
}

export function ChangePin({ title = 'Change admin PIN' }: { title?: string }) {
  const { session } = useStore()
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await changePin(session!.token, next.trim())
      setNext('')
      setMsg({ ok: true, text: 'PIN changed.' })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not change PIN' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>{title}</h2>
      <p className="muted">Devices already unlocked stay unlocked. New devices will need the new PIN.</p>
      <Field label="New PIN">
        <PinInput value={next} onChange={setNext} placeholder="At least 4 digits" />
      </Field>
      {msg ? <p className={msg.ok ? 'success' : 'error'}>{msg.text}</p> : null}
      <button type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Change PIN'}
      </button>
    </form>
  )
}
