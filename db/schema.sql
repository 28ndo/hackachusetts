-- Dispatch ledger v2 schema (build-plan §3). Everything lives in schema v2;
-- the public schema belongs to an older app and is never touched.
-- Drop-and-recreate: safe to rerun (the seed applies it on every run).

create schema if not exists v2;

drop table if exists v2.replay_queue;
drop table if exists v2.routing_overrides;
drop table if exists v2.outcomes;
drop table if exists v2.assignments;
drop table if exists v2.reports;
drop table if exists v2.problems;

create table v2.problems (
  id                text primary key,
  service_family    text not null,
  lat               double precision not null,
  lon               double precision not null,
  address           text not null default '',
  road_segment_id   text,
  road_name         text,
  jurisdiction_code text,
  reporter_count    int not null default 1,
  first_reported_at timestamptz not null,
  last_reported_at  timestamptz not null,
  status            text not null,
  priority          jsonb not null
);

-- Problem.reportIds is derived from reports.problem_id (no join table).
create table v2.reports (
  id                 text primary key,
  source             text not null,
  service_name       text not null,
  service_family     text not null,
  description        text,
  original_text      text,
  lat                double precision not null,
  lon                double precision not null,
  address            text not null default '',
  media_urls         jsonb not null default '[]',
  requested_at       timestamptz not null,
  city_status        text,
  city_status_notes  text,
  preferred_language text not null default 'en',
  road_segment_id    text,
  jurisdiction_code  text,
  road_name          text,
  problem_id         text
);

create table v2.assignments (
  id             text primary key,
  problem_id     text not null references v2.problems(id),
  entity_id      text not null,
  attempt        int not null,
  sent_at        timestamptz not null,
  respond_by     timestamptz not null,
  resolve_by     timestamptz not null,
  routing_reason text not null,
  confidence     text not null,
  state          text not null
);

create table v2.outcomes (
  id            text primary key,
  assignment_id text not null references v2.assignments(id),
  code          text not null,
  note          text,
  photo_url     text,
  scheduled_for text,
  new_owner_id  text,
  by_who        text not null,
  at            timestamptz not null
);

create table v2.routing_overrides (
  id                     text primary key,
  service_family         text not null,
  road_segment_id        text,
  area_key               text,
  entity_id              text not null,
  learned_from           text not null,
  learned_from_entity_id text not null,
  created_at             timestamptz not null
);

create table v2.replay_queue (
  id         serial primary key,
  label      text not null,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

create index assignments_entity_state_idx on v2.assignments (entity_id, state);
create index problems_family_status_idx   on v2.problems (service_family, status);
create index problems_lat_lon_idx         on v2.problems (lat, lon);
create index reports_problem_idx          on v2.reports (problem_id);
create index reports_requested_at_idx     on v2.reports (requested_at);
create index outcomes_assignment_idx      on v2.outcomes (assignment_id);
create index overrides_family_segment_idx on v2.routing_overrides (service_family, road_segment_id);
