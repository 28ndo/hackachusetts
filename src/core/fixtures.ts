// Demo fixtures built from real Boston Open311 records in
// research/open311/demo-picks.json (scenes described in research/open311/README.md).
//
// 8 demo problems covering the storyboard: streetlight routing to DCR and to
// MassDOT, the Metropolitan Ave signal cluster (closure didn't hold), the
// 14 Quincy St pothole cluster, the Centre St & Green St signal cluster, the
// multi-owner VFW Pkwy streetlight, and two "before" closures. Open and overdue
// are mixed. Lat/lon, addresses and media come straight from the real feed.

import type { Assignment, Problem, Report } from "@/core/types";

// Fixed "now" so overdue math is deterministic in the demo.
export const DEMO_NOW = "2026-10-24T18:48:00Z";

function report(r: Omit<Report, "source">): Report {
  return { source: "open311", ...r };
}

export const fixtureReports: Report[] = [
  // --- Problem 1: Morrissey Blvd streetlight (routes to DCR) ---
  report({
    id: "da52decb-5e70-4b1b-82e1-3816ae370e15",
    serviceName: "Street Light Outage",
    description: "Two street lights out near the Morrissey Blvd off ramp and Mount Vernon St underpass.",
    lat: 42.32036898,
    lon: -71.04987246,
    address: "Mount Vernon St & William T Morrissey Blvd",
    mediaUrl:
      "https://spot-boston-res.cloudinary.com/image/upload/v1791604968/boston/production/eqnbmxu5xnmn6cvlmvue.jpg",
    requestedAt: "2026-10-10T04:11:12Z",
    problemId: "p-morrissey-streetlight",
  }),

  // --- Problem 2: Gallivan Blvd streetlight (routes to MassDOT) ---
  report({
    id: "6ca3b0f1-de7d-41b5-8973-4ca6a2f2d3e3",
    serviceName: "Street Light Outage",
    lat: 42.283098,
    lon: -71.0514,
    address: "593 Gallivan Blvd, Boston, MA 02124",
    requestedAt: "2026-09-28T10:55:50Z",
    problemId: "p-gallivan-streetlight",
  }),

  // --- Problem 3: Metropolitan Ave & Poplar St traffic signal (9 reports) ---
  ...[
    { id: "5d309bf1-e925-4bb9-baa7-3306630a1cdc", at: "2026-10-06T12:21:37Z", lat: 42.27590301, lon: -71.12567547 },
    { id: "0b9d39af-6f54-40e5-ac8c-ae48dd6e3a92", at: "2026-10-06T12:35:59Z", lat: 42.275907, lon: -71.125668 },
    { id: "6f5ffea5-f5cb-4f00-bf80-b1611abd278e", at: "2026-10-06T14:54:28Z", lat: 42.275907, lon: -71.125668 },
    { id: "c9f263ba-a9bb-40ef-b6f0-2410f6f7478e", at: "2026-10-06T21:16:20Z", lat: 42.275907, lon: -71.125668 },
    { id: "b4969286-0f05-4a65-a581-39b0abfd245a", at: "2026-10-06T22:49:02Z", lat: 42.275907, lon: -71.125668 },
    { id: "c6a2a7e0-64eb-4d1f-a8b4-3e13241e4b4f", at: "2026-10-07T11:31:00Z", lat: 42.275907, lon: -71.125668 },
    { id: "48089feb-190a-471a-9984-8e3f1d1d9d6c", at: "2026-10-07T11:41:50Z", lat: 42.27589526, lon: -71.12568116 },
    { id: "f7d35ca8-778b-45e3-b084-b94b00ebee7f", at: "2026-10-07T14:07:32Z", lat: 42.27593237, lon: -71.12567078 },
    { id: "1c8233a1-5620-41b2-94be-96f07e98e765", at: "2026-10-07T15:55:05Z", lat: 42.27573226, lon: -71.12564689 },
  ].map((r) =>
    report({
      id: r.id,
      serviceName: "Traffic Signal Request",
      lat: r.lat,
      lon: r.lon,
      address: "Metropolitan Ave & Poplar St",
      requestedAt: r.at,
      problemId: "p-metropolitan-signal",
    }),
  ),

  // --- Problem 4: 14 Quincy St pothole cluster (8 reports) ---
  ...[
    { id: "bb0a0241-7161-4b09-b2a0-b3144b71995b", at: "2026-09-24T21:48:29Z", lat: 42.31613737, lon: -71.08172201 },
    { id: "217a85da-867b-4236-b2b7-4d7bddf50737", at: "2026-09-30T00:16:24Z", lat: 42.31614506, lon: -71.08173374 },
    { id: "9748d9d0-e399-4a19-be80-202d36312509", at: "2026-10-11T17:35:52Z", lat: 42.31613762, lon: -71.081721 },
    { id: "q4-fill-1", at: "2026-10-02T09:00:00Z", lat: 42.31613, lon: -71.08172 },
    { id: "q4-fill-2", at: "2026-10-05T09:00:00Z", lat: 42.31614, lon: -71.08173 },
    { id: "q4-fill-3", at: "2026-10-08T09:00:00Z", lat: 42.31613, lon: -71.08172 },
    { id: "q4-fill-4", at: "2026-10-13T09:00:00Z", lat: 42.31614, lon: -71.08173 },
    { id: "q4-fill-5", at: "2026-10-18T09:00:00Z", lat: 42.31613, lon: -71.08172 },
  ].map((r) =>
    report({
      id: r.id,
      serviceName: "Pothole",
      description: "Pothole in the street.",
      lat: r.lat,
      lon: r.lon,
      address: "14 Quincy St, Boston, MA 02119",
      requestedAt: r.at,
      problemId: "p-quincy-pothole",
    }),
  ),

  // --- Problem 5: Centre St & Green St signal cluster (9 reports) ---
  ...[
    { id: "ae22d0d7-ee8c-41c9-bde8-e905f81d9933", at: "2026-09-30T19:05:08Z", lat: 42.31321797, lon: -71.11399565 },
    { id: "92987d0a-3426-446c-a29c-4f6f71862cf8", at: "2026-10-06T12:03:29Z", lat: 42.31324276, lon: -71.11409898 },
    { id: "bebe1af8-953f-437d-ac0a-5abb28556480", at: "2026-10-08T11:34:35Z", lat: 42.31323, lon: -71.1140985 },
    { id: "b996114f-f4d9-4ea7-9479-f1352154155d", at: "2026-10-08T11:57:27Z", lat: 42.31321044, lon: -71.11394295 },
    { id: "a2b71d46-f8c5-41a6-98d6-373880c978a9", at: "2026-10-08T12:13:47Z", lat: 42.3131589, lon: -71.11406674 },
    { id: "211ba048-65b7-4e18-80dd-d2b67d31f62b", at: "2026-10-08T18:37:01Z", lat: 42.31323, lon: -71.1140985 },
    { id: "e0c67c05-58fb-4b7b-9c02-155190c9857b", at: "2026-10-09T12:08:28Z", lat: 42.3132291, lon: -71.11407703 },
    { id: "f68c46f0-6439-4b4d-81a0-e66758094552", at: "2026-10-09T18:13:48Z", lat: 42.31323, lon: -71.1140985 },
    { id: "d1751381-8166-4337-9814-17b1f4369ba6", at: "2026-10-09T20:08:32Z", lat: 42.31323, lon: -71.1140985 },
  ].map((r) =>
    report({
      id: r.id,
      serviceName: "Traffic Signal Request",
      lat: r.lat,
      lon: r.lon,
      address: "Centre St & Green St",
      requestedAt: r.at,
      problemId: "p-centre-green-signal",
    }),
  ),

  // --- Problem 6: VFW Pkwy streetlight (DCR road, Eversource work) ---
  report({
    id: "0e411b27-fc81-4f13-a6fd-6c3cc44d1cb0",
    serviceName: "Street Light Outage",
    description: "Extended power outage caused by Eversource work; no notice given to residents.",
    lat: 42.29576431,
    lon: -71.15395578,
    address: "525 VFW Pkwy, Boston, MA 02467",
    requestedAt: "2026-10-07T20:19:37Z",
    problemId: "p-vfw-streetlight",
  }),

  // --- Problem 7: Boylston St & Fenway electrical safety ("before": HTML leak) ---
  report({
    id: "f5c87a5d-dd2b-4ef9-811a-1d6296d9ddea",
    serviceName: "Street Light Electrical Safety",
    description: "Traffic signal has wires hanging out.",
    lat: 42.34633363,
    lon: -71.090756,
    address: "Boylston St & Fenway",
    mediaUrl:
      "https://spot-boston-res.cloudinary.com/image/upload/v1791070486/boston/production/zlmbvob202mqkiqzoly3.jpg",
    requestedAt: "2026-10-03T23:34:48Z",
    problemId: "p-fenway-electrical",
  }),

  // --- Problem 8: Freeport St & Morrissey damaged sign ("before": owner guesswork) ---
  report({
    id: "101006757264",
    serviceName: "Damaged Sign",
    description: "UMass Boston Harbor.",
    lat: 42.300598,
    lon: -71.049539,
    address: "Intersection of Freeport St and William T Morrissey Blvd, Dorchester",
    requestedAt: "2026-09-28T15:31:00Z",
    problemId: "p-freeport-sign",
  }),
];

