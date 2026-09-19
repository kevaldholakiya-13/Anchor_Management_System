const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');

/**
 * GET /api/live/:eventId/status
 * Returns: current session, next session, event meta, full ordered session list
 */
router.get('/:eventId/status', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { eventId: req.params.eventId },
      orderBy: { order: 'asc' },
      include: { speaker: true },
    });

    const now = new Date();

    const currentSession =
      sessions.find((s) => s.status === 'IN_PROGRESS') ||
      sessions.find((s) => s.status === 'DELAYED') ||
      sessions.find(
        (s) =>
          s.status === 'PENDING' &&
          new Date(s.scheduledStart) <= now &&
          new Date(s.scheduledEnd) >= now
      ) ||
      null;

    const currentIdx = currentSession ? sessions.findIndex((s) => s.id === currentSession.id) : -1;

    const nextSession =
      currentIdx >= 0
        ? sessions.slice(currentIdx + 1).find((s) => s.status === 'PENDING' || s.status === 'DELAYED') || null
        : sessions.find((s) => s.status === 'PENDING') || null;

    const meta = await prisma.eventMeta.findUnique({
      where: { eventId: req.params.eventId },
    });

    const event = await prisma.event.findUnique({
      where: { id: req.params.eventId },
    });

    res.json({
      event,
      currentSession,
      nextSession,
      sessions,
      meta,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
