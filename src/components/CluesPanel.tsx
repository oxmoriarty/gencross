import { clues, type ClueData } from "@/data/crosswordData";

interface CluesPanelProps {
  open: boolean;
  onClose: () => void;
  solvedClues: Set<number>;
}

const CluesPanel = ({ open, onClose, solvedClues }: CluesPanelProps) => {
  if (!open) return null;

  const across = clues.filter((c) => c.direction === "across").sort((a, b) => a.clueNumber - b.clueNumber);
  const down = clues.filter((c) => c.direction === "down").sort((a, b) => a.clueNumber - b.clueNumber);

  const renderClue = (c: ClueData) => (
    <li
      key={c.clueNumber}
      className={`text-sm ${solvedClues.has(c.clueNumber) ? "text-muted-foreground line-through" : "text-foreground"}`}
    >
      <span className="font-600">{c.clueNumber}.</span> {c.clueText}
    </li>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-700 text-foreground">All Clues</h2>
          <button onClick={onClose} className="rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-muted">
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 font-display text-sm font-600 uppercase tracking-wider text-primary">Across</h3>
            <ul className="space-y-1.5">{across.map(renderClue)}</ul>
          </div>
          <div>
            <h3 className="mb-2 font-display text-sm font-600 uppercase tracking-wider text-primary">Down</h3>
            <ul className="space-y-1.5">{down.map(renderClue)}</ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CluesPanel;
