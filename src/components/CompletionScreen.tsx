import { useRef } from "react";
import { toPng } from "html-to-image";
import { formatTime } from "@/utils/leaderboard";
import { motion } from "framer-motion";

interface CompletionScreenProps {
  username: string;
  time: number;
  score: number;
  onPlayAgain: () => void;
  gridSnapshot: Map<string, string>; // key -> letter
  onShowLeaderboard: () => void;
}

const CompletionScreen = ({ username, time, score, onPlayAgain, onShowLeaderboard }: CompletionScreenProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-glow"
      >
        <h1 className="mb-2 text-center font-display text-3xl font-900 text-gradient-primary">
          GenCross
        </h1>
        <p className="mb-6 text-center text-lg font-600 text-foreground">
          🎉 Congratulations!
        </p>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          You completed GenCross!
        </p>

        <div className="mb-6 space-y-3 rounded-xl bg-secondary p-4">
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
      </motion.div>

      <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
        <button
          onClick={handleDownload}
          className="w-full rounded-lg border border-primary bg-background px-6 py-3 font-display text-sm font-600 text-primary transition-all hover:bg-primary/5"
        >
          Download Result
        </button>
        <button
          onClick={onShowLeaderboard}
          className="w-full rounded-lg border border-border bg-secondary px-6 py-3 font-display text-sm font-600 text-secondary-foreground transition-all hover:bg-muted"
        >
          🏆 Leaderboard
        </button>
        <button
          onClick={onPlayAgain}
          className="w-full rounded-lg bg-primary px-6 py-3 font-display text-sm font-600 text-primary-foreground shadow-glow transition-all hover:brightness-110"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default CompletionScreen;
