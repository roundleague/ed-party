// ─── Shared type definitions mirrored from server ────────────────────────────
// These must stay in sync with server/src/gameManager.ts types.

export type Phase =
  | 'lobby'
  | 'game_intro'
  | 'prompt'
  | 'drawing'
  | 'voting'
  | 'tap_waiting'
  | 'tap_go'
  | 'results'
  | 'leaderboard'
  | 'finished';

export type GameType =
  | 'who_knows_ed'
  | 'ed_story'
  | 'draw_ed'
  | 'fastest_finger'
  | 'most_likely_to'
  | 'love_life'
  | 'relive_the_photo';

export interface Player {
  id: string;
  name: string;
  iconUrl: string;
  score: number;
  connected: boolean;
}

export interface PromptData {
  type: GameType;
  question?: string;
  options?: string[];
  story?: string;
  photoUrl?: string | null;
  memory?: string;
  names?: string[];
  prompt?: string;
  roundNumber: number;
  totalRounds: number;
}

export interface AnswerEntry {
  answer: any;
  correct: boolean;
  pointsEarned: number;
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

export interface LoveLifePlayerResult {
  order: string[];
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
  memory?: string;
  memoryAuthor?: string;
  loveLifeCorrectOrder?: string[];
  loveLifeResults?: Record<string, LoveLifePlayerResult>;
}

export interface GameState {
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
  drawings: Record<string, string>;
  totalGames: number;
}

// ─── Game metadata ─────────────────────────────────────────────────────────────

export const GAME_COLORS: Record<GameType, string> = {
  who_knows_ed: 'from-violet-600 to-purple-800',
  ed_story: 'from-blue-600 to-cyan-800',
  draw_ed: 'from-pink-600 to-rose-800',
  fastest_finger: 'from-yellow-500 to-orange-700',
  most_likely_to: 'from-green-600 to-teal-800',
  love_life: 'from-rose-500 to-pink-800',
  relive_the_photo: 'from-amber-500 to-orange-700',
};

export const GAME_EMOJIS: Record<GameType, string> = {
  who_knows_ed: '🧠',
  ed_story: '📖',
  draw_ed: '🎨',
  fastest_finger: '⚡',
  most_likely_to: '🤔',
  love_life: '💘',
  relive_the_photo: '📸',
};

export const ROOM_CODE = 'ED2026';
