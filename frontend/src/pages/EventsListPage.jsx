import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, createEvent, deleteEvent, updateEvent } from '../services/api';
import Layout from '../components/Layout';

const STATUS_MAP = {
  UPCOMING: { label: 'Upcoming', cls: 'badge-pending', icon: '📅' },
  LIVE: { label: 'Live', cls: 'badge-live', icon: '🔴' },
  COMPLETED: { label: 'Completed', cls: 'badge-completed', icon: '✅' },
};

export default function EventsListPage() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', theme: '', date: '', venue: '' });

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    try {
      const d = await getEvents();
      setEvents(d);
      if (d && d.length > 0) {
        localStorage.setItem('smartanchor_current_event_id', d[0].id);
        localStorage.setItem('smartanchor_current_event_name', d[0].name);
      }
    } catch {
      setError('Cannot connect to backend. Make sure it is running on :4000');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const event = await createEvent(form);
      nav(`/setup/${event.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event');
      setCreating(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteEvent(id);
    setEvents(p => p.filter(e => e.id !== id));
  }

  async function handleGoLive(id) {
    await updateEvent(id, { status: 'LIVE' });
    nav(`/live/${id}`);
  }

  const totalSessions = events.reduce((a, e) => a + (e._count?.sessions || 0), 0);
  const liveEvents = events.filter(e => e.status === 'LIVE').length;

  return (
    <Layout>
      {/* ── Events Hero Banner ── */}
      <div className="event-hero">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                🎙️ SMARTANCHOR CONTROL CENTER
              </div>
              {liveEvents > 0 && (
                <div style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(62,112,73,0.35)', border: '1px solid rgba(62,112,73,0.6)', fontSize: 11, fontWeight: 700, color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="live-dot" style={{ background: '#34d399' }} />{liveEvents} EVENT LIVE
                </div>
              )}
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 8, color: '#ffffff' }}>
              Events Management
            </h1>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.88)', maxWidth: 640, lineHeight: 1.6 }}>
              Sun-baked simplicity for seamless stage orchestration. Organize agendas, manage speakers, generate AI anchor scripts, and monitor live events in real time.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
            <button
              className="btn"
              id="new-event-btn"
              onClick={() => setShowForm(true)}
              style={{
                background: '#ffffff',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: 13,
                padding: '11px 22px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            >
              + New Event
            </button>
            {liveEvents > 0 && (
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(62,112,73,0.3)', border: '1px solid rgba(62,112,73,0.6)', color: '#a7f3d0' }}
                onClick={() => {
                  const live = events.find((e) => e.status === 'LIVE');
                  if (live) nav(`/live/${live.id}`);
                }}
              >
                🔴 Jump to Live Dashboard →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>📅</div>
          <div>
            <div className="stat-value">{events.length}</div>
            <div className="stat-label">Total Events</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>🔴</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{liveEvents}</div>
            <div className="stat-label">Live Now</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--bg-card-alt)', color: 'var(--text-secondary)' }}>📋</div>
          <div>
            <div className="stat-value">{totalSessions}</div>
            <div className="stat-label">Total Sessions</div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', border: '1px solid #fca5a5', color: 'var(--danger-text)', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="card animate-in">
          <div className="card-header">
            <span className="card-title">✨ Create New Event</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕ Cancel</button>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Event Name *</label>
                  <input id="event-name-input" className="form-input" placeholder="e.g. InnovateFest 2026" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Theme *</label>
                  <input id="event-theme-input" className="form-input" placeholder="e.g. Building the Future with AI" value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input id="event-date-input" className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Venue *</label>
                  <input id="event-venue-input" className="form-input" placeholder="e.g. Main Auditorium, IIT Gandhinagar" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} required />
                </div>
              </div>
              <button id="create-event-btn" className="btn btn-primary" type="submit" disabled={creating}>
                {creating ? '⏳ Creating...' : '✨ Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Events grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200 }} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎪</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No events yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>Create your first event to get started with AnchorX</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create First Event</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {events.map(event => {
            const st = STATUS_MAP[event.status] || STATUS_MAP.UPCOMING;
            return (
              <div key={event.id} className="card" style={{ overflow: 'hidden', transition: 'all 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
              >
                {/* Card top bar */}
                <div style={{ height: 4, background: event.status === 'LIVE' ? 'linear-gradient(90deg, var(--success), #4f8c5c)' : event.status === 'COMPLETED' ? 'var(--border-strong)' : 'linear-gradient(90deg, var(--primary), #d97706)' }} />
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span className={`badge ${st.cls}`}>{st.icon} {st.label}</span>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => handleDelete(event.id, event.name)} id={`delete-${event.id}`}>🗑️</button>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{event.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--primary-text)', fontWeight: 500, marginBottom: 12 }}>🎯 {event.theme}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      📅 {event.date && !isNaN(new Date(event.date).getTime()) ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBA'}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      📍 {event.venue}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                    <div style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card-alt)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {event._count?.sessions || 0} sessions
                    </div>
                    <div style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card-alt)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {event._count?.speakers || 0} speakers
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {event.status === 'LIVE' ? (
                      <button className="btn btn-success" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={() => nav(`/live/${event.id}`)} id={`live-${event.id}`}>
                        🔴 Open Dashboard
                      </button>
                    ) : (
                      <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={() => handleGoLive(event.id)} id={`golive-${event.id}`}>
                        ▶ Go Live
                      </button>
                    )}
                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={() => nav(`/setup/${event.id}`)} id={`setup-${event.id}`}>
                      ⚙️ Setup
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
