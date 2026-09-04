import { Link } from 'react-router-dom'
import { Medals } from '../components/Medals'
import { Status } from '../components/Status'
import { byDateDesc, championshipRecord, formatDate } from '../lib/stats'
import { useStore } from '../store'

export function Championships() {
  const { db } = useStore()
  const events = [...db.championships].sort(byDateDesc)
  return (
    <Status>
      <header className="hero">
        <h1>Championships</h1>
        <p className="muted">{events.length} event{events.length === 1 ? '' : 's'}</p>
      </header>
      {events.length === 0 ? (
        <p className="empty">No championships yet. Create one from the Admin tab.</p>
      ) : (
        <ul className="list">
          {events.map((c) => {
            const r = championshipRecord(db, c.id)
            const athletes = new Set(db.matches.filter((m) => m.championshipId === c.id).map((m) => m.athleteId)).size
            return (
              <li key={c.id}>
                <Link to={`/championships/${c.id}`} className="card event-card">
                  <div className="event-main">
                    <div className="event-name">{c.name}</div>
                    <div className="muted">
                      {formatDate(c.date)}
                      {c.location ? ` · ${c.location}` : ''}
                      {c.organization ? ` · ${c.organization}` : ''}
                    </div>
                    <div className="event-meta">
                      <span>
                        <span className="win">{r.wins}W</span> <span className="loss">{r.losses}L</span>
                      </span>
                      <span className="muted">
                        {athletes} athlete{athletes === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                  <Medals medals={r.medals} compact />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Status>
  )
}
