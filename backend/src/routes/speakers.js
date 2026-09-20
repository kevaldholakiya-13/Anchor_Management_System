const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');

// GET /api/speakers/:eventId — list speakers for an event
router.get('/:eventId', async (req, res) => {
  try {
    const speakers = await prisma.speaker.findMany({
      where: { eventId: req.params.eventId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(speakers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/speakers/:id — edit speaker
router.put('/:id', async (req, res) => {
  const { name, bio, topic, achievements, photoUrl } = req.body;
  try {
    const speaker = await prisma.speaker.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(bio && { bio }),
        ...(topic && { topic }),
        ...(achievements !== undefined && { achievements }),
        ...(photoUrl !== undefined && { photoUrl }),
      },
    });
    res.json(speaker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/speakers/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.session.updateMany({
        where: { speakerId: req.params.id },
        data: { speakerId: null },
      }),
      prisma.speaker.delete({ where: { id: req.params.id } }),
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
