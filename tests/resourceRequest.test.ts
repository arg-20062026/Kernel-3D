import { describe, expect, it } from "vitest";
import { evaluateResourceRequest } from "../src/algorithm/resourceRequest";
import type { BankerInput } from "../src/algorithm/banker";

const initialInput: BankerInput = {
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

describe("Resource Request Algorithm", () => {
  it("grants a valid request when the resulting state is safe", () => {
    const result = evaluateResourceRequest(
      initialInput,
      1,
      [1, 0, 2],
    );

    expect(result.granted).toBe(true);

    if (result.granted) {
      expect(result.input.available).toEqual([2, 3, 0]);
      expect(result.input.allocation[1]).toEqual([3, 0, 2]);
      expect(result.safeSequence).toHaveLength(5);
    }
  });

  it("grants a zero-resource request if the system is already safe", () => {
    const result = evaluateResourceRequest(
      initialInput,
      0,
      [0, 0, 0],
    );

    expect(result.granted).toBe(true);
    if (result.granted) {
      expect(result.input.available).toEqual(initialInput.available);
      expect(result.input.allocation).toEqual(initialInput.allocation);
    }
  });

  it("handles different dimensions (e.g. 3 processes, 2 resources)", () => {
    const input3x2: BankerInput = {
      allocation: [
        [1, 1],
        [2, 0],
        [0, 1],
      ],
      max: [
        [2, 2],
        [3, 1],
        [1, 2],
      ],
      available: [1, 1],
    };

    const result = evaluateResourceRequest(input3x2, 0, [1, 0]);
    expect(result.granted).toBe(true);
    if (result.granted) {
      expect(result.input.available).toEqual([0, 1]);
      expect(result.input.allocation[0]).toEqual([2, 1]);
    }
  });

  it("rejects a request that exceeds the process Need", () => {
    const result = evaluateResourceRequest(
      initialInput,
      1,
      [2, 0, 0],
    );

    expect(result.granted).toBe(false);

    if (!result.granted) {
      expect(result.reason).toBe("exceeds-need");
    }
  });

  it("rejects a request when resources are unavailable", () => {
    const result = evaluateResourceRequest(
      initialInput,
      0,
      [0, 0, 3],
    );

    expect(result.granted).toBe(false);

    if (!result.granted) {
      expect(result.reason).toBe("unavailable");
    }
  });

  it("rejects a request that would create an unsafe state", () => {
    const result = evaluateResourceRequest(
      initialInput,
      4,
      [3, 3, 0],
    );

    expect(result.granted).toBe(false);

    if (!result.granted) {
      expect(result.reason).toBe("unsafe");
      expect(result.unfinishedProcesses).toBeDefined();
    }
  });

  it("rejects negative resource quantities", () => {
    const result = evaluateResourceRequest(
      initialInput,
      1,
      [-1, 0, 0],
    );

    expect(result.granted).toBe(false);

    if (!result.granted) {
      expect(result.reason).toBe("invalid-request");
    }
  });

  it("rejects fractional resource quantities", () => {
    const result = evaluateResourceRequest(
      initialInput,
      1,
      [0.5, 0, 0],
    );

    expect(result.granted).toBe(false);
    if (!result.granted) {
      expect(result.reason).toBe("invalid-request");
    }
  });

  it("rejects mismatched request vector length", () => {
    const result = evaluateResourceRequest(
      initialInput,
      1,
      [1, 0], // 2 values instead of 3
    );

    expect(result.granted).toBe(false);
    if (!result.granted) {
      expect(result.reason).toBe("invalid-request");
    }
  });

  it("rejects an invalid process index", () => {
    const result = evaluateResourceRequest(
      initialInput,
      10,
      [0, 0, 0],
    );

    expect(result.granted).toBe(false);

    if (!result.granted) {
      expect(result.reason).toBe("invalid-process");
    }

    const negativeResult = evaluateResourceRequest(
      initialInput,
      -1,
      [0, 0, 0],
    );
    expect(negativeResult.granted).toBe(false);
  });

  it("does not mutate the original system state", () => {
    const original = structuredClone(initialInput);

    evaluateResourceRequest(initialInput, 1, [1, 0, 2]);

    expect(initialInput).toEqual(original);
  });

  it("preserves state when request is rejected for being unsafe", () => {
    const original = structuredClone(initialInput);
    const result = evaluateResourceRequest(initialInput, 4, [3, 3, 0]);

    expect(result.granted).toBe(false);
    expect(initialInput).toEqual(original);
  });
});
