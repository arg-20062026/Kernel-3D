import type { SimulationModel } from "../types/simulation";

export const CLASSIC_5X3_PRESET: SimulationModel = {
  processCount: 5,
  resourceCount: 3,
  processNames: ["P0", "P1", "P2", "P3", "P4"],
  resourceNames: ["Resource A", "Resource B", "Resource C"],
  allocation: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ],
  max: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ],
  available: [3, 3, 2],
};

export const UNSAFE_PRESET: SimulationModel = {
  processCount: 4,
  resourceCount: 2,
  processNames: ["P0", "P1", "P2", "P3"],
  resourceNames: ["CPU Core", "GPU Memory"],
  allocation: [
    [2, 1],
    [1, 2],
    [1, 1],
    [0, 1],
  ],
  max: [
    [4, 3],
    [3, 4],
    [3, 2],
    [2, 3],
  ],
  available: [0, 0],
};

export const COMPACT_3X2_PRESET: SimulationModel = {
  processCount: 3,
  resourceCount: 2,
  processNames: ["P0", "P1", "P2"],
  resourceNames: ["Alpha", "Beta"],
  allocation: [
    [1, 2],
    [2, 0],
    [1, 1],
  ],
  max: [
    [2, 3],
    [3, 1],
    [2, 2],
  ],
  available: [1, 1],
};

export function createDefaultProcessNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `P${i}`);
}

export function createDefaultResourceNames(count: number): string[] {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length: count }, (_, i) => {
    if (i < 26) return `Resource ${letters[i]}`;
    return `Resource R${i + 1}`;
  });
}

export function createEmptyMatrix(rows: number, cols: number, fill = 0): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

export function createEmptyVector(length: number, fill = 0): number[] {
  return Array.from({ length }, () => fill);
}
