import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <span className="header-time">
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
    </span>
  );
}

export default function Layout({ children, eventId, eventName, isLive }) {
  const nav = useNavigate();
  const loc = useLocation();

  const navItems = [
    { icon: '▤', label: 'Events', path: '/', match: '/' },
    { icon: '📋', label: 'Agenda', path: eventId ? `/setup/${eventId}?tab=agenda` : '/', match: 'agenda' },
    { icon: '🎤', label: 'Speakers', path: eventId ? `/setup/${eventId}?tab=speakers` : '/', match: 'speakers' },
    { icon: '📝', label: 'Scripts', path: eventId ? `/setup/${eventId}?tab=scripts` : '/', match: 'scripts' },
    { icon: '⚡', label: 'Disruptions', path: eventId ? `/live/${eventId}` : '/', match: 'disruption', badge: isLive ? null : null },
  ];

  function isActive(item) {
    if (item.path === '/' && loc.pathname === '/') return true;
    if (item.match !== '/' && loc.pathname.includes(item.match)) return true;
    return false;
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🎙️</div>
          <div>
            <div className="sidebar-logo-text">SmartAnchor</div>
            <div className="sidebar-logo-sub">Smart Scripts, Smooth Events</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`sidebar-link ${isActive(item) ? 'active' : ''}`}
              onClick={() => nav(item.path)}
              id={`nav-${item.label.toLowerCase()}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
              {item.badge != null && <span className="sidebar-badge">{item.badge}</span>}
            </button>
          ))}

          {eventId && isLive && (
            <>
              <div className="divider" style={{ margin: '12px 0' }} />
              <div className="sidebar-section-label">Live</div>
              <button
                className={`sidebar-link ${loc.pathname.includes('/live') ? 'active' : ''}`}
                onClick={() => nav(`/live/${eventId}`)}
                id="nav-dashboard"
              >
                <span className="sidebar-link-icon">🔴</span>
                Live Dashboard
                <span className="sidebar-badge" style={{ background: '#10b981' }}>ON</span>
              </button>
            </>
          )}
        </nav>

        {/* Current Event Card */}
        {eventName && (
          <div className="sidebar-event-card">
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              {isLive ? '🔴 Live Event' : '📅 Current Event'}
            </div>
            <div className="sidebar-event-name">{eventName}</div>
            <div className="sidebar-event-meta">
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        )}

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">O</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>Organizer</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Admin</div>
          </div>
        </div>
      </aside>

      {/* ── Header ── */}
      <header className="header">
        {/* Search */}
        <div className="header-search">
          <span>🔍</span>
          <span>Search sessions, speakers, or anything...</span>
        </div>

        <div className="header-right">
          {/* Event chip */}
          {eventName && (
            <div className="header-event-chip" onClick={() => eventId && nav(`/live/${eventId}`)}>
              <span style={{ fontSize: 12 }}>{eventName.length > 20 ? eventName.slice(0, 20) + '…' : eventName}</span>
              {isLive && (
                <>
                  <div className="live-dot" />
                  <span style={{ color: '#10b981', fontWeight: 700, fontSize: 11 }}>LIVE</span>
                </>
              )}
            </div>
          )}
          <LiveClock />
          <button className="header-icon-btn" id="header-notif-btn">🔔</button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
