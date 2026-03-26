import { useState, useCallback, useEffect, useRef } from "react";
import { clues, buildGrid, getCellsForClue, type ClueData } from "@/data/crosswordData";
import Keyboard from "./Keyboard";
import CluesPanel from "./CluesPanel";
import { playSuccessSound, playCompleteSound } from "@/utils/sound";
import { formatTime } from "@/utils/leaderboard";

interface GameScreenProps {
  username: string;
  onComplete: (time: number, gridSnapshot: Map<string, string>) => void;
}

const { cells: gridCells, gridRows, gridCols } = buildGrid();

const sortedClues = [...clues].sort((a, b) => a.clueNumber - b.clueNumber);

const GameScreen = ({ username, onComplete }: GameScreenProps) => {
  const [userInputs, setUserInputs] = useState<Map<string, string>>(new Map());
  const [activeClueIdx, setActiveClueIdx] = useState(0);
  const [activeCellIdx, setActiveCellIdx] = useState(0);
  const [solvedClues, setSolvedClues] = useState<Set<number>>(new Set());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showCluesPanel, setShowCluesPanel] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const gridRef = useRef<HTMLDivElement>(null);

  const activeClue = sortedClues[activeClueIdx];
  const activeCells = getCellsForClue(activeClue);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Check if a clue is solved
  const checkClue = useCallback(
    (clue: ClueData, inputs: Map<string, string>) => {
      const keys = getCellsForClue(clue);
      const chars = clue.answer.split("");
      return chars.every((ch, i) => inputs.get(keys[i]) === ch);
    },
    []
  );

  // Auto-advance to next unsolved clue when current is solved
  const advanceToNextUnsolved = useCallback(
    (newSolved: Set<number>) => {
      if (newSolved.size === sortedClues.length) return;
      let idx = activeClueIdx;
      for (let i = 0; i < sortedClues.length; i++) {
        idx = (activeClueIdx + 1 + i) % sortedClues.length;
        if (!newSolved.has(sortedClues[idx].clueNumber)) break;
      }
      setActiveClueIdx(idx);
      setActiveCellIdx(0);
    },
    [activeClueIdx]
  );

  const handleKey = useCallback(
    (key: string) => {
      if (solvedClues.has(activeClue.clueNumber)) {
        // If current clue solved, advance
        advanceToNextUnsolved(solvedClues);
        return;
      }

      setUserInputs((prev) => {
        const next = new Map(prev);
        const cellKey = activeCells[activeCellIdx];

        if (key === "BACKSPACE") {
          next.delete(cellKey);
          setActiveCellIdx((i) => Math.max(0, i - 1));
          return next;
        }

        next.set(cellKey, key);

        // Check completion
        const clue = activeClue;
        const chars = clue.answer.split("");
        const keys = activeCells;
        const allFilled = chars.every((ch, i) => next.get(keys[i]) === ch);
        if (allFilled) {
          playSuccessSound();
          const newSolved = new Set(solvedClues);
          newSolved.add(clue.clueNumber);
          // Also check other clues that may now be complete due to shared cells
          for (const c of sortedClues) {
            if (!newSolved.has(c.clueNumber) && checkClue(c, next)) {
              newSolved.add(c.clueNumber);
            }
          }
          setSolvedClues(newSolved);
          if (newSolved.size === sortedClues.length) {
            clearInterval(timerRef.current);
            playCompleteSound();
            setTimeout(() => onComplete(elapsed, next), 800);
          } else {
            setTimeout(() => advanceToNextUnsolved(newSolved), 300);
          }
        } else {
          // Move to next empty cell
          let nextIdx = activeCellIdx + 1;
          if (nextIdx >= activeCells.length) nextIdx = activeCells.length - 1;
          setActiveCellIdx(nextIdx);
        }

        return next;
      });
    },
    [activeClue, activeCellIdx, activeCells, solvedClues, elapsed, onComplete, advanceToNextUnsolved, checkClue]
  );

  const handleCellClick = (cellKey: string) => {
    // Find which clue this cell belongs to and select it
    const idx = activeCells.indexOf(cellKey);
    if (idx >= 0) {
      setActiveCellIdx(idx);
      return;
    }
    // Find a clue that contains this cell
    for (let i = 0; i < sortedClues.length; i++) {
      const keys = getCellsForClue(sortedClues[i]);
      const ci = keys.indexOf(cellKey);
      if (ci >= 0) {
        setActiveClueIdx(i);
        setActiveCellIdx(ci);
        return;
      }
    }
  };

  const handleHint = () => {
    if (hintsUsed >= 5) return;
    // Find first empty or wrong cell in active clue
    const chars = activeClue.answer.split("");
    for (let i = 0; i < chars.length; i++) {
      if (userInputs.get(activeCells[i]) !== chars[i]) {
        setUserInputs((prev) => {
          const next = new Map(prev);
          next.set(activeCells[i], chars[i]);
          return next;
        });
        setHintsUsed((h) => h + 1);
        break;
      }
    }
  };

  const navigateClue = (dir: -1 | 1) => {
    let idx = activeClueIdx;
    for (let i = 0; i < sortedClues.length; i++) {
      idx = (activeClueIdx + dir + sortedClues.length + i * dir) % sortedClues.length;
      if (idx < 0) idx += sortedClues.length;
      if (!solvedClues.has(sortedClues[idx]?.clueNumber)) break;
    }
    setActiveClueIdx(Math.max(0, Math.min(idx, sortedClues.length - 1)));
    setActiveCellIdx(0);
  };

  // Calculate cell size based on viewport
  const cellSize = Math.min(Math.floor((window.innerWidth - 32) / gridCols), 28);

  const highlightedSet = new Set(activeCells);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="font-display text-xl font-900 text-gradient-primary sm:text-2xl">GenCross</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCluesPanel(true)}
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-600 text-secondary-foreground transition-all hover:bg-muted"
          >
            All Clues
          </button>
          <div className="rounded-md bg-secondary px-3 py-1.5 font-display text-sm font-600 text-foreground">
            ⏱ {formatTime(elapsed)}
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 overflow-auto px-2 py-3">
        <div
          ref={gridRef}
          className="mx-auto"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridRows}, ${cellSize}px)`,
            gap: "1px",
            width: `${gridCols * (cellSize + 1) - 1}px`,
          }}
        >
          {Array.from({ length: gridRows }).map((_, r) =>
            Array.from({ length: gridCols }).map((_, c) => {
              const key = `${r},${c}`;
              const cell = gridCells.get(key);
              if (!cell) {
                return <div key={key} />;
              }

              const isHighlighted = highlightedSet.has(key);
              const isActive = activeCells[activeCellIdx] === key;
              const isSolved = cell.clueNumbers.every((cn) => solvedClues.has(cn));
              const userLetter = userInputs.get(key) || "";

              return (
                <div
                  key={key}
                  onClick={() => handleCellClick(key)}
                  className={`relative flex cursor-pointer items-center justify-center border transition-all ${
                    isSolved
                      ? "cell-correct"
                      : isActive
                      ? "cell-active border-2"
                      : isHighlighted
                      ? "cell-highlighted"
                      : "border-border bg-card"
                  }`}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    fontSize: cellSize * 0.5,
                  }}
                >
                  {cell.displayNumber && (
                    <span
                      className="absolute left-0.5 top-0 font-display font-600 leading-none text-muted-foreground"
                      style={{ fontSize: cellSize * 0.25 }}
                    >
                      {cell.displayNumber}
                    </span>
                  )}
                  <span className="font-display font-700 text-foreground">{userLetter}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Clue bar + keyboard */}
      <div className="border-t border-border bg-background pb-safe">
        {/* Active clue */}
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            onClick={() => navigateClue(-1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all hover:brightness-110"
          >
            ‹
          </button>
          <div className="flex-1 text-center text-sm font-500 text-foreground">
            <span className="font-700 text-primary">{activeClue.clueNumber}.</span>{" "}
            {activeClue.clueText}
            <span className="ml-1 text-xs text-muted-foreground">
              ({activeClue.direction})
            </span>
          </div>
          <button
            onClick={() => navigateClue(1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-all hover:brightness-110"
          >
            ›
          </button>
        </div>

        {/* Hint button */}
        <div className="flex justify-center pb-1">
          <button
            onClick={handleHint}
            disabled={hintsUsed >= 5}
            className="rounded-md border border-accent bg-background px-4 py-1 text-xs font-600 text-accent transition-all hover:bg-accent/5 disabled:opacity-40"
          >
            💡 Hint ({5 - hintsUsed} left)
          </button>
        </div>

        <Keyboard onKey={handleKey} />
      </div>

      <CluesPanel open={showCluesPanel} onClose={() => setShowCluesPanel(false)} solvedClues={solvedClues} />
    </div>
  );
};

export default GameScreen;
