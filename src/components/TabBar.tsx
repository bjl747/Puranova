import { NavLink } from 'react-router-dom';
import './TabBar.css';

const TABS = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/achievements', label: 'Badges', icon: BadgeIcon },
  { to: '/learn', label: 'Learn', icon: LearnIcon },
  { to: '/profile', label: 'Profile', icon: ProfileIcon },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `tabbar__item ${isActive ? 'tabbar__item--active' : ''}`
          }
        >
          <t.icon />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5v6h6" />
      <path d="M4 11a8 8 0 1 0 2.3-5.7L4 8" />
      <path d="M12 8v4l3 2" strokeLinecap="round" />
    </svg>
  );
}
function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="9" r="5.5" />
      <path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5" strokeLinejoin="round" />
    </svg>
  );
}
function LearnIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5.5A2 2 0 0 1 6 4h5v15H6a2 2 0 0 0-2 1.2z" />
      <path d="M20 5.5A2 2 0 0 0 18 4h-5v15h5a2 2 0 0 1 2 1.2z" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
    </svg>
  );
}
