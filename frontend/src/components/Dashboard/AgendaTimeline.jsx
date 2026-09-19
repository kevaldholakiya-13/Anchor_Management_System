const STATUS_CONFIG = {
  PENDING:     { color: '#475569', bg: 'rgba(71,85,105,0.15)', dot: '#475569' },
  IN_PROGRESS: { color: '#818cf8', bg: 'rgba(99,102,241,0.15)', dot: '#6366f1' },
  COMPLETED:   { color: '#34d399', bg: 'rgba(16,185,129,0.1)', dot: '#10b981' },
  DELAYED:     { color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', dot: '#f59e0b' },
  CANCELLED:   { color: '#f87171', bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' },
};

const TYPE_ICONS = {
  OPENING: '🎪', KEYNOTE: '🎤', PANEL: '👥',
  WORKSHOP: '🔧', BREAK: '☕', COMPETITION: '🏆', CLOSING: '🎯'
};

function pad(n) { return String(n).padStart(2, '0'); }
function fmtTime(d) {
  const dt = new Date(d);
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export default function AgendaTimeline({ sessions = [], currentSessionId }) {
  return (
    <div className="glass-card" style={{ padding: '22px 20px', height: '100%', overflowY: 'auto' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 20 }}>
        📋 Today's Agenda
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sessions.map((s, i) => {
          const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.PENDING;
          const isCurrent = s.id === currentSessionId;
          const isLast = i === sessions.length - 1;

          return (
            <div key={s.id} style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 4 }}>
              {/* Timeline track */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 20 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                  background: cfg.dot,
                  boxShadow: isCurrent ? `0 0 10px ${cfg.dot}` : 'none',
                  zIndex: 1,
                  border: isCurrent ? `2px solid ${cfg.dot}` : 'none',
                  outline: isCurrent ? `3px solid ${cfg.bg}` : 'none',
                }} />
                {!isLast && (
                  <div style={{ width: 2, flex: 1, minHeight: 24, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 10,
                  marginBottom: isLast ? 0 : 8,
                  background: isCurrent ? cfg.bg : 'rgba(255,255,255,0.02)',
                  border: isCurrent ? `1px solid ${cfg.color}40` : '1px solid transparent',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: isCurrent ? 700 : 600,
                      color: isCurrent ? '#f1f5f9' : '#94a3b8',
                      marginBottom: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {TYPE_ICONS[s.type]} {s.title}
                    </div>
                    {s.speaker && (
                      <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>
                        {s.speaker.name}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: isCurrent ? cfg.color : '#475569', fontWeight: 600 }}>
                      {fmtTime(s.scheduledStart)}
                    </div>
                    <div style={{ fontSize: 11, color: '#334155' }}>–{fmtTime(s.scheduledEnd)}</div>
                  </div>
                </div>

                {s.status === 'DELAYED' && (
                  <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 4 }}>⏳ Delayed — schedule updated</div>
                )}
                {s.status === 'CANCELLED' && (
                  <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>✕ Cancelled</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
