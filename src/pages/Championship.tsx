import { Link, useParams } from 'react-router-dom'
import { MatchRow } from '../components/MatchRow'
import { medalIcon } from '../components/Medals'
import { Stat } from '../components/Stat'
import { Status } from '../components/Status'
import { championshipRecord, formatDate } from '../lib/stats'
import { useStore } from '../store'

export function Championship() {
  const { id } = useParams()
  const { db } = useStore()
  const event = db.championships.find((c) => c.id === id)

  return (
    <Status>
      {!event ? (
        <p className="empty">Championship not found.</p>
      ) : (
        <>
          <Link to="/championships" className="back">
            ← Championships
          </Link>
          <header className="profile">
            <h1>{event.name}</h1>
            <p className="muted">
              {formatDate(event.date)}
              {event.location ? ` · ${event.location}` : ''}
              {event.organization ? ` · ${event.organization}` : ''}
            </p>
          </header>
          {(() => {
            const r = championshipRecord(db, event.id)
            const placements = db.placements
              .filter((p) => p.championshipId === event.id)
              .sort((a, b) => a.place - b.place)
            const matches = db.matches.filter((m) => m.championshipId === event.id)
            const byAthlete = new Map(db.athletes.map((a) => [a.id, a]))
            return (
              <>
                <div className="stats-grid">
                  <Stat label="Wins" value={r.wins} tone="win" />
                  <Stat label="Losses" value={r.losses} tone="loss" />
                  <Stat label="Submissions" value={r.submissions} tone="accent" />
                  <Stat label="Medals" value={r.medals[1] + r.medals[2] + r.medals[3]} />
                </div>
                {placements.length > 0 && (
                  <section className="section">
                    <div className="section-head">
                      <span className="section-title">Podium</span>
                    </div>
                    {placements.map((p) => (
                      <div key={p.id} className="placement">
                        <span>{medalIcon(p.place)}</span>
                        <Link to={`/athletes/${p.athleteId}`}>{byAthlete.get(p.athleteId)?.name ?? 'Unknown'}</Link>
                        <span className="muted">{p.division}</span>
                      </div>
                    ))}
                  </section>
                )}
                <section className="section">
                  <div className="section-head">
                    <span className="section-title">Matches</span>
                    <span className="muted">{matches.length}</span>
                  </div>
                  {matches.length === 0 ? (
                    <p className="empty">No matches recorded.</p>
                  ) : (
                    matches.map((m) => <MatchRow key={m.id} match={m} athlete={byAthlete.get(m.athleteId)} showAthlete />)
                  )}
                </section>
              </>
            )
          })()}
        </>
      )}
    </Status>
  )
}
