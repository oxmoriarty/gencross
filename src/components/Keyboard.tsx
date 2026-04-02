const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "-ZXCVBNM⌫"];

interface KeyboardProps {
  onKey: (key: string) => void;
}

const Keyboard = ({ onKey }: KeyboardProps) => {
  return (
    <div className="flex flex-col items-center gap-1.5 px-1 py-2">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex gap-[5px]">
          {row.split("").map((key) => {
            const isBackspace = key === "⌫";
            const isHyphen = key === "-";
            return (
              <button
                key={key}
                onClick={() => onKey(isBackspace ? "BACKSPACE" : key)}
                className={`flex items-center justify-center rounded-lg border border-border font-display font-600 shadow-soft transition-all active:scale-95 ${
                  isBackspace
                    ? "bg-accent px-5 py-3.5 text-lg text-accent-foreground"
                    : isHyphen
                    ? "bg-secondary px-5 py-3.5 text-lg text-secondary-foreground"
                    : "bg-card min-w-[32px] px-2.5 py-3.5 text-lg text-card-foreground sm:min-w-[38px] sm:px-3"
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
