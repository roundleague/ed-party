// simulate.ts — run with: npx tsx src/simulate.ts
// Connects 5 bot players and auto-responds to every game phase.
// Keep the server running in another terminal first.

import { io, Socket } from 'socket.io-client';

const SERVER = 'http://localhost:3001';

const BOT_NAMES = ['Alice', 'Bruno', 'Carlos', 'Diana', 'Eddie'];

interface GameState {
  phase: string;
  currentGameType: string | null;
  currentGameIndex: number;
  currentRoundIndex: number;
  currentPrompt: { options?: string[]; roundNumber?: number } | null;
  players: { id: string; name: string }[];
  answeredPlayerIds: string[];
  drawings: Record<string, string>;
}

// Tiny stub drawing — a colored square so the voting grid has something to show
function makeFakeDrawing(hue: number): string {
  const size = 100;
  const canvas = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="hsl(${hue},60%,30%)"/>
    <circle cx="${size/2}" cy="${size/2}" r="30" fill="hsl(${hue},80%,60%)" opacity="0.8"/>
    <text x="${size/2}" y="${size/2+8}" text-anchor="middle" font-size="24" fill="white">🙂</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
}

interface Bot {
  name: string;
  socket: Socket;
  playerId: string | null;
  hue: number;
  submittedKey: string | null; // tracks which round we already submitted for
}

const bots: Bot[] = BOT_NAMES.map((name, i) => ({
  name,
  socket: io(SERVER, { transports: ['websocket'] }),
  playerId: null,
  hue: (i * 72) % 360,
  submittedKey: null,
}));

function roundKey(state: GameState) {
  return `${state.phase}-${state.currentGameIndex}-${state.currentRoundIndex}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function handleState(bot: Bot, state: GameState) {
  const { phase, currentGameType, players, answeredPlayerIds, drawings } = state;
  if (!bot.playerId) return;

  // Skip if already submitted this round
  const key = roundKey(state);
  if (bot.submittedKey === key) return;

  // Skip if server already knows we answered
  if (answeredPlayerIds.includes(bot.playerId)) {
    bot.submittedKey = key;
    return;
  }

  // Stagger responses so it looks natural (0–1.5s random delay)
  await sleep(300 + Math.random() * 1200);

  // Re-check after delay (another bot may have triggered phase change)
  if (bot.submittedKey === key) return;
  bot.submittedKey = key;

  if (phase === 'prompt') {
    if (currentGameType === 'who_knows_ed') {
      const opts = state.currentPrompt?.options ?? [];
      const answer = Math.floor(Math.random() * Math.max(opts.length, 4));
      bot.socket.emit('submit_answer', { playerId: bot.playerId, answer });
      console.log(`[${bot.name}] answered MC: option ${answer}`);
    }

    else if (currentGameType === 'ed_story') {
      const answer = Math.random() > 0.5;
      bot.socket.emit('submit_answer', { playerId: bot.playerId, answer });
      console.log(`[${bot.name}] voted: ${answer ? 'REAL' : 'FAKE'}`);
    }

    else if (currentGameType === 'most_likely_to') {
      const others = players.filter((p) => p.id !== bot.playerId);
      if (others.length === 0) return;
      const target = others[Math.floor(Math.random() * others.length)];
      bot.socket.emit('submit_vote', { playerId: bot.playerId, targetId: target.id });
      console.log(`[${bot.name}] voted for ${target.name}`);
    }
  }

  else if (phase === 'drawing') {
    const drawing = makeFakeDrawing(bot.hue);
    bot.socket.emit('submit_drawing', { playerId: bot.playerId, imageData: drawing });
    console.log(`[${bot.name}] submitted drawing`);
  }

  else if (phase === 'voting' && currentGameType === 'draw_ed') {
    const others = Object.keys(drawings).filter((id) => id !== bot.playerId);
    if (others.length === 0) return;
    const target = others[Math.floor(Math.random() * others.length)];
    bot.socket.emit('submit_vote', { playerId: bot.playerId, targetId: target });
    console.log(`[${bot.name}] voted for drawing by ${target}`);
  }

  else if (phase === 'tap_go') {
    // Simulate varied reaction times (100ms – 800ms after go)
    const delay = 100 + Math.random() * 700;
    await sleep(delay);
    bot.socket.emit('tap_action', { playerId: bot.playerId });
    console.log(`[${bot.name}] tapped after ${Math.round(delay)}ms`);
  }

  else if (phase === 'tap_waiting' && Math.random() < 0.15) {
    // 15% chance of an "early tap"
    await sleep(500 + Math.random() * 500);
    bot.socket.emit('tap_action', { playerId: bot.playerId });
    console.log(`[${bot.name}] tapped EARLY 🐓`);
  }
}

// Connect all bots
bots.forEach((bot, i) => {
  bot.socket.on('connect', () => {
    console.log(`[${bot.name}] connected`);
    // Stagger joins slightly
    setTimeout(() => {
      bot.socket.emit('join_room', { name: bot.name });
    }, i * 300);
  });

  bot.socket.on('you_joined', ({ playerId }: { playerId: string }) => {
    bot.playerId = playerId;
    console.log(`[${bot.name}] joined as ${playerId}`);
  });

  bot.socket.on('room_update', (state: GameState) => {
    handleState(bot, state).catch(console.error);
  });

  bot.socket.on('disconnect', () => {
    console.log(`[${bot.name}] disconnected`);
  });
});

console.log('\n🤖 Simulating 5 players — keep the server running in another terminal.');
console.log('   Open http://localhost:5173/host and press Start to begin.\n');

// Keep alive
process.on('SIGINT', () => {
  bots.forEach((b) => b.socket.disconnect());
  process.exit(0);
});
