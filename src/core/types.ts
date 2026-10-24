// The shared contract for the dispatch ledger (v2 rebuild).
// Mirrors research/build-plan.md §3 (data model), §4 (entity catalog),
// §5 (routing + priority), §6 (outcome codes) and §7 (scorecard).
// Every module builds against this file. Change it only on purpose.

// ---------------------------------------------------------------------------
// §3 Data model
// ---------------------------------------------------------------------------

export type ReportSource = "open311" | "agent" | "phone" | "employee";

/** Raw intake: one Open311 request. */
export interface Report {
  id: string;
  source: ReportSource;
  serviceName: string;
  /** familyOf(serviceName), or "not routed" */
  serviceFamily: string;
  /** English text (the auto-translation when the intake tagged one) */
  description?: string;
  /** The reporter's own words when they wrote in another language */
  originalText?: string;
  lat: number;
  lon: number;
  address: string;
  mediaUrls: string[];
  requestedAt: string;
  /** The city's own closure text today (the "before"). Raw HTML stripped. */
  cityStatus?: "open" | "closed";
  cityStatusNotes?: string;
  problemId?: string;
  /** Locale parsed from the "-- original (xx-XX) --" tag; "en" by default. */
  preferredLanguage: string;
  /** Nearest MassDOT Road Inventory segment, set offline by the seed. */
  roadSegmentId?: string;
  jurisdictionCode?: string;
  roadName?: string;
}

export type ProblemStatus =
  | "new"
  | "routed"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "deferred"
  | "not_actionable";

/** One real-world issue: a cluster of reports. */
export interface Problem {
  id: string;
  serviceFamily: string;
  lat: number;
  lon: number;
  address: string;
  roadSegmentId?: string;
  roadName?: string;
  /** MassDOT Road Inventory: 0 unaccepted, 1 MassDOT, 2 City, 3 DCR, 5 Massport, B state college, H private */
  jurisdictionCode?: string;
  reportIds: string[];
  reporterCount: number;
  firstReportedAt: string;
  lastReportedAt: string;
  status: ProblemStatus;
  priority: Priority;
}

export type AssignmentState =
  | "sent"
  | "acknowledged"
  | "in_progress"
  | "closed"
  | "rerouted"
  | "stale";

export type RoutingConfidence = "rule" | "jurisdiction" | "learned" | "triage";

/** A work packet sent to one entity. A problem can have several over time (hops). */
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

/** The entity's structured answer. Replaces free-text "Noted". */
export interface Outcome {
  id: string;
  assignmentId: string;
  code: OutcomeCode;
  note?: string;
  photoUrl?: string;
  /** ISO date (YYYY-MM-DD) or a label like "spring 2027" */
  scheduledFor?: string;
  newOwnerId?: string;
  by: string;
  at: string;
}

