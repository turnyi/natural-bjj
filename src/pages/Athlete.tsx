import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Belt, beltLabel } from '../components/Belt'
import { AthleteEditForm, DeleteButton, MatchForm, PinInput, PlacementForm, useSave } from '../components/forms'
import { MatchRow } from '../components/MatchRow'
import { medalIcon } from '../components/Medals'
import { Stat } from '../components/Stat'
import { Status } from '../components/Status'
import { athleteRecord, byDateDesc, formatDate, winRate } from '../lib/stats'
import { useStore } from '../store'
import { ChangePin } from './Admin'

export function Athlete() {
  const { id } = useParams()
  const { db } = useStore()
  const athlete = db.athletes.find((a) => a.id === id)

  return <Status>{!athlete ? <p className="empty">Athlete not found.</p> : <AthleteView athleteId={athlete.id} />}</Status>
}

type Mode = 'none' | 'match' | 'podium' | 'edit' | 'pin' | 'unlock'

function AthleteView({ athleteId }: { athleteId: string }) {
  const { db, session, canEdit, logout } = useStore()
  const { save } = useSave()
  const [mode, setMode] = useState<Mode>('none')
  const athlete = db.athletes.find((a) => a.id === athleteId)!
  const record = athleteRecord(db, athleteId)
  const total = record.wins + record.losses + record.draws
  const editable = canEdit(athleteId)
  const isMe = session?.athleteId === athleteId
  const events = db.championships
    .filter(
      (c) =>
        db.matches.some((m) => m.championshipId === c.id && m.athleteId === athleteId) ||
        db.placements.some((p) => p.championshipId === c.id && p.athleteId === athleteId),
    )
    .sort(byDateDesc)

  const toggle = (m: Mode) => setMode((cur) => (cur === m ? 'none' : m))

  return (
    <>
      <Link to="/" className="back">
        ← Team
      </Link>
      <header className="profile">
        <h1>{athlete.name}</h1>
        <Belt belt={athlete.belt} stripes={athlete.stripes} size="lg" />
        <p className="muted">
          {beltLabel(athlete.belt, athlete.stripes)}
          {athlete.weight ? ` · ${athlete.weight}` : ''}
        </p>
      </header>

      {editable ? (
        <div className="chips">
          <button className={mode === 'match' ? 'chip active' : 'chip'} onClick={() => toggle('match')}>
            + Match
          </button>
          <button className={mode === 'podium' ? 'chip active' : 'chip'} onClick={() => toggle('podium')}>
            + Podium
          </button>
          <button className={mode === 'edit' ? 'chip active' : 'chip'} onClick={() => toggle('edit')}>
            Edit profile
          </button>
          {isMe && (
            <>
              <button className={mode === 'pin' ? 'chip active' : 'chip'} onClick={() => toggle('pin')}>
                PIN
              </button>
              <button className="chip" onClick={logout}>
                Sign out
              </button>
            </>
          )}
        </div>
      ) : (
        !session?.isAdmin && (
          <div className="chips">
            <button className={mode === 'unlock' ? 'chip active' : 'chip'} onClick={() => toggle('unlock')}>
              This is me
            </button>
          </div>
        )
      )}

      {mode === 'unlock' && <UnlockAthlete athleteId={athleteId} onDone={() => setMode('none')} />}
      {mode === 'match' && <MatchForm athleteId={athleteId} onSaved={() => setMode('none')} />}
      {mode === 'podium' && <PlacementForm athleteId={athleteId} onSaved={() => setMode('none')} />}
      {mode === 'edit' && <AthleteEditForm athlete={athlete} onDone={() => setMode('none')} />}
      {mode === 'pin' && <ChangePin title="Change my PIN" />}

      <div className="stats-grid">
        <Stat label="Wins" value={record.wins} tone="win" />
        <Stat label="Losses" value={record.losses} tone="loss" />
        <Stat label="Win rate" value={total ? `${winRate(record)}%` : '–'} />
        <Stat label="Sub wins" value={record.submissions} tone="accent" />
        <Stat label="Submitted" value={record.submitted} />
        <Stat label="Points" value={`${record.scored}–${record.conceded}`} />
      </div>

      <div className="podium-row">
        {([1, 2, 3] as const).map((p) => (
          <div key={p} className="podium-item">
            <span>{medalIcon(p)}</span>
            <b>{record.medals[p]}</b>
          </div>
        ))}
      </div>

      {events.length === 0 ? (
        <p className="empty">No competitions recorded yet.</p>
      ) : (
        events.map((c) => {
          const matches = db.matches.filter((m) => m.championshipId === c.id && m.athleteId === athleteId)
          const placements = db.placements.filter((p) => p.championshipId === c.id && p.athleteId === athleteId)
          return (
            <section key={c.id} className="section">
              <div className="section-head">
                <Link to={`/championships/${c.id}`} className="section-title">
                  {c.name}
                </Link>
                <span className="muted">{formatDate(c.date)}</span>
              </div>
              {placements.map((p) => (
                <div key={p.id} className="placement">
                  <span>{medalIcon(p.place)}</span>
                  <span className="grow">{p.division}</span>
                  {editable && (
                    <DeleteButton label="Delete podium" onConfirm={() => save({ op: 'delete', table: 'placements', row: { id: p.id } })} />
                  )}
                </div>
              ))}
              {matches.map((m) => (
                <div key={m.id} className="match-wrap">
                  <MatchRow match={m} />
                  {editable && (
                    <DeleteButton label="Delete match" onConfirm={() => save({ op: 'delete', table: 'matches', row: { id: m.id } })} />
                  )}
                </div>
              ))}
            </section>
          )
        })
      )}
    </>
  )
}

function UnlockAthlete({ athleteId, onDone }: { athleteId: string; onDone: () => void }) {
  const { login, logout, session } = useStore()
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (session) await logout()
      await login(pin.trim(), athleteId)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wrong PIN')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Enter your PIN</h2>
      <p className="muted small">No PIN yet? Ask an admin to set one for you.</p>
      <PinInput value={pin} onChange={setPin} />
      {error ? <p className="error">{error}</p> : null}
      <button type="submit" disabled={busy}>
        {busy ? 'Checking…' : 'Unlock'}
      </button>
    </form>
  )
}
