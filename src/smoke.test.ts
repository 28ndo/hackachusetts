import { describe, it, expect } from "vitest";
import fc from "fast-check";

// Smoke test: proves the test runner and fast-check are wired up.
describe("scaffold smoke test", () => {
  it("runs a trivial fast-check property", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      }),
    );
    expect(true).toBe(true);
  });
});
