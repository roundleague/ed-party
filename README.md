# Ed Party 🎉

A Jackbox-style bachelor party game built for Ed's big night.

## How It Works

- **Host** opens `/host` on a laptop connected to the TV
- **Players** open `/join` on their phones (same Wi-Fi)
- The host controls the game with keyboard shortcuts or on-screen buttons
- Room code is hardcoded as `ED2026`

---

## Running the Game

### 1. Find Your Local IP

**Windows:**
```
ipconfig
```
Look for **IPv4 Address** under your active adapter (e.g. `192.168.1.42`).

**Mac/Linux:**
```
ifconfig | grep "inet "
```

### 2. Start the Server

```bash
cd server
npm install
npm run dev
```

Server starts on `http://0.0.0.0:3001`

### 3. Start the Client

```bash
cd client
npm install
npm run dev
```

Client starts on `http://0.0.0.0:5173`

### 4. Connect Devices

- **TV/Host:** Open `http://localhost:5173/host` (or `http://192.168.x.x:5173/host`)
- **Phones:** Open `http://192.168.x.x:5173/join` — or scan the QR code shown on the host screen

---

## Host Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` or `→` | Next step |
| `Shift+R` | Reset game |

---

## Customizing the Game

All game content lives in one file: **`server/src/gameManager.ts`**

Look for sections marked `// ✏️ CUSTOMIZE`.

### Who Knows Ed Best Questions
```typescript
const WHO_KNOWS_ED_QUESTIONS = [
  {
    question: "What is Ed's go-to drunk order?",
    options: ["Beer", "Whiskey", "Vodka", "Juice"],
    correctAnswer: 0,  // zero-based index of correct option
  },
  // ... add more
];
```

### Ed Stories (Real or Fake)
```typescript
const ED_STORIES = [
  {
    story: "Ed once convinced a bouncer he was a food critic.",
    isReal: true,   // true = this really happened
    photoUrl: null, // or: "/assets/ed/photos/ed-funny-1.jpg"
  },
  // ...
];
```

### Most Likely To Prompts
```typescript
const MOST_LIKELY_PROMPTS = [
  "Most likely to lose their phone tonight",
  // ...
];
```

---

## Adding Assets

Drop files into `client/public/assets/`:

```
client/public/assets/
├── ed/photos/
│   ├── ed-hero.jpg
│   ├── ed-funny-1.jpg
│   ├── ed-funny-2.jpg
│   └── ed-childhood.jpg
├── players/icons/
│   ├── player-1.png   (used as player avatars)
│   ├── player-2.png
│   └── ...player-12.png
└── sfx/
    ├── correct.mp3
    ├── wrong.mp3
    ├── reveal.mp3
    ├── winner.mp3
    └── click.mp3
```

All assets are optional — the app falls back gracefully.

---

## Mini Games

| # | Game | Mechanic |
|---|------|----------|
| 1 | Who Knows Ed Best? | Multiple choice — +100 for correct |
| 2 | Guess the Ed Story | Real or Fake vote — +100 for correct |
| 3 | Draw Ed | Phone canvas → voting → +200/+100 |
| 4 | Fastest Finger | Reaction tap — +200/+150/+100 |
| 5 | Most Likely To | Vote for a player — most votes +100 |

---

## Tech Stack

- **Server:** Node.js + Express + Socket.io (port 3001)
- **Client:** React + Vite + TypeScript + Tailwind CSS (port 5173)
- **Realtime:** WebSockets via Socket.io
- **State:** In-memory only (resets on server restart)
