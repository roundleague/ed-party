import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import PlayerAvatar from '../components/PlayerAvatar';
import DrawingCanvas from '../components/DrawingCanvas';
import ConfettiBurst from '../components/ConfettiBurst';
import { playSound } from '../utils/assets';
import type { Player } from '../games/gamesConfig';

// Fetches available icon paths from the server
function useIcons() {
  const [icons, setIcons] = useState<string[]>([]);
  useEffect(() => {
    const base = `${window.location.protocol}//${window.location.hostname}:3001`;
    fetch(`${base}/api/icons`)
      .then((r) => r.json())
      .then(({ icons }: { icons: string[] }) => setIcons(icons))
      .catch(() => setIcons([]));
  }, []);
  return icons;
}

export default function JoinScreen() {
  const {
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
  } = useSocket();

  const { phase, currentPrompt, currentGameType, players, answeredPlayerIds, drawings } = gameState;

  const icons = useIcons();
  const [nameInput, setNameInput] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [step, setStep] = useState<'name' | 'icon'>('name');
  const [joined, setJoined] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [earlyTap, setEarlyTap] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevPhaseRef = useRef(phase);

  // Reset tap state on phase change
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      setTapped(false);
      setEarlyTap(false);
      prevPhaseRef.current = phase;
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'finished') setShowConfetti(true);
  }, [phase]);

  const handleNameNext = () => {
    if (!nameInput.trim()) return;
    setStep('icon');
  };

  const handleJoin = () => {
    const name = nameInput.trim();
    if (!name || !selectedIcon) return;
    joinRoom(name, selectedIcon);
    setJoined(true);
  };

  const handleTap = () => {
    if (tapped) return;
    if (phase === 'tap_waiting') {
      setEarlyTap(true);
      tapAction();
      playSound('wrong');
      return;
    }
    if (phase === 'tap_go') {
      setTapped(true);
      tapAction();
      playSound('correct');
    }
  };

  const otherPlayers = players.filter((p) => p.id !== myId);

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <PhoneShell>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-5xl animate-spin">⏳</div>
          <p className="text-white/50 text-lg">Connecting...</p>
        </div>
      </PhoneShell>
    );
  }

  // ── Step 1: Name entry ─────────────────────────────────────────────────────
  if (!joined || !myId) {
    if (step === 'name') {
      return (
        <PhoneShell>
          <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
            <div className="text-center">
              <div className="text-6xl mb-2">🎉</div>
              <h1 className="text-4xl font-black gradient-text">Ed Party</h1>
              <p className="text-white/40 mt-1">Enter your name to join</p>
            </div>
            <div className="w-full">
              <input
                autoFocus
                type="text"
                maxLength={20}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameNext()}
                placeholder="Your name..."
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white text-2xl font-bold text-center placeholder-white/30 outline-none focus:border-violet-500 focus:bg-white/15 transition-all"
              />
            </div>
            <button
              onClick={handleNameNext}
              disabled={!nameInput.trim()}
              className={`phone-btn transition-all ${
                nameInput.trim()
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Next →
            </button>
          </div>
        </PhoneShell>
      );
    }

    // ── Step 2: Icon picker ──────────────────────────────────────────────────
    return (
      <PhoneShell scroll>
        <div className="flex flex-col gap-5 px-5 py-6">
          <div className="text-center">
            <button onClick={() => setStep('name')} className="text-white/30 text-sm mb-1">← Back</button>
            <h2 className="text-2xl font-black text-white">Pick your face</h2>
            <p className="text-white/40 text-sm mt-1">Playing as <span className="text-white font-bold">{nameInput}</span></p>
          </div>

          {icons.length === 0 ? (
            <div className="text-center text-white/30 py-8">Loading icons...</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {icons.map((iconUrl) => {
                const isSelected = selectedIcon === iconUrl;
                const fileName = iconUrl.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '';
                return (
                  <button
                    key={iconUrl}
                    onClick={() => { setSelectedIcon(iconUrl); playSound('click'); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95 ${
                      isSelected
                        ? 'border-violet-500 bg-violet-500/20 scale-105'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <img
                      src={iconUrl}
                      alt={fileName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <span className="text-xs font-semibold capitalize text-white/70 truncate w-full text-center">
                      {fileName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={!selectedIcon}
            className={`phone-btn mt-2 transition-all ${
              selectedIcon
                ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {selectedIcon ? "Let's Go! 🎉" : 'Pick a face first'}
          </button>
        </div>
      </PhoneShell>
    );
  }

  // ── Waiting in lobby ───────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <PhoneShell>
        <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
          {myPlayer && (
            <PlayerAvatar player={myPlayer} size="xl" showName showScore={false} />
          )}
          <div className="text-center">
            <div className="text-2xl font-black text-white/80">{myPlayer?.name}</div>
            <p className="text-white/40 mt-1">You're in! 🎉</p>
          </div>
          <div className="glass rounded-2xl px-6 py-4 text-center">
            <p className="text-white/40 text-sm">Waiting for the host to start...</p>
            <p className="text-white/20 text-xs mt-1">{players.length} player{players.length !== 1 ? 's' : ''} in lobby</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {players.filter(p => p.id !== myId).map((p) => (
              <div key={p.id} className="glass rounded-full px-3 py-1 text-sm text-white/60">
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </PhoneShell>
    );
  }

  // ── Game intro ─────────────────────────────────────────────────────────────
  if (phase === 'game_intro') {
    return (
      <PhoneShell>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-7xl animate-bounce-in">{getGameEmoji(currentGameType)}</div>
          <h2 className="text-3xl font-black gradient-text text-center px-4">
            {gameState.currentGameName}
          </h2>
          <p className="text-white/40 text-center px-8">{getGameHint(currentGameType)}</p>
        </div>
      </PhoneShell>
    );
  }

  // ── WHO KNOWS ED BEST – answer ─────────────────────────────────────────────
  if (phase === 'prompt' && currentGameType === 'who_knows_ed' && currentPrompt) {
    return (
      <PhoneShell>
        <div className="flex flex-col gap-4 h-full px-4 py-6 overflow-auto">
          <div className="text-center text-white/40 text-xs uppercase tracking-widest">
            Round {currentPrompt.roundNumber}/{currentPrompt.totalRounds}
          </div>
          <h2 className="text-xl font-bold text-center text-white leading-snug">
            {currentPrompt.question}
          </h2>
          <div className="flex flex-col gap-3 flex-1 justify-center">
            {currentPrompt.options?.map((opt, i) => {
              const answered = hasAnswered;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (answered) return;
                    submitAnswer(i);
                    playSound('click');
                  }}
                  disabled={answered}
                  className={`phone-btn text-lg py-5 flex items-center gap-3 px-5 ${
                    answered
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-700 to-purple-800 text-white'
                  }`}
                >
                  <span className="text-white/40 font-black text-sm w-5 text-left">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 text-left">{opt}</span>
                </button>
              );
            })}
          </div>
          {hasAnswered && <WaitingMsg />}
        </div>
      </PhoneShell>
    );
  }

  // ── ED STORY – vote ────────────────────────────────────────────────────────
  if (phase === 'prompt' && currentGameType === 'ed_story' && currentPrompt) {
    return (
      <PhoneShell>
        <div className="flex flex-col gap-5 h-full px-4 py-6 justify-center">
          <div className="text-center text-white/40 text-xs uppercase tracking-widest">
            Round {currentPrompt.roundNumber}/{currentPrompt.totalRounds}
          </div>
          <div className="glass rounded-2xl p-5 text-center">
            <p className="text-lg font-semibold text-white leading-snug">{currentPrompt.story}</p>
          </div>
          {!hasAnswered ? (
            <div className="flex gap-3">
              <button
                onClick={() => { submitAnswer(true); playSound('click'); }}
                className="flex-1 phone-btn bg-gradient-to-br from-green-600 to-emerald-700 text-white py-7 text-2xl"
              >
                ✓ REAL
              </button>
              <button
                onClick={() => { submitAnswer(false); playSound('click'); }}
                className="flex-1 phone-btn bg-gradient-to-br from-red-600 to-rose-800 text-white py-7 text-2xl"
              >
                ✗ FAKE
              </button>
            </div>
          ) : (
            <WaitingMsg />
          )}
        </div>
      </PhoneShell>
    );
  }

  // ── DRAW ED – drawing ──────────────────────────────────────────────────────
  if (phase === 'drawing' && currentPrompt) {
    return (
      <PhoneShell scroll>
        <div className="flex flex-col gap-3 px-3 py-4 w-full">
          <div className="text-center text-white/40 text-xs uppercase tracking-widest">Draw Ed</div>
          <DrawingCanvas
            prompt={currentPrompt.prompt}
            onSubmit={(data) => { submitDrawing(data); playSound('click'); }}
            disabled={hasDrawn}
          />
        </div>
      </PhoneShell>
    );
  }

  // ── DRAW ED – voting ───────────────────────────────────────────────────────
  if (phase === 'voting' && currentGameType === 'draw_ed') {
    return (
      <PhoneShell scroll>
        <div className="flex flex-col gap-4 px-4 py-6">
          <h2 className="text-xl font-black text-center gradient-text">Vote for the funniest!</h2>
          {!hasVoted ? (
            <div className="flex flex-col gap-3">
              {Object.entries(drawings)
                .filter(([id]) => id !== myId)
                .map(([playerId, imageData]) => {
                  const p = players.find((x) => x.id === playerId);
                  return (
                    <button
                      key={playerId}
                      onClick={() => { submitVote(playerId); playSound('click'); }}
                      className="w-full rounded-2xl overflow-hidden border-2 border-white/10 hover:border-pink-500 active:scale-95 transition-all"
                    >
                      <img src={imageData} alt={p?.name} className="w-full aspect-video object-contain bg-[#1a1a2e]" />
                      <div className="py-2 bg-white/5 font-bold text-center">{p?.name ?? '?'}</div>
                    </button>
                  );
                })}
            </div>
          ) : (
            <WaitingMsg />
          )}
        </div>
      </PhoneShell>
    );
  }

  // ── FASTEST FINGER ─────────────────────────────────────────────────────────
  if (phase === 'tap_waiting' || phase === 'tap_go') {
    const isGo = phase === 'tap_go';
    return (
      <PhoneShell>
        <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
          {earlyTap && (
            <div className="text-red-400 font-black text-lg animate-bounce">Too early! 🐓</div>
          )}
          <button
            onPointerDown={handleTap}
            disabled={tapped || earlyTap}
            className={`relative w-56 h-56 rounded-full font-black text-3xl transition-all duration-150 no-select ${
              tapped || earlyTap
                ? 'bg-white/10 text-white/30 cursor-not-allowed scale-90'
                : isGo
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-2xl shadow-yellow-500/50 active:scale-95 scale-110'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {tapped ? '✓' : earlyTap ? '🐓' : isGo ? 'TAP!' : 'WAIT...'}
          </button>
          {tapped && <div className="text-green-400 font-bold text-lg">⚡ Tapped!</div>}
          {!isGo && !earlyTap && (
            <p className="text-white/30 text-sm text-center">Don't tap yet...</p>
          )}
        </div>
      </PhoneShell>
    );
  }

  // ── MOST LIKELY TO – vote ──────────────────────────────────────────────────
  if (phase === 'prompt' && currentGameType === 'most_likely_to' && currentPrompt) {
    return (
      <PhoneShell scroll>
        <div className="flex flex-col gap-4 px-4 py-6">
          <div className="text-center text-white/40 text-xs uppercase tracking-widest">
            Round {currentPrompt.roundNumber}/{currentPrompt.totalRounds}
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-white/50 text-sm mb-1">Most Likely To...</p>
            <p className="text-xl font-bold text-white">{currentPrompt.prompt}</p>
          </div>
          {!hasVoted ? (
            <div className="flex flex-col gap-3">
              {otherPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { submitVote(p.id); playSound('click'); }}
                  className="phone-btn bg-gradient-to-r from-teal-700 to-green-800 text-white py-5 text-xl flex items-center gap-4 px-5"
                >
                  <PlayerAvatar player={p} size="sm" showName={false} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <WaitingMsg />
          )}
        </div>
      </PhoneShell>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const myResult = gameState.results?.playerAnswers?.[myId ?? ''];
    const myRank = gameState.results?.rankings?.findIndex((r) => r.playerId === myId);
    const myVoteResult = gameState.results?.voteResults?.find((v) => v.playerId === myId);
    const myDrawResult = gameState.results?.drawingResults?.find((d) => d.playerId === myId);

    return (
      <PhoneShell>
        <div className="flex flex-col items-center justify-center h-full gap-6 px-4 text-center">
          {myResult && (
            <>
              <div className="text-7xl">{myResult.correct ? '🎉' : '😭'}</div>
              <div className={`text-4xl font-black ${myResult.correct ? 'text-green-400' : 'text-red-400'}`}>
                {myResult.correct ? 'Correct!' : 'Wrong!'}
              </div>
              {myResult.pointsEarned > 0 && (
                <div className="text-3xl font-black text-yellow-400">+{myResult.pointsEarned} pts</div>
              )}
            </>
          )}
          {myRank !== undefined && myRank >= 0 && (
            <>
              <div className="text-7xl">{myRank === 0 ? '⚡🥇' : myRank === 1 ? '⚡🥈' : myRank === 2 ? '⚡🥉' : '😅'}</div>
              <div className="text-3xl font-black">Rank #{myRank + 1}</div>
              {(gameState.results?.rankings?.[myRank]?.pointsEarned ?? 0) > 0 && (
                <div className="text-2xl font-black text-yellow-400">
                  +{gameState.results?.rankings?.[myRank]?.pointsEarned} pts
                </div>
              )}
            </>
          )}
          {myVoteResult && (
            <>
              <div className="text-6xl">{myVoteResult.voteCount > 0 ? '😂' : '🤷'}</div>
              <div className="text-2xl font-bold">
                {myVoteResult.voteCount} vote{myVoteResult.voteCount !== 1 ? 's' : ''}
              </div>
              {myVoteResult.pointsEarned > 0 && (
                <div className="text-2xl font-black text-yellow-400">+{myVoteResult.pointsEarned} pts</div>
              )}
            </>
          )}
          {myDrawResult && (
            <>
              <img src={myDrawResult.imageData} alt="your drawing" className="w-full max-w-xs rounded-2xl border border-white/20" />
              <div className="text-2xl font-bold">{myDrawResult.voteCount} vote{myDrawResult.voteCount !== 1 ? 's' : ''}</div>
              {myDrawResult.pointsEarned > 0 && (
                <div className="text-2xl font-black text-yellow-400">+{myDrawResult.pointsEarned} pts</div>
              )}
            </>
          )}
          {!myResult && myRank === undefined && !myVoteResult && !myDrawResult && (
            <div className="text-white/40 text-lg">Watch the host screen!</div>
          )}

          {myPlayer && (
            <div className="glass rounded-2xl px-6 py-3">
              <span className="text-white/40 text-sm">Total: </span>
              <span className="text-yellow-400 font-black text-2xl">{myPlayer.score} pts</span>
            </div>
          )}
          <p className="text-white/30 text-sm">Waiting for host...</p>
        </div>
      </PhoneShell>
    );
  }

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  if (phase === 'leaderboard') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex((p) => p.id === myId);
    return (
      <PhoneShell>
        <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
          <div className="text-5xl">🏆</div>
          {myPlayer && (
            <>
              <PlayerAvatar player={myPlayer} size="lg" showName showScore />
              <div className="glass rounded-2xl px-6 py-3 text-center">
                <div className="text-white/40 text-xs uppercase tracking-widest">Your Rank</div>
                <div className="text-4xl font-black text-white">#{myRank + 1}</div>
              </div>
            </>
          )}
          <p className="text-white/30 text-sm">Waiting for next game...</p>
        </div>
      </PhoneShell>
    );
  }

  // ── FINISHED ───────────────────────────────────────────────────────────────
  if (phase === 'finished') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    const isWinner = winner?.id === myId;
    return (
      <PhoneShell>
        <ConfettiBurst trigger={showConfetti && isWinner} intensity="high" />
        <div className="flex flex-col items-center justify-center h-full gap-5 px-4 text-center">
          <div className="text-7xl">{isWinner ? '🏆' : '🎊'}</div>
          <h1 className="text-4xl font-black gradient-text">Game Over!</h1>
          {isWinner ? (
            <p className="text-2xl font-bold text-yellow-400">You won! 🎉</p>
          ) : (
            <p className="text-xl text-white/60">
              Winner: <span className="font-black text-white">{winner?.name}</span>
            </p>
          )}
          {myPlayer && (
            <div className="glass rounded-2xl px-6 py-4">
              <div className="text-white/40 text-sm">Your score</div>
              <div className="text-4xl font-black text-yellow-400">{myPlayer.score} pts</div>
            </div>
          )}
          <p className="text-white/30 text-sm mt-2">Thanks for playing! Congrats Ed! 🍾</p>
        </div>
      </PhoneShell>
    );
  }

  // ── Fallback waiting ───────────────────────────────────────────────────────
  return (
    <PhoneShell>
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-5xl animate-pulse">⏳</div>
        <p className="text-white/50">Stand by...</p>
      </div>
    </PhoneShell>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PhoneShell({ children, scroll = false }: { children: React.ReactNode; scroll?: boolean }) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#0f0f2a] to-[#0f0f1a] text-white flex flex-col ${
        scroll ? 'overflow-y-auto' : 'overflow-hidden'
      }`}
    >
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

function WaitingMsg() {
  return (
    <div className="text-center py-4">
      <div className="text-green-400 font-bold text-lg mb-1">✓ Submitted!</div>
      <p className="text-white/30 text-sm">Waiting for others...</p>
    </div>
  );
}

function getGameEmoji(gameType: string | null): string {
  const map: Record<string, string> = {
    who_knows_ed: '🧠',
    ed_story: '📖',
    draw_ed: '🎨',
    fastest_finger: '⚡',
    most_likely_to: '🤔',
  };
  return map[gameType ?? ''] ?? '🎮';
}

function getGameHint(gameType: string | null): string {
  const map: Record<string, string> = {
    who_knows_ed: 'Select the correct answer!',
    ed_story: 'Vote REAL or FAKE!',
    draw_ed: 'Draw Ed on your phone!',
    fastest_finger: 'Tap the button as fast as you can!',
    most_likely_to: 'Vote for the person who fits best!',
  };
  return map[gameType ?? ''] ?? 'Get ready!';
}
