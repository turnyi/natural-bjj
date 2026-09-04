import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Team', icon: '🥋' },
  { to: '/championships', label: 'Events', icon: '🏆' },
  { to: '/admin', label: 'Admin', icon: '⚙️' },
]

export function Nav() {
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
