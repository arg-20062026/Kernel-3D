
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
  });

  it("identifies an unsafe state", () => {
    const unsafeInput: BankerInput = {
      allocation: [[1, 0], [0, 1]],
      max: [[2, 0], [0, 2]],
      available: [0, 0],
    };

    const result = runSafetyAlgorithm(unsafeInput);

    expect(result.isSafe).toBe(false);
    expect(result.unfinishedProcesses).toEqual([0, 1]);
  });

  it("rejects allocation greater than maximum claim", () => {
    expect(() =>
      calculateNeed([[3]], [[2]]),
    ).toThrow();
  });
});
