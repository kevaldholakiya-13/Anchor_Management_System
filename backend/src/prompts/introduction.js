/**
 * Speaker introduction prompt builder.
 */
function buildIntroductionPrompt({ speakerName, topic, bio, achievement, sessionType }) {
  return `You are an emcee introducing a speaker at a college event. Write a warm, credible, 40-60 word introduction. Mention their achievement naturally within the flow, not as a list. End with a smooth handover line inviting them to the stage. Return ONLY valid JSON with this exact shape: { "script": "..." }

Speaker name: ${speakerName}
Topic they will speak on: ${topic}
Bio: ${bio}
Key achievement: ${achievement}
Session type: ${sessionType}`;
}

const FALLBACK_INTRO = {
  script:
    "Please put your hands together for our next speaker — someone whose work speaks for itself and whose insights are going to leave a mark on every person in this room. We are honored to have them here today. Let's welcome them to the stage!",
};

module.exports = { buildIntroductionPrompt, FALLBACK_INTRO };
