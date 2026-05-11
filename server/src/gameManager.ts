// ─── gameManager.ts ───────────────────────────────────────────────────────────
// All game logic lives here. Edit game data at the top of each section marked
// with "✏️ CUSTOMIZE" to tailor questions / stories / prompts for your Ed.

import {
  scoreMultipleChoice,
  scoreEdStory,
  scoreDrawingVotes,
  scoreFastestFinger,
  scoreMostLikelyTo,
} from './scoring';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Phase =
  | 'lobby'
  | 'game_intro'
  | 'prompt'        // collecting answers (MC, T/F, Most Likely To)
  | 'drawing'       // Draw Ed – canvas phase
  | 'voting'        // Draw Ed – vote on drawings
  | 'tap_waiting'   // Fastest Finger – wait for go signal
  | 'tap_go'        // Fastest Finger – TAP NOW
  | 'results'
  | 'leaderboard'
  | 'finished';

export type GameType =
  | 'who_knows_ed'
  | 'ed_story'
  | 'draw_ed'
  | 'fastest_finger'
  | 'most_likely_to';

export interface Player {
  id: string;
  name: string;
  iconUrl: string;
  score: number;
  connected: boolean;
}

interface InternalPlayer extends Player {
  socketId: string;
}

export interface PromptData {
  type: GameType;
  question?: string;
  options?: string[];
  story?: string;
  photoUrl?: string | null;
  prompt?: string;
  roundNumber: number;
  totalRounds: number;
}

export interface DrawingEntry {
  playerId: string;
  playerName: string;
  iconUrl: string;
  imageData: string;
  voteCount: number;
  pointsEarned: number;
}

export interface TapEntry {
  playerId: string;
  playerName: string;
  iconUrl: string;
  reactionTime: number;
  pointsEarned: number;
  early: boolean;
}

export interface VoteEntry {
  playerId: string;
  playerName: string;
  iconUrl: string;
  voteCount: number;
  pointsEarned: number;
  voterNames: string[];
}

export interface AnswerEntry {
  answer: any;
  correct: boolean;
  pointsEarned: number;
}

export interface RoundResult {
  type: GameType;
  correctAnswer?: number | boolean;
  correctOptionText?: string;
  playerAnswers?: Record<string, AnswerEntry>;
  rankings?: TapEntry[];
  voteResults?: VoteEntry[];
  drawingResults?: DrawingEntry[];
}

export interface PublicGameState {
  phase: Phase;
  currentGameIndex: number;
  currentRoundIndex: number;
  currentGameType: GameType | null;
  currentGameName: string | null;
  currentPrompt: PromptData | null;
  results: RoundResult | null;
  tapPhase: 'waiting' | 'go' | null;
  players: Player[];
  answeredPlayerIds: string[];
  drawings: Record<string, string>; // shown during Draw Ed voting
  totalGames: number;
}

// ─── ✏️ CUSTOMIZE: Multiple choice questions ─────────────────────────────────
// correctAnswer is the zero-based index of the correct option.
const WHO_KNOWS_ED_QUESTIONS = [
  {
    question: "Titus Tran lived from ____",
    options: ["Jan 2016 – May 2018", "Mar 2018 – Feb 2020", "Dec 2017 – Oct 2019", "Jun 2019 – Nov 2021"],
    correctAnswer: 2,
  },
  {
    question: "Ed's first job after college was ____",
    options: ["Accountant at Platt Electric", "Currency Transaction Reporter at U.S. Bank", "Technician at Seagate", "Sales clerk at New Unto Others"],
    correctAnswer: 1,
  },
  {
    question: "Ed and Joy started dating on ____",
    options: ["Feb 14, 2021", "Nov 20, 2021", "Jan 14, 2022", "Mar 7, 2022"],
    correctAnswer: 2,
  },
  {
    question: "Edward Tran is recognized as an Ordained Minister with ____",
    options: ["American Marriage Ministries", "Open Ministry", "United Church of Christ", "Universal Life Church Ministries"],
    correctAnswer: 3,
  },
];

// ─── ✏️ CUSTOMIZE: True / False questions ────────────────────────────────────
// isReal: true = the statement is correct (REAL), false = it's wrong (FAKE).
const ED_STORIES = [
  {
    story: '7 × 8 = 56',
    isReal: true,
    photoUrl: null,
  },
  {
    story: '144 ÷ 12 = 13',
    isReal: false, // answer is 12
    photoUrl: null,
  },
  {
    story: '15 + 27 = 43',
    isReal: false, // answer is 42
    photoUrl: null,
  },
  {
    story: '9² = 81',
    isReal: true,
    photoUrl: null,
  },
  {
    story: '√64 = 9',
    isReal: false, // answer is 8
    photoUrl: null,
  },
];

