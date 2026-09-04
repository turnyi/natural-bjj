import { useState, type FormEvent } from 'react'
import { Belt } from '../components/Belt'
import { Status } from '../components/Status'
import { changePin, verifyPin } from '../lib/db'
import { byDateDesc, formatDate } from '../lib/stats'
import { useStore, type Change } from '../store'
import {
  BELTS,
  METHODS,
  METHOD_LABELS,
  RESULTS,
  type Athlete,
  type Belt as BeltType,
  type Method,
  type Place,
  type Result,
} from '../types'

const today = () => new Date().toISOString().slice(0, 10)

export function Admin() {
  const { pin } = useStore()
  return (
    <Status>
      <header className="hero">
        <h1>Admin</h1>
        <p className="muted">Changes are live for the whole team instantly.</p>
      </header>
      {pin ? <Panels /> : <PinSetup />}
    </Status>
  )
}

function PinSetup() {
  const { setPin } = useStore()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (!(await verifyPin(value.trim()))) throw new Error('Wrong PIN')
      setPin(value.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify PIN')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Unlock admin</h2>
      <p className="muted">Enter the team admin PIN. It stays saved on this device.</p>
      <input
        type="password"
        inputMode="numeric"
        placeholder="PIN"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        required
      />
      {error ? <p className="error">{error}</p> : null}
      <button type="submit" disabled={busy}>
        {busy ? 'Checking…' : 'Unlock'}
      </button>
    </form>
  )
}

type Tab = 'match' | 'placement' | 'athletes' | 'events' | 'pin'

function Panels() {
  const { setPin, reload } = useStore()
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
      {tab === 'match' && <MatchForm />}
      {tab === 'placement' && <PlacementForm />}
      {tab === 'athletes' && <Athletes />}
      {tab === 'events' && <Events />}
      {tab === 'pin' && <ChangePin />}
      <div className="row gap">
        <button className="ghost" onClick={reload}>
          Refresh data
        </button>
        <button className="ghost danger" onClick={() => setPin('')}>
          Lock admin
        </button>
      </div>
    </>
  )
}

function useSave() {
  const { write } = useStore()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const save = async (change: Change, onDone?: () => void) => {
    setBusy(true)
    setMsg(null)
    try {
      await write(change)
      setMsg({ ok: true, text: 'Saved' })
      onDone?.()
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Save failed' })
    } finally {
      setBusy(false)
    }
  }
  const feedback = msg ? <p className={msg.ok ? 'success' : 'error'}>{msg.text}</p> : null
  return { save, busy, feedback }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function AthleteSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { db } = useStore()
  const sorted = [...db.athletes].sort((a, b) => a.name.localeCompare(b.name))
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} required>
      <option value="">Select athlete…</option>
      {sorted.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name} ({a.belt})
        </option>
      ))}
    </select>
  )
}

function EventSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { db } = useStore()
  const sorted = [...db.championships].sort(byDateDesc)
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} required>
      <option value="">Select championship…</option>
      {sorted.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} · {formatDate(c.date)}
        </option>
      ))}
    </select>
  )
}

