import { Link, useParams } from 'react-router-dom'
import { Belt, beltLabel } from '../components/Belt'
import { MatchRow } from '../components/MatchRow'
import { medalIcon } from '../components/Medals'
import { Stat } from '../components/Stat'
import { Status } from '../components/Status'
import { athleteRecord, byDateDesc, formatDate, winRate } from '../lib/stats'
import { useStore } from '../store'

export function Athlete() {
  const { id } = useParams()
  const { db } = useStore()
  const athlete = db.athletes.find((a) => a.id === id)

  return (
    <Status>
      {!athlete ? (
        <p className="empty">Athlete not found.</p>
      ) : (
        <AthleteView athleteId={athlete.id} />
      )}
    </Status>
  )
}

function AthleteView({ athleteId }: { athleteId: string }) {
  const { db } = useStore()
  const athlete = db.athletes.find((a) => a.id === athleteId)!
  const record = athleteRecord(db, athleteId)
  const total = record.wins + record.losses + record.draws
  const events = db.championships
    .filter((c) => db.matches.some((m) => m.championshipId === c.id && m.athleteId === athleteId) || db.placements.some((p) => p.championshipId === c.id && p.athleteId === athleteId))
    .sort(byDateDesc)

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
                  {medalIcon(p.place)} {p.division}
                </div>
              ))}
              {matches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </section>
          )
        })
      )}
    </>
  )
}
