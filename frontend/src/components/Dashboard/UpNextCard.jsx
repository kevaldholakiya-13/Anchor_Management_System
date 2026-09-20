const TYPE_ICONS = {
  OPENING: '🎪', KEYNOTE: '🎤', PANEL: '👥',
  WORKSHOP: '🔧', BREAK: '☕', COMPETITION: '🏆', CLOSING: '🎯'
};

export default function UpNextCard({ session }) {
  if (!session) {
    return (
      <div className="card" style={{ padding: '20px 24px', opacity: 0.6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          Up Next
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>No upcoming sessions</p>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        padding: '20px 24px',
        border: '1px solid var(--border)',
        position: 'relative', overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRadius: '50%', background: 'var(--primary-light)', opacity: 0.5, transform: 'translate(30%, -30%)', pointerEvents: 'none' }} />

      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
        ⏭ Up Next
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
            {TYPE_ICONS[session.type]} {session.title}
          </div>
          {session.speaker && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{session.speaker.name}</div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
            {new Date(session.scheduledStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>scheduled start</div>
        </div>
      </div>
    </div>
  );
}
