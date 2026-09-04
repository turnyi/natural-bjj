import { useStore } from '../store'

export function Status({ children }: { children: React.ReactNode }) {
  const { loading, error, reload } = useStore()
  if (loading)
    return (
      <div className="center muted">
        <div className="spinner" />
        Loading…
      </div>
    )
  if (error)
    return (
      <div className="center">
        <p className="error">{error}</p>
        <button onClick={reload}>Retry</button>
      </div>
    )
  return <>{children}</>
}
