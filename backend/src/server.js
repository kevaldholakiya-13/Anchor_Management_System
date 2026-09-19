require('dotenv').config({ override: true });
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const eventsRouter = require('./routes/events');
const sessionsRouter = require('./routes/sessions');
const speakersRouter = require('./routes/speakers');
const scriptsRouter = require('./routes/scripts');
const disruptionRouter = require('./routes/disruption');
const liveRouter = require('./routes/live');
const { initSockets } = require('./sockets');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes via req.io
app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/speakers', speakersRouter);
app.use('/api/scripts', scriptsRouter);
app.use('/api/disruption', disruptionRouter);
app.use('/api/live', liveRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// Socket.io
initSockets(io);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = { app, io };
