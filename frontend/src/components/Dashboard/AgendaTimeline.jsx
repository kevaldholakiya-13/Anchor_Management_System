const STATUS_CONFIG = {
  PENDING:     { color: 'var(--text-muted)', bg: '#f7f1e7', dot: '#9c8e84' },
  IN_PROGRESS: { color: 'var(--primary)', bg: '#faeee5', dot: '#c2652a' },
  COMPLETED:   { color: 'var(--success)', bg: '#edf5ef', dot: '#3e7049' },
  DELAYED:     { color: 'var(--warning)', bg: '#fdf4ea', dot: '#b8681d' },
  CANCELLED:   { color: 'var(--danger)', bg: '#faebeb', dot: '#8c3c3c' },
};

const TYPE_ICONS = {
  OPENING: '🎪', KEYNOTE: '🎤', PANEL: '👥',
  WORKSHOP: '🔧', BREAK: '☕', COMPETITION: '🏆', CLOSING: '🎯'
};

function pad(n) { return String(n).padStart(2, '0'); }
function fmtTime(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export default function AgendaTimeline({ sessions = [], currentSessionId }) {
  return (
    <div className="card" style={{ padding: '24px 22px', height: '100%', overflowY: 'auto' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 20 }}>
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
                  boxShadow: isCurrent ? `0 0 8px ${cfg.dot}` : 'none',
                  zIndex: 1,
                  border: isCurrent ? `2px solid #ffffff` : 'none',
                  outline: isCurrent ? `2px solid ${cfg.dot}` : 'none',
                }} />
                {!isLast && (
                  <div style={{ width: 2, flex: 1, minHeight: 24, background: 'var(--border)', margin: '4px 0' }} />
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: isLast ? 0 : 8,
                  background: isCurrent ? cfg.bg : 'var(--bg-surface-low)',
                  border: isCurrent ? `1px solid var(--primary-border)` : '1px solid var(--border)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13.5, fontWeight: isCurrent ? 700 : 600,
                      color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                      marginBottom: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {TYPE_ICONS[s.type]} {s.title}
                    </div>
                    {s.speaker && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 4 }}>
                        {s.speaker.name}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: isCurrent ? cfg.color : 'var(--text-muted)', fontWeight: 600 }}>
                      {fmtTime(s.scheduledStart)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>–{fmtTime(s.scheduledEnd)}</div>
                  </div>
                </div>

                {s.status === 'DELAYED' && (
                  <div style={{ fontSize: 11, color: 'var(--warning-text)', marginTop: 4 }}>⏳ Delayed — schedule updated</div>
                )}
                {s.status === 'CANCELLED' && (
                  <div style={{ fontSize: 11, color: 'var(--danger-text)', marginTop: 4 }}>✕ Cancelled</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
