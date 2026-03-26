import mochiImg from "@/assets/mochi.png";
import { motion } from "framer-motion";
import { useState } from "react";

interface LandingPageProps {
  onStart: (username: string) => void;
}

const LandingPage = ({ onStart }: LandingPageProps) => {
  const [username, setUsername] = useState("");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      {/* Logo */}
      <motion.h1
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 font-display text-6xl font-900 tracking-tight text-gradient-primary sm:text-7xl"
      >
        GenCross
      </motion.h1>

      {/* Mochi + speech bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-8 flex flex-col items-center gap-2"
      >
        <img
          src={mochiImg}
          alt="Mochi, GenLayer's mascot"
          className="h-28 w-28 object-contain sm:h-36 sm:w-36"
        />
        <div className="relative mt-1 max-w-[280px] rounded-xl border border-border bg-secondary px-4 py-3 shadow-soft">
          <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t border-border bg-secondary" />
          <p className="text-center font-body text-sm leading-relaxed text-foreground">
            How well do you know GenLayer? Let's find out! 🚀
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="w-full max-w-xs space-y-4"
      >
        <p className="text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Fill in the crossword using the clues. Solve all clues as fast as you can!
        </p>

        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value.slice(0, 20))}
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-center font-body text-base text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30"
        />

        <button
          disabled={!username.trim()}
          onClick={() => onStart(username.trim())}
          className="w-full rounded-lg bg-primary px-6 py-3 font-display text-lg font-700 text-primary-foreground shadow-glow transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Play
        </button>
      </motion.div>
    </div>
  );
};

export default LandingPage;
