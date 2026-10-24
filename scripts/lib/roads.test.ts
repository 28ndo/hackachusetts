import { describe, expect, it } from "vitest";
import { nearestOwner } from "./roads";

// A report sits next to the middle of a road whose endpoints are both far away
// (~1 km), and next to one part of a MultiLineString. Both must be found.

const roads = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { Jurisdictn: "3", St_Name: "LONG PARKWAY", OBJECTID: 1 },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-71.07, 42.3],
          [-71.05, 42.3],
        ] as [number, number][],
      },
    },
    {
      type: "Feature" as const,
      properties: { Jurisdictn: "1", St_Name: "SPLIT ROUTE", OBJECTID: 2 },
      geometry: {
        type: "MultiLineString" as const,
        coordinates: [
          [
            [-71.2, 42.4],
            [-71.199, 42.4],
          ],
          [
            [-71.1, 42.35],
            [-71.099, 42.35],
          ],
        ] as [number, number][][],
      },
    },
  ],
};

describe("nearestOwner()", () => {
  it("finds a long segment whose endpoints are both far from the report", () => {
    // 5 m north of the middle of a 1.6 km segment.
    expect(nearestOwner(42.300045, -71.06, roads)).toEqual({
      jurisdictionCode: "3",
      roadSegmentId: "1",
    });
  });

  it("finds a report next to the second part of a MultiLineString", () => {
    expect(nearestOwner(42.35004, -71.0995, roads)).toEqual({
      jurisdictionCode: "1",
      roadSegmentId: "2",
    });
  });

  it("returns nothing beyond 20 m", () => {
    expect(nearestOwner(42.301, -71.06, roads)).toBeUndefined();
  });
});
