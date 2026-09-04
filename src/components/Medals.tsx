import type { Record3 } from '../lib/stats'

const icons: Record<1 | 2 | 3, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export function Medals({ medals, compact = false }: { medals: Record3; compact?: boolean }) {
  const places = ([1, 2, 3] as const).filter((p) => medals[p] > 0)
  if (!places.length) return compact ? null : <span className="muted">No medals yet</span>
  return (
    <span className="medals">
      {places.map((p) => (
        <span key={p} className="medal">
          {icons[p]}
          <b>{medals[p]}</b>
        </span>
      ))}
    </span>
  )
}

export const medalIcon = (place: 1 | 2 | 3) => icons[place]
