import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLiveStatus, getEvents, triggerDisruption, updateSession, generateScript, startSession, completeSession } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import Layout from '../components/Layout';
import VoiceTransmissionControl from '../components/VoiceTransmissionControl';

const TYPE_ICONS = { OPENING:'🎪',KEYNOTE:'🎤',PANEL:'👥',WORKSHOP:'🔧',BREAK:'☕',COMPETITION:'🏆',CLOSING:'🎯' };
const STATUS_CONFIG = {
  PENDING:     { dot:'#94a3b8', badge:'badge-pending',    label:'Upcoming' },
  IN_PROGRESS: { dot:'#6366f1', badge:'badge-in-progress',label:'In Progress' },
  COMPLETED:   { dot:'#10b981', badge:'badge-completed',  label:'Completed' },
  DELAYED:     { dot:'#f59e0b', badge:'badge-delayed',    label:'Delayed' },
  CANCELLED:   { dot:'#ef4444', badge:'badge-cancelled',  label:'Cancelled' },
};

function pad(n){ return String(n).padStart(2,'0'); }
function fmtTime(d){ if(!d) return '—'; const dt=new Date(d); return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`; }

function Countdown({ end }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    if (!end) return;
    const calc = () => {
      const ms = new Date(end).getTime() - Date.now();
      setDiff(Math.floor(ms / 1000));
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [end]);

  if (!end) return null;
  const over = diff < 0;
  const absSecs = Math.abs(diff);
  const mins = Math.floor(absSecs / 60);
  const secs = absSecs % 60;

  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        color: over ? 'var(--danger)' : 'var(--success)',
        fontSize: 15,
      }}
    >
      {over ? `+${mins}m ${pad(secs)}s overrun` : `${mins}m ${pad(secs)}s left`}
    </span>
  );
}

function ScriptBox({ script, loading, canGen, onGen, onSave, scriptKey }) {
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState('');
  const [copied,setCopied]=useState(false);

  if(loading) return <div style={{padding:16}}><div className="skeleton" style={{height:14,marginBottom:8}}/><div className="skeleton" style={{height:14,width:'70%',marginBottom:8}}/><div className="skeleton" style={{height:14,width:'50%'}}/><p style={{fontSize:12,color:'var(--text-muted)',marginTop:10,display:'flex',gap:6,alignItems:'center'}}><span style={{width:12,height:12,borderRadius:'50%',border:'2px solid var(--primary)',borderTopColor:'transparent',animation:'spin 0.8s linear infinite',display:'inline-block'}}/>Generating script...</p></div>;
  if(!script) return <div style={{padding:'32px 16px',textAlign:'center'}}><div style={{fontSize:32,marginBottom:10}}>✨</div><p style={{fontSize:13,color:'var(--text-muted)',marginBottom:14}}>{canGen?'No script yet — generate one now':'Add a speaker first'}</p>{canGen&&<button id={`gen-${scriptKey}`} className="btn btn-primary btn-sm" onClick={onGen}>✨ Generate with AI</button>}</div>;

  return (
    <div className="animate-fade">
      {editing
        ? <textarea id={`edit-${scriptKey}`} className="script-edit-area" value={val} onChange={e=>setVal(e.target.value)} onBlur={()=>{setEditing(false);onSave&&onSave(val);}} autoFocus style={{marginBottom:12,minHeight:110}} />
        : <div id={`script-${scriptKey}`} className="script-box" style={{marginBottom:12,cursor:'text'}} onClick={()=>{setVal(script);setEditing(true);}}>{script}</div>
      }
      <div style={{display:'flex',gap:8,marginBottom:script?10:0}}>
        <button id={`copy-${scriptKey}`} className="btn btn-ghost btn-sm" onClick={()=>{navigator.clipboard.writeText(script);setCopied(true);setTimeout(()=>setCopied(false),2000);}}>
          {copied?'✅ Copied':'📋 Copy'}
        </button>
        <button id={`edit-btn-${scriptKey}`} className="btn btn-ghost btn-sm" onClick={()=>{setVal(script);setEditing(true);}}>✏️ Edit</button>
        <button id={`regen-${scriptKey}`} className="btn btn-ghost btn-sm" onClick={onGen}>🔄 Regen</button>
      </div>
      {script && (
        <VoiceTransmissionControl
          text={script}
          id={`voice-live-${scriptKey}`}
          btnLabel="Transmit to Stage"
        />
      )}
    </div>
  );
}

export default function LiveDashboardPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disruption, setDisruption] = useState(null);
  const [scriptUpdates, setScriptUpdates] = useState({});
  const [scriptLoading, setScriptLoading] = useState({});
  const [activeScript, setActiveScript] = useState('intro');
  const [delayModal, setDelayModal] = useState(false);
  const [delayMins, setDelayMins] = useState(15);
  const [triggering, setTriggering] = useState(false);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!id) {
      getEvents().then((events) => {
        if (events && events.length > 0) {
          const live = events.find((e) => e.status === 'LIVE') || events[0];
          nav(`/live/${live.id}`, { replace: true });
        } else {
          nav('/', { replace: true });
        }
      }).catch(() => nav('/', { replace: true }));
    }
  }, [id, nav]);

  const load = useCallback(async () => {
    if (!id) return;
    try { const d = await getLiveStatus(id); setData(d); setLoading(false); } catch(e) { setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [id, load]);

  useSocket(id, {
    onSessionUpdate: (d) => { addActivity('📋','Schedule updated',d.disruption?.sessionTitle||''); load(); },
    onScriptReady: (d) => {
      const key = `${d.sessionId}-${d.scriptType}`;
      setScriptUpdates(p=>({...p,[key]:d.script}));
      setScriptLoading(p=>{const n={...p};delete n[key];return n;});
      if(d.scriptType==='stallScript') setDisruption(p=>p?{...p,stallScript:d.script}:null);
      addActivity('✨','Script generated',d.scriptType);
    },
  });

  function addActivity(icon, text, sub) {
    const ts = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    setActivities(p=>[{icon,text,sub,ts},...p].slice(0,8));
  }

  async function handleDisruption(type) {
    if(!data?.currentSession) return;
    setTriggering(true);
    const sessionId = data.currentSession.id;
    setScriptLoading(p=>({...p,[`${sessionId}-stallScript`]:true}));
    setDisruption({ type, minutesDelayed:type==='delay'?delayMins:0, sessionTitle:data.currentSession.title, stallScript:null });
    addActivity('🚨',`${type==='delay'?'Delay':'Cancellation'} triggered`,data.currentSession.title);
    try {
      await triggerDisruption({ sessionId, type, minutesDelayed:type==='delay'?delayMins:0 });
      setDelayModal(false); load();
    } catch(e){ console.error(e); }
    finally { setTriggering(false); }
  }

  async function handleGenScript(scriptType, sessionId) {
    const key=`${sessionId||id}-${scriptType}`;
    setScriptLoading(p=>({...p,[key]:true}));
    try {
      const r = await generateScript({ eventId:id, sessionId, scriptType });
      setScriptUpdates(p=>({...p,[key]:r.script}));
      addActivity('✨','Script generated',scriptType);
    } catch(e){ console.error(e); }
    finally { setScriptLoading(p=>{const n={...p};delete n[key];return n;}); }
  }

  async function handleSaveScript(scriptType, sessionId, val) {
    const field = scriptType==='intro'?'introScript':'transitionScript';
    await updateSession(sessionId,{[field]:val});
  }

  function getScript(sid, type, fallback) {
    const k=`${sid}-${type}`; if(scriptUpdates[k]) return scriptUpdates[k];
    if(type==='introScript') return fallback?.introScript;
    if(type==='transitionScript') return fallback?.transitionScript;
    return null;
  }

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:12}}>
      <div style={{width:40,height:40,borderRadius:'50%',border:'3px solid var(--primary)',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/>
      <p style={{color:'var(--text-muted)',fontSize:14}}>Connecting to live event...</p>
    </div>
  );

  const { event, currentSession:cur, nextSession:next, sessions=[], meta } = data||{};

  if(!event) return (
    <Layout>
      <div className="card" style={{ padding: 48, textAlign: 'center', maxWidth: 540, margin: '40px auto' }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🎙️</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Live Event Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 13.5, lineHeight: 1.6 }}>
          Could not locate this event's live stream. Please check your event list or select an active event to start anchoring.
        </p>
        <button className="btn btn-primary" onClick={() => nav('/')}>
          ← View All Events
        </button>
      </div>
    </Layout>
  );

  const completedCount = sessions.filter(s=>s.status==='COMPLETED').length;
  const totalCount = sessions.length;
  const speakerCount = [...new Set(sessions.filter(s=>s.speakerId).map(s=>s.speakerId))].length;

  const SCRIPT_TABS = [
    { key:'intro', label:'🎤 Intro', script:cur?getScript(cur.id,'introScript',cur):null, loading:cur&&scriptLoading[`${cur.id}-introScript`], canGen:!!cur?.speakerId, sessionId:cur?.id, scriptType:'intro' },
    { key:'transition', label:'🔀 Transition', script:cur?getScript(cur.id,'transitionScript',cur):null, loading:cur&&scriptLoading[`${cur.id}-transitionScript`], canGen:!!cur, sessionId:cur?.id, scriptType:'transition' },
    { key:'opening', label:'🎪 Opening', script:scriptUpdates[`${id}-opening`] || meta?.openingScript, loading:scriptLoading[`${id}-opening`], canGen:true, sessionId:null, scriptType:'opening' },
    { key:'closing', label:'🎯 Closing', script:scriptUpdates[`${id}-closing`] || meta?.closingScript, loading:scriptLoading[`${id}-closing`], canGen:true, sessionId:null, scriptType:'closing' },
  ];
  const activeTab = SCRIPT_TABS.find(t=>t.key===activeScript);

  const progressPct = cur ? (() => {
    const start = new Date(cur.scheduledStart).getTime();
    const end = new Date(cur.scheduledEnd).getTime();
    const now = Date.now();
    const total = end - start;
    if (isNaN(total) || total <= 0) return 0;
    const pct = ((now - start) / total) * 100;
    return isNaN(pct) ? 0 : Math.min(100, Math.max(0, pct));
  })() : 0;

  return (
    <Layout eventId={id} eventName={event?.name} isLive>
      {/* ── Event Hero ── */}
      <div className="event-hero">
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:24,position:'relative',zIndex:1}}>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <div style={{padding:'4px 12px',borderRadius:99,background:'rgba(255,255,255,0.18)',border:'1px solid rgba(255,255,255,0.3)',fontSize:11,fontWeight:700,color:'#ffffff',display:'flex',alignItems:'center',gap:6}}>
                <div className="live-dot" style={{background:'#ffffff'}}/>LIVE EVENT
              </div>
            </div>
            <h1 style={{fontSize:32,fontWeight:700,letterSpacing:'-0.015em',marginBottom:8,color:'#ffffff'}}>
              {event?.name || 'AnchorX Live Event'}
            </h1>
            <p style={{fontSize:14.5,color:'rgba(255,255,255,0.88)',marginBottom:18,lineHeight:1.5}}>
              🎯 {event?.theme || 'Real-time stage orchestration'}
            </p>
            <div style={{display:'flex',gap:24,flexWrap:'wrap',fontSize:13,color:'rgba(255,255,255,0.9)'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,color:'#ffffff'}}>
                📅 {new Date(event?.date||new Date()).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6,color:'#ffffff'}}>
                📍 {event?.venue || 'Main Stage'}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6,color:'#ffffff'}}>
                🎤 {event?.theme?.split(':')[0]||'Live Flow'}
              </div>
            </div>
          </div>
          {/* Quote */}
          <div style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:'var(--radius)',padding:'18px 22px',maxWidth:270,flexShrink:0}}>
            <p style={{fontSize:13.5,fontStyle:'italic',color:'rgba(250,246,240,0.95)',lineHeight:1.6,marginBottom:8}}>
              "Great events aren't just planned, they're orchestrated."
            </p>
            <p style={{fontSize:11,color:'rgba(250,246,240,0.65)',fontWeight:600}}>
              — AnchorX · Warm Editorial Stagecraft
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        {[
          { icon:'📋', label:'Total Sessions', value:totalCount, bg:'var(--primary-light)', color:'var(--primary)' },
          { icon:'✅', label:'Completed', value:completedCount, bg:'var(--success-bg)', color:'var(--success)' },
          { icon:'⏳', label:'Remaining', value:totalCount-completedCount, bg:'var(--warning-bg)', color:'var(--warning)' },
          { icon:'🎤', label:'Speakers', value:speakerCount, bg:'var(--bg-card-alt)', color:'var(--text-secondary)' },
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{background:s.bg}}>{s.icon}</div>
            <div>
              <div className="stat-value" style={{color:s.color}}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Disruption Banner ── */}
      {disruption && (
        <div className={`disruption-card animate-in ${disruption.type==='cancellation'?'critical':''}`}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <span style={{fontSize:18}}>🚨</span>
                <span style={{fontSize:14,fontWeight:800,color:disruption.type==='delay'?'var(--warning-text)':'var(--danger-text)'}}>
                  {disruption.type==='delay'?`Session Delayed +${disruption.minutesDelayed} min`:'Session Cancelled'}
                </span>
                <span style={{fontSize:12,background:'rgba(0,0,0,0.08)',padding:'2px 10px',borderRadius:99,fontWeight:600}}>{disruption.sessionTitle}</span>
              </div>
              <div style={{fontSize:12,fontWeight:700,color:'var(--warning-text)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>📢 Anchor Stall Script</div>
              {disruption.stallScript
                ? <div className="script-box" style={{borderLeftColor:'var(--warning)',background:'#fffbeb',marginBottom:10}}>{disruption.stallScript}</div>
                : <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',background:'rgba(0,0,0,0.06)',borderRadius:'var(--radius-sm)',marginBottom:10}}>
                    <div style={{width:16,height:16,borderRadius:'50%',border:'2px solid var(--warning)',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/>
                    <span style={{fontSize:13,color:'var(--warning-text)'}}>Generating stall script via Gemini AI...</span>
                  </div>
              }
              {disruption.stallScript && (
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:8}}>
                  <button id="copy-stall-btn" className="btn btn-ghost btn-sm" onClick={()=>navigator.clipboard.writeText(disruption.stallScript)}>📋 Copy Stall Script</button>
                  <VoiceTransmissionControl
                    id={`stall-${disruption.sessionTitle||'current'}`}
                    text={disruption.stallScript}
                    title="Anchor Disruption Stall Script"
                    compact={true}
                  />
                </div>
              )}
            </div>
            <button onClick={()=>setDisruption(null)} style={{background:'none',border:'none',fontSize:18,cursor:'pointer',color:'var(--text-muted)',flexShrink:0}} id="dismiss-disruption">✕</button>
          </div>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 320px',gap:16}}>
        {/* Current Session */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔴 Current Session</span>
            {cur && <span className={`badge ${STATUS_CONFIG[cur.status]?.badge||'badge-pending'}`}>{STATUS_CONFIG[cur.status]?.label}</span>}
          </div>
          <div className="card-body">
            {cur ? (
              <>
                {cur.speaker && (
                  <div style={{marginBottom:16,padding:'14px',background:'var(--bg-card-alt)',border:'1px solid var(--border)',borderRadius:'var(--radius)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:8}}>
                      <div style={{width:48,height:48,borderRadius:'var(--radius-sm)',background:'var(--primary-light)',border:'1px solid var(--primary-border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--primary)',flexShrink:0}}>
                        {cur.speaker.name[0]}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:700}}>{cur.speaker.name}</div>
                        <div style={{fontSize:12,color:'var(--text-muted)'}}>{cur.speaker.topic}</div>
                      </div>
                    </div>
                    {cur.speaker.bio && (
                      <p style={{fontSize:12.5,color:'var(--text-secondary)',lineHeight:1.5,marginBottom:10}}>
                        {cur.speaker.bio}
                      </p>
                    )}
                    <VoiceTransmissionControl
                      id={`live-speaker-${cur.speaker.id||cur.speaker.name}`}
                      text={`Speaker: ${cur.speaker.name}. Presentation: ${cur.speaker.topic || cur.title}. ${cur.speaker.bio || ''} ${cur.speaker.keyAchievements ? `Key achievements: ${cur.speaker.keyAchievements}` : ''}`}
                      title={`Speaker Brief: ${cur.speaker.name}`}
                      compact={true}
                    />
                  </div>
                )}
                <h3 style={{fontSize:18,fontWeight:700,marginBottom:6}}>{TYPE_ICONS[cur.type]} {cur.title}</h3>
                <div style={{fontSize:12.5,color:'var(--text-muted)',marginBottom:16}}>
                  {fmtTime(cur.scheduledStart)} – {fmtTime(cur.scheduledEnd)}
                </div>
                <div className="progress-bar" style={{marginBottom:8}}>
                  <div className={`progress-fill ${progressPct>90?'progress-fill-warning':'progress-fill-primary'}`} style={{width:`${progressPct}%`}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <span style={{fontSize:12,color:'var(--text-muted)'}}>{Math.round(progressPct)}% complete</span>
                  <Countdown end={cur.scheduledEnd}/>
                </div>
                <div style={{display:'flex',gap:8}}>
                  {cur.status==='PENDING'&&<button id={`start-${cur.id}`} className="btn btn-success btn-sm" onClick={()=>startSession(cur.id).then(load)}>▶ Start</button>}
                  {cur.status==='IN_PROGRESS'&&<button id={`complete-${cur.id}`} className="btn btn-secondary btn-sm" onClick={()=>completeSession(cur.id).then(load)}>✓ Complete</button>}
                </div>
              </>
            ) : (
              <div style={{textAlign:'center',padding:'32px 0',color:'var(--text-muted)'}}>
                <div style={{fontSize:36,marginBottom:8}}>📭</div>
                <p>No active session</p>
              </div>
            )}
          </div>
        </div>

        {/* Next Session + Disruption Controls */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">⏭ Next Session</span>
            </div>
            <div className="card-body">
              {next ? (
                <>
                  <h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>{TYPE_ICONS[next.type]} {next.title}</h3>
                  {next.speaker && (
                    <div style={{marginBottom:10}}>
                      <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:6}}>👤 {next.speaker.name}</p>
                      <VoiceTransmissionControl
                        id={`next-speaker-${next.speaker.id||next.speaker.name}`}
                        text={`Upcoming Speaker: ${next.speaker.name}. Presentation: ${next.speaker.topic || next.title}. ${next.speaker.bio || ''}`}
                        title={`Upcoming: ${next.speaker.name}`}
                        compact={true}
                      />
                    </div>
                  )}
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:12,color:'var(--text-muted)'}}>Scheduled</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:14,fontWeight:700,color:'var(--primary)'}}>{fmtTime(next.scheduledStart)}</span>
                  </div>
                </>
              ) : <p style={{color:'var(--text-muted)',fontSize:14}}>No upcoming sessions</p>}
            </div>
          </div>

          {/* Disruption Controls */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">⚡ Live Controls</span>
            </div>
            <div className="card-body-sm">
              {cur ? (
                <>
                  <p style={{fontSize:12.5,color:'var(--text-muted)',marginBottom:14}}>Trigger disruption handling for the current session</p>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <button id="trigger-delay-btn" className="btn btn-danger" style={{justifyContent:'center'}} onClick={()=>setDelayModal(true)} disabled={triggering}>
                      ⏳ Mark Session Delayed
                    </button>
                    <button id="trigger-cancel-btn" className="btn btn-ghost" style={{justifyContent:'center',borderColor:'var(--danger)',color:'var(--danger)'}} onClick={()=>handleDisruption('cancellation')} disabled={triggering}>
                      ✕ Cancel Session
                    </button>
                  </div>
                  {delayModal && (
                    <div style={{marginTop:14,padding:14,background:'var(--danger-bg)',borderRadius:'var(--radius-sm)',border:'1px solid rgba(163,56,32,0.25)'}}>
                      <p style={{fontSize:13,fontWeight:600,marginBottom:10,color:'var(--danger-text)'}}>How many minutes delayed?</p>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <input id="delay-minutes-input" type="number" min="1" max="60" value={delayMins} onChange={e=>setDelayMins(Number(e.target.value))} className="form-input" style={{width:80}}/>
                        <span style={{fontSize:12,color:'var(--text-secondary)'}}>minutes</span>
                        <button id="confirm-delay-btn" className="btn btn-danger btn-sm" onClick={()=>handleDisruption('delay')} disabled={triggering}>
                          {triggering?'⏳ Processing...':'🚨 Confirm'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setDelayModal(false)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </>
              ) : <p style={{color:'var(--text-muted)',fontSize:13}}>Start a session to enable disruption controls</p>}
            </div>
          </div>

          {/* Live Activity */}
          <div className="card" style={{flex:1}}>
            <div className="card-header">
              <span className="card-title">📡 Live Activity</span>
            </div>
            <div className="card-body-sm" style={{maxHeight:160,overflowY:'auto'}}>
              {activities.length===0 ? <p style={{fontSize:13,color:'var(--text-muted)'}}>Waiting for activity...</p>
              : activities.map((a,i)=>(
                <div key={i} className="activity-item">
                  <div className="activity-icon" style={{background:'var(--bg-base)'}}>{a.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:'var(--text-primary)'}}>{a.text}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)'}}>{a.sub} · {a.ts}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agenda Timeline */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Agenda</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>nav(`/setup/${id}`)}>Edit →</button>
          </div>
          <div style={{padding:'8px 16px',maxHeight:560,overflowY:'auto'}}>
            {sessions.map((s,i)=>{
              const cfg=STATUS_CONFIG[s.status]||STATUS_CONFIG.PENDING;
              const isCur=s.id===cur?.id;
              return (
                <div key={s.id} className={`timeline-row ${isCur?'active':''}`}>
                  <div className="timeline-time">{fmtTime(s.scheduledStart)}</div>
                  <div className="timeline-dot" style={{background:cfg.dot,boxShadow:isCur?`0 0 0 4px ${cfg.dot}22`:undefined}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:isCur?700:500,color:isCur?'var(--text-primary)':'var(--text-secondary)',lineHeight:1.3}}>{TYPE_ICONS[s.type]} {s.title}</div>
                    {s.speaker&&<div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{s.speaker.name}</div>}
                  </div>
                  <span className={`badge ${cfg.badge}`} style={{fontSize:10}}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── AI Scripts ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📝 AI Anchor Scripts</span>
          <div className="tab-strip">
            {SCRIPT_TABS.map(t=>(
              <button key={t.key} id={`script-tab-${t.key}`} className={`tab-btn ${activeScript===t.key?'active':''}`} onClick={()=>setActiveScript(t.key)}>{t.label}</button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{minHeight:160}}>
          {activeTab && (
            <ScriptBox
              key={activeTab.key}
              scriptKey={activeTab.key}
              script={activeTab.script}
              loading={activeTab.loading}
              canGen={activeTab.canGen}
              onGen={()=>handleGenScript(activeTab.scriptType, activeTab.sessionId)}
              onSave={activeTab.sessionId?(val=>handleSaveScript(activeTab.scriptType,activeTab.sessionId,val)):undefined}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