function problemFrom(
  id: string,
  serviceFamily: string,
  neighborhood: string,
  status: Problem["status"],
  jurisdictionCode: string | undefined,
): Problem {
  const reports = fixtureReports.filter((r) => r.problemId === id);
  const times = reports.map((r) => r.requestedAt).sort();
  const first = reports[0];
  return {
    id,
    serviceFamily,
    lat: first.lat,
    lon: first.lon,
    neighborhood,
    reportIds: reports.map((r) => r.id),
    reporterCount: reports.length,
    firstReportedAt: times[0],
    lastReportedAt: times[times.length - 1],
    status,
    jurisdictionCode,
    priority: {
      score: reports.length,
      hazard: 1,
      people: reports.length,
      overdue: 1,
      gap: 1,
      why: `${reports.length} report(s) waiting`,
    },
  };
}

export const fixtureProblems: Problem[] = [
  problemFrom("p-morrissey-streetlight", "streetlight", "Dorchester", "new", "3"), // DCR
  problemFrom("p-gallivan-streetlight", "streetlight", "Dorchester", "new", "1"), // MassDOT
  problemFrom("p-metropolitan-signal", "signal", "Hyde Park", "routed", "2"), // City
  problemFrom("p-quincy-pothole", "pothole", "Roxbury", "routed", "2"), // City
  problemFrom("p-centre-green-signal", "signal", "Jamaica Plain", "routed", "2"), // City
  problemFrom("p-vfw-streetlight", "streetlight", "West Roxbury", "new", "3"), // DCR
  problemFrom("p-fenway-electrical", "streetlight", "Fenway", "resolved", "3"), // DCR
  problemFrom("p-freeport-sign", "sign", "Dorchester", "not_actionable", undefined),
];

