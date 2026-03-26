const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "-ZXCVBNM⌫"];

interface KeyboardProps {
  onKey: (key: string) => void;
}

const Keyboard = ({ onKey }: KeyboardProps) => {
  return (
    <div className="flex flex-col items-center gap-1.5 py-2">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {row.split("").map((key) => {
            const isBackspace = key === "⌫";
            const isHyphen = key === "-";
            return (
              <button
                key={key}
                onClick={() => onKey(isBackspace ? "BACKSPACE" : key)}
                className={`flex items-center justify-center rounded-md border border-border font-display font-600 shadow-soft transition-all active:scale-95 ${
                  isBackspace
                    ? "bg-accent px-3 py-2.5 text-sm text-accent-foreground sm:px-4 sm:text-base"
                    : isHyphen
                    ? "bg-secondary px-3 py-2.5 text-sm text-secondary-foreground sm:px-4 sm:text-base"
                    : "bg-card px-2.5 py-2.5 text-sm text-card-foreground sm:px-3.5 sm:text-base"
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
