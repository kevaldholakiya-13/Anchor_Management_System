import { useState, useEffect } from 'react';
import voiceService from '../services/voiceTransmission';

export default function VoiceTransmissionControl({
  text,
  id,
  title = '',
  compact = false,
  btnLabel = 'Transmit Voice',
}) {
  const [voiceState, setVoiceState] = useState({
    activeId: voiceService.activeId,
    activeGender: voiceService.activeGender,
    isSpeaking: voiceService.isSpeaking,
    isPaused: voiceService.isPaused,
  });

  const [gender, setGender] = useState('female');

  useEffect(() => {
    const unsub = voiceService.subscribe((state) => {
      setVoiceState({ ...state });
    });
    return unsub;
  }, []);

  const isCurrentActive = voiceState.isSpeaking && voiceState.activeId === id;

  function handleToggle() {
    if (isCurrentActive) {
      voiceService.stop();
    } else {
      if (!text) return;
      voiceService.speak(text, { id, gender });
    }
  }

  if (!text) return null;

  if (compact) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {/* Gender Toggle Pill */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-card-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '2px' }}>
          <button
            type="button"
            onClick={() => setGender('female')}
            title="Female Voice"
            style={{
              padding: '3px 7px',
              fontSize: 11,
              fontWeight: 600,
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              background: gender === 'female' ? '#faf6f0' : 'transparent',
              color: gender === 'female' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: gender === 'female' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            👩 Female
          </button>
          <button
            type="button"
            onClick={() => setGender('male')}
            title="Male Voice"
            style={{
              padding: '3px 7px',
              fontSize: 11,
              fontWeight: 600,
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              background: gender === 'male' ? '#faf6f0' : 'transparent',
              color: gender === 'male' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: gender === 'male' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            👨 Male
          </button>
        </div>

        {/* Speak / Stop Button */}
        <button
          type="button"
          className={`btn btn-sm ${isCurrentActive ? 'btn-danger' : 'btn-secondary'}`}
          onClick={handleToggle}
          title={isCurrentActive ? 'Stop Voice Transmission' : `Speak aloud (${gender === 'female' ? 'Female' : 'Male'} Voice)`}
          style={{ padding: '4px 10px', fontSize: 11.5 }}
        >
          {isCurrentActive ? (
            <>
              <span className="live-dot" style={{ background: '#fff' }} />
              ⏹ Stop
            </>
          ) : (
            <>🔊 {btnLabel}</>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        background: isCurrentActive ? '#fff1e9' : 'var(--bg-card-alt)',
        border: `1px solid ${isCurrentActive ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        transition: 'all var(--transition)',
        marginTop: 12,
        marginBottom: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        {/* Animated wave or icon */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {isCurrentActive ? (
            <div className="audio-wave-anim" title="Transmitting Audio Aloud">
              <span className="audio-bar" />
              <span className="audio-bar" />
              <span className="audio-bar" />
              <span className="audio-bar" />
              <span className="audio-bar" />
            </div>
          ) : (
            <span style={{ fontSize: 16 }}>🔊</span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Voice Transmission</span>
            {isCurrentActive && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--radius-pill)', background: 'var(--primary)', color: '#fff', fontWeight: 700, letterSpacing: '0.04em' }}>
                LIVE AUDIO · {voiceState.activeGender.toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isCurrentActive ? 'Transmitting narration through stage speakers...' : 'Audible stagecraft narration (Male & Female voices)'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Gender Toggle */}
        <div style={{ display: 'flex', background: '#faf6f0', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '2px' }}>
          <button
            type="button"
            onClick={() => {
              setGender('female');
              if (isCurrentActive) voiceService.speak(text, { id, gender: 'female' });
            }}
            style={{
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 600,
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              background: gender === 'female' ? 'var(--primary)' : 'transparent',
              color: gender === 'female' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all var(--transition)',
            }}
          >
            👩 Female Voice
          </button>
          <button
            type="button"
            onClick={() => {
              setGender('male');
              if (isCurrentActive) voiceService.speak(text, { id, gender: 'male' });
            }}
            style={{
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 600,
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              background: gender === 'male' ? 'var(--primary)' : 'transparent',
              color: gender === 'male' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all var(--transition)',
            }}
          >
            👨 Male Voice
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          id={`voice-btn-${id}`}
          className={`btn btn-sm ${isCurrentActive ? 'btn-danger' : 'btn-primary'}`}
          onClick={handleToggle}
          style={{ padding: '6px 14px', fontSize: 12 }}
        >
          {isCurrentActive ? (
            <>
              <span className="live-dot" style={{ background: '#fff' }} />
              ⏹ Stop Voice
            </>
          ) : (
            <>▶ {btnLabel}</>
          )}
        </button>
      </div>
    </div>
  );
}
