const express = require('express');
const router = express.Router();
const { handleDisruption } = require('../services/disruptionHandlerService');

/**
 * POST /api/disruption/trigger
 * Body: { sessionId, type, minutesDelayed?, reason? }
 * type: 'delay' | 'cancellation'
 */
router.post('/trigger', async (req, res) => {
  const { sessionId, type, minutesDelayed = 0, reason } = req.body;

  if (!sessionId || !type) {
    return res.status(400).json({ error: 'sessionId and type are required' });
  }
  if (!['delay', 'cancellation'].includes(type)) {
    return res.status(400).json({ error: "type must be 'delay' or 'cancellation'" });
  }
  if (type === 'delay' && (!minutesDelayed || minutesDelayed <= 0)) {
    return res.status(400).json({ error: 'minutesDelayed must be > 0 for a delay' });
  }

  try {
    // Immediately acknowledge so the UI doesn't wait
    res.json({ success: true, message: 'Disruption handling in progress', sessionId, type, minutesDelayed });

    // Handle asynchronously (socket events will push updates)
    await handleDisruption({ sessionId, type, minutesDelayed, reason, io: req.io });
  } catch (err) {
    console.error('[DisruptionRoute] Error:', err.message);
    // Response already sent — log only
  }
});

module.exports = router;
