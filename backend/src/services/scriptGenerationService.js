/**
 * Script Generation Service
 * Generates all AI scripts grounded in real event/speaker data from DB.
 */
const prisma = require('../db/prisma');
const { generateJSON } = require('./llmClient');
const { buildOpeningPrompt, FALLBACK_OPENING } = require('../prompts/opening');
const { buildIntroductionPrompt, FALLBACK_INTRO } = require('../prompts/introduction');
const { buildTransitionPrompt, FALLBACK_TRANSITION } = require('../prompts/transition');
const { buildClosingPrompt, FALLBACK_CLOSING } = require('../prompts/closing');
const { buildStallPrompt, FALLBACK_STALL } = require('../prompts/stall');

/**
 * Safely call LLM with a fallback JSON object.
 */
async function safeGenerate(prompt, fallback) {
  try {
    const result = await generateJSON(prompt);
    return result;
  } catch (err) {
    console.error('[ScriptGen] LLM error, using fallback:', err.message);
    return fallback;
  }
}

/**
 * Generate opening script for an event. Saves to EventMeta.
 */
async function generateOpeningScript(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      sessions: { orderBy: { order: 'asc' } },
      meta: true,
    },
  });
  if (!event) throw new Error(`Event ${eventId} not found`);

  const highlightSession = event.sessions.find(
    (s) => s.type === 'KEYNOTE' || s.type === 'PANEL'
  );

  const prompt = buildOpeningPrompt({
    eventName: event.name,
    theme: event.theme,
    venue: event.venue,
    sessionCount: event.sessions.length,
    highlightSession: highlightSession?.title,
  });

  const { script } = await safeGenerate(prompt, FALLBACK_OPENING);

  await prisma.eventMeta.upsert({
    where: { eventId },
    create: { eventId, openingScript: script },
    update: { openingScript: script },
  });

  return script;
}

/**
 * Generate intro script for a session (grounded in speaker bio).
 */
async function generateIntroScript(sessionId) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { speaker: true },
  });
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const speaker = session.speaker;
  const prompt = buildIntroductionPrompt({
    speakerName: speaker?.name || 'our speaker',
    topic: session.title,
    bio: speaker?.bio || '',
    achievement: speaker?.achievements || '',
    sessionType: session.type,
  });

  const { script } = await safeGenerate(prompt, FALLBACK_INTRO);

  await prisma.session.update({
    where: { id: sessionId },
    data: { introScript: script },
  });

  return script;
}

/**
 * Generate transition script between two adjacent sessions.
 */
async function generateTransitionScript(sessionId) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { speaker: true, event: { include: { sessions: { orderBy: { order: 'asc' }, include: { speaker: true } } } } },
  });
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const sessions = session.event.sessions;
  const idx = sessions.findIndex((s) => s.id === sessionId);
  const prev = idx > 0 ? sessions[idx - 1] : null;

  const prompt = buildTransitionPrompt({
    prevTitle: prev?.title || 'the previous session',
    prevSpeaker: prev?.speaker?.name,
    nextTitle: session.title,
    nextSpeaker: session.speaker?.name,
    timeStatus: session.status === 'DELAYED' ? `running late` : 'on time',
  });

  const { script } = await safeGenerate(prompt, FALLBACK_TRANSITION);

  await prisma.session.update({
    where: { id: sessionId },
    data: { transitionScript: script },
  });

  return script;
}

/**
 * Generate closing script for an event.
 */
async function generateClosingScript(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { sessions: { orderBy: { order: 'asc' } }, meta: true },
  });
  if (!event) throw new Error(`Event ${eventId} not found`);

  const prompt = buildClosingPrompt({
    eventName: event.name,
    sessionTitles: event.sessions.map((s) => s.title),
    thanksTo: null,
  });

  const { script } = await safeGenerate(prompt, FALLBACK_CLOSING);

  await prisma.eventMeta.upsert({
    where: { eventId },
    create: { eventId, closingScript: script },
    update: { closingScript: script },
  });

  return script;
}

/**
 * Generate stall + updated transition script on disruption.
 * Returns { stallScript, updatedTransition }
 */
async function generateStallScript({ sessionId, minutesDelayed, reason }) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      speaker: true,
      event: {
        include: {
          sessions: { orderBy: { order: 'asc' }, include: { speaker: true } },
        },
      },
    },
  });
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const sessions = session.event.sessions;
  const idx = sessions.findIndex((s) => s.id === sessionId);
  const next = idx < sessions.length - 1 ? sessions[idx + 1] : null;

  const prompt = buildStallPrompt({
    sessionTitle: session.title,
    minutesDelayed,
    nextTitle: next?.title || 'the next session',
    nextSpeaker: next?.speaker?.name,
    reason,
  });

  const result = await safeGenerate(prompt, FALLBACK_STALL);
  const stallScript = result.stallScript;
  const updatedTransition = result.updatedTransition;

  // Save stall script to the delayed session
  await prisma.session.update({
    where: { id: sessionId },
    data: { stallScript },
  });

  // If there's a next session, save the updated transition there
  if (next) {
    await prisma.session.update({
      where: { id: next.id },
      data: { transitionScript: updatedTransition },
    });
  }

  return { stallScript, updatedTransition, nextSessionId: next?.id };
}

module.exports = {
  generateOpeningScript,
  generateIntroScript,
  generateTransitionScript,
  generateClosingScript,
  generateStallScript,
};
