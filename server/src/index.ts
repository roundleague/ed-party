import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as gm from './gameManager';

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
  io.to(ROOM_CODE).emit('room_update', gm.getPublicState());
});

app.get('/health', (_req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // Send current state immediately on connect
  socket.emit('room_update', gm.getPublicState());

  // ── join_room ───────────────────────────────────────────────────────────────
  socket.on('join_room', ({ name }: { name: string }) => {
    const trimmedName = (name ?? '').trim().slice(0, 20);
    if (!trimmedName) return;

    socket.join(ROOM_CODE);
    const { playerId, player } = gm.joinRoom(socket.id, trimmedName);

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
  console.log(`\n🎉 Ed Party server running on port ${PORT}`);
  console.log(`   Room code: ${ROOM_CODE}`);
  console.log(`   Health:    http://localhost:${PORT}/health\n`);
});
