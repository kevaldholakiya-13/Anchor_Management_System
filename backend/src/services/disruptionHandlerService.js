/**
 * Disruption Handler Service — THE CORE DIFFERENTIATOR
 *
 * On a disruption (delay or cancellation):
 * 1. Marks session as DELAYED or CANCELLED
 * 2. Recalculates scheduledStart/End for ALL downstream sessions
 * 3. Immediately generates stall script (fast path, pushed via socket)
 * 4. Regenerates the next session's transition script (background, pushed when ready)
 * 5. Updates EventMeta with disruption log
 */
const prisma = require('../db/prisma');
const { generateStallScript, generateTransitionScript } = require('./scriptGenerationService');

/**
 * @param {object} params
 * @param {string} params.sessionId       - ID of the disrupted session
 * @param {'delay'|'cancellation'} params.type - Type of disruption
 * @param {number} [params.minutesDelayed] - For delays
 * @param {string} [params.reason]         - Optional reason text
 * @param {object} params.io               - Socket.io server instance
 */
async function handleDisruption({ sessionId, type, minutesDelayed = 0, reason, io }) {
  // 1. Load the session and all siblings (ordered)
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      event: {
        include: {
          sessions: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!session) throw new Error(`Session ${sessionId} not found`);
  const { eventId } = session;
  const allSessions = session.event.sessions;

  // 2. Mark the disrupted session
  const newStatus = type === 'cancellation' ? 'CANCELLED' : 'DELAYED';
  await prisma.session.update({
    where: { id: sessionId },
    data: { status: newStatus },
  });

  // 3. Recalculate downstream session times
  const sessionIdx = allSessions.findIndex((s) => s.id === sessionId);
  let accumulatedDelay = minutesDelayed; // minutes to shift

  const updatePromises = [];
  for (let i = sessionIdx + 1; i < allSessions.length; i++) {
    const s = allSessions[i];
    const newStart = new Date(new Date(s.scheduledStart).getTime() + accumulatedDelay * 60000);
    const newEnd = new Date(new Date(s.scheduledEnd).getTime() + accumulatedDelay * 60000);
    updatePromises.push(
      prisma.session.update({
        where: { id: s.id },
        data: { scheduledStart: newStart, scheduledEnd: newEnd },
      })
    );
  }
  await Promise.all(updatePromises);

  // 4. Update EventMeta disruption log
  await prisma.eventMeta.upsert({
    where: { eventId },
    create: {
      eventId,
      lastDisruptionType: type,
      lastDisruptionMinutes: minutesDelayed,
      lastDisruptionAt: new Date(),
    },
    update: {
      lastDisruptionType: type,
      lastDisruptionMinutes: minutesDelayed,
      lastDisruptionAt: new Date(),
    },
  });

  // 5. Push the updated schedule immediately via socket
  const updatedSessions = await prisma.session.findMany({
    where: { eventId },
    orderBy: { order: 'asc' },
    include: { speaker: true },
  });

  io.to(`event:${eventId}`).emit('session:update', {
    eventId,
    sessions: updatedSessions,
    disruption: {
      type,
      sessionId,
      sessionTitle: session.title,
      minutesDelayed,
    },
  });

  // 6. Fast path: generate announcement/stall script and push immediately
  try {
    const { stallScript, updatedTransition, nextSessionId } = await generateStallScript({
      sessionId,
      type,
      minutesDelayed,
      reason,
    });

    // Push stall script to anchor dashboard
    io.to(`event:${eventId}`).emit('script:ready', {
      sessionId,
      scriptType: 'stallScript',
      script: stallScript,
      minutesDelayed,
      type,
    });

    // Push updated transition for the next session
    if (nextSessionId && updatedTransition) {
      io.to(`event:${eventId}`).emit('script:ready', {
        sessionId: nextSessionId,
        scriptType: 'transitionScript',
        script: updatedTransition,
      });
    }
  } catch (err) {
    console.error('[DisruptionHandler] Stall script generation failed:', err.message);
  }

  return { success: true, sessionId, type, minutesDelayed, eventId };
}

module.exports = { handleDisruption };
