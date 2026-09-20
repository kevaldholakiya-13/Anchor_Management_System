import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getEvents } from '../services/api';
import GlobalSearch from './GlobalSearch';

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

  const [resolvedEventId, setResolvedEventId] = useState(
    eventId || localStorage.getItem('smartanchor_current_event_id') || ''
  );
  const [resolvedEventName, setResolvedEventName] = useState(
    eventName || localStorage.getItem('smartanchor_current_event_name') || ''
  );

  useEffect(() => {
    if (eventId) {
      setResolvedEventId(eventId);
      localStorage.setItem('smartanchor_current_event_id', eventId);
    }
    if (eventName) {
      setResolvedEventName(eventName);
      localStorage.setItem('smartanchor_current_event_name', eventName);
    }
  }, [eventId, eventName]);

  useEffect(() => {
    getEvents().then((events) => {
      if (events && events.length > 0) {
        if (eventId) {
          const match = events.find((e) => e.id === eventId);
          if (match) {
            setResolvedEventId(match.id);
            setResolvedEventName(match.name);
            localStorage.setItem('smartanchor_current_event_id', match.id);
            localStorage.setItem('smartanchor_current_event_name', match.name);
            return;
          }
        }
        const liveEvent = events.find((e) => e.status === 'LIVE');
        const chosen = liveEvent || events[0];
        if (!resolvedEventId || !events.some((e) => e.id === resolvedEventId)) {
          setResolvedEventId(chosen.id);
          setResolvedEventName(chosen.name);
          localStorage.setItem('smartanchor_current_event_id', chosen.id);
          localStorage.setItem('smartanchor_current_event_name', chosen.name);
        }
      }
    }).catch(() => {});
  }, [eventId, resolvedEventId]);

  const navItems = [
    { icon: '▤', label: 'Events', id: 'events' },
    { icon: '🔴', label: 'Live Dashboard', id: 'dashboard' },
    { icon: '📋', label: 'Agenda', id: 'agenda' },
    { icon: '🎤', label: 'Speakers', id: 'speakers' },
    { icon: '📝', label: 'Scripts', id: 'scripts' },
    { icon: '⚡', label: 'Disruptions', id: 'disruptions' },
  ];

  async function handleNav(label) {
    if (label === 'Events') {
      nav('/');
      return;
    }

    let targetId = resolvedEventId || localStorage.getItem('smartanchor_current_event_id') || '';

    // If targetId is not yet available, dynamically fetch events immediately!
    if (!targetId) {
      try {
        const events = await getEvents();
        if (events && events.length > 0) {
          const live = events.find((e) => e.status === 'LIVE') || events[0];
          targetId = live.id;
          setResolvedEventId(live.id);
          setResolvedEventName(live.name);
          localStorage.setItem('smartanchor_current_event_id', live.id);
          localStorage.setItem('smartanchor_current_event_name', live.name);
        }
      } catch (err) {
        console.error('Failed to resolve event for navigation', err);
      }
    }

    if (!targetId) {
      alert('Please create an event first.');
      nav('/');
      return;
    }

    if (label === 'Live Dashboard' || label === 'Disruptions') {
      nav(`/live/${targetId}`);
    } else if (label === 'Agenda') {
      nav(`/setup/${targetId}?tab=agenda`);
    } else if (label === 'Speakers') {
      nav(`/setup/${targetId}?tab=speakers`);
    } else if (label === 'Scripts') {
      nav(`/setup/${targetId}?tab=scripts`);
    }
  }

  function isActive(item) {
    if (item.label === 'Events') {
      return loc.pathname === '/';
    }
    if (item.label === 'Live Dashboard' || item.label === 'Disruptions') {
      return loc.pathname.includes('/live');
    }
    if (item.label === 'Agenda') {
      return loc.pathname.includes('/setup') && (loc.search.includes('tab=agenda') || (!loc.search.includes('tab=speakers') && !loc.search.includes('tab=scripts')));
    }
    if (item.label === 'Speakers') {
      return loc.pathname.includes('/setup') && loc.search.includes('tab=speakers');
    }
    if (item.label === 'Scripts') {
      return loc.pathname.includes('/setup') && loc.search.includes('tab=scripts');
    }
    return false;
  }

  const activeEventId = resolvedEventId;
  const activeEventName = resolvedEventName;

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => nav('/')}>
          <div className="sidebar-logo-icon">🎙️</div>
          <div>
            <div className="sidebar-logo-text">AnchorX</div>
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
              onClick={() => handleNav(item.label)}
              id={`nav-${item.id}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
              {item.label === 'Live Dashboard' && isLive && (
                <span className="sidebar-badge" style={{ background: 'var(--success)' }}>ON</span>
              )}
            </button>
          ))}
        </nav>

        {/* Current Event Card */}
        {activeEventName && (
          <div
            className="sidebar-event-card"
            style={{ cursor: 'pointer' }}
            onClick={() => handleNav('Live Dashboard')}
            title="Open Live Dashboard"
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              {isLive ? '🔴 Live Event' : '📅 Current Event'}
            </div>
            <div className="sidebar-event-name">{activeEventName}</div>
            <div className="sidebar-event-meta">
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        )}

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">O</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Organizer</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admin</div>
          </div>
        </div>
      </aside>

      {/* ── Header ── */}
      <header className="header">
        {/* Global Website Search */}
        <GlobalSearch activeEventId={activeEventId} activeEventName={activeEventName} />

        <div className="header-right">
          {/* Event chip */}
          {activeEventName && (
            <div className="header-event-chip" onClick={() => handleNav('Live Dashboard')}>
              <span style={{ fontSize: 12 }}>{activeEventName.length > 20 ? activeEventName.slice(0, 20) + '…' : activeEventName}</span>
              {isLive && (
                <>
                  <div className="live-dot" />
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 11 }}>LIVE</span>
                </>
              )}
            </div>
          )}
          <LiveClock />
          <button
            className="header-icon-btn"
            id="header-notif-btn"
            onClick={() => alert('No new notifications')}
            title="Notifications"
          >
            🔔
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
