import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getEvent, updateEvent,
  addSession, deleteSession,
  addSpeaker, deleteSpeaker,
  generateScript
} from '../services/api';

const SESSION_TYPES = ['OPENING', 'KEYNOTE', 'PANEL', 'WORKSHOP', 'BREAK', 'COMPETITION', 'CLOSING'];

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

export default function SetupPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('agenda');
  const [generating, setGenerating] = useState({});

  // Session form
  const [sessionForm, setSessionForm] = useState({
    title: '', type: 'KEYNOTE', speakerId: '', scheduledStart: '', scheduledEnd: ''
  });

  // Speaker form
  const [speakerForm, setSpeakerForm] = useState({
    name: '', bio: '', topic: '', achievements: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (id) loadEvent();
  }, [id]);

  async function loadEvent() {
    try {
      const data = await getEvent(id);
      setEvent(data);
    } catch {
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  }

  function flash(msg, isError = false) {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  }

  async function handleAddSession(e) {
    e.preventDefault();
    try {
      // Convert local datetime to ISO
      const start = new Date(sessionForm.scheduledStart).toISOString();
      const end = new Date(sessionForm.scheduledEnd).toISOString();
      await addSession(id, { ...sessionForm, scheduledStart: start, scheduledEnd: end, speakerId: sessionForm.speakerId || null });
      setSessionForm({ title: '', type: 'KEYNOTE', speakerId: '', scheduledStart: '', scheduledEnd: '' });
      flash('Session added!');
      loadEvent();
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to add session', true);
    }
  }

  async function handleAddSpeaker(e) {
    e.preventDefault();
    try {
      await addSpeaker(id, speakerForm);
      setSpeakerForm({ name: '', bio: '', topic: '', achievements: '' });
      flash('Speaker added!');
      loadEvent();
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to add speaker', true);
    }
  }

  async function handleDeleteSession(sessionId) {
    if (!confirm('Delete this session?')) return;
    await deleteSession(sessionId);
    loadEvent();
  }

  async function handleDeleteSpeaker(speakerId) {
    if (!confirm('Delete this speaker?')) return;
    await deleteSpeaker(speakerId);
    loadEvent();
  }

  async function handleGenerate(scriptType, sessionId = null) {
    const key = `${scriptType}-${sessionId || 'event'}`;
    setGenerating((p) => ({ ...p, [key]: true }));
    try {
      await generateScript({ eventId: id, sessionId, scriptType });
      flash(`${scriptType} script generated!`);
      loadEvent();
    } catch (err) {
      flash(err.response?.data?.error || 'Generation failed', true);
    } finally {
      setGenerating((p) => ({ ...p, [key]: false }));
    }
  }

  async function handleGoLive() {
    await updateEvent(id, { status: 'LIVE' });
    nav(`/live/${id}`);
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚙️</div>
        <p style={{ color: '#94a3b8' }}>Loading event...</p>
      </div>
    </div>
  );

  if (!event) return null;

  const sessions = event.sessions || [];
  const speakers = event.speakers || [];

  const TABS = [
    { id: 'agenda', label: '📋 Agenda', count: sessions.length },
    { id: 'speakers', label: '🎤 Speakers', count: speakers.length },
    { id: 'scripts', label: '📝 Scripts', count: null },
  ];

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button className="btn btn-ghost" onClick={() => nav('/')} style={{ padding: '8px 14px', fontSize: 13 }}>
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>{event.name}</h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>📍 {event.venue} · {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <button
            id="go-live-btn"
            className="btn btn-primary"
            onClick={handleGoLive}
          >
            🔴 Go Live →
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: 14 }}>
            ✅ {success}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 20px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#94a3b8',
              }}
            >
              {tab.label} {tab.count !== null && <span style={{ opacity: 0.7, fontWeight: 400 }}>({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* ── AGENDA TAB ── */}
        {activeTab === 'agenda' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
            {/* Add session form */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Add Session</h2>
              <form onSubmit={handleAddSession} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input id="session-title" className="form-input" placeholder="e.g. AI in Healthcare" value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select id="session-type" className="form-select form-input" value={sessionForm.type} onChange={(e) => setSessionForm({ ...sessionForm, type: e.target.value })}>
                    {SESSION_TYPES.map((t) => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Speaker (optional)</label>
                  <select id="session-speaker" className="form-select form-input" value={sessionForm.speakerId} onChange={(e) => setSessionForm({ ...sessionForm, speakerId: e.target.value })}>
                    <option value="">— No speaker —</option>
                    {speakers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Start *</label>
                    <input id="session-start" className="form-input" type="datetime-local" value={sessionForm.scheduledStart} onChange={(e) => setSessionForm({ ...sessionForm, scheduledStart: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End *</label>
                    <input id="session-end" className="form-input" type="datetime-local" value={sessionForm.scheduledEnd} onChange={(e) => setSessionForm({ ...sessionForm, scheduledEnd: e.target.value })} required />
                  </div>
                </div>
                <button id="add-session-btn" className="btn btn-primary" type="submit">+ Add Session</button>
              </form>
            </div>

            {/* Session list */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                Agenda ({sessions.length} sessions)
              </h2>
              {sessions.length === 0 ? (
                <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                  No sessions yet. Add your first session →
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sessions.map((s, i) => (
                    <div key={s.id} className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#818cf8', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{TYPE_ICONS[s.type]} {s.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {fmtTime(s.scheduledStart)} – {fmtTime(s.scheduledEnd)}
                          {s.speaker && ` · ${s.speaker.name}`}
                        </div>
                      </div>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => handleDeleteSession(s.id)}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SPEAKERS TAB ── */}
        {activeTab === 'speakers' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Add Speaker</h2>
              <form onSubmit={handleAddSpeaker} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input id="speaker-name" className="form-input" placeholder="Dr. Priya Menon" value={speakerForm.name} onChange={(e) => setSpeakerForm({ ...speakerForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Topic *</label>
                  <input id="speaker-topic" className="form-input" placeholder="What will they speak about?" value={speakerForm.topic} onChange={(e) => setSpeakerForm({ ...speakerForm, topic: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Bio * (used for AI intro scripts)</label>
                  <textarea id="speaker-bio" className="form-textarea" placeholder="Background, current role, expertise..." value={speakerForm.bio} onChange={(e) => setSpeakerForm({ ...speakerForm, bio: e.target.value })} required style={{ minHeight: 80 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Key Achievement (for intro hook)</label>
                  <input id="speaker-achievement" className="form-input" placeholder="e.g. Forbes 30 Under 30, built X used by Y" value={speakerForm.achievements} onChange={(e) => setSpeakerForm({ ...speakerForm, achievements: e.target.value })} />
                </div>
                <button id="add-speaker-btn" className="btn btn-primary" type="submit">+ Add Speaker</button>
              </form>
            </div>

            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Speakers ({speakers.length})</h2>
              {speakers.length === 0 ? (
                <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                  No speakers yet. Add your first speaker →
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {speakers.map((sp) => (
                    <div key={sp.id} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 700, color: '#fff'
                      }}>
                        {sp.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{sp.name}</div>
                        <div style={{ fontSize: 12, color: '#6366f1', marginBottom: 4 }}>{sp.topic}</div>
                        <div style={{ fontSize: 12, color: '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sp.bio}</div>
                      </div>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => handleDeleteSpeaker(sp.id)}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SCRIPTS TAB ── */}
        {activeTab === 'scripts' && (
          <div>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
              Generate AI scripts grounded in your real event data. Scripts are saved and editable on the live dashboard.
            </p>
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Opening */}
              <ScriptGenCard
                title="Opening Script"
                description="Energy-setting welcome for the entire event"
                icon="🎪"
                script={event.meta?.openingScript}
                generating={generating['opening-event']}
                onGenerate={() => handleGenerate('opening', null)}
                id="gen-opening"
              />
              {/* Closing */}
              <ScriptGenCard
                title="Closing Script"
                description="Warm, memorable event close referencing highlights"
                icon="🎯"
                script={event.meta?.closingScript}
                generating={generating['closing-event']}
                onGenerate={() => handleGenerate('closing', null)}
                id="gen-closing"
              />
              {/* Per-session scripts */}
              {sessions.filter((s) => s.speakerId).map((s) => (
                <div key={s.id}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                    {TYPE_ICONS[s.type]} {s.title} · {s.speaker?.name}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <ScriptGenCard
                      title="Introduction Script"
                      description={`Introduce ${s.speaker?.name} to the stage`}
                      icon="🎤"
                      script={s.introScript}
                      generating={generating[`intro-${s.id}`]}
                      onGenerate={() => handleGenerate('intro', s.id)}
                      id={`gen-intro-${s.id}`}
                    />
                    <ScriptGenCard
                      title="Transition Script"
                      description="Bridge from previous session to this one"
                      icon="🔀"
                      script={s.transitionScript}
                      generating={generating[`transition-${s.id}`]}
                      onGenerate={() => handleGenerate('transition', s.id)}
                      id={`gen-transition-${s.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScriptGenCard({ title, description, icon, script, generating, onGenerate, id }) {
  return (
    <div className="glass-card script-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{icon} {title}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{description}</div>
        </div>
        <button id={id} className="btn btn-secondary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={onGenerate} disabled={generating}>
          {generating ? '⏳ Generating...' : script ? '🔄 Regenerate' : '✨ Generate'}
        </button>
      </div>
      {script ? (
        <div className="script-text" style={{ maxHeight: 100, overflow: 'hidden', maskImage: 'linear-gradient(to bottom, black 60%, transparent)' }}>
          {script}
        </div>
      ) : (
        <div style={{ padding: '16px', borderRadius: 8, background: 'rgba(0,0,0,0.15)', color: '#475569', fontSize: 13, textAlign: 'center' }}>
          Not generated yet
        </div>
      )}
    </div>
  );
}
