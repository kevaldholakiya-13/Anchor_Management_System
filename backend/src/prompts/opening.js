/**
 * Opening script prompt builder.
 * Returns a full prompt string ready to send to the LLM.
 */
function buildOpeningPrompt({ eventName, theme, venue, sessionCount, highlightSession }) {
  return `You are an experienced event emcee writing a short, energetic opening script for a live college event. Keep it under 100 words, natural spoken tone, no stage directions. Return ONLY valid JSON with this exact shape: { "script": "..." }

Event name: ${eventName}
Theme: ${theme}
Venue: ${venue}
Number of sessions today: ${sessionCount}
Notable highlight: ${highlightSession || 'Multiple inspiring sessions planned'}`;
}

// Hardcoded fallback in case LLM fails — ensures demo never breaks
const FALLBACK_OPENING = {
  script:
    "Welcome everyone — what an incredible energy in the room today! You've gathered here for something special. Brilliant minds, bold ideas, and the kind of conversations that change things. Today we have an outstanding lineup of sessions ready to challenge, inspire, and move you. Let's make it count. Welcome to the show!",
};

module.exports = { buildOpeningPrompt, FALLBACK_OPENING };
