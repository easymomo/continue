import { describe, expect, it } from "vitest";

/**
 * Simple utility function to test
 */
function sum(a: number, b: number): number {
  return a + b;
}

describe("Sum function", () => {
  it("adds two positive numbers correctly", () => {
    expect(sum(2, 3)).toBe(5);
  });

  it("handles negative numbers", () => {
    expect(sum(-1, 5)).toBe(4);
    expect(sum(-1, -3)).toBe(-4);
  });

  it("handles zero", () => {
    expect(sum(0, 0)).toBe(0);
    expect(sum(0, 5)).toBe(5);
  });
});
