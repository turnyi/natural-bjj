import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Belt } from '../components/Belt'
import { Medals } from '../components/Medals'
import { Stat } from '../components/Stat'
import { Status } from '../components/Status'
import { athleteRecord, teamRecord, totalMedals, winRate } from '../lib/stats'
import { useStore } from '../store'
import { BELTS, type Belt as BeltType } from '../types'

export function Team() {
  const { db } = useStore()
  const [belt, setBelt] = useState<BeltType | 'all'>('all')
  const team = teamRecord(db)

  const athletes = useMemo(
    () =>
      db.athletes
        .map((a) => ({ athlete: a, record: athleteRecord(db, a.id) }))
        .filter((x) => belt === 'all' || x.athlete.belt === belt)
        .sort(
          (a, b) =>
            b.record.wins - a.record.wins ||
            totalMedals(b.record) - totalMedals(a.record) ||
            a.athlete.name.localeCompare(b.athlete.name),
        ),
    [db, belt],
  )

  return (
    <Status>
      <header className="hero">
        <h1>
          Natural <span className="accent">BJJ</span>
        </h1>
        <p className="muted">Team competition record</p>
      </header>

      <div className="stats-grid">
        <Stat label="Wins" value={team.wins} tone="win" />
        <Stat label="Losses" value={team.losses} tone="loss" />
        <Stat label="Submissions" value={team.submissions} tone="accent" />
        <Stat label="Medals" value={totalMedals(team)} />
      </div>

      <div className="chips">
        <button className={belt === 'all' ? 'chip active' : 'chip'} onClick={() => setBelt('all')}>
          All
        </button>
        {BELTS.map((b) => (
          <button key={b} className={belt === b ? `chip active chip-${b}` : `chip chip-${b}`} onClick={() => setBelt(b)}>
            {b}
          </button>
        ))}
      </div>

      {athletes.length === 0 ? (
        <p className="empty">No athletes yet. Add them from the Admin tab.</p>
      ) : (
        <ul className="list">
          {athletes.map(({ athlete, record }, i) => (
            <li key={athlete.id}>
              <Link to={`/athletes/${athlete.id}`} className="card athlete-card">
                <span className="rank">{i + 1}</span>
                <div className="athlete-main">
                  <div className="athlete-name">{athlete.name}</div>
                  <Belt belt={athlete.belt} stripes={athlete.stripes} size="sm" />
                </div>
                <div className="athlete-side">
                  <div className="record">
                    <span className="win">{record.wins}</span>
                    <span className="muted">-</span>
                    <span className="loss">{record.losses}</span>
                    {record.draws ? (
                      <>
                        <span className="muted">-</span>
                        <span>{record.draws}</span>
                      </>
                    ) : null}
                  </div>
                  <div className="athlete-sub">
                    <Medals medals={record.medals} compact />
                    {record.wins + record.losses > 0 ? <span className="muted">{winRate(record)}%</span> : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Status>
  )
}
