import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { clues, buildGrid, getCellsForClue, type ClueData } from "@/data/crosswordData";
import Keyboard from "./Keyboard";
import CluesPanel from "./CluesPanel";
import { playSuccessSound, playCompleteSound, playKeySound } from "@/utils/sound";
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
  const [hintCells, setHintCells] = useState<Set<string>>(new Set());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showCluesPanel, setShowCluesPanel] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const activeClue = sortedClues[activeClueIdx];
  const activeCells = getCellsForClue(activeClue);

  // Set of locked (solved + hint) cell keys
  const lockedCells = useMemo(() => {
    const locked = new Set<string>();
    for (const clue of sortedClues) {
      if (solvedClues.has(clue.clueNumber)) {
        getCellsForClue(clue).forEach((k) => locked.add(k));
      }
    }
    // Also lock hint-revealed cells
    hintCells.forEach((k) => locked.add(k));
    return locked;
  }, [solvedClues, hintCells]);

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
      playKeySound();

      if (solvedClues.has(activeClue.clueNumber)) {
        advanceToNextUnsolved(solvedClues);
        return;
      }

      setUserInputs((prev) => {
        const next = new Map(prev);
        const cellKey = activeCells[activeCellIdx];

        if (lockedCells.has(cellKey)) {
          let nextIdx = activeCellIdx + (key === "BACKSPACE" ? -1 : 1);
          while (nextIdx >= 0 && nextIdx < activeCells.length && lockedCells.has(activeCells[nextIdx])) {
            nextIdx += key === "BACKSPACE" ? -1 : 1;
          }
          nextIdx = Math.max(0, Math.min(nextIdx, activeCells.length - 1));
          setActiveCellIdx(nextIdx);
          return prev;
        }

        if (key === "BACKSPACE") {
          next.delete(cellKey);
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
          while (nextIdx < activeCells.length && lockedCells.has(activeCells[nextIdx])) nextIdx++;
          if (nextIdx >= activeCells.length) nextIdx = activeCells.length - 1;
          setActiveCellIdx(nextIdx);
        }

        return next;
      });
    },
    [activeClue, activeCellIdx, activeCells, solvedClues, elapsed, onComplete, advanceToNextUnsolved, checkClue, lockedCells]
  );

  useEffect(() => {
    const handlePhysicalKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      if (/^[a-z]$/i.test(event.key)) {
        event.preventDefault();
        handleKey(event.key.toUpperCase());
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        handleKey("BACKSPACE");
      }
    };

    window.addEventListener("keydown", handlePhysicalKey);
    return () => window.removeEventListener("keydown", handlePhysicalKey);
  }, [handleKey]);

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
        const cellKey = activeCells[i];
        setUserInputs((prev) => {
          const next = new Map(prev);
          next.set(cellKey, chars[i]);
          return next;
        });
        setHintCells((prev) => {
          const next = new Set(prev);
          next.add(cellKey);
          return next;
        });
        setHintsUsed((h) => h + 1);

        // Check if this hint completes the clue
        setTimeout(() => {
          setUserInputs((current) => {
            const allFilled = chars.every((ch, j) => current.get(activeCells[j]) === ch);
            if (allFilled) {
              playSuccessSound();
              const newSolved = new Set(solvedClues);
              newSolved.add(activeClue.clueNumber);
              for (const c of sortedClues) {
                if (!newSolved.has(c.clueNumber) && checkClue(c, current)) {
                  newSolved.add(c.clueNumber);
                }
              }
              setSolvedClues(newSolved);
              if (newSolved.size === sortedClues.length) {
                clearInterval(timerRef.current);
                playCompleteSound();
                setTimeout(() => onComplete(elapsed, current), 800);
              }
            }
            return current;
          });
        }, 50);
        break;
      }
    }
  };

  // Allow navigating to solved clues too
  const navigateClue = (dir: -1 | 1) => {
    const idx = (activeClueIdx + dir + sortedClues.length) % sortedClues.length;
    setActiveClueIdx(idx);
    setActiveCellIdx(0);
  };

  const cellSize = useMemo(() => {
    const maxW = Math.floor((Math.min(window.innerWidth, 620) - 28) / gridCols);
    const maxH = Math.floor((window.innerHeight * 0.49) / gridRows);
    return Math.max(17, Math.min(maxW, maxH, 38));
  }, []);

  const highlightedSet = new Set(activeCells);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-3 py-1.5">
        <h1 className="font-display text-lg font-900 text-gradient-primary">GenCross</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCluesPanel(true)}
            className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-600 text-secondary-foreground transition-all hover:bg-muted"
          >
            All Clues
          </button>
          <div className="rounded-md bg-secondary px-2.5 py-1 font-display text-xs font-600 text-foreground">
            ⏱ {formatTime(elapsed)}
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="flex shrink grow items-center justify-center overflow-hidden px-3 py-2">
        <div
          className="mx-auto overflow-hidden rounded-lg"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridCols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridRows}, ${cellSize}px)`,
            gap: 0,
            backgroundColor: "hsl(var(--crossword-grid))",
            border: "1px solid hsl(var(--crossword-grid))",
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
                    className="cell-block"
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
                  className={`relative flex cursor-pointer items-center justify-center transition-colors ${
                    isLocked
                      ? "cell-correct text-foreground"
                      : isActive
                      ? "cell-active-current text-foreground"
                      : isHighlighted
                      ? "cell-highlighted text-foreground"
                      : userLetter
                      ? "cell-filled text-foreground"
                      : "cell-playable text-foreground"
                  }`}
                  style={{ width: cellSize, height: cellSize, fontSize: cellSize * 0.52 }}
                >
                  {cell.displayNumber && (
                    <span
                      className="absolute left-px top-0 font-display font-700 leading-none text-muted-foreground"
                      style={{ fontSize: Math.max(6, cellSize * 0.24) }}
                    >
                      {cell.displayNumber}
                    </span>
                  )}
                  <span className="font-display font-800">{userLetter}</span>
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-base font-700 text-primary-foreground"
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-base font-700 text-primary-foreground"
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
