export interface LeaderboardEntry {
  username: string;
  score: number;
  time: number; // seconds
}

const KEY = "gencross_leaderboard";
export const LEADERBOARD_LIMIT = 100;

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function saveScore(username: string, score: number, time: number) {
  const lb = getLeaderboard();
  const existing = lb.find(e => e.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    if (score > existing.score) {
      existing.score = score;
      existing.time = time;
    }
  } else {
    lb.push({ username, score, time });
  }
  lb.sort((a, b) => b.score - a.score);
  localStorage.setItem(KEY, JSON.stringify(lb.slice(0, LEADERBOARD_LIMIT)));
}

export function calculateScore(timeSec: number, hintsUsed: number): number {
  // Base 1000, lose points for time and hints
  const timePenalty = Math.min(timeSec * 1.5, 700);
  const hintPenalty = hintsUsed * 50;
  return Math.max(1, Math.round(1000 - timePenalty - hintPenalty));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
