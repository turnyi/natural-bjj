export function Stat({ label, value, tone }: { label: string; value: string | number; tone?: 'win' | 'loss' | 'accent' }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
