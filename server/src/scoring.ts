// ─── Scoring constants ────────────────────────────────────────────────────────
// Edit these to change point values across all games

export const POINTS = {
  // Who Knows Ed Best & Ed Story
  CORRECT_ANSWER: 100,

  // Draw Ed voting
  DRAW_WINNER: 200,
  DRAW_SECOND: 100,

  // Fastest Finger
  TAP_FIRST: 200,
  TAP_SECOND: 150,
  TAP_THIRD: 100,

  // Most Likely To
  MOST_VOTES: 100,
};

export function scoreMultipleChoice(
  answers: Record<string, number>,
  correctAnswer: number
): Record<string, { correct: boolean; pointsEarned: number }> {
  const result: Record<string, { correct: boolean; pointsEarned: number }> = {};
  for (const [playerId, answer] of Object.entries(answers)) {
    const correct = answer === correctAnswer;
    result[playerId] = { correct, pointsEarned: correct ? POINTS.CORRECT_ANSWER : 0 };
  }
  return result;
}

export function scoreEdStory(
  votes: Record<string, boolean>,
  isReal: boolean
): Record<string, { correct: boolean; pointsEarned: number }> {
  const result: Record<string, { correct: boolean; pointsEarned: number }> = {};
  for (const [playerId, vote] of Object.entries(votes)) {
    const correct = vote === isReal;
    result[playerId] = { correct, pointsEarned: correct ? POINTS.CORRECT_ANSWER : 0 };
  }
  return result;
}

export function scoreDrawingVotes(
  votes: Record<string, string> // voterId → targetPlayerId
): Record<string, { voteCount: number; pointsEarned: number }> {
  const tally: Record<string, number> = {};
  for (const targetId of Object.values(votes)) {
    tally[targetId] = (tally[targetId] ?? 0) + 1;
  }
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const result: Record<string, { voteCount: number; pointsEarned: number }> = {};
  sorted.forEach(([id, count], rank) => {
    let points = 0;
    if (rank === 0) points = POINTS.DRAW_WINNER;
    else if (rank === 1) points = POINTS.DRAW_SECOND;
    result[id] = { voteCount: count, pointsEarned: points };
  });
  // Players with zero votes
  for (const [id] of Object.entries(votes)) {
    if (!(id in result)) result[id] = { voteCount: 0, pointsEarned: 0 };
  }
  return result;
}

export function scoreFastestFinger(
  reactionTimes: Record<string, number>,
  earlyTapIds: Set<string>
): Array<{ playerId: string; reactionTime: number; pointsEarned: number; early: boolean }> {
  const valid = Object.entries(reactionTimes)
    .filter(([id]) => !earlyTapIds.has(id))
    .sort((a, b) => a[1] - b[1]);

  return valid.map(([playerId, reactionTime], rank) => {
    let pointsEarned = 0;
    if (rank === 0) pointsEarned = POINTS.TAP_FIRST;
    else if (rank === 1) pointsEarned = POINTS.TAP_SECOND;
    else if (rank === 2) pointsEarned = POINTS.TAP_THIRD;
    return { playerId, reactionTime, pointsEarned, early: false };
  });
}

export function scoreMostLikelyTo(
  votes: Record<string, string> // voterId → targetPlayerId
): Record<string, { voteCount: number; pointsEarned: number; voterIds: string[] }> {
  const tally: Record<string, { count: number; voters: string[] }> = {};
  for (const [voterId, targetId] of Object.entries(votes)) {
    if (!tally[targetId]) tally[targetId] = { count: 0, voters: [] };
    tally[targetId].count++;
    tally[targetId].voters.push(voterId);
  }
  const maxVotes = Math.max(0, ...Object.values(tally).map((t) => t.count));
  const result: Record<string, { voteCount: number; pointsEarned: number; voterIds: string[] }> = {};
  for (const [id, { count, voters }] of Object.entries(tally)) {
    result[id] = {
      voteCount: count,
      pointsEarned: count === maxVotes && count > 0 ? POINTS.MOST_VOTES : 0,
      voterIds: voters,
    };
  }
  return result;
}