/** What the system learned from a NOT_OURS. */
export interface RoutingOverride {
  id: string;
  serviceFamily: string;
  roadSegmentId?: string;
  /** ~50 m grid key when no segment is known: `${lat.toFixed(4)}:${lon.toFixed(4)}` style */
  areaKey?: string;
  entityId: string;
  learnedFrom: string;
  learnedFromEntityId: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// §4 Entity catalog (data/entities.yaml)
// ---------------------------------------------------------------------------

export type EntityKind =
  | "city_dept"
  | "state_agency"
  | "utility"
  | "other_town"
  | "authority"
  | "private";

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

export interface EntityHandoffToday {
  ontimePct?: number;
  stillOpen?: number;
  referredOnPct?: number;
}

export interface Entity {
  id: string;
  name: string;
  kind: EntityKind;
  department?: string;
  queues: string[];
  owns: string[];
  where?: { jurisdictionCodes?: string[] };
  hazard?: Record<string, number>;
  need?: string[];
  help?: string[];
  cant?: EntityCant[];
  workload?: EntityWorkload;
  handoffToday?: EntityHandoffToday;
  /** e.g. "48h", "4h" */
  respondWithin?: string;
  contact?: string;
}

/** The ops triage queue is a pseudo-entity with this id. */
export const TRIAGE_ID = "triage";

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

export const OUTCOME_CODES: OutcomeCode[] = [
  "FIXED",
  "MADE_SAFE",
  "SCHEDULED",
  "DEFERRED_CAPITAL",
  "NOT_OURS",
  "NOT_FOUND",
  "PRIVATE_PROPERTY",
  "DUPLICATE",
  "NEEDS_INFO",
];

/** Extra input an outcome code needs from the entity. */
export type OutcomeInput = "scheduledFor" | "newOwnerId" | "note" | "photoUrl";

/** One row of the OUTCOMES protocol table (§6). */
export interface OutcomeSpec {
  /** Short button label, e.g. "Fixed" */
  label: string;
  /** What happens next, automatically (shown as a hint under the button). */
  nextStep: string;
  nextProblemStatus: ProblemStatus;
  nextAssignmentState: AssignmentState;
  /** Required inputs. */
  needs: OutcomeInput[];
  /** Optional inputs. */
  optional: OutcomeInput[];
}

/** Locales with a resident message per outcome code (data/locales/<code>.json). */
export const LOCALES = ["en", "es", "ht", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

// ---------------------------------------------------------------------------
// §5 Priority and routing
// ---------------------------------------------------------------------------

/** priority = hazard × people × overdue; each factor shown on the card. */
export interface Priority {
  score: number;
  hazard: number;
  people: number;
  overdue: number;
  gap: number;
  /** e.g. "7 people waiting · 9 days overdue · hazard 3" */
  why: string;
}

export interface RoutingDecision {
  entityId: string;
  queue?: string;
  reason: string;
  confidence: RoutingConfidence;
  /** required packet items (from entity.need) not satisfied by the reports */
  missing: string[];
  /** set when a pre-dispatch check suggests closing with this code (e.g. private way) */
  suggestedOutcome?: OutcomeCode;
}

/** The result of applying an outcome. */
export interface StateChange {
  problemId: string;
  assignmentId: string;
  code: OutcomeCode;
  previousProblemStatus: ProblemStatus;
  nextProblemStatus: ProblemStatus;
  previousAssignmentState: AssignmentState;
  nextAssignmentState: AssignmentState;
  /** Resident message in English (preview panel renders other locales itself). */
  residentMessage: string;
  newAssignment?: Assignment;
  learnedOverride?: RoutingOverride;
}

// ---------------------------------------------------------------------------
// Read models for the UI (served by Repo so pages never write SQL)
// ---------------------------------------------------------------------------

export interface EntityCounts {
  entityId: string;
  open: number;
  overdue: number;
  /** open packets with a reporter whose preferredLanguage is not "en" */
  nonEnglish: number;
}

export interface ScorecardRow {
  entityId: string;
  open: number;
  overdue: number;
  /** closed via an outcome (any code) */
  answered: number;
  fixed: number;
  rerouted: number;
  notFound: number;
  deferred: number;
  /** share of problems this entity ever handled that were re-reported after FIXED (0 when none) */
  reopenRate: number;
  /** median hours from sentAt to first outcome, undefined when no outcomes yet */
  medianResponseHours?: number;
}

export interface TopCluster {
  problemId: string;
  serviceFamily: string;
  address: string;
  reporterCount: number;
  entityId: string;
  assignmentId: string;
  /** what the city told reporters today, e.g. "Noted." (first non-empty cityStatusNotes) */
  cityNoteBefore?: string;
}

export interface Overview {
  totalReports: number;
  routableReports: number;
  totalProblems: number;
  routedProblems: number;
  triageProblems: number;
  /** share of reports that collapsed into an existing problem */
  duplicateShare: number;
  /** share of the city's own closure notes that start with "Noted" */
  cityNotedShare: number;
  reportsByDay: { day: string; count: number }[];
  byFamily: { family: string; reports: number; problems: number }[];
  entities: EntityCounts[];
  topClusters: TopCluster[];
  learnedRules: RoutingOverride[];
  outcomesRecorded: number;
  replayRemaining: number;
}

/** Optional inbox filter: only packets with a reporter who wrote in another language. */
export interface InboxFilter {
  nonEnglish?: boolean;
}

export interface InboxItem {
  rank: number;
  assignment: Assignment;
  problem: Problem;
  /** lead report's description (English translation if the tag was present) */
  description?: string;
  photoCount: number;
  firstPhotoUrl?: string;
  reporterLanguages: string[];
  /** true when respondBy is in the past and state is sent */
  overdue: boolean;
}

export interface HistoryEvent {
  at: string;
  kind: "report" | "assignment" | "outcome";
  /** short human line, e.g. "Sent to DCR (DCR parkway, Road Inventory)" */
  text: string;
  entityId?: string;
  code?: OutcomeCode;
  confidence?: RoutingConfidence;
}

export interface Packet {
  assignment: Assignment;
  problem: Problem;
  reports: Report[];
  /** every hop and answer for this problem, oldest first */
  history: HistoryEvent[];
  outcomes: Outcome[];
  /** entity.need items not satisfied by the reports */
  missing: string[];
}

export interface ReplayResult {
  report: Report;
  problem: Problem;
  assignment: Assignment;
  /** true when the report joined an existing problem */
  joinedExisting: boolean;
  decision: RoutingDecision;
}

// ---------------------------------------------------------------------------
// Repo: the only thing pages and server actions talk to
// ---------------------------------------------------------------------------

export interface Repo {
  // reads
  overview(): Promise<Overview>;
  listInbox(entityId: string, limit?: number, filter?: InboxFilter): Promise<InboxItem[]>;
  getPacket(assignmentId: string): Promise<Packet | undefined>;
  getProblem(problemId: string): Promise<Problem | undefined>;
  getAssignment(assignmentId: string): Promise<Assignment | undefined>;
  listReports(problemId: string): Promise<Report[]>;
  listOverrides(): Promise<RoutingOverride[]>;
  scorecard(): Promise<ScorecardRow[]>;
  /** open (not resolved / not_actionable) problems of this family within `meters` of the point */
  listOpenProblemsNear(lat: number, lon: number, serviceFamily: string, meters: number): Promise<Problem[]>;

  // writes
  createAssignment(assignment: Assignment): Promise<void>;
  updateAssignment(assignmentId: string, patch: Partial<Assignment>): Promise<void>;
  updateProblem(problemId: string, patch: Partial<Problem>): Promise<void>;
  recordOutcome(outcome: Outcome): Promise<void>;
  addOverride(override: RoutingOverride): Promise<void>;
  /** insert a report and attach it to problemId (updates problem reportIds/reporterCount/lastReportedAt) */
  attachReport(report: Report, problem: Problem): Promise<void>;
  createProblem(problem: Problem): Promise<void>;

  // replay
  /** pops the next held-back report, or undefined when the queue is empty */
  nextReplayReport(): Promise<Report | undefined>;
}
