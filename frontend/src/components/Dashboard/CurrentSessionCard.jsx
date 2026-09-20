import { useState, useEffect } from 'react';

const STATUS_LABELS = {
  PENDING: { label: 'Pending', cls: 'badge-pending' },
  IN_PROGRESS: { label: 'In Progress', cls: 'badge-in-progress' },
  COMPLETED: { label: 'Completed', cls: 'badge-completed' },
  DELAYED: { label: 'Delayed', cls: 'badge-delayed' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-cancelled' },
};

const TYPE_ICONS = {
  OPENING: '🎪', KEYNOTE: '🎤', PANEL: '👥',
  WORKSHOP: '🔧', BREAK: '☕', COMPETITION: '🏆', CLOSING: '🎯'
};

function useCountdown(end) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!end) return;
    function calc() {
      const ms = new Date(end) - new Date();
      setRemaining(Math.max(0, Math.floor(ms / 1000)));
    }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [end]);

  const totalSeconds = remaining;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const isOverrun = new Date(end) < new Date();
  return { mins, secs, isOverrun, totalSeconds };
}

export default function CurrentSessionCard({ session, onStart, onComplete }) {
  const { mins, secs, isOverrun } = useCountdown(session?.scheduledEnd);
  const status = session ? STATUS_LABELS[session.status] || STATUS_LABELS.PENDING : null;

  if (!session) {
    return (
      <div className="card" style={{ padding: 36, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
        <p style={{ color: 'var(--text-muted)' }}>No active session</p>
      </div>
    );
  }

  const progressPct = (() => {
    const start = new Date(session.scheduledStart);
    const end = new Date(session.scheduledEnd);
    const now = new Date();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  })();

  return (
    <div
      className="card animate-slide-in"
      style={{
        padding: 28,
        border: `1px solid ${isOverrun ? 'rgba(140,60,60,0.4)' : 'var(--primary-border)'}`,
        boxShadow: 'var(--shadow-md)',
        position: 'relative', overflow: 'hidden'
      }}
    >
      {/* Background accent */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 180, height: 180, borderRadius: '50%',
        background: isOverrun ? 'rgba(140,60,60,0.06)' : 'rgba(194,101,42,0.06)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, position: 'relative' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            🔴 Currently On Stage
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em', marginBottom: 8 }}>
            {TYPE_ICONS[session.type]} {session.title}
          </h2>
          {session.speaker && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: 'var(--primary)'
              }}>
                {session.speaker.name[0]}
              </div>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{session.speaker.name}</span>
            </div>
          )}
        </div>
        <span className={`badge ${status.cls}`}>{status.label}</span>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 18 }}>
        <div className="progress-bar" style={{ marginBottom: 8 }}>
          <div
            className={`progress-fill ${isOverrun ? 'progress-fill-warning' : 'progress-fill-primary'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
          <span>{new Date(session.scheduledStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          <span style={{ color: isOverrun ? 'var(--danger-text)' : 'var(--text-primary)', fontWeight: 600 }}>
            {isOverrun ? `+${Math.abs(mins)}m overrun` : `${mins}m ${String(secs).padStart(2, '0')}s remaining`}
          </span>
          <span>{new Date(session.scheduledEnd).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Session controls */}
      <div style={{ display: 'flex', gap: 10 }}>
        {session.status === 'PENDING' && (
          <button id={`start-session-${session.id}`} className="btn btn-primary" onClick={onStart} style={{ fontSize: 13 }}>
            ▶ Start Session
          </button>
        )}
        {session.status === 'IN_PROGRESS' && (
          <button id={`complete-session-${session.id}`} className="btn btn-secondary" onClick={onComplete} style={{ fontSize: 13 }}>
            ✓ Mark Complete
          </button>
        )}
      </div>
    </div>
  );
}
