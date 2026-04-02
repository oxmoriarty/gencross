import { useState, useCallback } from "react";
import LandingPage from "@/components/LandingPage";
import GameScreen from "@/components/GameScreen";
import CompletionScreen from "@/components/CompletionScreen";
import Leaderboard from "@/components/Leaderboard";
import { saveScore, calculateScore } from "@/utils/leaderboard";

type Screen = "landing" | "game" | "complete" | "leaderboard";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("landing");
  const [username, setUsername] = useState("");
  const [finalTime, setFinalTime] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [gridSnapshot, setGridSnapshot] = useState<Map<string, string>>(new Map());
  const [hintsUsed] = useState(0);

  const handleStart = useCallback((name: string) => {
    setUsername(name);
    setScreen("game");
  }, []);

  const handleComplete = useCallback(
    (time: number, snapshot: Map<string, string>) => {
      const score = calculateScore(time, hintsUsed);
      setFinalTime(time);
      setFinalScore(score);
      setGridSnapshot(snapshot);
      saveScore(username, score, time);
      setScreen("complete");
    },
    [username, hintsUsed]
  );

  const handlePlayAgain = useCallback(() => {
    setScreen("game");
  }, []);

  if (screen === "landing") {
    return (
      <div>
        <LandingPage onStart={handleStart} />
        <div className="flex justify-center pb-8">
          <button
            onClick={() => setScreen("leaderboard")}
            className="rounded-md border border-border px-4 py-2 text-sm font-600 text-muted-foreground transition-all hover:bg-muted"
          >
            🏆 View Leaderboard
          </button>
        </div>
      </div>
    );
  }

  if (screen === "game") {
    return <GameScreen username={username} onComplete={handleComplete} />;
  }

  if (screen === "complete") {
    return (
      <CompletionScreen
        username={username}
        time={finalTime}
        score={finalScore}
        onPlayAgain={handlePlayAgain}
        gridSnapshot={gridSnapshot}
      />
    );
  }

  return <Leaderboard onBack={() => setScreen("landing")} />;
};

export default Index;
