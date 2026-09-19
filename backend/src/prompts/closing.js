/**
 * Closing script prompt builder.
 */
function buildClosingPrompt({ eventName, sessionTitles, thanksTo }) {
  return `You are an emcee closing an event. Thank the speakers and audience warmly, reference 1-2 session highlights, keep it under 80 words, warm and uplifting tone. Return ONLY valid JSON with this exact shape: { "script": "..." }

Event name: ${eventName}
Sessions delivered today: ${sessionTitles.join(', ')}
People/sponsors to thank: ${thanksTo || 'the organizers, speakers, and audience'}`;
}

const FALLBACK_CLOSING = {
  script:
    "And that, everyone, is a wrap! What an incredible day — from the first session to this very moment, you have been an amazing audience. A huge thank you to our speakers for sharing their wisdom, and to every single one of you for being here. This is just the beginning. Go out there and build something extraordinary. Good night!",
};

module.exports = { buildClosingPrompt, FALLBACK_CLOSING };
