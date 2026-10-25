
export type Matrix = number[][];
export type Vector = number[];

export interface BankerInput {
  allocation: Matrix;
  max: Matrix;
  available: Vector;
}

export interface SafetyStep {
  process: number;
  workBefore: Vector;
  need: Vector;
  workAfter: Vector;
}

export interface SafetyResult {
  isSafe: boolean;
  safeSequence: number[];
  steps: SafetyStep[];
  unfinishedProcesses: number[];
  finalWork: Vector;
}

export function calculateNeed(
  allocation: Matrix,
  max: Matrix,
): Matrix {
  validateDimensions(allocation, max);

  return max.map((row, i) =>
    row.map((maximum, j) => {
      const allocated = allocation[i][j];

      if (maximum < allocated) {
        throw new Error(
          `Invalid data: Max exceeds Allocation for P${i}, resource ${j}.`,
        );
      }

      return maximum - allocated;
    }),
  );
}

export function validateDimensions(
  allocation: Matrix,
  max: Matrix,
): void {
  if (allocation.length === 0 || max.length !== allocation.length) {
    throw new Error("Allocation and Max must have the same non-zero number of processes.");
  }

  const resourceCount = allocation[0]?.length ?? 0;

  if (resourceCount === 0) {
    throw new Error("At least one resource type is required.");
  }

  if (max.some((row) => row.length !== resourceCount)) {
    throw new Error("Every Max row must have the same number of resources.");
  }

  if (allocation.some((row) => row.length !== resourceCount)) {
    throw new Error("Every Allocation row must have the same number of resources.");
  }

  if (
    [...allocation, ...max].some((row) =>
      row.some((value) => !Number.isSafeInteger(value) || value < 0),
    )
  ) {
    throw new Error("Resource values must be non-negative integers.");
  }
}

export function validateInput(input: BankerInput): void {
  validateDimensions(input.allocation, input.max);

  const resourceCount = input.allocation[0].length;

  if (input.available.length !== resourceCount) {
    throw new Error("Available must contain one value per resource type.");
  }

  if (
    input.available.some(
      (value) => !Number.isSafeInteger(value) || value < 0,
    )
  ) {
    throw new Error("Available values must be non-negative integers.");
  }
}

export function runSafetyAlgorithm(
  input: BankerInput,
): SafetyResult {
  validateInput(input);

  const { allocation, max, available } = input;
  const need = calculateNeed(allocation, max);

  const work = [...available];
  const finish = allocation.map(() => false);
  const safeSequence: number[] = [];
  const steps: SafetyStep[] = [];

  let progress = true;

  while (progress) {
    progress = false;

    for (let i = 0; i < allocation.length; i++) {
      if (finish[i]) continue;

      const canFinish = need[i].every(
        (required, j) => required <= work[j],
      );

      if (!canFinish) continue;

      const workBefore = [...work];
      const processNeed = [...need[i]];

      for (let j = 0; j < work.length; j++) {
        work[j] += allocation[i][j];
      }

      finish[i] = true;
      safeSequence.push(i);

      steps.push({
        process: i,
        workBefore,
        need: processNeed,
        workAfter: [...work],
      });

      progress = true;
    }
  }

  const unfinishedProcesses = finish
    .map((completed, i) => (completed ? -1 : i))
    .filter((i) => i !== -1);

  return {
    isSafe: unfinishedProcesses.length === 0,
    safeSequence,
    steps,
    unfinishedProcesses,
    finalWork: [...work],
  };
}
