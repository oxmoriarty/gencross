export interface ClueData {
  clueNumber: number;
  clueText: string;
  answer: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

export const clues: ClueData[] = [
  { clueNumber: 1, clueText: "GenLayer's Consensus Mechanism is ____ Democracy", answer: "OPTIMISTIC", row: 14, col: 6, direction: "across" },
  { clueNumber: 2, clueText: "Equivalence _____", answer: "PRINCIPLE", row: 8, col: 14, direction: "down" },
  { clueNumber: 3, clueText: "The name of GenLayer's mascot", answer: "MOCHI", row: 16, col: 12, direction: "across" },
  { clueNumber: 4, clueText: "Intelligent Contracts are written in this language", answer: "PYTHON", row: 18, col: 14, direction: "across" },
  { clueNumber: 5, clueText: "AI powered web3 marketing platform built on Genlayer", answer: "RALLY", row: 19, col: 5, direction: "across" },
  { clueNumber: 6, clueText: "Highest role on Genlayer server", answer: "SINGULARITY", row: 1, col: 0, direction: "down" },
  { clueNumber: 7, clueText: "Name of GenLayer's current testnet", answer: "BRADBURY", row: 0, col: 4, direction: "down" },
  { clueNumber: 8, clueText: "Genlayer is the ___ layer for the internet", answer: "INTELLIGENCE", row: 3, col: 19, direction: "down" },
  { clueNumber: 9, clueText: "Randomly chosen validator who proposes a result", answer: "LEADER", row: 12, col: 3, direction: "down" },
  { clueNumber: 10, clueText: "This can be done by any validator within the finality window", answer: "APPEAL", row: 11, col: 12, direction: "across" },
  { clueNumber: 11, clueText: "Intelligent Contracts can perform this type of operations", answer: "NON-DETERMINISTIC", row: 3, col: 0, direction: "across" },
  { clueNumber: 12, clueText: "Intelligent Contracts in GenLayer can interact directly with", answer: "LLMS", row: 0, col: 13, direction: "down" },
];

export interface CellData {
  row: number;
  col: number;
  letter: string;
  clueNumbers: number[];
  displayNumber?: number;
}

export function buildGrid(): { cells: Map<string, CellData>; gridRows: number; gridCols: number } {
  const cells = new Map<string, CellData>();

  for (const clue of clues) {
    const rawChars = clue.answer.split("");
    for (let i = 0; i < rawChars.length; i++) {
      const ch = rawChars[i];
      const r = clue.direction === "down" ? clue.row + i : clue.row;
      const c = clue.direction === "across" ? clue.col + i : clue.col;
      const key = `${r},${c}`;
      const existing = cells.get(key);
      if (existing) {
        if (!existing.clueNumbers.includes(clue.clueNumber)) {
          existing.clueNumbers.push(clue.clueNumber);
        }
      } else {
        cells.set(key, {
          row: r, col: c, letter: ch,
          clueNumbers: [clue.clueNumber],
        });
      }
    }
  }

  // Assign display numbers
  for (const clue of clues) {
    const key = `${clue.row},${clue.col}`;
    const cell = cells.get(key);
    if (cell) {
      if (!cell.displayNumber || clue.clueNumber < cell.displayNumber) {
        cell.displayNumber = clue.clueNumber;
      }
    }
  }

  let maxR = 0, maxC = 0;
  cells.forEach(cell => {
    if (cell.row > maxR) maxR = cell.row;
    if (cell.col > maxC) maxC = cell.col;
  });

  return { cells, gridRows: maxR + 1, gridCols: maxC + 1 };
}

export function getCellsForClue(clue: ClueData): string[] {
  const keys: string[] = [];
  const chars = clue.answer.split("");
  for (let i = 0; i < chars.length; i++) {
    const r = clue.direction === "down" ? clue.row + i : clue.row;
    const c = clue.direction === "across" ? clue.col + i : clue.col;
    keys.push(`${r},${c}`);
  }
  return keys;
}
