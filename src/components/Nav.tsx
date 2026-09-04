import { NavLink } from 'react-router-dom'
import { useStore } from '../store'

export function Nav() {
  const { session } = useStore()
  const me = session?.athleteId
  const tabs = [
    { to: '/', label: 'Team', icon: '🥋' },
    { to: '/championships', label: 'Events', icon: '🏆' },
    me ? { to: `/athletes/${me}`, label: 'Me', icon: '👤' } : { to: '/join', label: 'Join', icon: '➕' },
    { to: '/admin', label: 'Admin', icon: '⚙️' },
  ]
  return (
    <nav className="nav">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="nav-icon" aria-hidden>
            {t.icon}
          </span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
