import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { networkInterfaces } from 'os';
import { readdirSync } from 'fs';
import { join } from 'path';
import * as gm from './gameManager';

function getLocalIp(): string {
  for (const ifaces of Object.values(networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const ROOM_CODE = 'ED2026';

// Wire up the broadcast function so gameManager can push state
gm.setBroadcastFn(() => {
  io.emit('room_update', gm.getPublicState());
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/info', (_req, res) => res.json({ localIp: getLocalIp(), port: PORT }));

// Return the list of player icon files so the client knows what's available
app.get('/api/icons', (_req, res) => {
  try {
    const iconsDir = join(__dirname, '../../client/public/assets/players/icons');
    const files = readdirSync(iconsDir).filter((f) =>
      /\.(png|jpg|jpeg|gif|webp)$/i.test(f)
    );
    res.json({ icons: files.map((f) => `/assets/players/icons/${f}`) });
  } catch {
    res.json({ icons: [] });
  }
});

// Return sound-bite clips
app.get('/api/clips', (_req, res) => {
  try {
    const sfxDir = join(__dirname, '../../client/public/assets/sfx');
    const files = readdirSync(sfxDir).filter((f) => /\.mp3$/i.test(f));
    res.json({ clips: files.map((f) => `/assets/sfx/${f}`) });
  } catch {
    res.json({ clips: [] });
  }
});

// Return Ed's embarrassing photos
app.get('/api/photos', (_req, res) => {
  try {
    const photosDir = join(__dirname, '../../client/public/assets/ed/photos');
    const files = readdirSync(photosDir).filter((f) =>
      /\.(png|jpg|jpeg|gif|webp)$/i.test(f)
    );
    res.json({ photos: files.map((f) => `/assets/ed/photos/${f}`) });
  } catch {
    res.json({ photos: [] });
  }
});

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // Send current state immediately on connect
  socket.emit('room_update', gm.getPublicState());

  // ── join_room ───────────────────────────────────────────────────────────────
  socket.on('join_room', ({ name, iconUrl }: { name: string; iconUrl?: string }) => {
    const trimmedName = (name ?? '').trim().slice(0, 20);
    if (!trimmedName) return;

    socket.join(ROOM_CODE);
    const { playerId, player } = gm.joinRoom(socket.id, trimmedName, iconUrl);

    // Tell THIS client who they are
    socket.emit('you_joined', { playerId, player });

    // Tell everyone the updated player list (via room_update from broadcast)
    console.log(`[join] ${trimmedName} (${playerId})`);
  });

  // ── host_start_game ─────────────────────────────────────────────────────────
  socket.on('host_start_game', () => {
    console.log('[host] start_game');
    socket.join(ROOM_CODE);
    gm.hostStartGame();
  });

  // ── host_next ───────────────────────────────────────────────────────────────
  socket.on('host_next', () => {
    socket.join(ROOM_CODE);
    gm.hostNext();
  });

  // ── host_reset ──────────────────────────────────────────────────────────────
  socket.on('host_reset', () => {
    console.log('[host] reset');
    socket.join(ROOM_CODE);
    gm.hostReset();
  });

  // ── submit_answer ───────────────────────────────────────────────────────────
  socket.on('submit_answer', ({ playerId, answer }: { playerId: string; answer: number | boolean }) => {
    gm.submitAnswer(playerId, answer);
  });

  // ── submit_vote ─────────────────────────────────────────────────────────────
  socket.on('submit_vote', ({ playerId, targetId }: { playerId: string; targetId: string }) => {
    gm.submitVote(playerId, targetId);
  });

  // ── submit_drawing ──────────────────────────────────────────────────────────
  socket.on('submit_drawing', ({ playerId, imageData }: { playerId: string; imageData: string }) => {
    gm.submitDrawing(playerId, imageData);
  });

  // ── host_award_memory ───────────────────────────────────────────────────────
  socket.on('host_award_memory', ({ authorId }: { authorId: string }) => {
    gm.awardMemoryPoints(authorId);
    gm.hostNext();
  });

  // ── tap_action ──────────────────────────────────────────────────────────────
  socket.on('tap_action', ({ playerId }: { playerId: string }) => {
    gm.tapAction(playerId);
  });

  // ── disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    gm.disconnectPlayer(socket.id);
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`\n🎉 Ed Party server running`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${ip}:${PORT}`);
  console.log(`\n   Host screen: http://${ip}:5173/host`);
  console.log(`   Join URL:    http://${ip}:5173/join\n`);
});