function MatchForm() {
  const { db } = useStore()
  const { save, busy, feedback } = useSave()
  const blank = {
    championshipId: '',
    athleteId: '',
    opponent: '',
    opponentTeam: '',
    round: '',
    result: 'win' as Result,
    method: 'points' as Method,
    submission: '',
    scored: 0,
    conceded: 0,
    notes: '',
  }
  const [f, setF] = useState(blank)
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setF((s) => ({ ...s, [k]: v }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save(
      {
        op: 'insert',
        table: 'matches',
        row: {
          championshipId: f.championshipId,
          athleteId: f.athleteId,
          opponent: f.opponent.trim(),
          opponentTeam: f.opponentTeam.trim() || undefined,
          round: f.round.trim() || undefined,
          result: f.result,
          method: f.method,
          submission: f.method === 'submission' ? f.submission.trim() || undefined : undefined,
          scored: Number(f.scored) || 0,
          conceded: Number(f.conceded) || 0,
          notes: f.notes.trim() || undefined,
        },
      },
      () => setF((s) => ({ ...blank, championshipId: s.championshipId, athleteId: s.athleteId })),
    )
  }

  const recent = [...db.matches].slice(-5).reverse()
  const nameOf = (id: string) => db.athletes.find((a) => a.id === id)?.name ?? '?'

  return (
    <>
      <form className="panel" onSubmit={submit}>
        <h2>Add match</h2>
        <Field label="Championship">
          <EventSelect value={f.championshipId} onChange={(v) => set('championshipId', v)} />
        </Field>
        <Field label="Athlete">
          <AthleteSelect value={f.athleteId} onChange={(v) => set('athleteId', v)} />
        </Field>
        <div className="row">
          <Field label="Opponent">
            <input value={f.opponent} onChange={(e) => set('opponent', e.target.value)} placeholder="Name" />
          </Field>
          <Field label="Opponent team">
            <input value={f.opponentTeam} onChange={(e) => set('opponentTeam', e.target.value)} placeholder="Academy" />
          </Field>
        </div>
        <Field label="Result">
          <div className="segmented">
            {RESULTS.map((r) => (
              <button
                type="button"
                key={r}
                className={f.result === r ? `seg active seg-${r}` : 'seg'}
                onClick={() => set('result', r)}
              >
                {r}
              </button>
            ))}
          </div>
        </Field>
        <div className="row">
          <Field label="Method">
            <select value={f.method} onChange={(e) => set('method', e.target.value as Method)}>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Round">
            <input value={f.round} onChange={(e) => set('round', e.target.value)} placeholder="Final, Semi…" />
          </Field>
        </div>
        {f.method === 'submission' && (
          <Field label="Submission">
            <input
              value={f.submission}
              onChange={(e) => set('submission', e.target.value)}
              placeholder="Armbar, RNC, Triangle…"
            />
          </Field>
        )}
        <div className="row">
          <Field label="Points scored">
            <input type="number" min={0} value={f.scored} onChange={(e) => set('scored', Number(e.target.value))} />
          </Field>
          <Field label="Points conceded">
            <input type="number" min={0} value={f.conceded} onChange={(e) => set('conceded', Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Notes">
          <input value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional" />
        </Field>
        {feedback}
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save match'}
        </button>
      </form>
      {recent.length > 0 && (
        <section className="panel">
          <h2>Recent matches</h2>
          {recent.map((m) => (
            <div key={m.id} className="admin-row">
              <span>
                <span className={`result result-${m.result} inline`}>{m.result[0].toUpperCase()}</span> {nameOf(m.athleteId)}{' '}
                <span className="muted">vs {m.opponent}</span>
              </span>
              <DeleteButton
                label="Delete match"
                onConfirm={() => save({ op: 'delete', table: 'matches', row: { id: m.id } })}
              />
            </div>
          ))}
        </section>
      )}
    </>
  )
}

function PlacementForm() {
  const { db } = useStore()
  const { save, busy, feedback } = useSave()
  const [f, setF] = useState({ championshipId: '', athleteId: '', division: '', place: 1 as Place })
  const nameOf = (id: string) => db.athletes.find((a) => a.id === id)?.name ?? '?'
  const eventOf = (id: string) => db.championships.find((c) => c.id === id)?.name ?? '?'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save(
      { op: 'insert', table: 'placements', row: { ...f, division: f.division.trim() } },
      () => setF((s) => ({ ...s, athleteId: '', division: '' })),
    )
  }

  const recent = [...db.placements].slice(-8).reverse()

  return (
    <>
      <form className="panel" onSubmit={submit}>
        <h2>Add podium result</h2>
        <Field label="Championship">
          <EventSelect value={f.championshipId} onChange={(v) => setF((s) => ({ ...s, championshipId: v }))} />
        </Field>
        <Field label="Athlete">
          <AthleteSelect value={f.athleteId} onChange={(v) => setF((s) => ({ ...s, athleteId: v }))} />
        </Field>
        <Field label="Division">
          <input
            value={f.division}
            onChange={(e) => setF((s) => ({ ...s, division: e.target.value }))}
            placeholder="Adult Blue Middle, Absolute…"
            required
          />
        </Field>
        <Field label="Place">
          <div className="segmented">
            {([1, 2, 3] as const).map((p) => (
              <button
                type="button"
                key={p}
                className={f.place === p ? 'seg active' : 'seg'}
                onClick={() => setF((s) => ({ ...s, place: p }))}
              >
                {p === 1 ? '🥇 1st' : p === 2 ? '🥈 2nd' : '🥉 3rd'}
              </button>
            ))}
          </div>
        </Field>
        {feedback}
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save result'}
        </button>
      </form>
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
              <DeleteButton
                label="Delete podium"
                onConfirm={() => save({ op: 'delete', table: 'placements', row: { id: p.id } })}
              />
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

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save(
      { op: 'insert', table: 'athletes', row: { name: f.name.trim(), belt: f.belt, stripes: f.stripes, weight: f.weight.trim() || null } },
      () => setF({ name: '', belt: 'white', stripes: 0, weight: '' }),
    )
  }

  const update = (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    save(
      { op: 'update', table: 'athletes', row: { ...editing, name: editing.name.trim(), weight: editing.weight?.trim() || null } },
      () => setEditing(null),
    )
  }

  const sorted = [...db.athletes].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <form className="panel" onSubmit={editing ? update : submit}>
        <h2>{editing ? `Edit ${editing.name}` : 'Add athlete'}</h2>
        <Field label="Name">
          <input
            value={editing ? editing.name : f.name}
            onChange={(e) => (editing ? setEditing({ ...editing, name: e.target.value }) : setF({ ...f, name: e.target.value }))}
            required
          />
        </Field>
        <Field label="Belt">
          <div className="segmented">
            {BELTS.map((b) => {
              const cur = editing ? editing.belt : f.belt
              return (
                <button
                  type="button"
                  key={b}
                  className={cur === b ? `seg active seg-belt-${b}` : 'seg'}
                  onClick={() => (editing ? setEditing({ ...editing, belt: b }) : setF({ ...f, belt: b }))}
                >
                  {b}
                </button>
              )
            })}
          </div>
        </Field>
        <div className="row">
          <Field label="Stripes">
            <input
              type="number"
              min={0}
              max={4}
              value={editing ? editing.stripes : f.stripes}
              onChange={(e) =>
                editing ? setEditing({ ...editing, stripes: Number(e.target.value) }) : setF({ ...f, stripes: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Weight class">
            <input
              value={editing ? editing.weight ?? '' : f.weight}
              onChange={(e) => (editing ? setEditing({ ...editing, weight: e.target.value }) : setF({ ...f, weight: e.target.value }))}
              placeholder="Middle, -76kg…"
            />
          </Field>
        </div>
        {feedback}
        <div className="row gap">
          <button type="submit" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add athlete'}
          </button>
          {editing && (
            <button type="button" className="ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>
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
              <DeleteButton
                label="Delete athlete"
                onConfirm={() => save({ op: 'delete', table: 'athletes', row: { id: a.id } })}
              />
            </span>
          </div>
        ))}
      </section>
    </>
  )
}

function Events() {
  const { db } = useStore()
  const { save, busy, feedback } = useSave()
  const [f, setF] = useState({ name: '', date: today(), location: '', organization: '' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save(
      {
        op: 'insert',
        table: 'championships',
        row: {
          name: f.name.trim(),
          date: f.date,
          location: f.location.trim() || null,
          organization: f.organization.trim() || null,
        },
      },
      () => setF({ name: '', date: today(), location: '', organization: '' }),
    )
  }

  const sorted = [...db.championships].sort(byDateDesc)

  return (
    <>
      <form className="panel" onSubmit={submit}>
        <h2>Create championship</h2>
        <Field label="Name">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Open Nacional 2026" required />
        </Field>
        <Field label="Date">
          <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required />
        </Field>
        <div className="row">
          <Field label="Location">
            <input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="City" />
          </Field>
          <Field label="Organization">
            <input value={f.organization} onChange={(e) => setF({ ...f, organization: e.target.value })} placeholder="IBJJF, AJP…" />
          </Field>
        </div>
        {feedback}
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Create'}
        </button>
      </form>
      <section className="panel">
        <h2>All championships ({sorted.length})</h2>
        {sorted.map((c) => (
          <div key={c.id} className="admin-row">
            <span>
              {c.name} <span className="muted">{formatDate(c.date)}</span>
            </span>
            <DeleteButton
              label="Delete championship"
              onConfirm={() => save({ op: 'delete', table: 'championships', row: { id: c.id } })}
            />
          </div>
        ))}
      </section>
    </>
  )
}

function ChangePin() {
  const { pin, setPin } = useStore()
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await changePin(pin, next.trim())
      setPin(next.trim())
      setNext('')
      setMsg({ ok: true, text: 'PIN changed. Share the new one with the other admins.' })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not change PIN' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Change admin PIN</h2>
      <p className="muted">Anyone with the PIN can edit results. Other devices will need the new PIN.</p>
      <Field label="New PIN">
        <input type="password" inputMode="numeric" value={next} onChange={(e) => setNext(e.target.value)} minLength={4} required />
      </Field>
      {msg ? <p className={msg.ok ? 'success' : 'error'}>{msg.text}</p> : null}
      <button type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Change PIN'}
      </button>
    </form>
  )
}

function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  const [arm, setArm] = useState(false)
  if (!arm)
    return (
      <button className="ghost small danger" onClick={() => setArm(true)} aria-label={label}>
        ✕
      </button>
    )
  return (
    <span className="row gap">
      <button className="small danger" onClick={onConfirm}>
        Confirm
      </button>
      <button className="ghost small" onClick={() => setArm(false)}>
        Cancel
      </button>
    </span>
  )
}
