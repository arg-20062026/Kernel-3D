import { describe, expect, it } from "vitest";
import {
  computeProcessPositions,
  computeResourcePositions,
} from "../src/scene3d/layoutMath";

describe("3D Layout Mathematics", () => {
  it("computes process positions for various process counts", () => {
    const singleProc = computeProcessPositions(1);
    expect(singleProc).toHaveLength(1);
    expect(singleProc[0]).toHaveLength(3);

    const fiveProc = computeProcessPositions(5);
    expect(fiveProc).toHaveLength(5);

    // Each coordinate should be a valid finite number
    fiveProc.forEach(([x, y, z]) => {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(Number.isFinite(z)).toBe(true);
    });

    // Positions should be distinct
    const xCoords = new Set(fiveProc.map(([x]) => x));
    expect(xCoords.size).toBeGreaterThan(1);
  });

  it("computes resource positions correctly for 1 and multiple resources", () => {
    const singleRes = computeResourcePositions(1);
    expect(singleRes).toEqual([[0, 0, 0]]);

    const threeRes = computeResourcePositions(3);
    expect(threeRes).toHaveLength(3);

    threeRes.forEach(([x, y, z]) => {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
      expect(Number.isFinite(z)).toBe(true);
    });
  });

  it("scales positions gracefully up to maximum limits", () => {
    const tenProc = computeProcessPositions(10);
    expect(tenProc).toHaveLength(10);

    const sixRes = computeResourcePositions(6);
    expect(sixRes).toHaveLength(6);
  });
});
