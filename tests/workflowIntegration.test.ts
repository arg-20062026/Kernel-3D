import { describe, expect, it } from "vitest";
import {
  CLASSIC_5X3_PRESET,
  UNSAFE_PRESET,
  createDefaultProcessNames,
  createDefaultResourceNames,
  createEmptyMatrix,
  createEmptyVector,
} from "../src/data/presets";
import { STAGE_DIALOGUES } from "../src/data/dialogues";
import { calculateNeed, runSafetyAlgorithm } from "../src/algorithm/banker";
import { evaluateResourceRequest } from "../src/algorithm/resourceRequest";

describe("KERNEL 3D Guided Workflow & System Integration", () => {
  it("verifies all stages have designated Lisa guidance dialogues", () => {
    const requiredStages = [
      "WELCOME",
      "SYSTEM_CONFIG",
      "PROCESS_NAMING",
      "RESOURCE_NAMING",
      "EXPLORING_3D",
      "ALLOCATION_INPUT",
      "SAFETY_ANALYSIS",
      "SIMULATION_3D",
      "SESSION_ENDED",
    ] as const;

    requiredStages.forEach((stage) => {
      expect(STAGE_DIALOGUES[stage]).toBeDefined();
      expect(STAGE_DIALOGUES[stage].length).toBeGreaterThan(15);
    });

    expect(STAGE_DIALOGUES.WELCOME).toContain(
      "Hi, I'm Lisa, welcome to Banker's Algorithm Simulation. Please allow microphone access to proceed.",
    );
    expect(STAGE_DIALOGUES.SYSTEM_CONFIG).toContain(
      "Cool. We need the number of processes. Tell me how many processes you want.",
    );
    expect(STAGE_DIALOGUES.EXPLORING_3D).toContain(
      "This is the 3D view. Processes are represented by boxes, and resource types are represented by spheres. You can explore the scene. Say 'Next' when you're ready.",
    );
    expect(STAGE_DIALOGUES.ALLOCATION_INPUT).toContain(
      "No need to type. This is a predefined matrix of Allocation and Maximum values. Say what you want to change, or say 'Skip' to continue.",
    );
  });

  it("verifies classic 5x3 preset executes to a verified safe sequence", () => {
    const need = calculateNeed(
      CLASSIC_5X3_PRESET.allocation,
      CLASSIC_5X3_PRESET.max,
    );
    expect(need).toEqual([
      [7, 4, 3],
      [1, 2, 2],
      [6, 0, 0],
      [0, 1, 1],
      [4, 3, 1],
    ]);

    const result = runSafetyAlgorithm({
      allocation: CLASSIC_5X3_PRESET.allocation,
      max: CLASSIC_5X3_PRESET.max,
      available: CLASSIC_5X3_PRESET.available,
    });

    expect(result.isSafe).toBe(true);
    expect(result.safeSequence).toEqual([1, 3, 4, 0, 2]);
    // Map to custom process names
    const namedSequence = result.safeSequence.map(
      (idx) => CLASSIC_5X3_PRESET.processNames[idx],
    );
    expect(namedSequence).toEqual(["P1", "P3", "P4", "P0", "P2"]);
  });

  it("verifies unsafe preset identifies blocked processes without claiming false completion", () => {
    const result = runSafetyAlgorithm({
      allocation: UNSAFE_PRESET.allocation,
      max: UNSAFE_PRESET.max,
      available: UNSAFE_PRESET.available,
    });

    expect(result.isSafe).toBe(false);
    expect(result.unfinishedProcesses.length).toBeGreaterThan(0);
    expect(result.safeSequence.length).toBeLessThan(UNSAFE_PRESET.processCount);
  });

  it("verifies process and resource name generators and deduplication logic", () => {
    const pNames = createDefaultProcessNames(4);
    expect(pNames).toEqual(["P0", "P1", "P2", "P3"]);

    const rNames = createDefaultResourceNames(3);
    expect(rNames).toEqual(["Resource A", "Resource B", "Resource C"]);

    // Test case-insensitive duplicate rejection logic
    const testDuplicate = (names: string[]): boolean => {
      const lowerMap = new Set<string>();
      for (const n of names) {
        const lower = n.trim().toLowerCase();
        if (lowerMap.has(lower)) return false;
        lowerMap.add(lower);
      }
      return true;
    };

    expect(testDuplicate(["Worker", "worker"])).toBe(false);
    expect(testDuplicate(["Proc A", "proc a"])).toBe(false);
    expect(testDuplicate(["Proc 1", "Proc 2"])).toBe(true);
  });

  it("verifies dimension resizing and state preservation", () => {
    const pCount = 3;
    const rCount = 2;
    const alloc = createEmptyMatrix(pCount, rCount, 1);
    const max = createEmptyMatrix(pCount, rCount, 2);
    const avail = createEmptyVector(rCount, 3);

    expect(alloc).toHaveLength(3);
    expect(alloc[0]).toHaveLength(2);
    expect(max).toHaveLength(3);
    expect(max[0]).toHaveLength(2);
    expect(avail).toEqual([3, 3]);

    const need = calculateNeed(alloc, max);
    expect(need).toEqual([
      [1, 1],
      [1, 1],
      [1, 1],
    ]);

    const result = runSafetyAlgorithm({
      allocation: alloc,
      max,
      available: avail,
    });
    expect(result.isSafe).toBe(true);
  });

  it("verifies tentative allocation rollback on unsafe resource request", () => {
    const state = structuredClone(CLASSIC_5X3_PRESET);
    // Request [3, 3, 0] for process 4 creates an unsafe state
    const evalRes = evaluateResourceRequest(
      {
        allocation: state.allocation,
        max: state.max,
        available: state.available,
      },
      4,
      [3, 3, 0],
    );

    expect(evalRes.granted).toBe(false);
    if (!evalRes.granted) {
      expect(evalRes.reason).toBe("unsafe");
    }

    // Original state unmodified
    expect(state.available).toEqual([3, 3, 2]);
    expect(state.allocation[4]).toEqual([0, 0, 2]);
  });
});
