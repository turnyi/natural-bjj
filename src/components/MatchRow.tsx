import { Link } from 'react-router-dom'
import { METHOD_LABELS, type Athlete, type Match } from '../types'

export function MatchRow({ match, athlete, showAthlete }: { match: Match; athlete?: Athlete; showAthlete?: boolean }) {
  const detail =
    match.method === 'submission' && match.submission
      ? `Submission · ${match.submission}`
      : METHOD_LABELS[match.method]
  return (
    <div className="match">
      <span className={`result result-${match.result}`}>{match.result[0].toUpperCase()}</span>
      <div className="match-body">
        <div className="match-top">
          {showAthlete && athlete ? (
            <Link to={`/athletes/${athlete.id}`} className="match-athlete">
              {athlete.name}
            </Link>
          ) : null}
          {showAthlete && athlete ? <span className="muted"> vs </span> : null}
          <span className="match-opponent">{match.opponent || 'Unknown'}</span>
          {match.opponentTeam ? <span className="muted"> ({match.opponentTeam})</span> : null}
        </div>
        <div className="match-meta">
          <span>{detail}</span>
          {match.round ? <span>· {match.round}</span> : null}
          {match.notes ? <span className="muted">· {match.notes}</span> : null}
        </div>
      </div>
      <div className="score">
        <b>{match.scored}</b>
        <span className="muted">–</span>
        <b>{match.conceded}</b>
      </div>
    </div>
  )
}
