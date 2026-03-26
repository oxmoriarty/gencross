import mochiImg from "@/assets/mochi.png";
import { motion } from "framer-motion";

interface LandingPageProps {
  onStart: (username: string) => void;
}

import { useState } from "react";

const LandingPage = ({ onStart }: LandingPageProps) => {
  const [username, setUsername] = useState("");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <h1 className="font-display text-5xl font-900 tracking-tight text-gradient-primary sm:text-7xl">
          GenCross
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative mb-8 flex items-end gap-3"
      >
        {/* Speech bubble */}
        <div className="relative max-w-xs rounded-2xl border border-border bg-secondary px-5 py-4 shadow-soft">
          <p className="font-body text-sm leading-relaxed text-foreground sm:text-base">
            How well do you know GenLayer? Let's find out! 🚀
          </p>
          {/* Bubble tail pointing right */}
          <div className="absolute -right-2 bottom-4 h-4 w-4 rotate-45 border-b border-r border-border bg-secondary" />
        </div>
        <img
          src={mochiImg}
          alt="Mochi, GenLayer's mascot"
          className="h-24 w-24 object-contain sm:h-32 sm:w-32"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="w-full max-w-sm space-y-5"
      >
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          Fill in the crossword using the clues. Use the on-screen keyboard to
          enter letters. Solve all clues as fast as you can.
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
