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

  return (
    <div
      id="disruption-banner"
      className="disruption-banner animate-slide-in"
      style={{ margin: '0 24px 0', borderRadius: 16, padding: '20px 24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🚨</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#f87171', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {disruption.type === 'delay' ? `Session Delayed +${disruption.minutesDelayed} min` : 'Session Cancelled'}
              </span>
            </div>
            <span style={{ fontSize: 12, color: '#f87171', background: 'rgba(239,68,68,0.15)', padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>
              {disruption.sessionTitle}
            </span>
          </div>

          {/* Stall Script */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              📢 Anchor Stall Script — Read This Now
            </div>
            {disruption.stallScript ? (
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                lineHeight: 1.8,
                color: '#fecaca',
                background: 'rgba(0,0,0,0.25)',
                padding: '14px 18px',
                borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.2)',
                whiteSpace: 'pre-wrap'
              }}>
                {disruption.stallScript}
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', borderRadius: 10,
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(239,68,68,0.15)'
              }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #f87171', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#f87171' }}>Generating stall script via AI...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
          </div>

          {disruption.stallScript && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                id="copy-stall-script-btn"
                className="btn"
                onClick={copyScript}
                style={{ fontSize: 12, padding: '7px 14px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', borderRadius: 8 }}
              >
                {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
              </button>
              <span style={{ fontSize: 12, color: '#ef4444', opacity: 0.7 }}>
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
