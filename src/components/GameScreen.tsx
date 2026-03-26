import { useState, useCallback, useEffect, useRef, useMemo } from "react";
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

  const activeClue = sortedClues[activeClueIdx];
  const activeCells = getCellsForClue(activeClue);

  // Set of locked (solved) cell keys
  const lockedCells = useMemo(() => {
    const locked = new Set<string>();
    for (const clue of sortedClues) {
      if (solvedClues.has(clue.clueNumber)) {
        getCellsForClue(clue).forEach((k) => locked.add(k));
      }
    }
    return locked;
  }, [solvedClues]);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const checkClue = useCallback(
    (clue: ClueData, inputs: Map<string, string>) => {
      const keys = getCellsForClue(clue);
      const chars = clue.answer.split("");
      return chars.every((ch, i) => inputs.get(keys[i]) === ch);
    },
    []
  );

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
        advanceToNextUnsolved(solvedClues);
        return;
      }

      setUserInputs((prev) => {
        const next = new Map(prev);
        const cellKey = activeCells[activeCellIdx];

        // Don't allow editing locked cells
        if (lockedCells.has(cellKey)) {
          // Skip to next unlocked cell
          let nextIdx = activeCellIdx + (key === "BACKSPACE" ? -1 : 1);
          nextIdx = Math.max(0, Math.min(nextIdx, activeCells.length - 1));
          setActiveCellIdx(nextIdx);
          return prev;
        }

        if (key === "BACKSPACE") {
          next.delete(cellKey);
          // Move back, skipping locked cells
          let ni = activeCellIdx - 1;
          while (ni >= 0 && lockedCells.has(activeCells[ni])) ni--;
          setActiveCellIdx(Math.max(0, ni >= 0 ? ni : activeCellIdx));
          return next;
        }

        next.set(cellKey, key);

        const clue = activeClue;
        const chars = clue.answer.split("");
        const keys = activeCells;
        const allFilled = chars.every((ch, i) => next.get(keys[i]) === ch);
        if (allFilled) {
          playSuccessSound();
          const newSolved = new Set(solvedClues);
          newSolved.add(clue.clueNumber);
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
          let nextIdx = activeCellIdx + 1;
          // Skip locked cells
          while (nextIdx < activeCells.length && lockedCells.has(activeCells[nextIdx])) nextIdx++;
          if (nextIdx >= activeCells.length) nextIdx = activeCells.length - 1;
          setActiveCellIdx(nextIdx);
        }

        return next;
      });
    },
    [activeClue, activeCellIdx, activeCells, solvedClues, elapsed, onComplete, advanceToNextUnsolved, checkClue, lockedCells]
  );

  const handleCellClick = (cellKey: string) => {
    const idx = activeCells.indexOf(cellKey);
    if (idx >= 0) {
      setActiveCellIdx(idx);
      return;
    }
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

  // Responsive cell size: fit grid in available space
  const cellSize = useMemo(() => {
    const maxW = Math.floor((Math.min(window.innerWidth, 500) - 16) / gridCols);
    const maxH = Math.floor((window.innerHeight * 0.42) / gridRows);
    return Math.max(12, Math.min(maxW, maxH, 28));
  }, []);

  const highlightedSet = new Set(activeCells);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <h1 className="font-display text-lg font-900 text-gradient-primary sm:text-xl">GenCross</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCluesPanel(true)}
            className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-600 text-secondary-foreground transition-all hover:bg-muted"
          >
            All Clues
          </button>
          <div className="rounded-md bg-secondary px-2.5 py-1 font-display text-xs font-600 text-foreground sm:text-sm">
            ⏱ {formatTime(elapsed)}
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="flex shrink grow items-center justify-center overflow-hidden px-1 py-1">
        <div
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
                return (
                  <div
                    key={key}
                    className="bg-foreground/90"
                    style={{ width: cellSize, height: cellSize }}
                  />
                );
              }

              const isHighlighted = highlightedSet.has(key);
              const isActive = activeCells[activeCellIdx] === key;
              const isLocked = lockedCells.has(key);
              const userLetter = userInputs.get(key) || "";

              return (
                <div
                  key={key}
                  onClick={() => handleCellClick(key)}
                  className={`relative flex cursor-pointer items-center justify-center border transition-colors ${
                    isLocked
                      ? "cell-correct"
                      : isActive
                      ? "cell-active border-2"
                      : isHighlighted
                      ? "cell-highlighted"
                      : "border-border bg-card"
                  }`}
                  style={{ width: cellSize, height: cellSize, fontSize: cellSize * 0.48 }}
                >
                  {cell.displayNumber && (
                    <span
                      className="absolute left-px top-0 font-display font-700 leading-none text-muted-foreground"
                      style={{ fontSize: Math.max(6, cellSize * 0.22) }}
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

      {/* Bottom: clue bar + hint + keyboard */}
      <div className="shrink-0 border-t border-border bg-background pb-safe">
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <button
            onClick={() => navigateClue(-1)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground"
          >
            ‹
          </button>
          <div className="flex-1 text-center text-xs font-500 leading-tight text-foreground sm:text-sm">
            <span className="font-700 text-primary">{activeClue.clueNumber}.</span>{" "}
            {activeClue.clueText}
            <span className="ml-1 text-[10px] text-muted-foreground">({activeClue.direction})</span>
          </div>
          <button
            onClick={() => navigateClue(1)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground"
          >
            ›
          </button>
        </div>

        <div className="flex justify-center pb-0.5">
          <button
            onClick={handleHint}
            disabled={hintsUsed >= 5}
            className="rounded-md border border-accent bg-background px-3 py-0.5 text-xs font-600 text-accent transition-all hover:bg-accent/5 disabled:opacity-40"
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
