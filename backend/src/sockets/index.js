/**
 * Socket.io room strategy:
 * - Clients join room `event:{eventId}` to receive live updates for a specific event
 * Events emitted:
 *   session:update  → { eventId, sessions[] }   (schedule changed)
 *   script:ready    → { sessionId, scriptType, script }  (AI generation done)
 *   disruption:active → { eventId, type, minutesDelayed, sessionTitle }
 */

function initSockets(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join:event', (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`   Socket ${socket.id} joined room event:${eventId}`);
    });

    socket.on('leave:event', (eventId) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = { initSockets };
