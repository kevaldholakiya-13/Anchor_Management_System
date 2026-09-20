import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  getEvent, getEvents, updateEvent,
  addSession, deleteSession,
  addSpeaker, deleteSpeaker,
  generateScript
} from '../services/api';
import VoiceTransmissionControl from '../components/VoiceTransmissionControl';

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
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tabParam || 'agenda');
  const [generating, setGenerating] = useState({});

  useEffect(() => {
    if (tabParam && ['agenda', 'speakers', 'scripts'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  function handleTabSelect(tabId) {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  }

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
    if (id) {
      loadEvent();
    } else {
      getEvents().then((events) => {
        if (events && events.length > 0) {
          const live = events.find((e) => e.status === 'LIVE') || events[0];
          nav(`/setup/${live.id}${tabParam ? `?tab=${tabParam}` : ''}`, { replace: true });
        } else {
          nav('/', { replace: true });
        }
      }).catch(() => nav('/', { replace: true }));
    }
  }, [id, tabParam, nav]);

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
    if (!sessionForm.scheduledStart || !sessionForm.scheduledEnd) {
      flash('Please provide valid start and end dates/times', true);
      return;
    }
    const startDate = new Date(sessionForm.scheduledStart);
    const endDate = new Date(sessionForm.scheduledEnd);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      flash('Invalid date or time value', true);
      return;
    }
    if (endDate <= startDate) {
      flash('Session end time must be after start time', true);
      return;
    }
    try {
      const start = startDate.toISOString();
      const end = endDate.toISOString();
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
    <Layout eventId={id} eventName={event?.name} isLive={event?.status === 'LIVE'}>
      {/* ── Event Setup Hero ── */}
      <div className="event-hero">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, position: 'relative', zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => nav('/')}
                style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}
              >
                ← All Events
              </button>
              <div style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, color: '#ffffff' }}>
                ⚙️ EVENT SETUP & ORCHESTRATION
              </div>
              {event.status === 'LIVE' && (
                <div style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(62,112,73,0.3)', border: '1px solid rgba(62,112,73,0.5)', fontSize: 11, fontWeight: 700, color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="live-dot" style={{ background: '#34d399' }} />LIVE NOW
                </div>
              )}
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 8, color: '#ffffff' }}>
              {event.name}
            </h1>
            <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.88)', marginBottom: 18, lineHeight: 1.5 }}>
              🎯 {event.theme || 'Configure sessions, speakers, and AI stage scripts'}
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
              <span style={{ color: '#ffffff' }}>📅 {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span style={{ color: '#ffffff' }}>📍 {event.venue}</span>
              <span style={{ color: '#ffffff' }}>📋 {sessions.length} sessions</span>
              <span style={{ color: '#ffffff' }}>🎤 {speakers.length} speakers</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
            <button
              id="go-live-btn"
              className="btn"
              style={{
                background: '#ffffff',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: 13,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                padding: '11px 22px',
              }}
              onClick={handleGoLive}
            >
              🔴 {event.status === 'LIVE' ? 'Open Live Dashboard →' : 'Go Live →'}
            </button>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              {event.status === 'LIVE' ? 'Event is currently in progress' : 'Ready to start stage anchoring'}
            </span>
          </div>
        </div>
      </div>

        {/* Alerts */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 16, background: 'var(--danger-bg)', border: '1px solid rgba(163,56,32,0.3)', color: 'var(--danger-text)', fontSize: 13.5 }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 16, background: 'var(--success-bg)', border: '1px solid rgba(123,128,85,0.3)', color: 'var(--success-text)', fontSize: 13.5 }}>
            ✅ {success}
          </div>
        )}

        {/* Tabs: Sunken Niche (#EDE4D3) with Alabaster Active Tab */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--bg-card-alt)', padding: 4, borderRadius: 'var(--radius-sm)', width: 'fit-content', border: '1px solid var(--border)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => handleTabSelect(tab.id)}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: 'var(--font)',
                transition: 'all 0.15s ease',
                background: activeTab === tab.id ? '#faf6f0' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
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
            <div className="card" style={{ padding: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Add Session</h2>
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
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                Agenda ({sessions.length} sessions)
              </h2>
              {sessions.length === 0 ? (
                <div className="card" style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No sessions yet. Add your first session →
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sessions.map((s, i) => (
                    <div key={s.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{TYPE_ICONS[s.type]} {s.title}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
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
            <div className="card" style={{ padding: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Add Speaker</h2>
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
                  <textarea id="speaker-bio" className="form-textarea" placeholder="Background, current role, expertise..." value={speakerForm.bio} onChange={(e) => setSpeakerForm({ ...speakerForm, bio: e.target.value })} required style={{ minHeight: 85 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Key Achievement (for intro hook)</label>
                  <input id="speaker-achievement" className="form-input" placeholder="e.g. Forbes 30 Under 30, built X used by Y" value={speakerForm.achievements} onChange={(e) => setSpeakerForm({ ...speakerForm, achievements: e.target.value })} />
                </div>
                <button id="add-speaker-btn" className="btn btn-primary" type="submit">+ Add Speaker</button>
              </form>
            </div>

            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Speakers ({speakers.length})</h2>
              {speakers.length === 0 ? (
                <div className="card" style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No speakers yet. Add your first speaker →
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {speakers.map((sp) => (
                    <div key={sp.id} className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                        background: 'var(--primary-light)', border: '1px solid var(--primary-border)',
                        display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 700, color: 'var(--primary)'
                      }}>
                        {sp.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{sp.name}</div>
                          <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => handleDeleteSpeaker(sp.id)} title="Delete speaker">🗑️</button>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, marginBottom: 6 }}>🎯 {sp.topic}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: sp.achievements ? 6 : 10 }}>{sp.bio}</div>
                        {sp.achievements && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, background: 'var(--bg-card-alt)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                            🏆 {sp.achievements}
                          </div>
                        )}
                        <VoiceTransmissionControl
                          text={`${sp.name}. Speaking on topic: ${sp.topic}. ${sp.bio || ''}. ${sp.achievements ? 'Key background and achievements: ' + sp.achievements : ''}`}
                          id={`voice-sp-${sp.id}`}
                          compact
                          btnLabel="Narrate Speaker"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SCRIPTS TAB ── */}
        {activeTab === 'scripts' && (
          <div style={{ paddingBottom: 80 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
              Generate AI scripts grounded in your real event data. Scripts are saved and editable on the live dashboard.
            </p>
            <div style={{ display: 'grid', gap: 28 }}>
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
                <div key={s.id} style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                    {TYPE_ICONS[s.type]} {s.title} · {s.speaker?.name}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
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
    </Layout>
  );
}

function ScriptGenCard({ title, description, icon, script, generating, onGenerate, id }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="card" style={{ padding: '24px 26px 30px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{icon}</span>
            <span>{title}</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {script && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12 }}
              onClick={() => {
                navigator.clipboard.writeText(script);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? '✅ Copied' : '📋 Copy'}
            </button>
          )}
          <button id={id} className="btn btn-secondary btn-sm" onClick={onGenerate} disabled={generating}>
            {generating ? '⏳ Generating...' : script ? '🔄 Regenerate' : '✨ Generate'}
          </button>
        </div>
      </div>
      {script ? (
        <div>
          <div className="script-text" style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--text-primary)', marginBottom: 16 }}>
            {script}
          </div>
          <div style={{ marginTop: 14 }}>
            <VoiceTransmissionControl
              text={script}
              id={`voice-script-${id}`}
              title={title}
              btnLabel="Transmit Script"
            />
          </div>
        </div>
      ) : (
        <div style={{ padding: '24px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card-alt)', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
          Not generated yet — click generate to produce AI script
        </div>
      )}
    </div>
  );
}