// ─── ✏️ CUSTOMIZE: Draw Ed prompts ───────────────────────────────────────────
const DRAW_ED_PROMPTS = [
  'Draw Ed on his wedding day',
  'Draw Ed at age 80',
];

// ─── ✏️ CUSTOMIZE: Fastest Finger round labels ────────────────────────────────
const FASTEST_FINGER_PROMPTS = [
  'Round 1 – First tap wins bragging rights!',
  'Round 2 – Who has the fastest reflexes?',
  'Round 3 – Final round. No excuses.',
];

// ─── ✏️ CUSTOMIZE: Most Likely To prompts ────────────────────────────────────
const MOST_LIKELY_PROMPTS = [
  'Most likely to lose their phone tonight',
  'Most likely to cry at the wedding',
  'Most likely to give an unsolicited toast at dinner',
  'Most likely to challenge someone to a fight at 2am',
];

// ─── Game sequence & metadata ─────────────────────────────────────────────────

const GAME_SEQUENCE: GameType[] = [
  'who_knows_ed',
  'ed_story',
  'draw_ed',
  'fastest_finger',
  'most_likely_to',
];

const GAME_NAMES: Record<GameType, string> = {
  who_knows_ed: 'Who Knows Ed Best?',
  ed_story: 'True or False: Math Edition',
  draw_ed: 'Draw Ed',
  fastest_finger: 'Fastest Finger',
  most_likely_to: 'Most Likely To...',
};

const GAME_DESCRIPTIONS: Record<GameType, string> = {
  who_knows_ed: 'How well do you really know Ed? Pick the right answer.',
  ed_story: 'Is the math equation correct? Vote REAL or FAKE.',
  draw_ed: 'Draw Ed based on the prompt. Everyone votes for the funniest.',
  fastest_finger: 'Wait for the signal then TAP as fast as you can.',
  most_likely_to: 'Vote for the person in the room who best fits the description.',
};

function getGameRounds(gameType: GameType): PromptData[] {
  switch (gameType) {
    case 'who_knows_ed':
      return WHO_KNOWS_ED_QUESTIONS.map((q, i) => ({
        type: 'who_knows_ed' as GameType,
        question: q.question,
        options: q.options,
        roundNumber: i + 1,
        totalRounds: WHO_KNOWS_ED_QUESTIONS.length,
      }));
    case 'ed_story':
      return ED_STORIES.map((s, i) => ({
        type: 'ed_story' as GameType,
        story: s.story,
        photoUrl: s.photoUrl ?? null,
        roundNumber: i + 1,
        totalRounds: ED_STORIES.length,
      }));
    case 'draw_ed':
      return DRAW_ED_PROMPTS.map((p, i) => ({
        type: 'draw_ed' as GameType,
        prompt: p,
        roundNumber: i + 1,
        totalRounds: DRAW_ED_PROMPTS.length,
      }));
    case 'fastest_finger':
      return FASTEST_FINGER_PROMPTS.map((p, i) => ({
        type: 'fastest_finger' as GameType,
        prompt: p,
        roundNumber: i + 1,
        totalRounds: FASTEST_FINGER_PROMPTS.length,
      }));
    case 'most_likely_to':
      return MOST_LIKELY_PROMPTS.map((p, i) => ({
        type: 'most_likely_to' as GameType,
        prompt: p,
        roundNumber: i + 1,
        totalRounds: MOST_LIKELY_PROMPTS.length,
      }));
  }
}

// ─── Internal State ───────────────────────────────────────────────────────────

interface InternalState {
  phase: Phase;
  currentGameIndex: number;
  currentRoundIndex: number;
  currentGameType: GameType | null;
  currentGameRounds: PromptData[];
  answers: Record<string, number | boolean>;
  votes: Record<string, string>;
  drawings: Record<string, string>;
  results: RoundResult | null;
  tapStartTime: number | null;
  reactionTimes: Record<string, number>;
  earlyTaps: Set<string>;
  tapTimeout: ReturnType<typeof setTimeout> | null;
  autoAdvanceTimeout: ReturnType<typeof setTimeout> | null;
}

const players = new Map<string, InternalPlayer>(); // id → player

