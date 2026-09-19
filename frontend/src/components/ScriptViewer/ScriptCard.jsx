import { useState } from 'react';

export default function ScriptCard({ scriptKey, script, loading, canGenerate, onGenerate, onSave }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [copied, setCopied] = useState(false);

  function startEdit() {
    setEditValue(script || '');
    setEditing(true);
  }

  function handleBlur() {
    setEditing(false);
    if (onSave && editValue !== script) {
      onSave(editValue);
    }
  }

  function handleCopy() {
    if (script) {
      navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 8, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, marginBottom: 6, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 6, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 6 }} />
        <div style={{ marginTop: 12, fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #6366f1', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          Generating script...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // No script yet
  if (!script) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 16px' }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>✨</div>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
          {canGenerate ? 'No script generated yet' : 'Add a speaker to generate an intro script'}
        </p>
        {canGenerate && (
          <button id={`generate-${scriptKey}-btn`} className="btn btn-primary" onClick={onGenerate} style={{ fontSize: 13 }}>
            ✨ Generate with AI
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="animate-slide-in">
      {/* Script content or editor */}
      {editing ? (
        <textarea
          id={`edit-script-${scriptKey}`}
          className="script-edit-area"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          autoFocus
          style={{ marginBottom: 12 }}
        />
      ) : (
        <div
          id={`script-text-${scriptKey}`}
          className="script-text"
          style={{ marginBottom: 12, cursor: 'text' }}
          onClick={startEdit}
          title="Click to edit"
        >
          {script}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          id={`copy-${scriptKey}-btn`}
          className="btn btn-secondary"
          onClick={handleCopy}
          style={{ fontSize: 12, padding: '7px 14px' }}
        >
          {copied ? '✅ Copied!' : '📋 Copy'}
        </button>
        <button
          id={`edit-${scriptKey}-btn`}
          className="btn btn-ghost"
          onClick={startEdit}
          style={{ fontSize: 12, padding: '7px 14px' }}
        >
          ✏️ Edit
        </button>
        <button
          id={`regen-${scriptKey}-btn`}
          className="btn btn-ghost"
          onClick={onGenerate}
          style={{ fontSize: 12, padding: '7px 14px' }}
        >
          🔄 Regenerate
        </button>
      </div>

      {editing && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#475569' }}>
          Click outside to save edits
        </div>
      )}
    </div>
  );
}
