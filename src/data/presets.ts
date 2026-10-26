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


/**
 * Deterministically generates a valid predefined matrix configuration
 * for arbitrary process and resource counts.
 * Uses textbook presets when dimensions match, otherwise computes
 * a strictly validated model where Allocation <= Maximum.
 */
export function generateDeterministicPreset(
  processCount: number,
  resourceCount: number,
): SimulationModel {
  if (processCount === 5 && resourceCount === 3) {
    return structuredClone(CLASSIC_5X3_PRESET);
  }
  if (processCount === 4 && resourceCount === 2) {
    return structuredClone(UNSAFE_PRESET);
  }
  if (processCount === 3 && resourceCount === 2) {
    return structuredClone(COMPACT_3X2_PRESET);
  }

  const processNames = createDefaultProcessNames(processCount);
  const resourceNames = createDefaultResourceNames(resourceCount);

  const allocation: number[][] = [];
  const max: number[][] = [];

  for (let i = 0; i < processCount; i++) {
    const allocRow: number[] = [];
    const maxRow: number[] = [];
    for (let j = 0; j < resourceCount; j++) {
      // Deterministic allocation: small safe numbers
      const allocVal = (i + j) % 3;
      allocRow.push(allocVal);
      // Max claim is always >= allocation
      const neededExtra = ((i * 2 + j) % 3) + 1;
      maxRow.push(allocVal + neededExtra);
    }
    allocation.push(allocRow);
    max.push(maxRow);
  }

  // Generous available vector so initial processes can complete
  const available: number[] = Array.from(
    { length: resourceCount },
    (_, j) => 2 + (j % 2),
  );

  return {
    processCount,
    resourceCount,
    processNames,
    resourceNames,
    allocation,
    max,
    available,
  };
}
