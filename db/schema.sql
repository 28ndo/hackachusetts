-- Postgres schema for the problem ledger (dispatch-ledger spec, build-plan §3).
-- Safe to drop and recreate: `npm run seed` runs this as the demo reset.
-- Entities stay in data/entities.yaml; there is deliberately no entities table.

drop table if exists outcomes cascade;
drop table if exists assignments cascade;
drop table if exists problem_reports cascade;
drop table if exists routing_overrides cascade;
drop table if exists replay_queue cascade;
drop table if exists problems cascade;
drop table if exists reports cascade;

-- Raw intake: one row per Open311 request. All 20,730 land here for the counter.
create table reports (
  id                 text primary key,
  source             text not null default 'open311',
  service_name       text not null,
  service_family     text not null,           -- familyOf(service_name) or 'not routed'
  description        text,
  lat                double precision not null,
  lon                double precision not null,
  address            text not null,
  media_url          text,
  requested_at       timestamptz not null,
  preferred_language text,
  problem_id         text                       -- set for routable, clustered reports
);

-- One real-world issue (a cluster of reports).
create table problems (
  id                  text primary key,
  service_family      text not null,
  lat                 double precision not null,
  lon                 double precision not null,
  road_segment_id     text,
  neighborhood        text not null default '',
  block_group_id      text,
  ej_criteria         text,
  limited_english_pct double precision,
  reporter_count      integer not null default 1,
  first_reported_at   timestamptz not null,
  last_reported_at    timestamptz not null,
  status              text not null default 'new',
  jurisdiction_code   text,
  priority            jsonb not null
);

-- Cluster membership (a report belongs to exactly one problem).
create table problem_reports (
  problem_id text not null references problems(id) on delete cascade,
  report_id  text not null references reports(id) on delete cascade,
  primary key (problem_id, report_id)
);

-- A work packet sent to one entity (a problem can have several over time).
create table assignments (
  id             text primary key,
  problem_id     text not null references problems(id) on delete cascade,
  entity_id      text not null,
  attempt        integer not null default 1,
  sent_at        timestamptz not null,
  respond_by     timestamptz not null,
  resolve_by     timestamptz not null,
  routing_reason text not null,
  confidence     text not null,                 -- rule | jurisdiction | learned
  state          text not null default 'sent'   -- sent|acknowledged|in_progress|closed|rerouted|stale
);

-- The entity's structured answer (replaces free-text "Noted").
create table outcomes (
  id            text primary key,
  assignment_id text not null references assignments(id) on delete cascade,
  code          text not null,                  -- OutcomeCode
  note          text,
  photo_url     text,
  scheduled_for text,
  by_who        text not null,
  at            timestamptz not null
);

-- What the system learned from a NOT_OURS reroute.
create table routing_overrides (
  id              serial primary key,
  service_family  text not null,
  road_segment_id text,
  area_key        text,                          -- ~50 m grid key when no segment
  entity_id       text not null,
  learned_from    text not null,                 -- outcome id
  created_at      timestamptz not null default now()
);

-- Reports held back by the seed so the demo can "replay" them on cue.
create table replay_queue (
  id         serial primary key,
  payload    jsonb not null,                     -- a serialized Report
  label      text,                               -- e.g. 'morrissey-dcr'
  created_at timestamptz not null default now()
);

-- Indexes the spec calls for.
create index idx_assignments_entity_state on assignments(entity_id, state);
create index idx_problems_family_segment on problems(service_family, road_segment_id);
-- Supports the cluster-membership and packet lookups.
create index idx_reports_problem on reports(problem_id);
create index idx_outcomes_assignment on outcomes(assignment_id);
create index idx_overrides_family_segment on routing_overrides(service_family, road_segment_id);
