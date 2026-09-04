import { useState, type FormEvent, type ReactNode } from 'react'
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

export const today = () => new Date().toISOString().slice(0, 10)

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function useSave() {
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
  return { save, busy, feedback, clear: () => setMsg(null) }
}

export function AthleteSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

export function EventSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

export function BeltPicker({ value, onChange }: { value: BeltType; onChange: (b: BeltType) => void }) {
  return (
    <div className="segmented">
      {BELTS.map((b) => (
        <button
          type="button"
          key={b}
          className={value === b ? `seg active seg-belt-${b}` : 'seg'}
          onClick={() => onChange(b)}
        >
          {b}
        </button>
      ))}
    </div>
  )
}

export function MatchForm({ athleteId, onSaved }: { athleteId?: string; onSaved?: () => void }) {
  const { save, busy, feedback } = useSave()
  const blank = {
    championshipId: '',
    athleteId: athleteId ?? '',
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
          opponentTeam: f.opponentTeam.trim() || null,
          round: f.round.trim() || null,
          result: f.result,
          method: f.method,
          submission: f.method === 'submission' ? f.submission.trim() || null : null,
          scored: Number(f.scored) || 0,
          conceded: Number(f.conceded) || 0,
          notes: f.notes.trim() || null,
        },
      },
      () => {
        setF((s) => ({ ...blank, championshipId: s.championshipId, athleteId: s.athleteId }))
        onSaved?.()
      },
    )
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Add match</h2>
      <Field label="Championship">
        <EventSelect value={f.championshipId} onChange={(v) => set('championshipId', v)} />
      </Field>
      {!athleteId && (
        <Field label="Athlete">
          <AthleteSelect value={f.athleteId} onChange={(v) => set('athleteId', v)} />
        </Field>
      )}
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
            <button type="button" key={r} className={f.result === r ? `seg active seg-${r}` : 'seg'} onClick={() => set('result', r)}>
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
          <input value={f.submission} onChange={(e) => set('submission', e.target.value)} placeholder="Armbar, RNC, Triangle…" />
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
  )
}

export function PlacementForm({ athleteId, onSaved }: { athleteId?: string; onSaved?: () => void }) {
  const { save, busy, feedback } = useSave()
  const [f, setF] = useState({ championshipId: '', athleteId: athleteId ?? '', division: '', place: 1 as Place })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save({ op: 'insert', table: 'placements', row: { ...f, division: f.division.trim() } }, () => {
      setF((s) => ({ ...s, division: '' }))
      onSaved?.()
    })
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Add podium result</h2>
      <Field label="Championship">
        <EventSelect value={f.championshipId} onChange={(v) => setF((s) => ({ ...s, championshipId: v }))} />
      </Field>
      {!athleteId && (
        <Field label="Athlete">
          <AthleteSelect value={f.athleteId} onChange={(v) => setF((s) => ({ ...s, athleteId: v }))} />
        </Field>
      )}
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
            <button type="button" key={p} className={f.place === p ? 'seg active' : 'seg'} onClick={() => setF((s) => ({ ...s, place: p }))}>
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
  )
}

export function ChampionshipForm({ onSaved }: { onSaved?: () => void }) {
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
      () => {
        setF({ name: '', date: today(), location: '', organization: '' })
        onSaved?.()
      },
    )
  }

  return (
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
  )
}

export function AthleteEditForm({ athlete, onDone }: { athlete: Athlete; onDone: () => void }) {
  const { save, busy, feedback } = useSave()
  const [f, setF] = useState({ name: athlete.name, belt: athlete.belt, stripes: athlete.stripes, weight: athlete.weight ?? '' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save(
      {
        op: 'update',
        table: 'athletes',
        row: { id: athlete.id, name: f.name.trim(), belt: f.belt, stripes: f.stripes, weight: f.weight.trim() || null },
      },
      onDone,
    )
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Edit profile</h2>
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
      <div className="row gap">
        <button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className="ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export function DeleteButton({ label, onConfirm }: { label: string; onConfirm: () => void }) {
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

export function PinInput(props: { value: string; onChange: (v: string) => void; placeholder?: string; minLength?: number }) {
  return (
    <input
      type="password"
      inputMode="numeric"
      autoComplete="off"
      placeholder={props.placeholder ?? 'PIN'}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      minLength={props.minLength ?? 4}
      required
    />
  )
}
