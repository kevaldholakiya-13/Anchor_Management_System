/**
 * Transition script prompt builder (between two sessions).
 */
function buildTransitionPrompt({ prevTitle, prevSpeaker, nextTitle, nextSpeaker, timeStatus }) {
  return `You are an emcee transitioning between two sessions at a college event. Reference the previous session briefly in one sentence and build excitement for the next. Keep under 60 words total. Return ONLY valid JSON with this exact shape: { "script": "..." }

Previous session: ${prevTitle}${prevSpeaker ? ` by ${prevSpeaker}` : ''}
Next session: ${nextTitle}${nextSpeaker ? ` by ${nextSpeaker}` : ''}
Time status: ${timeStatus}`;
}

const FALLBACK_TRANSITION = {
  script:
    "What a session that was! Give it up one more time. Now without further ado, we are moving straight into our next session — trust me, you do not want to miss this one. Let's go!",
};

module.exports = { buildTransitionPrompt, FALLBACK_TRANSITION };
