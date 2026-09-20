import { useState } from 'react';

export default function DisruptionBanner({ disruption, onDismiss }) {
  const [copied, setCopied] = useState(false);

  function copyScript() {
    if (disruption?.stallScript) {
      navigator.clipboard.writeText(disruption.stallScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isCancel = disruption.type === 'cancellation';
  const accentColor = isCancel ? 'var(--danger-text)' : 'var(--warning-text)';
  const badgeBg = isCancel ? 'var(--danger-bg)' : 'var(--warning-bg)';

  return (
    <div
      id="disruption-banner"
      className={`disruption-banner animate-slide-in ${isCancel ? 'critical' : ''}`}
      style={{ margin: '0 24px 0', borderRadius: 'var(--radius)', padding: '22px 26px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🚨</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: accentColor, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {disruption.type === 'delay' ? `Session Delayed +${disruption.minutesDelayed} min` : 'Session Cancelled'}
              </span>
            </div>
            <span style={{ fontSize: 12, color: accentColor, background: badgeBg, border: `1px solid ${accentColor}30`, padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>
              {disruption.sessionTitle}
            </span>
          </div>

          {/* Stall Script */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: accentColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              📢 Anchor Stall Script — Read This Now
            </div>
            {disruption.stallScript ? (
              <div style={{
                fontFamily: 'var(--font)',
                fontSize: 13.5,
                lineHeight: 1.8,
                color: 'var(--text-primary)',
                background: '#ffffff',
                padding: '16px 20px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${isCancel ? 'rgba(140,60,60,0.3)' : 'var(--primary-border)'}`,
                borderLeft: `3px solid ${accentColor}`,
                whiteSpace: 'pre-wrap'
              }}>
                {disruption.stallScript}
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px 20px', borderRadius: 'var(--radius-sm)',
                background: '#ffffff', border: `1px solid ${accentColor}30`
              }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${accentColor}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: accentColor }}>Generating stall script via AI...</span>
              </div>
            )}
          </div>

          {disruption.stallScript && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                id="copy-stall-script-btn"
                className="btn btn-secondary btn-sm"
                onClick={copyScript}
              >
                {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
              </button>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Schedule auto-updated · downstream sessions shifted
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, padding: 4, flexShrink: 0, lineHeight: 1 }}
          id="dismiss-disruption-btn"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
