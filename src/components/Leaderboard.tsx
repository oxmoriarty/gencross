import { getLeaderboard, formatTime, LEADERBOARD_LIMIT } from "@/utils/leaderboard";
import { motion } from "framer-motion";

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard = ({ onBack }: LeaderboardProps) => {
  const entries = getLeaderboard().slice(0, LEADERBOARD_LIMIT);

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <h1 className="mb-1 text-center font-display text-3xl font-900 text-gradient-primary">
          GenCross
        </h1>
        <h2 className="mb-6 text-center font-display text-xl font-600 text-foreground">
          🏆 Top 100 Leaderboard
        </h2>

        {entries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No scores yet. Be the first!</p>
        ) : (
          <div className="max-h-[68vh] overflow-auto rounded-xl border border-border shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="px-4 py-3 text-left font-display text-xs font-600 uppercase tracking-wider text-muted-foreground">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left font-display text-xs font-600 uppercase tracking-wider text-muted-foreground">
                    Player
                  </th>
                  <th className="px-4 py-3 text-right font-display text-xs font-600 uppercase tracking-wider text-muted-foreground">
                    Time
                  </th>
                  <th className="px-4 py-3 text-right font-display text-xs font-600 uppercase tracking-wider text-muted-foreground">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={i} className="border-t border-border transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-600 text-foreground">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </td>
                    <td className="px-4 py-3 text-foreground">{entry.username}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatTime(entry.time)}</td>
                    <td className="px-4 py-3 text-right font-700 text-primary">{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={onBack}
          className="mt-6 w-full rounded-lg bg-primary px-6 py-3 font-display text-sm font-600 text-primary-foreground shadow-glow transition-all hover:brightness-110"
        >
          Back
        </button>
      </motion.div>
    </div>
  );
};

export default Leaderboard;
