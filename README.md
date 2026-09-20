# AnchorX — AI Event Flow Platform

> **Bit N Build '26 Gujarat Round — PS-5**
> AI-powered anchor co-pilot with real-time disruption handling for live college events.

---

## Quick Start

### Prerequisites
- Node.js v18+
- A hosted PostgreSQL database (Supabase / Neon / Railway — free tier is fine)
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `backend/.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
GEMINI_API_KEY="your_gemini_api_key"
PORT=4000
CLIENT_URL="http://localhost:5173"
```

Run DB migration and generate Prisma client:
```bash
npm run db:push       # Push schema to your DB
npm run db:generate   # Generate Prisma client
```

Seed the demo event (InnovateFest 2026):
```bash
npm run seed
# Copy the Event ID printed at the end — you'll need it!
```

Start the backend:
```bash
npm run dev
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## Demo Flow (For Judges)

1. Open `http://localhost:5173` → you'll see **InnovateFest 2026** (seeded)
2. Click **🔴 Live Dashboard**
3. Current session: **"Agentic AI: From Chatbots to Autonomous Systems"** by Dr. Priya Menon is IN_PROGRESS
4. Click **⏳ Mark Session Delayed** → enter `15` minutes → **Confirm Delay**
5. Watch the disruption banner appear with the AI-generated stall script (~2-3 sec)
6. The agenda timeline auto-updates with all downstream sessions shifted
7. Copy stall script and read it aloud as if you're the anchor

---

## Project Structure

```
bit and build/
├── backend/
│   ├── prisma/schema.prisma        # DB schema (Event, Session, Speaker, EventMeta)
│   ├── seed/demoEvent.js           # InnovateFest 2026 realistic demo seed
│   └── src/
│       ├── server.js               # Express + Socket.io entry
│       ├── db/prisma.js            # Prisma singleton
│       ├── routes/                 # events, sessions, speakers, scripts, disruption, live
│       ├── services/
│       │   ├── llmClient.js        # Google Gemini API (single integration point)
│       │   ├── scriptGenerationService.js
│       │   └── disruptionHandlerService.js  # ⭐ Core differentiator
│       ├── prompts/                # opening, introduction, transition, closing, stall
│       └── sockets/index.js        # Socket.io room management
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── EventsListPage.jsx
│       │   ├── SetupPage.jsx       # Event/agenda/speaker setup + script generation
│       │   └── LiveDashboardPage.jsx  # ⭐ Main demo screen
│       ├── components/Dashboard/
│       │   ├── LiveClock.jsx
│       │   ├── CurrentSessionCard.jsx  # Countdown timer + overrun detection
│       │   ├── UpNextCard.jsx
│       │   ├── AgendaTimeline.jsx      # Live-updating agenda sidebar
│       │   ├── DisruptionBanner.jsx    # Animated alert + stall script display
│       │   └── ScriptPanel.jsx
│       ├── components/ScriptViewer/
│       │   └── ScriptCard.jsx      # Editable, copyable script display
│       ├── hooks/useSocket.js      # Socket.io event room hook
│       └── services/api.js         # Axios API client
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List all events |
| POST | `/api/events` | Create event |
| GET | `/api/events/:id` | Full event + sessions + speakers |
| POST | `/api/events/:id/sessions` | Add session |
| POST | `/api/events/:id/speakers` | Add speaker |
| POST | `/api/scripts/generate` | `{ eventId, sessionId?, scriptType }` |
| **POST** | **`/api/disruption/trigger`** | **`{ sessionId, type, minutesDelayed? }` — THE DEMO ENDPOINT** |
| GET | `/api/live/:eventId/status` | Current + next session for dashboard |

**Socket events (server → client):**
- `session:update` — schedule changed, agenda re-renders
- `script:ready` — new AI script arrived, banner/panel updates

---

## V2+ Roadmap

- **Text-to-speech** playback of generated scripts
- **Multi-organizer** roles and permissions
- **Session analytics** — average overrun, delay patterns
- **Voice co-anchor** — AI listens to live mic, suggests scripts in real time
- **Predictive delay estimation** from historical event data
