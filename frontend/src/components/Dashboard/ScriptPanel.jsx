import { useState } from 'react';
import ScriptCard from '../ScriptViewer/ScriptCard';

export default function ScriptPanel({ session, meta, getScript, scriptLoading, onGenerate, onSave, eventId }) {
  const [activeScript, setActiveScript] = useState('intro');

  const SCRIPT_TABS = [
    {
      key: 'intro',
      label: '🎤 Intro',
      script: getScript(session.id, 'introScript', session),
      loading: scriptLoading[`${session.id}-introScript`],
      canGenerate: !!session.speakerId,
    },
    {
      key: 'transition',
      label: '🔀 Transition',
      script: getScript(session.id, 'transitionScript', session),
      loading: scriptLoading[`${session.id}-transitionScript`],
      canGenerate: true,
    },
    {
      key: 'opening',
      label: '🎪 Opening',
      script: meta?.openingScript,
      loading: scriptLoading[`${eventId}-opening`],
      canGenerate: true,
    },
    {
      key: 'closing',
      label: '🎯 Closing',
      script: meta?.closingScript,
      loading: scriptLoading[`${eventId}-closing`],
      canGenerate: true,
    },
  ];

  const active = SCRIPT_TABS.find((t) => t.key === activeScript);

  function handleGenerate(key) {
    if (key === 'intro') onGenerate('intro', session.id);
    else if (key === 'transition') onGenerate('transition', session.id);
    else if (key === 'opening') onGenerate('opening', null);
    else if (key === 'closing') onGenerate('closing', null);
  }

  function handleSave(key, value) {
    if (key === 'intro') onSave('intro', session.id, value);
    else if (key === 'transition') onSave('transition', session.id, value);
    // opening/closing editing saved via api update on event meta (not implemented in V1 — defer)
  }

  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16 }}>
        📝 Anchor Scripts
      </div>

      {/* Script type tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {SCRIPT_TABS.map((tab) => (
          <button
            key={tab.key}
            id={`script-tab-${tab.key}`}
            onClick={() => setActiveScript(tab.key)}
            style={{
              padding: '7px 14px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              background: activeScript === tab.key ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
              color: activeScript === tab.key ? '#818cf8' : '#64748b',
              border: activeScript === tab.key ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Script content */}
      {active && (
        <ScriptCard
          key={active.key}
          scriptKey={active.key}
          script={active.script}
          loading={active.loading}
          canGenerate={active.canGenerate}
          onGenerate={() => handleGenerate(active.key)}
          onSave={(val) => handleSave(active.key, val)}
        />
      )}
    </div>
  );
}
