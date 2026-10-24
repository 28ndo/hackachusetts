// The shared contract. Both teammates build against this file.
// OWNER: Niklas. Never edit without saying so explicitly in your response (show the diff).
//
// Types mirror research/build-plan.md §3 (data model), §6 (outcome codes),
// §4 (entity entry format), and the interfaces in PLAYBOOK.md §2.

// ---------------------------------------------------------------------------
// §3 Data model
// ---------------------------------------------------------------------------

/** Where a report entered the system. */
export type ReportSource = "open311" | "agent" | "phone" | "employee";

/** raw intake (one Open311 request) */
export interface Report {
  id: string;
  source: ReportSource;
  serviceName: string;
  description?: string;
  lat: number;
  lon: number;
  address: string;
  mediaUrl?: string;
  requestedAt: string;
  problemId?: string;
  /**
   * From the intake's "-- original (xx-XX) --" tag, or a future agent/app
   * field; default "en".
   */
  preferredLanguage?: string;
}

export type ProblemStatus =
  | "new"
  | "routed"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "deferred"
  | "not_actionable";

/** one real-world issue (a cluster of reports) */
export interface Problem {
  id: string;
  serviceFamily: string;
  lat: number;
  lon: number;
  roadSegmentId?: string;
  neighborhood: string;
  blockGroupId?: string;
  /** MassGIS EJ2020 join at ingest; lens only, never in priority (§5b). */
  ejCriteria?: string;
  /** Share of households with limited English; lens only. */
  limitedEnglishPct?: number;
  reportIds: string[];
  reporterCount: number;
  firstReportedAt: string;
  lastReportedAt: string;
  status: ProblemStatus;
  priority: Priority;
  /** MassDOT Road Inventory jurisdiction code, precomputed by the ledger. */
  jurisdictionCode?: string;
}

export type AssignmentState =
  | "sent"
  | "acknowledged"
  | "in_progress"
  | "closed"
  | "rerouted"
  | "stale";

export type RoutingConfidence = "rule" | "jurisdiction" | "learned";

/** a work packet sent to one entity (a problem can have several over time) */
export interface Assignment {
  id: string;
  problemId: string;
  entityId: string;
  attempt: number;
  sentAt: string;
  respondBy: string;
  resolveBy: string;
  routingReason: string;
  confidence: RoutingConfidence;
  state: AssignmentState;
}

/** the entity's structured answer (replaces "Noted") */
export interface Outcome {
  id: string;
  assignmentId: string;
  code: OutcomeCode;
  note?: string;
  photoUrl?: string;
  scheduledFor?: string;
  newOwnerId?: string;
  by: string;
  at: string;
}

/** what the system learned */
export interface RoutingOverride {
  serviceFamily: string;
  /** keyed by road segment, or an area key when no segment is known */
  roadSegmentId?: string;
  areaKey?: string;
  entityId: string;
  learnedFrom: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// §4 Entity catalog entry format
// ---------------------------------------------------------------------------

export type EntityKind =
  | "city_dept"
  | "state_agency"
  | "utility"
  | "other_town"
  | "authority"
  | "private";

/** A "can't" rule from the department map; each one is a pre-dispatch check. */
export interface EntityCant {
  rule: string;
  check: string;
  sendTo?: string[];
  outcome?: OutcomeCode;
}

export interface EntityWorkload {
  perDay?: number;
  medianDays?: number;
  p90Days?: number;
  slaDays?: number;
  ontimePct?: number;
  open?: number;
}

/** Today's referral-queue handoff stats, for the "before" story. */
export interface EntityHandoffToday {
  ontimePct?: number;
  stillOpen?: number;
  referredOnPct?: number;
}

/** from the catalog (§4), loaded from data/entities.yaml */
export interface Entity {
  id: string;
  name: string;
  kind: EntityKind;
  department?: string;
  queues: string[];
  /** service families this entity owns */
  owns: string[];
  where?: { jurisdictionCodes?: string[] };
  /** hazard 1–5 per service family this entity owns */
  hazard?: Record<string, number>;
  /** required items, checked before dispatch */
  need?: string[];
  /** optional items */
  help?: string[];
  /** each one is a pre-dispatch check */
  cant?: EntityCant[];
  workload?: EntityWorkload;
  handoffToday?: EntityHandoffToday;
  respondWithin?: string;
  contact?: string;
}

// ---------------------------------------------------------------------------
// §6 Outcome codes
// ---------------------------------------------------------------------------

export type OutcomeCode =
  | "FIXED"
  | "MADE_SAFE"
  | "SCHEDULED"
  | "DEFERRED_CAPITAL"
  | "NOT_OURS"
  | "NOT_FOUND"
  | "PRIVATE_PROPERTY"
  | "DUPLICATE"
  | "NEEDS_INFO";

/** One row of the OUTCOMES protocol table (§6). */
export interface OutcomeSpec {
  nextProblemStatus: ProblemStatus;
  nextAssignmentState: AssignmentState;
  /** extra inputs this code requires from the entity */
  needs?: string[];
  residentMessage(outcome: Outcome): string;
}

// ---------------------------------------------------------------------------
// Priority (§5) and routing (PLAYBOOK §2)
// ---------------------------------------------------------------------------

/** priority = hazard × people × overdue, with each factor shown on the card. */
export interface Priority {
  score: number;
  hazard: number;
  people: number;
  overdue: number;
  gap: number;
  why: string;
}

export interface RoutingDecision {
  entityId: string;
  queue?: string;
  reason: string;
  confidence: "learned" | "jurisdiction" | "rule" | "triage";
  /** required items still missing from the packet (from entity.need) */
  missing: string[];
}

/** The result of applying an outcome: what moved and what the resident sees. */
export interface StateChange {
  problemId: string;
  assignmentId: string;
  previousProblemStatus: ProblemStatus;
  nextProblemStatus: ProblemStatus;
  previousAssignmentState: AssignmentState;
  nextAssignmentState: AssignmentState;
  residentMessage: string;
  /** a new assignment created as a side effect, e.g. after NOT_OURS reroute */
  newAssignmentId?: string;
  /** a routing override learned as a side effect */
  learnedOverride?: RoutingOverride;
}

// ---------------------------------------------------------------------------
// Repo interface (PLAYBOOK §2). P2 implements it against Postgres;
// Niklas uses fixtureRepo until it lands.
// ---------------------------------------------------------------------------

export interface ScorecardRow {
  entityId: string;
  acknowledgeHours?: number;
  ontimePct?: number;
  rerouteRate?: number;
  reopenRate?: number;
  notFoundShare?: number;
}

export interface Repo {
  listInbox(entityId: string): Promise<Assignment[]>;
  getProblem(problemId: string): Promise<Problem | undefined>;
  recordOutcome(outcome: Outcome): Promise<void>;
  createAssignment(assignment: Assignment): Promise<void>;
  updateAssignment(
    assignmentId: string,
    patch: Partial<Assignment>,
  ): Promise<void>;
  updateProblem(problemId: string, patch: Partial<Problem>): Promise<void>;
  addOverride(override: RoutingOverride): Promise<void>;
  listOverrides(): Promise<RoutingOverride[]>;
  scorecard(): Promise<ScorecardRow[]>;
  ingestReport(report: Report): Promise<Problem>;
}