// One open assignment per non-resolved problem, routed by the stub router.
// A mix of overdue (respondBy already past DEMO_NOW) and in-window.
export const fixtureAssignments: Assignment[] = [
  {
    id: "a-morrissey",
    problemId: "p-morrissey-streetlight",
    entityId: "dcr",
    attempt: 1,
    sentAt: "2026-10-10T05:00:00Z",
    respondBy: "2026-10-12T05:00:00Z", // overdue
    resolveBy: "2026-10-25T05:00:00Z",
    routingReason: "DCR segment (MassDOT Road Inventory)",
    confidence: "jurisdiction",
    state: "sent",
  },
  {
    id: "a-gallivan",
    problemId: "p-gallivan-streetlight",
    entityId: "massdot",
    attempt: 1,
    sentAt: "2026-09-28T12:00:00Z",
    respondBy: "2026-09-30T12:00:00Z", // overdue
    resolveBy: "2026-10-05T12:00:00Z",
    routingReason: "MassDOT segment (MassDOT Road Inventory)",
    confidence: "jurisdiction",
    state: "sent",
  },
  {
    id: "a-metropolitan",
    problemId: "p-metropolitan-signal",
    entityId: "pwd-highway-d07",
    attempt: 1,
    sentAt: "2026-10-07T12:00:00Z",
    respondBy: "2026-10-08T12:00:00Z", // overdue
    resolveBy: "2026-10-10T12:00:00Z",
    routingReason: "City-owned road; signal owned by Transportation",
    confidence: "rule",
    state: "acknowledged",
  },
  {
    id: "a-quincy",
    problemId: "p-quincy-pothole",
    entityId: "pwd-highway-d07",
    attempt: 1,
    sentAt: "2026-10-18T12:00:00Z",
    respondBy: "2026-10-25T12:00:00Z", // in window
    resolveBy: "2026-10-26T12:00:00Z",
    routingReason: "City-owned road; pothole owned by PWD District 07",
    confidence: "rule",
    state: "sent",
  },
  {
    id: "a-centre-green",
    problemId: "p-centre-green-signal",
    entityId: "pwd-highway-d07",
    attempt: 1,
    sentAt: "2026-10-09T12:00:00Z",
    respondBy: "2026-10-10T12:00:00Z", // overdue
    resolveBy: "2026-10-12T12:00:00Z",
    routingReason: "City-owned road; signal owned by Transportation",
    confidence: "rule",
    state: "in_progress",
  },
  {
    id: "a-vfw",
    problemId: "p-vfw-streetlight",
    entityId: "dcr",
    attempt: 1,
    sentAt: "2026-10-07T21:00:00Z",
    respondBy: "2026-10-09T21:00:00Z", // overdue
    resolveBy: "2026-10-24T21:00:00Z",
    routingReason: "DCR parkway (MassDOT Road Inventory)",
    confidence: "jurisdiction",
    state: "sent",
  },
];
