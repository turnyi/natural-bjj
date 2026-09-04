import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BeltPicker, Field, PinInput } from '../components/forms'
import { Status } from '../components/Status'
import { useStore } from '../store'
import type { Belt as BeltType } from '../types'

export function Join() {
  const { session, db, register } = useStore()
  const navigate = useNavigate()
  const [f, setF] = useState({ name: '', belt: 'white' as BeltType, stripes: 0, weight: '', pin: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const me = session?.athleteId ? db.athletes.find((a) => a.id === session.athleteId) : null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (f.pin !== f.confirm) return setError('PINs do not match')
    setBusy(true)
    setError('')
    try {
      const s = await register({ name: f.name, belt: f.belt, stripes: f.stripes, weight: f.weight, pin: f.pin })
      navigate(`/athletes/${s.athleteId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not register')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Status>
      <header className="hero">
        <h1>Join the team</h1>
        <p className="muted">Create your profile and pick a PIN to log your own results.</p>
      </header>
      {me ? (
        <div className="panel">
          <h2>You're signed in as {me.name}</h2>
          <Link to={`/athletes/${me.id}`}>
            <button type="button">Go to my profile</button>
          </Link>
        </div>
      ) : (
        <form className="panel" onSubmit={submit}>
          <Field label="Name">
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Your name" required />
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
          <div className="row">
            <Field label="PIN">
              <PinInput value={f.pin} onChange={(pin) => setF({ ...f, pin })} placeholder="At least 4 digits" />
            </Field>
            <Field label="Confirm PIN">
              <PinInput value={f.confirm} onChange={(confirm) => setF({ ...f, confirm })} placeholder="Repeat PIN" />
            </Field>
          </div>
          <p className="muted small">Already on the roster? Open your name in Team and tap "This is me".</p>
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create my profile'}
          </button>
        </form>
      )}
    </Status>
  )
}
