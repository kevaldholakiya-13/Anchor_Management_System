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
    <div className="card" style={{ padding: '24px 28px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16 }}>
        📝 Anchor Scripts
      </div>

      {/* Script type tabs */}
      <div className="tab-strip" style={{ marginBottom: 20 }}>
        {SCRIPT_TABS.map((tab) => (
          <button
            key={tab.key}
            id={`script-tab-${tab.key}`}
            className={`tab-btn ${activeScript === tab.key ? 'active' : ''}`}
            onClick={() => setActiveScript(tab.key)}
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
