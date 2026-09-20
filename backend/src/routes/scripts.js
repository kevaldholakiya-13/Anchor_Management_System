const express = require('express');
const router = express.Router();
const {
  generateOpeningScript,
  generateIntroScript,
  generateTransitionScript,
  generateClosingScript,
} = require('../services/scriptGenerationService');

/**
 * POST /api/scripts/generate
 * Body: { eventId, sessionId?, scriptType }
 * scriptType: 'opening' | 'intro' | 'transition' | 'closing'
 */
router.post('/generate', async (req, res) => {
  const { eventId, sessionId, scriptType } = req.body;

  if (!scriptType) {
    return res.status(400).json({ error: 'scriptType is required' });
  }

  try {
    let script;

    switch (scriptType) {
      case 'opening':
        if (!eventId) return res.status(400).json({ error: 'eventId is required for opening script' });
        script = await generateOpeningScript(eventId);
        break;

      case 'intro':
        if (!sessionId) return res.status(400).json({ error: 'sessionId is required for intro script' });
        script = await generateIntroScript(sessionId);
        break;

      case 'transition':
        if (!sessionId) return res.status(400).json({ error: 'sessionId is required for transition script' });
        script = await generateTransitionScript(sessionId);
        break;

      case 'closing':
        if (!eventId) return res.status(400).json({ error: 'eventId is required for closing script' });
        script = await generateClosingScript(eventId);
        break;

      default:
        return res.status(400).json({ error: `Unknown scriptType: ${scriptType}` });
    }

    if (req.io && eventId) {
      req.io.to(`event:${eventId}`).emit('script:ready', {
        eventId,
        sessionId,
        scriptType,
        script,
      });
    }

    res.json({ success: true, scriptType, script });
  } catch (err) {
    console.error('[ScriptRoute] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
