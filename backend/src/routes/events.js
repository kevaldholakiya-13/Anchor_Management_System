const express = require('express');
const router = express.Router();
const prisma = require('../db/prisma');

// GET /api/events — list all events
router.get('/', async (_req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { sessions: true, speakers: true } },
      },
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events — create event
router.post('/', async (req, res) => {
  const { name, theme, date, venue } = req.body;
  if (!name || !theme || !date || !venue) {
    return res.status(400).json({ error: 'name, theme, date, venue are required' });
  }
  try {
    const event = await prisma.event.create({
      data: {
        name,
        theme,
        date: new Date(date),
        venue,
        status: 'UPCOMING',
        meta: { create: {} }, // auto-create empty meta
      },
      include: { meta: true },
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id — full event with sessions + speakers + meta
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        sessions: {
          orderBy: { order: 'asc' },
          include: { speaker: true },
        },
        speakers: true,
        meta: true,
      },
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/events/:id — update event status / fields
router.put('/:id', async (req, res) => {
  const { name, theme, date, venue, status } = req.body;
  try {
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(theme && { theme }),
        ...(date && { date: new Date(date) }),
        ...(venue && { venue }),
        ...(status && { status }),
      },
    });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:id/sessions — add session to event
router.post('/:id/sessions', async (req, res) => {
  const { order, title, type, speakerId, scheduledStart, scheduledEnd } = req.body;
  if (!title || !type || !scheduledStart || !scheduledEnd) {
    return res.status(400).json({ error: 'title, type, scheduledStart, scheduledEnd are required' });
  }
  try {
    // Auto-assign order if not provided
    let sessionOrder = order;
    if (sessionOrder == null) {
      const count = await prisma.session.count({ where: { eventId: req.params.id } });
      sessionOrder = count + 1;
    }

    const session = await prisma.session.create({
      data: {
        eventId: req.params.id,
        order: sessionOrder,
        title,
        type,
        speakerId: speakerId || null,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        status: 'PENDING',
      },
      include: { speaker: true },
    });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:id/speakers — add speaker to event
router.post('/:id/speakers', async (req, res) => {
  const { name, bio, topic, achievements, photoUrl } = req.body;
  if (!name || !bio || !topic) {
    return res.status(400).json({ error: 'name, bio, topic are required' });
  }
  try {
    const speaker = await prisma.speaker.create({
      data: {
        eventId: req.params.id,
        name,
        bio,
        topic,
        achievements: achievements || '',
        photoUrl: photoUrl || null,
      },
    });
    res.status(201).json(speaker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
