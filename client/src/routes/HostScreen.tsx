import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useEdPhotos } from '../hooks/useEdPhotos';
import { useClips } from '../hooks/useClips';
import PlayerAvatar from '../components/PlayerAvatar';
import Leaderboard from '../components/Leaderboard';
import QRCodeDisplay from '../components/QRCodeDisplay';
import HostControls from '../components/HostControls';
import ConfettiBurst from '../components/ConfettiBurst';
import EdPhotoCard from '../components/EdPhotoCard';
import { GAME_COLORS, GAME_EMOJIS, ROOM_CODE, type Player } from '../games/gamesConfig';
import { playSound } from '../utils/assets';

function useJoinUrl() {
  const [joinUrl, setJoinUrl] = useState('');
  useEffect(() => {
    const serverBase = `${window.location.protocol}//${window.location.hostname}:3001`;
    fetch(`${serverBase}/api/info`)
      .then((r) => r.json())
      .then(({ localIp }: { localIp: string }) => {
        setJoinUrl(`http://${localIp}:5173/join`);
      })
      .catch(() => {
        // fallback: use whatever hostname the host opened the page with
        setJoinUrl(`${window.location.protocol}//${window.location.hostname}:5173/join`);
      });
  }, []);
  return joinUrl;
}

export default function HostScreen() {
  const joinUrl = useJoinUrl();
  const { gameState, hostNext, hostStartGame, hostReset, hostAwardMemory, hostAwardPhoto } = useSocket();
  const { phase, players, currentPrompt, currentGameType, currentGameName, results, answeredPlayerIds } = gameState;
  const { photos, random } = useEdPhotos();
  const { playRandomClip, stopClip } = useClips();

  const [showConfetti, setShowConfetti] = useState(false);
  const [prevPhase, setPrevPhase] = useState(phase);

  // Pick a new photo each time the phase changes so Ed keeps "reacting"
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const prevPhotoRef = useRef<string | null>(null);
  useEffect(() => {
    if (photos.length === 0) return;
    const next = random(prevPhotoRef.current ?? undefined);
    prevPhotoRef.current = next;
    setActivePhoto(next);
  }, [phase, gameState.currentRoundIndex, photos, random]);

  useEffect(() => {
    if (prevPhase !== phase) {
      if (phase === 'finished') {
        setShowConfetti(true);
        stopClip();
        playSound('winner');
      } else if (phase === 'results') {
        playRandomClip(); // 🎬 random sound bite after every round
      } else if (phase === 'leaderboard') {
        playSound('correct');
      }
      setPrevPhase(phase);
    }
  }, [phase, prevPhase, playRandomClip, stopClip]);

  const answeredCount = answeredPlayerIds.length;
  const connectedCount = players.filter((p) => p.connected).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] via-[#0f0f2a] to-[#0f0f1a] text-white p-6 flex flex-col no-select">
      <ConfettiBurst trigger={showConfetti} intensity="high" />

      {/* ── LOBBY ─────────────────────────────────────────────────────────── */}
      {phase === 'lobby' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-fade-in">
          <div className="flex items-center gap-8">
            {activePhoto && (
              <EdPhotoCard src={activePhoto} size="lg" rotate caption="the man of the hour" />
            )}
            <div className="text-center">
              <div className="text-6xl mb-2">🎉</div>
              <h1 className="text-7xl font-black gradient-text mb-1">Ed Party</h1>
              <p className="text-white/50 text-xl">Bachelor Party Edition</p>
            </div>
            {photos[1] && (
              <EdPhotoCard src={photos[1]} size="lg" rotate caption="legend" />
            )}
          </div>

          <div className="flex gap-12 items-start">
            {/* QR Code */}
            <div className="text-center">
              <QRCodeDisplay url={joinUrl} size={200} />
              <p className="mt-3 text-white/40 text-sm">Scan to join</p>
            </div>

            {/* Room code */}
            <div className="text-center">
              <div className="text-sm text-white/40 uppercase tracking-widest mb-2">Room Code</div>
              <div className="text-8xl font-black tracking-wider text-white glass px-8 py-4 rounded-3xl">
                {ROOM_CODE}
              </div>
              <div className="text-sm text-white/40 mt-3">go to {joinUrl}</div>
            </div>
          </div>

          {/* Players */}
          <div className="w-full max-w-4xl">
            <div className="text-center text-white/40 text-sm mb-4 uppercase tracking-widest">
              {players.length} player{players.length !== 1 ? 's' : ''} joined
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {players.map((p) => (
                <div key={p.id} className="animate-bounce-in">
                  <PlayerAvatar player={p} size="lg" showName showScore={false} />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={hostStartGame}
            disabled={players.length < 1}
            className={`px-16 py-5 rounded-2xl text-3xl font-black transition-all shadow-2xl ${
              players.length >= 1
                ? 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 shadow-violet-500/40 active:scale-95'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {players.length >= 1 ? '🚀 Start the Party!' : 'Waiting for players...'}
          </button>
        </div>
      )}

      {/* ── GAME INTRO ────────────────────────────────────────────────────── */}
      {phase === 'game_intro' && currentGameType && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-bounce-in">
          <div className={`flex items-center gap-8 p-14 rounded-[3rem] bg-gradient-to-br ${GAME_COLORS[currentGameType]} shadow-2xl`}>
            {activePhoto && (
              <EdPhotoCard src={activePhoto} size="md" rotate className="flex-shrink-0" />
            )}
            <div className="text-center">
              <div className="text-8xl mb-3">{GAME_EMOJIS[currentGameType]}</div>
              <h1 className="text-5xl font-black text-white mb-2">{currentGameName}</h1>
              <div className="text-lg text-white/70">
                Game {gameState.currentGameIndex + 1} of {gameState.totalGames}
              </div>
            </div>
            {photos.length > 1 && (
              <EdPhotoCard src={photos[(gameState.currentGameIndex + 1) % photos.length]} size="md" rotate className="flex-shrink-0" />
            )}
          </div>
          <HostControls onNext={hostNext} onReset={hostReset} nextLabel="Let's Go →" />
        </div>
      )}

      {/* ── WHO KNOWS ED BEST – prompt ────────────────────────────────────── */}
      {phase === 'prompt' && currentGameType === 'who_knows_ed' && currentPrompt && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-slide-up">
          <RoundBadge prompt={currentPrompt} />
          <h2 className="text-5xl font-black text-center max-w-3xl leading-tight">
            {currentPrompt.question}
          </h2>
          <div className="grid grid-cols-2 gap-4 w-full max-w-3xl">
            {currentPrompt.options?.map((opt, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-5 text-2xl font-bold flex items-center gap-3"
              >
                <span className="text-white/40 font-black text-xl">{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </div>
            ))}
          </div>
          <AnsweredBar answered={answeredCount} total={connectedCount} />
          <HostControls onNext={hostNext} onReset={hostReset} nextLabel="Reveal →" />
        </div>
      )}

      {/* ── GUESS WHO WROTE IT – prompt ───────────────────────────────────── */}
      {phase === 'prompt' && currentGameType === 'ed_story' && currentPrompt && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-slide-up">
          <RoundBadge prompt={currentPrompt} />
          <div className="glass rounded-3xl p-12 max-w-3xl text-center">
            <p className="text-4xl font-bold leading-relaxed text-white">{currentPrompt.memory}</p>
          </div>
          <p className="text-white/40 text-xl">Ed is thinking...</p>
          <HostControls onNext={hostNext} onReset={hostReset} nextLabel="Reveal →" />
        </div>
      )}

      {/* ── DRAW ED – drawing phase ───────────────────────────────────────── */}
      {phase === 'drawing' && currentPrompt && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-slide-up">
          <RoundBadge prompt={currentPrompt} />
          <div className="text-center">
            <div className="text-7xl mb-3">🎨</div>
            <h2 className="text-5xl font-black">{currentPrompt.prompt}</h2>
            <p className="text-white/40 text-xl mt-2">Players are drawing on their phones...</p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {players.map((p) => (
              <div
                key={p.id}
                className={`glass rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 transition-all ${
                  answeredPlayerIds.includes(p.id)
                    ? 'border border-green-500/60 text-green-400'
                    : 'text-white/40'
                }`}
              >
                {answeredPlayerIds.includes(p.id) ? '✓' : '⏳'} {p.name}
              </div>
            ))}
          </div>
          <AnsweredBar answered={answeredCount} total={connectedCount} label="Drawings submitted" />
          <HostControls onNext={hostNext} onReset={hostReset} nextLabel="Show Drawings →" />
        </div>
      )}

      {/* ── DRAW ED – voting phase ────────────────────────────────────────── */}
      {phase === 'voting' && currentGameType === 'draw_ed' && (
        <div className="flex-1 flex flex-col gap-6 animate-slide-up">
          <div className="text-center">
            <h2 className="text-4xl font-black gradient-text">Vote on your phones!</h2>
            <p className="text-white/40 mt-1">Who drew Ed the best (worst)?</p>
          </div>
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
            {Object.entries(gameState.drawings).map(([playerId, imageData]) => {
              const p = players.find((x) => x.id === playerId);
              return (
                <div key={playerId} className="glass rounded-2xl overflow-hidden">
                  <img src={imageData} alt={p?.name} className="w-full aspect-video object-contain bg-[#1a1a2e]" />
                  <div className="px-3 py-2 font-bold text-center truncate">{p?.name ?? '?'}</div>
                </div>
              );
            })}
          </div>
          <AnsweredBar answered={answeredCount} total={connectedCount} label="Votes in" />
          <HostControls onNext={hostNext} onReset={hostReset} nextLabel="Show Results →" />
        </div>
      )}

      {/* ── FASTEST FINGER ────────────────────────────────────────────────── */}
      {(phase === 'tap_waiting' || phase === 'tap_go') && currentPrompt && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <RoundBadge prompt={currentPrompt} />
          <div
            className={`text-center transition-all duration-300 ${
              phase === 'tap_go' ? 'scale-110' : ''
            }`}
          >
            <div
              className={`text-9xl font-black mb-4 transition-all duration-200 ${
                phase === 'tap_go'
                  ? 'text-yellow-400 animate-pulse-fast'
                  : 'text-white/30'
              }`}
            >
              {phase === 'tap_go' ? 'TAP NOW!' : 'WAIT...'}
            </div>
            <p className="text-white/40 text-xl">
              {phase === 'tap_waiting' ? 'Get your finger ready...' : 'Tap as fast as you can!'}
            </p>
          </div>
          {phase === 'tap_go' && (
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              {players.map((p) => (
                <div
                  key={p.id}
                  className={`glass rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 transition-all ${
                    answeredPlayerIds.includes(p.id)
                      ? 'border border-yellow-500/60 text-yellow-400'
                      : 'text-white/40'
                  }`}
                >
                  {answeredPlayerIds.includes(p.id) ? '⚡' : '⏳'} {p.name}
                </div>
              ))}
            </div>
          )}
          <HostControls onNext={hostNext} onReset={hostReset} nextLabel="Skip →" showNext={phase === 'tap_waiting'} />
        </div>
      )}

      {/* ── RELIVE THE PHOTO – host picks correct/shot ───────────────────── */}
      {phase === 'prompt' && currentGameType === 'relive_the_photo' && currentPrompt && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-slide-up">
          <RoundBadge prompt={currentPrompt} />
          <div className="rounded-3xl overflow-hidden max-w-sm w-full bg-white/5 border border-white/10">
            {currentPrompt.photoUrl ? (
              <img src={currentPrompt.photoUrl} alt="Round" className="w-full object-cover max-h-64" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="w-full h-48 flex items-center justify-center">
                <div className="text-6xl">📸</div>
              </div>
            )}
          </div>
          <div className="text-white/50 text-sm uppercase tracking-widest">Tap who got it right to award +100</div>
          <div className="flex flex-wrap gap-3 justify-center max-w-3xl">
            {players.filter((p) => p.connected).map((p) => (
              <button
                key={p.id}
                onClick={() => hostAwardPhoto(p.id)}
                className="flex items-center gap-3 glass px-6 py-3 rounded-2xl font-bold text-lg hover:border-green-500/60 hover:bg-green-500/10 active:scale-95 transition-all"
              >
                <PlayerAvatar player={p} size="sm" showName={false} />
                {p.name}
              </button>
            ))}
          </div>
          <button
            onClick={hostNext}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-red-700 text-white text-xl font-black active:scale-95 hover:from-orange-500 hover:to-red-600 transition-all"
          >
            🥃 Take a Shot — Next
          </button>
          <HostControls onNext={hostNext} onReset={hostReset} showNext={false} nextLabel="" />
        </div>
      )}

      {/* ── ED'S LOVE LIFE – prompt ──────────────────────────────────────── */}
      {phase === 'prompt' && currentGameType === 'love_life' && currentPrompt && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-slide-up">
          <RoundBadge prompt={currentPrompt} />
          <div className="text-center">
            <div className="text-7xl mb-3">💘</div>
            <h2 className="text-4xl font-black">Arrange earliest → latest</h2>
            <p className="text-white/40 text-lg mt-2">Players are ordering on their phones...</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {currentPrompt.names?.map((name) => (
              <div key={name} className={`glass rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 transition-all ${
                answeredPlayerIds.length > 0 ? 'text-white/60' : 'text-white/40'
              }`}>
                {name}
              </div>
            ))}
          </div>
          <AnsweredBar answered={answeredCount} total={connectedCount} label="Submitted" />
          <HostControls onNext={hostNext} onReset={hostReset} nextLabel="Reveal →" />
        </div>
      )}

      {/* ── MOST LIKELY TO – prompt ───────────────────────────────────────── */}
      {phase === 'prompt' && currentGameType === 'most_likely_to' && currentPrompt && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-slide-up">
          <RoundBadge prompt={currentPrompt} />
          <div className="text-center">
            <div className="text-white/40 text-2xl font-bold uppercase tracking-widest mb-3">Most Likely To...</div>
            <h2 className="text-6xl font-black leading-tight max-w-3xl">{currentPrompt.prompt}</h2>
          </div>
          <AnsweredBar answered={answeredCount} total={connectedCount} label="Votes cast" />
          <HostControls onNext={hostNext} onReset={hostReset} nextLabel="Reveal →" />
        </div>
      )}

      {/* ── RESULTS ───────────────────────────────────────────────────────── */}
      {phase === 'results' && results && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-bounce-in relative">
          {activePhoto && (
            <div className="absolute top-4 right-4">
              <EdPhotoCard src={activePhoto} size="sm" rotate />
            </div>
          )}
          {/* WHO KNOWS ED BEST results */}
          {results.type === 'who_knows_ed' && results.playerAnswers && (
            <>
              <div className="text-center">
                <div className="text-white/40 uppercase tracking-widest text-sm mb-2">Correct Answer</div>
                <div className="text-5xl font-black text-green-400">{results.correctOptionText}</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl w-full">
                {players.map((p) => {
                  const entry = results.playerAnswers?.[p.id];
                  return (
                    <div
                      key={p.id}
                      className={`glass rounded-2xl p-4 text-center border ${
                        entry?.correct ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/30'
                      }`}
                    >
                      <PlayerAvatar player={p} size="sm" showName showScore={false} />
                      <div className={`text-2xl mt-1 ${entry?.correct ? 'text-green-400' : 'text-red-400'}`}>
                        {entry?.correct ? '+100' : '0'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* GUESS WHO WROTE IT results */}
          {results.type === 'ed_story' && (
            <>
              <div className="glass rounded-3xl p-8 max-w-2xl text-center">
                <p className="text-2xl font-semibold text-white/80 leading-relaxed">{results.memory}</p>
              </div>
              <div className="text-center">
                <div className="text-white/40 text-lg uppercase tracking-widest mb-2">Written by...</div>
                <div className="text-6xl font-black text-violet-400">{results.memoryAuthor ?? '???'}</div>
              </div>
              <div className="text-white/50 text-sm uppercase tracking-widest">Tap who Ed guessed to award +100</div>
              <div className="flex flex-wrap gap-3 justify-center max-w-3xl">
                {players.filter((p) => p.connected).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => hostAwardMemory(p.id)}
                    className="flex items-center gap-3 glass px-6 py-3 rounded-2xl font-bold text-lg hover:border-green-500/60 hover:bg-green-500/10 active:scale-95 transition-all"
                  >
                    <PlayerAvatar player={p} size="sm" showName={false} />
                    {p.name}
                  </button>
                ))}
              </div>
              <button
                onClick={hostNext}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-red-700 text-white text-xl font-black active:scale-95 hover:from-orange-500 hover:to-red-600 transition-all"
              >
                🥃 Take a Shot — Next
              </button>
            </>
          )}

          {/* DRAW ED results */}
          {results.type === 'draw_ed' && results.drawingResults && (
            <div className="w-full max-w-4xl">
              <h2 className="text-4xl font-black text-center gradient-text mb-6">The Votes Are In!</h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {results.drawingResults.map((d, i) => (
                  <div
                    key={d.playerId}
                    className={`glass rounded-2xl overflow-hidden border ${
                      i === 0 ? 'border-yellow-400/60' : 'border-white/10'
                    }`}
                  >
                    {i === 0 && (
                      <div className="bg-yellow-500/20 text-yellow-400 text-center font-black py-1 text-sm">
                        👑 WINNER
                      </div>
                    )}
                    <img
                      src={d.imageData}
                      alt={d.playerName}
                      className="w-full aspect-video object-contain bg-[#1a1a2e]"
                    />
                    <div className="px-3 py-2 flex items-center justify-between">
                      <span className="font-bold truncate">{d.playerName}</span>
                      <span className="text-yellow-400 font-black">
                        {d.voteCount} vote{d.voteCount !== 1 ? 's' : ''}
                        {d.pointsEarned > 0 && <span className="text-green-400 ml-1">+{d.pointsEarned}</span>}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FASTEST FINGER results */}
          {results.type === 'fastest_finger' && results.rankings && (
            <div className="w-full max-w-xl">
              <h2 className="text-4xl font-black text-center gradient-text mb-6">⚡ Rankings</h2>
              <div className="space-y-3">
                {results.rankings.map((r, i) => {
                  const p = players.find((x) => x.id === r.playerId);
                  return (
                    <div
                      key={r.playerId}
                      className={`flex items-center gap-4 glass rounded-2xl px-5 py-4 ${
                        r.early ? 'opacity-50' : ''
                      } ${i === 0 ? 'border border-yellow-400/50' : ''}`}
                    >
                      <div className="text-2xl w-8 text-center font-black text-white/40">
                        {r.early ? '✗' : `#${i + 1}`}
                      </div>
                      {p && <PlayerAvatar player={p} size="sm" showName={false} />}
                      <div className="flex-1">
                        <div className="font-bold text-lg">{r.playerName}</div>
                        <div className="text-sm text-white/40">
                          {r.early ? 'Too early!' : `${r.reactionTime}ms`}
                        </div>
                      </div>
                      <div className={`text-2xl font-black ${r.pointsEarned > 0 ? 'text-green-400' : 'text-white/30'}`}>
                        {r.pointsEarned > 0 ? `+${r.pointsEarned}` : r.early ? '🐓' : '0'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* ED'S LOVE LIFE results */}
          {results.type === 'love_life' && results.loveLifeCorrectOrder && (
            <div className="w-full max-w-3xl">
              <h2 className="text-3xl font-black text-center gradient-text mb-4">The Correct Order</h2>
              <div className="flex gap-2 justify-center mb-8">
                {results.loveLifeCorrectOrder.map((name, i) => (
                  <div key={name} className="flex flex-col items-center gap-1">
                    {i > 0 && <div className="absolute -ml-4 mt-3 text-white/30 text-lg">→</div>}
                    <div className="bg-gradient-to-br from-rose-500 to-pink-700 rounded-xl px-4 py-3 font-black text-center min-w-[70px]">
                      {name}
                    </div>
                    <div className="text-white/30 text-xs">#{i + 1}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {players.map((p) => {
                  const r = results.loveLifeResults?.[p.id];
                  if (!r) return null;
                  return (
                    <div key={p.id} className="glass rounded-2xl px-5 py-3 flex items-center gap-4">
                      <PlayerAvatar player={p} size="sm" showName={false} />
                      <span className="font-bold w-20 truncate">{p.name}</span>
                      <div className="flex gap-1 flex-1">
                        {r.order.map((name, i) => {
                          const correct = name === results.loveLifeCorrectOrder?.[i];
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-lg px-2 py-1 text-xs font-bold text-center ${
                                correct ? 'bg-green-500/30 text-green-300 border border-green-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {name}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-yellow-400 font-black text-xl w-16 text-right">+{r.pointsEarned}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MOST LIKELY TO results */}
          {results.type === 'most_likely_to' && results.voteResults && (
            <div className="w-full max-w-2xl">
              <h2 className="text-3xl font-black text-center mb-2">{currentPrompt?.prompt}</h2>
              <p className="text-center text-white/40 mb-6">Most Likely To...</p>
              <div className="space-y-3">
                {results.voteResults.map((v, i) => {
                  const p = players.find((x) => x.id === v.playerId);
                  const maxVotes = results.voteResults![0]?.voteCount ?? 0;
                  return (
                    <div
                      key={v.playerId}
                      className={`flex items-center gap-4 glass rounded-2xl px-5 py-4 ${
                        i === 0 && v.voteCount > 0 ? 'border border-pink-500/50' : ''
                      }`}
                    >
                      {p && <PlayerAvatar player={p} size="sm" showName={false} />}
                      <div className="flex-1">
                        <div className="font-bold text-lg">{v.playerName}</div>
                        <div className="text-sm text-white/40">
                          {v.voterNames.length > 0 ? `Voted by: ${v.voterNames.join(', ')}` : 'No votes'}
                        </div>
                      </div>
                      <VoteBar count={v.voteCount} max={maxVotes} />
                      {v.pointsEarned > 0 && (
                        <div className="text-green-400 font-black text-xl">+{v.pointsEarned}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {results.type !== 'ed_story' && (
            <HostControls onNext={hostNext} onReset={hostReset} nextLabel="Continue →" />
          )}
        </div>
      )}

      {/* ── LEADERBOARD ────────────────────────────────────────────────────── */}
      {phase === 'leaderboard' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
          {activePhoto && (
            <EdPhotoCard src={activePhoto} size="sm" rotate caption="watching you lose" />
          )}
          <Leaderboard players={players} title="🏆 Standings" />
          <HostControls
            onNext={hostNext}
            onReset={hostReset}
            nextLabel={gameState.currentGameIndex < gameState.totalGames - 1 ? 'Next Game →' : 'Final Results →'}
          />
        </div>
      )}

      {/* ── FINISHED ───────────────────────────────────────────────────────── */}
      {phase === 'finished' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-bounce-in">
          <div className="flex items-center gap-10">
            {/* Flanking Ed photos */}
            {photos[0] && <EdPhotoCard src={photos[0]} size="lg" rotate />}
            <div className="text-center">
              <div className="text-8xl mb-2">🎊</div>
              <h1 className="text-7xl font-black gradient-text mb-2">Game Over!</h1>
              <p className="text-white/40 text-xl">Congratulations, Ed! 🍾</p>
            </div>
            {photos[1] && <EdPhotoCard src={photos[1]} size="lg" rotate />}
          </div>
          {/* Big centre Ed photo */}
          {activePhoto && (
            <EdPhotoCard src={activePhoto} size="xl" rotate={false} caption="🎊 The Man, The Myth, The Legend 🎊" />
          )}
          {players.length > 0 && (
            <div className="text-center">
              <div className="text-white/40 uppercase tracking-widest text-sm mb-3">Champion</div>
              <PlayerAvatar player={players[0]} size="xl" showName showScore highlight />
            </div>
          )}
          <Leaderboard players={players} title="Final Scores" />
          <button
            onClick={hostReset}
            className="mt-4 px-8 py-3 rounded-xl glass text-white/60 hover:text-white hover:bg-white/10 transition-all text-lg"
          >
            ↺ Play Again
          </button>
        </div>
      )}

      {/* Connection status */}
      <div className="fixed top-4 right-4 flex items-center gap-2 text-xs text-white/30">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        {connectedCount} online
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoundBadge({ prompt }: { prompt: { roundNumber: number; totalRounds: number } }) {
  return (
    <div className="glass px-4 py-2 rounded-full text-sm text-white/50 font-medium">
      Round {prompt.roundNumber} / {prompt.totalRounds}
    </div>
  );
}

function AnsweredBar({ answered, total, label = 'Answered' }: { answered: number; total: number; label?: string }) {
  const pct = total > 0 ? (answered / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 w-full max-w-sm">
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-white/50 text-sm whitespace-nowrap">
        {answered}/{total} {label}
      </span>
    </div>
  );
}

function VoteBar({ count, max }: { count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-white/70 font-bold w-4 text-right">{count}</span>
    </div>
  );
}
