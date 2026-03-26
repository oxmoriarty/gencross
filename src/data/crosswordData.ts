export interface ClueData {
  clueNumber: number;
  clueText: string;
  answer: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

export const clues: ClueData[] = [
  { clueNumber: 1, clueText: "GenLayer's Consensus Mechanism is ____ Democracy", answer: "OPTIMISTIC", row: 13, col: 6, direction: "across" },
  { clueNumber: 2, clueText: "Equivalence _____", answer: "PRINCIPLE", row: 11, col: 14, direction: "down" },
  { clueNumber: 3, clueText: "The name of GenLayer's mascot", answer: "MOCHI", row: 15, col: 12, direction: "across" },
  { clueNumber: 4, clueText: "Intelligent Contracts are written in this language", answer: "PYTHON", row: 17, col: 14, direction: "across" },
  { clueNumber: 5, clueText: "AI powered web3 marketing platform on Genlayer", answer: "RALLY", row: 18, col: 11, direction: "across" },
  { clueNumber: 6, clueText: "Highest role on Genlayer server", answer: "SINGULARITY", row: 1, col: 0, direction: "down" },
  { clueNumber: 7, clueText: "Name of GenLayer's current testnet", answer: "BRADBURY", row: 0, col: 4, direction: "down" },
  { clueNumber: 8, clueText: "Genlayer is the ___ layer for the internet", answer: "INTELLIGENCE", row: 3, col: 15, direction: "down" },
  { clueNumber: 9, clueText: "Randomly chosen validator who proposes a result", answer: "LEADER", row: 18, col: 14, direction: "down" },
  { clueNumber: 10, clueText: "This can be done by any validator within the finality window", answer: "APPEAL", row: 11, col: 12, direction: "across" },
  { clueNumber: 11, clueText: "Intelligent Contracts perform this type of operations", answer: "NON-DETERMINISTIC", row: 3, col: 0, direction: "across" },
  { clueNumber: 12, clueText: "Intelligent Contracts in GenLayer can interact directly with", answer: "LLMS", row: 0, col: 13, direction: "down" },
];

// Build the grid structure
export interface CellData {
  row: number;
  col: number;
  letter: string;
  clueNumbers: number[]; // which clues this cell belongs to
  displayNumber?: number; // number to show in cell corner
}

export function buildGrid(): { cells: Map<string, CellData>; gridRows: number; gridCols: number } {
  const cells = new Map<string, CellData>();

  for (const clue of clues) {
    const chars = clue.answer.split("");
    for (let i = 0; i < chars.length; i++) {
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
          row: r, col: c, letter: chars[i],
          clueNumbers: [clue.clueNumber],
        });
      }
    }
  }

  // Assign display numbers: first cell of each clue gets the clue number
  // But if multiple clues start at same cell, use the lowest number
  const startCells = new Map<string, number>();
  for (const clue of clues) {
    const key = `${clue.row},${clue.col}`;
    const existing = startCells.get(key);
    if (!existing || clue.clueNumber < existing) {
      startCells.set(key, clue.clueNumber);
    }
  }

  // Actually we need to assign sequential numbers to start cells
  // Crossword convention: number cells top-to-bottom, left-to-right
  const allStarts: { key: string; row: number; col: number; clueNums: number[] }[] = [];
  for (const clue of clues) {
    const key = `${clue.row},${clue.col}`;
    const existing = allStarts.find(s => s.key === key);
    if (existing) {
      existing.clueNums.push(clue.clueNumber);
    } else {
      allStarts.push({ key, row: clue.row, col: clue.col, clueNums: [clue.clueNumber] });
    }
  }
  // Sort by row then col
  allStarts.sort((a, b) => a.row - b.row || a.col - b.col);

  // Use original clue numbers as display numbers for simplicity
  for (const clue of clues) {
    const key = `${clue.row},${clue.col}`;
    const cell = cells.get(key);
    if (cell) {
      // Use the clue number directly
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
