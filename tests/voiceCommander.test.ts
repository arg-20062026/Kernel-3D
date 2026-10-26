import { describe, expect, it } from "vitest";
import {
  normalizeVoiceInput,
  parseSpokenNumber,
  parseProcessCount,
  parseResourceCount,
  parseMatrixEditCommand,
  isExactCommand,
} from "../src/utils/voiceCommander";
import { generateDeterministicPreset } from "../src/data/presets";
import { calculateNeed, runSafetyAlgorithm } from "../src/algorithm/banker";

describe("Voice Commander & Input Normalization", () => {
  it("normalizes voice input by trimming, lowercasing and removing punctuation", () => {
    expect(normalizeVoiceInput("  Start! ")).toBe("start");
    expect(normalizeVoiceInput("Change, the allocation?")).toBe(
      "change the allocation",
    );
    expect(normalizeVoiceInput("Next.")).toBe("next");
  });

  it("parses spoken number words and digits correctly", () => {
    expect(parseSpokenNumber("one")).toBe(1);
    expect(parseSpokenNumber("two")).toBe(2);
    expect(parseSpokenNumber("three")).toBe(3);
    expect(parseSpokenNumber("four")).toBe(4);
    expect(parseSpokenNumber("five")).toBe(5);
    expect(parseSpokenNumber("six")).toBe(6);
    expect(parseSpokenNumber("seven")).toBe(7);
    expect(parseSpokenNumber("eight")).toBe(8);
    expect(parseSpokenNumber("nine")).toBe(9);
    expect(parseSpokenNumber("ten")).toBe(10);
    expect(parseSpokenNumber("5")).toBe(5);
    expect(parseSpokenNumber("invalid")).toBeNull();
  });

  it("parses process count from natural speech phrases", () => {
    expect(parseProcessCount("five")).toBe(5);
    expect(parseProcessCount("five processes")).toBe(5);
    expect(parseProcessCount("I want five processes")).toBe(5);
    expect(parseProcessCount("give me 4 processes")).toBe(4);
    expect(parseProcessCount("3")).toBe(3);
    expect(parseProcessCount("hello there")).toBeNull();
  });

  it("parses resource count from natural speech phrases", () => {
    expect(parseResourceCount("three")).toBe(3);
    expect(parseResourceCount("three resources")).toBe(3);
    expect(parseResourceCount("three resource types")).toBe(3);
    expect(parseResourceCount("2")).toBe(2);
    expect(parseResourceCount("unknown")).toBeNull();
  });

  it("correctly identifies exact primary commands without substring false positives", () => {
    expect(isExactCommand("start", "start")).toBe(true);
    expect(isExactCommand("start please", "start")).toBe(true);
    expect(isExactCommand("let's start", "start")).toBe(true);
    expect(isExactCommand("lets start", "start")).toBe(true);
    expect(isExactCommand("start simulation", "start")).toBe(true);
    expect(isExactCommand("restart", "start")).toBe(false);
    expect(isExactCommand("starting line", "start")).toBe(false);

    expect(isExactCommand("next", "next")).toBe(true);
    expect(isExactCommand("continue", "next")).toBe(true);
    expect(isExactCommand("skip", "skip")).toBe(true);
    expect(isExactCommand("back", "back")).toBe(true);
    expect(isExactCommand("exit", "exit")).toBe(true);
    expect(isExactCommand("play", "play")).toBe(true);
    expect(isExactCommand("pause", "pause")).toBe(true);
    expect(isExactCommand("reset", "reset")).toBe(true);
  });

  it("parses valid matrix row edit voice commands", () => {
    const res = parseMatrixEditCommand(
      "change the allocation matrix of process p2 to 1 3 4",
      5,
      3,
    );
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.edit.matrixType).toBe("allocation");
      expect(res.edit.processIndex).toBe(2);
      expect(res.edit.values).toEqual([1, 3, 4]);
    }

    const res2 = parseMatrixEditCommand(
      "change max matrix of process p0 to 7 5 3",
      5,
      3,
    );
    expect(res2.success).toBe(true);
    if (res2.success) {
      expect(res2.edit.matrixType).toBe("max");
      expect(res2.edit.processIndex).toBe(0);
      expect(res2.edit.values).toEqual([7, 5, 3]);
    }
  });

  it("rejects invalid or ambiguous matrix edit commands", () => {
    // Missing matrix type
    const resNoType = parseMatrixEditCommand(
      "change process p1 to 1 2 3",
      5,
      3,
    );
    expect(resNoType.success).toBe(false);

    // Missing 'to'
    const resNoTo = parseMatrixEditCommand(
      "change allocation of process p1 1 2 3",
      5,
      3,
    );
    expect(resNoTo.success).toBe(false);

    // Process out of range
    const resOutOfRange = parseMatrixEditCommand(
      "change allocation of process p9 to 1 2 3",
      5,
      3,
    );
    expect(resOutOfRange.success).toBe(false);

    // Mismatched value count (heard 2 values instead of 3)
    const resWrongCount = parseMatrixEditCommand(
      "change allocation of process p1 to 1 2",
      5,
      3,
    );
    expect(resWrongCount.success).toBe(false);
  });
});

describe("Deterministic Predefined Matrix Generation", () => {
  it("generates mathematically valid configurations for arbitrary dimensions", () => {
    const dims = [
      [3, 2],
      [4, 3],
      [5, 4],
      [6, 3],
      [2, 2],
    ];

    dims.forEach(([pCount, rCount]) => {
      const preset = generateDeterministicPreset(pCount, rCount);
      expect(preset.processCount).toBe(pCount);
      expect(preset.resourceCount).toBe(rCount);
      expect(preset.allocation).toHaveLength(pCount);
      expect(preset.max).toHaveLength(pCount);
      expect(preset.available).toHaveLength(rCount);

      // Allocation must be <= Max for every cell
      const need = calculateNeed(preset.allocation, preset.max);
      expect(need).toHaveLength(pCount);
      preset.allocation.forEach((row, i) => {
        row.forEach((allocVal, j) => {
          expect(allocVal).toBeLessThanOrEqual(preset.max[i][j]);
          expect(need[i][j]).toBe(preset.max[i][j] - allocVal);
        });
      });

      // Valid safety evaluation
      const safety = runSafetyAlgorithm({
        allocation: preset.allocation,
        max: preset.max,
        available: preset.available,
      });
      expect(safety).toBeDefined();
    });
  });
});
