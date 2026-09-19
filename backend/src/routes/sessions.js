const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');

// PUT /api/sessions/:id — edit session
router.put('/:id', async (req, res) => {
  const { title, type, speakerId, scheduledStart, scheduledEnd, status, introScript, transitionScript } = req.body;
  try {
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(type && { type }),
        ...(speakerId !== undefined && { speakerId: speakerId || null }),
        ...(scheduledStart && { scheduledStart: new Date(scheduledStart) }),
        ...(scheduledEnd && { scheduledEnd: new Date(scheduledEnd) }),
        ...(status && { status }),
        ...(introScript !== undefined && { introScript }),
        ...(transitionScript !== undefined && { transitionScript }),
      },
      include: { speaker: true },
    });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sessions/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.session.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/:id/start — mark session as in progress
router.post('/:id/start', async (req, res) => {
  try {
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS', actualStart: new Date() },
      include: { speaker: true },
    });

    // Broadcast via socket
    req.io.to(`event:${session.eventId}`).emit('session:update', {
      eventId: session.eventId,
      trigger: 'session_started',
      sessionId: session.id,
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/:id/complete — mark session as completed
router.post('/:id/complete', async (req, res) => {
  try {
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', actualEnd: new Date() },
      include: { speaker: true },
    });

    req.io.to(`event:${session.eventId}`).emit('session:update', {
      eventId: session.eventId,
      trigger: 'session_completed',
      sessionId: session.id,
    });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
