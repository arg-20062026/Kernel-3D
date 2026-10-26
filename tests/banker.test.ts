import { describe, expect, it } from "vitest";
import {
  calculateNeed,
  runSafetyAlgorithm,
  type BankerInput,
} from "../src/algorithm/banker";

const safeInput: BankerInput = {
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

describe("Banker's Algorithm", () => {
  it("calculates the Need matrix correctly", () => {
    expect(calculateNeed(safeInput.allocation, safeInput.max)).toEqual([
      [7, 4, 3],
      [1, 2, 2],
      [6, 0, 0],
      [0, 1, 1],
      [4, 3, 1],
    ]);
  });

  it("finds the correct safe sequence", () => {
    const result = runSafetyAlgorithm(safeInput);

    expect(result.isSafe).toBe(true);
    expect(result.safeSequence).toEqual([1, 3, 4, 0, 2]);
    expect(result.steps).toHaveLength(5);
    expect(result.unfinishedProcesses).toHaveLength(0);
  });

  it("identifies an unsafe state", () => {
    const unsafeInput: BankerInput = {
      allocation: [
        [1, 0],
        [0, 1],
      ],
      max: [
        [2, 0],
        [0, 2],
      ],
      available: [0, 0],
    };

    const result = runSafetyAlgorithm(unsafeInput);

    expect(result.isSafe).toBe(false);
    expect(result.unfinishedProcesses).toEqual([0, 1]);
    expect(result.safeSequence).toHaveLength(0);
  });

  it("rejects allocation greater than maximum claim", () => {
    expect(() => calculateNeed([[3]], [[2]])).toThrow(
      /Max exceeds Allocation/,
    );
  });

  it("handles 1 process and 1 resource type", () => {
    const singleInput: BankerInput = {
      allocation: [[2]],
      max: [[5]],
      available: [3],
    };

    const need = calculateNeed(singleInput.allocation, singleInput.max);
    expect(need).toEqual([[3]]);

    const result = runSafetyAlgorithm(singleInput);
    expect(result.isSafe).toBe(true);
    expect(result.safeSequence).toEqual([0]);
    expect(result.finalWork).toEqual([5]);
  });

  it("handles different dimensions (e.g. 3 processes, 4 resources)", () => {
    const input3x4: BankerInput = {
      allocation: [
        [1, 0, 2, 1],
        [2, 1, 0, 0],
        [0, 2, 1, 1],
      ],
      max: [
        [2, 1, 3, 2],
        [3, 2, 1, 1],
        [1, 3, 2, 2],
      ],
      available: [1, 2, 1, 1],
    };

    const need = calculateNeed(input3x4.allocation, input3x4.max);
    expect(need).toEqual([
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ]);

    const result = runSafetyAlgorithm(input3x4);
    expect(result.isSafe).toBe(true);
    expect(result.safeSequence).toHaveLength(3);
    expect(new Set(result.safeSequence).size).toBe(3);
  });

  it("verifies state with multiple possible safe sequences finds a valid one", () => {
    // Both P0 and P1 have Need <= Available immediately
    const multiInput: BankerInput = {
      allocation: [
        [1, 0],
        [0, 1],
      ],
      max: [
        [2, 1],
        [1, 2],
      ],
      available: [2, 2],
    };

    const result = runSafetyAlgorithm(multiInput);
    expect(result.isSafe).toBe(true);
    expect(result.safeSequence).toHaveLength(2);
    // Every process in safe sequence must be valid
    expect(result.safeSequence).toContain(0);
    expect(result.safeSequence).toContain(1);
  });

  it("identifies partially completed safe trace with remaining blocked processes", () => {
    // P0 can complete, but P1 and P2 remain blocked
    const partialInput: BankerInput = {
      allocation: [
        [1, 0],
        [2, 2],
        [3, 1],
      ],
      max: [
        [2, 0],
        [5, 5],
        [6, 4],
      ],
      available: [1, 0],
    };

    const result = runSafetyAlgorithm(partialInput);
    expect(result.isSafe).toBe(false);
    expect(result.safeSequence).toEqual([0]);
    expect(result.unfinishedProcesses).toEqual([1, 2]);
  });

  it("rejects negative resource values", () => {
    const invalidInput: BankerInput = {
      allocation: [[-1, 0]],
      max: [[1, 0]],
      available: [1, 0],
    };

    expect(() => runSafetyAlgorithm(invalidInput)).toThrow(
      /Resource values must be non-negative integers/,
    );
  });

  it("rejects fractional/non-integer resource values", () => {
    const invalidInput: BankerInput = {
      allocation: [[1.5, 0]],
      max: [[2, 0]],
      available: [1, 0],
    };

    expect(() => runSafetyAlgorithm(invalidInput)).toThrow(
      /Resource values must be non-negative integers/,
    );
  });

  it("rejects negative or fractional available vector values", () => {
    const invalidInput: BankerInput = {
      allocation: [[1, 0]],
      max: [[2, 0]],
      available: [1, -0.5],
    };

    expect(() => runSafetyAlgorithm(invalidInput)).toThrow(
      /Available values must be non-negative integers/,
    );
  });

  it("rejects mismatched matrix dimensions", () => {
    const mismatchedRows: BankerInput = {
      allocation: [[1, 0]],
      max: [
        [2, 0],
        [1, 1],
      ],
      available: [1, 0],
    };

    expect(() => runSafetyAlgorithm(mismatchedRows)).toThrow(
      /Allocation and Max must have the same non-zero number of processes/,
    );

    const mismatchedCols: BankerInput = {
      allocation: [[1, 0, 1]],
      max: [[2, 0]],
      available: [1, 0, 1],
    };

    expect(() => runSafetyAlgorithm(mismatchedCols)).toThrow(
      /Every Max row must have the same number of resources/,
    );
  });

  it("rejects invalid Available vector dimensions", () => {
    const invalidAvail: BankerInput = {
      allocation: [[1, 0]],
      max: [[2, 0]],
      available: [1, 0, 5], // 3 values instead of 2
    };

    expect(() => runSafetyAlgorithm(invalidAvail)).toThrow(
      /Available must contain one value per resource type/,
    );
  });
});
