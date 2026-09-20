// Voice Transmission Service using Web Speech Synthesis API
// Supports instant Male and Female voice generation for scripts and speaker profiles

class VoiceTransmissionService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.currentUtterance = null;
    this.activeId = null;
    this.activeGender = 'female';
    this.isSpeaking = false;
    this.isPaused = false;
    this.listeners = new Set();

    if (this.synth) {
      this.loadVoices();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices() || [];
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((l) =>
      l({
        activeId: this.activeId,
        activeGender: this.activeGender,
        isSpeaking: this.isSpeaking,
        isPaused: this.isPaused,
      })
    );
  }

  getVoiceForGender(gender = 'female') {
    if (!this.voices || this.voices.length === 0) {
      if (this.synth) this.voices = this.synth.getVoices() || [];
    }

    const englishVoices = this.voices.filter((v) => v.lang && v.lang.startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : this.voices;

    const femaleKeywords = ['female', 'zira', 'jenny', 'aria', 'samantha', 'victoria', 'karen', 'susan', 'fiona', 'veena', 'ananya', 'geeta', 'swara', 'priya', 'sangeeta', 'eva', 'serena'];
    const maleKeywords = ['male', 'david', 'mark', 'george', 'guy', 'alex', 'daniel', 'fred', 'oliver', 'rishi', 'prabhat', 'madhav', 'hemant', 'ravi'];

    const targetKeywords = gender === 'female' ? femaleKeywords : maleKeywords;
    const opponentKeywords = gender === 'female' ? maleKeywords : femaleKeywords;

    // 1. Direct keyword match
    let match = pool.find((v) => {
      const name = v.name.toLowerCase();
      return targetKeywords.some((k) => name.includes(k)) && !opponentKeywords.some((k) => name.includes(k));
    });

    // 2. Any keyword match
    if (!match) {
      match = pool.find((v) => {
        const name = v.name.toLowerCase();
        return targetKeywords.some((k) => name.includes(k));
      });
    }

    // 3. Fallback to first available English or default voice
    if (!match && pool.length > 0) {
      match = pool[0];
    }

    return match || null;
  }

  speak(text, { id = null, gender = 'female', onEnd = null } = {}) {
    if (!this.synth) {
      alert('Speech synthesis is not supported in this browser environment.');
      return;
    }

    // Clean text: strip markdown characters
    const cleanText = text
      .replace(/[*_#`]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .trim();

    if (!cleanText) return;

    this.stop();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const selectedVoice = this.getVoiceForGender(gender);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Adjust pitch & speech rate for realistic stagecraft resonance
    if (gender === 'female') {
      utterance.pitch = selectedVoice ? 1.05 : 1.18;
      utterance.rate = 0.96;
    } else {
      utterance.pitch = selectedVoice ? 0.92 : 0.82;
      utterance.rate = 0.94;
    }

    this.activeId = id;
    this.activeGender = gender;
    this.isSpeaking = true;
    this.isPaused = false;
    this.currentUtterance = utterance;
    this.notify();

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.activeId = null;
      this.currentUtterance = null;
      this.notify();
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error', e);
      this.isSpeaking = false;
      this.isPaused = false;
      this.activeId = null;
      this.currentUtterance = null;
      this.notify();
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.activeId = null;
    this.currentUtterance = null;
    this.notify();
  }

  pause() {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.notify();
    }
  }

  resume() {
    if (this.synth && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.notify();
    }
  }

  toggle(text, { id, gender = 'female' }) {
    if (this.isSpeaking && this.activeId === id) {
      this.stop();
    } else {
      this.speak(text, { id, gender });
    }
  }
}

export const voiceService = new VoiceTransmissionService();
export default voiceService;
