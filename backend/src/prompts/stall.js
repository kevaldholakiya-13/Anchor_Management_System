/**
 * Disruption / stall script prompt builder.
 * This is the DEMO MOMENT — generates an upbeat filler script the anchor reads
 * while a delayed session is being sorted out.
 */
function buildStallPrompt({ sessionTitle, minutesDelayed, nextTitle, nextSpeaker, reason }) {
  return `A live session at a college event is running late. Write a natural, upbeat filler script for the emcee to read to keep the audience engaged. Keep under 70 words, conversational tone, no heavy apologies, stay positive and energetic. Also write a brief updated transition line that the emcee can use when the delayed session finally wraps up. Return ONLY valid JSON with this exact shape: { "stallScript": "...", "updatedTransition": "..." }

Delayed session: ${sessionTitle}
Minutes delayed: ${minutesDelayed}
Next session: ${nextTitle}${nextSpeaker ? ` by ${nextSpeaker}` : ''}
Reason (if known): ${reason || 'not specified'}`;
}

const FALLBACK_STALL = {
  stallScript:
    "Hey everyone — we are just taking a very brief pause to get the next session set up perfectly for you. Good things are worth the wait, and trust me, what's coming next is absolutely worth it. Use these two minutes — stretch, grab some water, connect with the person next to you. We will be back in just a moment!",
  updatedTransition:
    "Alright, the wait is over — and it was absolutely worth it. Let's get right into our next session. Here we go!",
};

module.exports = { buildStallPrompt, FALLBACK_STALL };
