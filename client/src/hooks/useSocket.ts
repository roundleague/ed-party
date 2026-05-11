import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, Player } from '../games/gamesConfig';

const SOCKET_URL = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:3001`
  : 'http://localhost:3001';

const DEFAULT_STATE: GameState = {
  phase: 'lobby',
  currentGameIndex: 0,
  currentRoundIndex: 0,
  currentGameType: null,
  currentGameName: null,
  currentPrompt: null,
  results: null,
  tapPhase: null,
  players: [],
  answeredPlayerIds: [],
  drawings: {},
  totalGames: 5,
};

export interface UseSocketReturn {
  gameState: GameState;
  myId: string | null;
  myPlayer: Player | null;
  isConnected: boolean;
  hasAnswered: boolean;
  hasVoted: boolean;
  hasDrawn: boolean;
  joinRoom: (name: string, iconUrl?: string) => void;
  submitAnswer: (answer: number | boolean) => void;
  submitVote: (targetId: string) => void;
  submitDrawing: (imageData: string) => void;
  tapAction: () => void;
  hostNext: () => void;
  hostStartGame: () => void;
  hostReset: () => void;
  hostAwardMemory: (authorId: string) => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>(DEFAULT_STATE);
  const [myId, setMyId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Track per-round submission state locally for instant UI feedback
  const [submittedPhase, setSubmittedPhase] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Reset submission flags when phase changes
  const prevPhaseRef = useRef<string | null>(null);
  useEffect(() => {
    const key = `${gameState.phase}-${gameState.currentRoundIndex}-${gameState.currentGameIndex}`;
    if (key !== submittedPhase) {
      setHasAnswered(false);
      setHasVoted(false);
      setHasDrawn(false);
      setSubmittedPhase(key);
    }
  }, [gameState.phase, gameState.currentRoundIndex, gameState.currentGameIndex, submittedPhase]);
  void prevPhaseRef;

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('room_update', (state: GameState) => {
      setGameState(state);
    });

    socket.on('you_joined', ({ playerId }: { playerId: string }) => {
      setMyId(playerId);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const joinRoom = useCallback((name: string, iconUrl?: string) => {
    emit('join_room', { name, iconUrl });
  }, [emit]);

  const submitAnswer = useCallback((answer: number | boolean) => {
    if (!myId) return;
    setHasAnswered(true);
    emit('submit_answer', { playerId: myId, answer });
  }, [myId, emit]);

  const submitVote = useCallback((targetId: string) => {
    if (!myId) return;
    setHasVoted(true);
    emit('submit_vote', { playerId: myId, targetId });
  }, [myId, emit]);

  const submitDrawing = useCallback((imageData: string) => {
    if (!myId) return;
    setHasDrawn(true);
    emit('submit_drawing', { playerId: myId, imageData });
  }, [myId, emit]);

  const tapAction = useCallback(() => {
    if (!myId) return;
    emit('tap_action', { playerId: myId });
  }, [myId, emit]);

  const hostNext = useCallback(() => emit('host_next'), [emit]);
  const hostStartGame = useCallback(() => emit('host_start_game'), [emit]);
  const hostReset = useCallback(() => emit('host_reset'), [emit]);
  const hostAwardMemory = useCallback((authorId: string) => emit('host_award_memory', { authorId }), [emit]);

  const myPlayer = myId ? (gameState.players.find((p) => p.id === myId) ?? null) : null;

  return {
    gameState,
    myId,
    myPlayer,
    isConnected,
    hasAnswered,
    hasVoted,
    hasDrawn,
    joinRoom,
    submitAnswer,
    submitVote,
    submitDrawing,
    tapAction,
    hostNext,
    hostStartGame,
    hostReset,
    hostAwardMemory,
  };
}
