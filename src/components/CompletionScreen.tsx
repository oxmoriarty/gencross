import { useRef } from "react";
import { toPng } from "html-to-image";
import { formatTime, getLeaderboard } from "@/utils/leaderboard";
import { buildGrid, clues, getCellsForClue } from "@/data/crosswordData";
import { motion } from "framer-motion";

interface CompletionScreenProps {
  username: string;
  time: number;
  score: number;
  onPlayAgain: () => void;
  gridSnapshot: Map<string, string>;
}

const { cells: gridCells, gridRows, gridCols } = buildGrid();

const CompletionScreen = ({ username, time, score, onPlayAgain, gridSnapshot }: CompletionScreenProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const entries = getLeaderboard().slice(0, 10);

  const miniCellSize = 16;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `gencross-${username}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      console.error("Failed to generate image");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-6 overflow-y-auto">
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-glow"
      >
        <h1 className="mb-1 text-center font-display text-2xl font-900 text-gradient-primary">
          GenCross
        </h1>
        <p className="mb-3 text-center text-base font-600 text-foreground">
          🎉 Congratulations!
        </p>
        <p className="mb-4 text-center text-xs text-muted-foreground">
          You completed GenCross!
        </p>

        <div className="mb-4 space-y-2 rounded-xl bg-secondary p-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Player</span>
            <span className="font-600 text-foreground">{username}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time</span>
            <span className="font-600 text-foreground">{formatTime(time)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Score</span>
            <span className="font-700 text-primary">{score}</span>
          </div>
        </div>

        {/* Mini completed grid */}
        <div className="mb-2 flex justify-center">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridCols}, ${miniCellSize}px)`,
              gridTemplateRows: `repeat(${gridRows}, ${miniCellSize}px)`,
              gap: "1px",
              backgroundColor: "#1a1a2e",
              border: "1px solid #1a1a2e",
            }}
          >
            {Array.from({ length: gridRows }).map((_, r) =>
              Array.from({ length: gridCols }).map((_, c) => {
                const key = `${r},${c}`;
                const cell = gridCells.get(key);
                if (!cell) {
                  return (
                    <div
                      key={key}
                      style={{ width: miniCellSize, height: miniCellSize, backgroundColor: "#1a1a2e" }}
                    />
                  );
                }
                const letter = gridSnapshot.get(key) || "";
                return (
                  <div
                    key={key}
                    className="flex items-center justify-center"
                    style={{
                      width: miniCellSize,
                      height: miniCellSize,
                      backgroundColor: "hsl(145 60% 88%)",
                      fontSize: miniCellSize * 0.55,
                    }}
                  >
                    <span className="font-display font-700 text-foreground">{letter}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>

      <div className="mt-4 flex w-full max-w-sm flex-col gap-3">
        <button
          onClick={handleDownload}
          className="w-full rounded-lg border border-primary bg-background px-6 py-3 font-display text-sm font-600 text-primary transition-all hover:bg-primary/5"
        >
          📥 Download Result
        </button>
        <button
          onClick={onPlayAgain}
          className="w-full rounded-lg bg-primary px-6 py-3 font-display text-sm font-600 text-primary-foreground shadow-glow transition-all hover:brightness-110"
        >
          Play Again
        </button>
      </div>

      {/* Inline Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-6 w-full max-w-sm"
      >
        <h2 className="mb-3 text-center font-display text-lg font-700 text-foreground">
          🏆 Leaderboard
        </h2>
        {entries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No scores yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="px-3 py-2 text-left font-display text-xs font-600 uppercase tracking-wider text-muted-foreground">Rank</th>
                  <th className="px-3 py-2 text-left font-display text-xs font-600 uppercase tracking-wider text-muted-foreground">Player</th>
                  <th className="px-3 py-2 text-right font-display text-xs font-600 uppercase tracking-wider text-muted-foreground">Time</th>
                  <th className="px-3 py-2 text-right font-display text-xs font-600 uppercase tracking-wider text-muted-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={i} className={`border-t border-border transition-colors hover:bg-muted/50 ${entry.username.toLowerCase() === username.toLowerCase() ? "bg-primary/5" : ""}`}>
                    <td className="px-3 py-2 font-600 text-foreground">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </td>
                    <td className="px-3 py-2 text-foreground">{entry.username}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{formatTime(entry.time)}</td>
                    <td className="px-3 py-2 text-right font-700 text-primary">{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CompletionScreen;
