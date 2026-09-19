const TYPE_ICONS = {
  OPENING: '🎪', KEYNOTE: '🎤', PANEL: '👥',
  WORKSHOP: '🔧', BREAK: '☕', COMPETITION: '🏆', CLOSING: '🎯'
};

export default function UpNextCard({ session }) {
  if (!session) {
    return (
      <div className="glass-card" style={{ padding: '18px 22px', opacity: 0.6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Up Next
        </div>
        <p style={{ color: '#64748b', fontSize: 14 }}>No upcoming sessions</p>
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '18px 22px',
        border: '1px solid rgba(6,182,212,0.2)',
        position: 'relative', overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, borderRadius: '50%', background: 'rgba(6,182,212,0.05)', transform: 'translate(30%, -30%)', pointerEvents: 'none' }} />

      <div style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        ⏭ Up Next
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
            {TYPE_ICONS[session.type]} {session.title}
          </div>
          {session.speaker && (
            <div style={{ fontSize: 13, color: '#94a3b8' }}>{session.speaker.name}</div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#06b6d4', fontFamily: 'JetBrains Mono, monospace' }}>
            {new Date(session.scheduledStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 11, color: '#475569' }}>scheduled start</div>
        </div>
      </div>
    </div>
  );
}
