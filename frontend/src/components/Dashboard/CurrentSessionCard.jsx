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
      <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
        <p style={{ color: '#64748b' }}>No active session</p>
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
      className="glass-card animate-slide-in"
      style={{
        padding: 28,
        border: `1px solid ${isOverrun ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.3)'}`,
        boxShadow: isOverrun
          ? '0 0 32px rgba(239,68,68,0.15)'
          : '0 0 32px rgba(99,102,241,0.12)',
        position: 'relative', overflow: 'hidden'
      }}
    >
      {/* Background accent */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 180, height: 180, borderRadius: '50%',
        background: isOverrun ? 'rgba(239,68,68,0.06)' : 'rgba(99,102,241,0.08)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, position: 'relative' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            🔴 Currently On Stage
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.01em', marginBottom: 8 }}>
            {TYPE_ICONS[session.type]} {session.title}
          </h2>
          {session.speaker && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff'
              }}>
                {session.speaker.name[0]}
              </div>
              <span style={{ fontSize: 14, color: '#94a3b8' }}>{session.speaker.name}</span>
            </div>
          )}
        </div>
        <span className={`badge ${status.cls}`}>{status.label}</span>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            width: `${progressPct}%`,
            background: isOverrun
              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
              : 'linear-gradient(90deg, #6366f1, #06b6d4)',
            transition: 'width 1s linear'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
          <span>{new Date(session.scheduledStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          <span style={{ color: isOverrun ? '#f87171' : '#94a3b8', fontWeight: 600 }}>
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