let state: InternalState = {
  phase: 'lobby',
  currentGameIndex: 0,
  currentRoundIndex: 0,
  currentGameType: null,
  currentGameRounds: [],
  answers: {},
  votes: {},
  drawings: {},
  results: null,
  tapStartTime: null,
  reactionTimes: {},
  earlyTaps: new Set(),
  tapTimeout: null,
  autoAdvanceTimeout: null,
};

let broadcastFn: (() => void) | null = null;

export function setBroadcastFn(fn: () => void) {
  broadcastFn = fn;
}

function broadcast() {
  broadcastFn?.();
}

// ─── Player management ────────────────────────────────────────────────────────

const PLAYER_ICONS = Array.from({ length: 12 }, (_, i) => `/assets/players/icons/player-${i + 1}.png`);

function pickIcon(): string {
  const used = new Set([...players.values()].map((p) => p.iconUrl));
  const available = PLAYER_ICONS.filter((icon) => !used.has(icon));
  return available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : PLAYER_ICONS[players.size % PLAYER_ICONS.length];
}

export function joinRoom(socketId: string, name: string, iconUrl?: string): { playerId: string; player: Player } {
  // Reconnect by name if player already exists
  for (const [id, p] of players.entries()) {
    if (p.name.toLowerCase() === name.toLowerCase()) {
      p.socketId = socketId;
      p.connected = true;
      if (iconUrl) p.iconUrl = iconUrl;
      broadcast();
      return { playerId: id, player: toPublicPlayer(p) };
    }
  }
  const id = `player_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const player: InternalPlayer = {
    id,
    name,
    iconUrl: iconUrl ?? pickIcon(),
    score: 0,
    connected: true,
    socketId,
  };
  players.set(id, player);
  broadcast();
  return { playerId: id, player: toPublicPlayer(player) };
}

export function disconnectPlayer(socketId: string) {
  for (const p of players.values()) {
    if (p.socketId === socketId) {
      p.connected = false;
      broadcast();
      return;
    }
  }
}

export function getPlayerBySocketId(socketId: string): InternalPlayer | undefined {
  for (const p of players.values()) {
    if (p.socketId === socketId) return p;
  }
  return undefined;
}

function toPublicPlayer(p: InternalPlayer): Player {
  return { id: p.id, name: p.name, iconUrl: p.iconUrl, score: p.score, connected: p.connected };
}

function getConnectedPlayers(): InternalPlayer[] {
  return [...players.values()].filter((p) => p.connected);
}

// ─── State helpers ────────────────────────────────────────────────────────────

function currentRound(): PromptData | null {
  return state.currentGameRounds[state.currentRoundIndex] ?? null;
}

function clearRoundData() {
  state.answers = {};
  state.votes = {};
  state.drawings = {};
  state.results = null;
  state.reactionTimes = {};
  state.earlyTaps = new Set();
  state.tapStartTime = null;
  clearTimers();
}

function clearTimers() {
  if (state.tapTimeout) { clearTimeout(state.tapTimeout); state.tapTimeout = null; }
  if (state.autoAdvanceTimeout) { clearTimeout(state.autoAdvanceTimeout); state.autoAdvanceTimeout = null; }
}

function checkAutoAdvance() {
  const connected = getConnectedPlayers();
  if (connected.length === 0) return;

  if (state.phase === 'prompt') {
    const submitted = Object.keys(state.answers).length + Object.keys(state.votes).length;
    if (submitted >= connected.length) {
      state.autoAdvanceTimeout = setTimeout(() => computeResults(), 800);
    }
  } else if (state.phase === 'drawing') {
    if (Object.keys(state.drawings).length >= connected.length) {
      state.autoAdvanceTimeout = setTimeout(() => startVotingPhase(), 800);
    }
  } else if (state.phase === 'voting') {
    if (Object.keys(state.votes).length >= connected.length) {
      state.autoAdvanceTimeout = setTimeout(() => computeResults(), 800);
    }
  }
}

// ─── Game flow ────────────────────────────────────────────────────────────────

export function hostStartGame() {
  if (state.phase !== 'lobby') return;
  state.currentGameIndex = 0;
  state.currentRoundIndex = 0;
  enterGameIntro();
}

function enterGameIntro() {
  const gameType = GAME_SEQUENCE[state.currentGameIndex];
  if (!gameType) {
    state.phase = 'finished';
    broadcast();
    return;
  }
  state.phase = 'game_intro';
  state.currentGameType = gameType;
  state.currentGameRounds = getGameRounds(gameType);
  state.currentRoundIndex = 0;
  clearRoundData();
  broadcast();
}

function enterPromptPhase() {
  const round = currentRound();
  if (!round) return;
  clearRoundData();

  if (state.currentGameType === 'draw_ed') {
    state.phase = 'drawing';
  } else if (state.currentGameType === 'fastest_finger') {
    state.phase = 'tap_waiting';
    // Random delay 1.5–4s before "go"
    const delay = 1500 + Math.random() * 2500;
    state.tapTimeout = setTimeout(() => {
      state.phase = 'tap_go';
      state.tapStartTime = Date.now();
      broadcast();
      // Auto-close after 5 seconds
      state.tapTimeout = setTimeout(() => {
        computeResults();
      }, 5000);
    }, delay);
  } else {
    state.phase = 'prompt';
  }
  broadcast();
}

function startVotingPhase() {
  state.phase = 'voting';
  state.votes = {};
  broadcast();
}

export function hostNext() {
  clearTimers();

  switch (state.phase) {
    case 'lobby':
      break;

    case 'game_intro':
      enterPromptPhase();
      break;

    case 'prompt':
    case 'drawing':
      // Force-advance even if not all answered
      if (state.currentGameType === 'draw_ed') {
        startVotingPhase();
      } else {
        computeResults();
      }
      break;

    case 'voting':
      computeResults();
      break;

    case 'tap_waiting':
      // Skip to tap_go early
      state.phase = 'tap_go';
      state.tapStartTime = Date.now();
      broadcast();
      state.tapTimeout = setTimeout(() => computeResults(), 5000);
      break;

    case 'tap_go':
      computeResults();
      break;

    case 'results': {
      const hasMoreRounds = state.currentRoundIndex < state.currentGameRounds.length - 1;
      if (hasMoreRounds) {
        state.currentRoundIndex++;
        enterPromptPhase();
      } else {
        state.phase = 'leaderboard';
        broadcast();
      }
      break;
    }

    case 'leaderboard': {
      const hasMoreGames = state.currentGameIndex < GAME_SEQUENCE.length - 1;
      if (hasMoreGames) {
        state.currentGameIndex++;
        state.currentRoundIndex = 0;
        enterGameIntro();
      } else {
        state.phase = 'finished';
        broadcast();
      }
      break;
    }

    case 'finished':
      break;
  }
}

export function hostReset() {
  clearTimers();
  players.forEach((p) => {
    p.score = 0;
    p.connected = true;
  });
  state = {
    phase: 'lobby',
    currentGameIndex: 0,
    currentRoundIndex: 0,
    currentGameType: null,
    currentGameRounds: [],
    answers: {},
    votes: {},
    drawings: {},
    results: null,
    tapStartTime: null,
    reactionTimes: {},
    earlyTaps: new Set(),
    tapTimeout: null,
    autoAdvanceTimeout: null,
  };
  broadcast();
}

// ─── Player actions ───────────────────────────────────────────────────────────

export function submitAnswer(playerId: string, answer: number | boolean) {
  if (state.phase !== 'prompt') return;
  if (state.answers[playerId] !== undefined) return; // no re-submit
  state.answers[playerId] = answer;
  broadcast();
  checkAutoAdvance();
}

export function submitVote(playerId: string, targetId: string) {
  if (state.phase !== 'voting' && state.phase !== 'prompt') return;
  if (state.votes[playerId] !== undefined) return;
  // For most_likely_to the phase is 'prompt', for draw_ed voting it's 'voting'
  state.votes[playerId] = targetId;
  broadcast();
  checkAutoAdvance();
}

export function submitDrawing(playerId: string, imageData: string) {
  if (state.phase !== 'drawing') return;
  state.drawings[playerId] = imageData;
  broadcast();
  checkAutoAdvance();
}

export function tapAction(playerId: string) {
  if (state.phase === 'tap_waiting') {
    // Early tap – penalize
    state.earlyTaps.add(playerId);
    return;
  }
  if (state.phase !== 'tap_go') return;
  if (state.reactionTimes[playerId] !== undefined) return;
  if (state.tapStartTime === null) return;
  state.reactionTimes[playerId] = Date.now() - state.tapStartTime;
  broadcast();
  // Auto-advance when all connected players have tapped
  const connected = getConnectedPlayers();
  if (Object.keys(state.reactionTimes).length >= connected.length) {
    clearTimers();
    state.autoAdvanceTimeout = setTimeout(() => computeResults(), 600);
  }
}

// ─── Results computation ──────────────────────────────────────────────────────

function computeResults() {
  clearTimers();
  const gameType = state.currentGameType!;
  const round = currentRound()!;

  let result: RoundResult = { type: gameType };

  if (gameType === 'who_knows_ed') {
    const correctAnswer = WHO_KNOWS_ED_QUESTIONS[state.currentRoundIndex]?.correctAnswer ?? 0;
    const scored = scoreMultipleChoice(
      state.answers as Record<string, number>,
      correctAnswer
    );
    result.correctAnswer = correctAnswer;
    result.correctOptionText = round.options?.[correctAnswer];
    result.playerAnswers = {};
    for (const [id, s] of Object.entries(scored)) {
      result.playerAnswers[id] = { answer: state.answers[id], ...s };
      const p = players.get(id);
      if (p) p.score += s.pointsEarned;
    }
  }

  else if (gameType === 'ed_story') {
    const storyData = ED_STORIES[state.currentRoundIndex];
    const isReal = storyData?.isReal ?? false;
    const scored = scoreEdStory(state.answers as Record<string, boolean>, isReal);
    result.correctAnswer = isReal;
    result.playerAnswers = {};
    for (const [id, s] of Object.entries(scored)) {
      result.playerAnswers[id] = { answer: state.answers[id], ...s };
      const p = players.get(id);
      if (p) p.score += s.pointsEarned;
    }
  }

  else if (gameType === 'draw_ed') {
    const scored = scoreDrawingVotes(state.votes);
    result.drawingResults = [];
    for (const [id, s] of Object.entries(scored)) {
      const p = players.get(id);
      if (p) {
        p.score += s.pointsEarned;
        result.drawingResults.push({
          playerId: id,
          playerName: p.name,
          iconUrl: p.iconUrl,
          imageData: state.drawings[id] ?? '',
          voteCount: s.voteCount,
          pointsEarned: s.pointsEarned,
        });
      }
    }
    result.drawingResults.sort((a, b) => b.voteCount - a.voteCount);
  }

  else if (gameType === 'fastest_finger') {
    const scored = scoreFastestFinger(state.reactionTimes, state.earlyTaps);
    result.rankings = scored.map((s) => {
      const p = players.get(s.playerId);
      if (p) p.score += s.pointsEarned;
      return {
        ...s,
        playerName: p?.name ?? '???',
        iconUrl: p?.iconUrl ?? '',
      };
    });
    // Add early tappers at end
    for (const id of state.earlyTaps) {
      const p = players.get(id);
      if (p) {
        result.rankings.push({
          playerId: id,
          playerName: p.name,
          iconUrl: p.iconUrl,
          reactionTime: -1,
          pointsEarned: 0,
          early: true,
        });
      }
    }
  }

  else if (gameType === 'most_likely_to') {
    const scored = scoreMostLikelyTo(state.votes);
    result.voteResults = [];
    for (const [id, s] of Object.entries(scored)) {
      const p = players.get(id);
      if (p) {
        p.score += s.pointsEarned;
        result.voteResults.push({
          playerId: id,
          playerName: p.name,
          iconUrl: p.iconUrl,
          voteCount: s.voteCount,
          pointsEarned: s.pointsEarned,
          voterNames: s.voterIds.map((vid) => players.get(vid)?.name ?? '?'),
        });
      }
    }
    result.voteResults.sort((a, b) => b.voteCount - a.voteCount);
  }

  state.results = result;
  state.phase = 'results';
  broadcast();
}

// ─── Public state ─────────────────────────────────────────────────────────────

export function getPublicState(): PublicGameState {
  const sorted = [...players.values()].sort((a, b) => b.score - a.score);
  const answeredPlayerIds = [
    ...Object.keys(state.answers),
    ...Object.keys(state.votes),
    ...Object.keys(state.drawings),
    ...Object.keys(state.reactionTimes),
  ];

  // Only expose drawings during voting phase
  const publicDrawings =
    state.phase === 'voting' || state.phase === 'results'
      ? { ...state.drawings }
      : {};

  const round = currentRound();

  return {
    phase: state.phase,
    currentGameIndex: state.currentGameIndex,
    currentRoundIndex: state.currentRoundIndex,
    currentGameType: state.currentGameType,
    currentGameName: state.currentGameType ? GAME_NAMES[state.currentGameType] : null,
    currentPrompt: round ?? null,
    results: state.results,
    tapPhase: state.phase === 'tap_waiting' ? 'waiting' : state.phase === 'tap_go' ? 'go' : null,
    players: sorted.map(toPublicPlayer),
    answeredPlayerIds: [...new Set(answeredPlayerIds)],
    drawings: publicDrawings,
    totalGames: GAME_SEQUENCE.length,
  };
}

export function getGameDescriptions(): Record<GameType, string> {
  return GAME_DESCRIPTIONS;
}
