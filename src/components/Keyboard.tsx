const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "-ZXCVBNM⌫"];

interface KeyboardProps {
  onKey: (key: string) => void;
}

const Keyboard = ({ onKey }: KeyboardProps) => {
  return (
    <div className="flex flex-col items-center gap-1 px-1 py-1.5">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-[3px]">
          {row.split("").map((key) => {
            const isBackspace = key === "⌫";
            const isHyphen = key === "-";
            return (
              <button
                key={key}
                onClick={() => onKey(isBackspace ? "BACKSPACE" : key)}
                className={`flex items-center justify-center rounded-md border border-border font-display font-600 shadow-soft transition-all active:scale-95 ${
                  isBackspace
                    ? "bg-accent px-4 py-3 text-base text-accent-foreground"
                    : isHyphen
                    ? "bg-secondary px-4 py-3 text-base text-secondary-foreground"
                    : "bg-card min-w-[30px] px-2 py-3 text-base text-card-foreground sm:min-w-[36px] sm:px-3"
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
