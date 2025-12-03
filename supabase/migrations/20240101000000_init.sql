-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  login text not null unique,
  github_id bigint not null unique,
  avatar_url text,
  bio text,
  html_url text,
  top_languages jsonb,
  activity_band int default 0,
  created_at timestamp with time zone default now(),
  last_synced_at timestamp with time zone default now()
);

-- RATINGS
create table ratings (
  profile_id uuid references profiles(id) on delete cascade primary key,
  category text default 'overall',
  mu double precision default 1500,
  phi double precision default 350,
  games_played int default 0,
  last_match_at timestamp with time zone default now(),
  -- Generated column for efficient sorting
  score double precision generated always as (mu - 2 * phi) stored
);

create index idx_ratings_score on ratings(score desc);
create index idx_ratings_games_played on ratings(games_played);

-- MATCHES
create table matches (
  id uuid primary key default uuid_generate_v4(),
  left_profile_id uuid references profiles(id) not null,
  right_profile_id uuid references profiles(id) not null,
  pair_hash text not null, -- hash(min_id + max_id) to prevent duplicate pairs for a user if needed, or just for tracking
  rater_id text, -- user_id or session_hash
  created_at timestamp with time zone default now()
);

create index idx_matches_rater_pair on matches(rater_id, pair_hash);

-- VOTES
create table votes (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id) not null,
  winner_id uuid references profiles(id), -- NULL if skip
  created_at timestamp with time zone default now()
);

-- SESSION CREDITS
create table session_credits (
  session_hash text primary key,
  credits int default 0,
  last_active_at timestamp with time zone default now()
);

-- RLS (Row Level Security)
alter table profiles enable row level security;
alter table ratings enable row level security;
alter table matches enable row level security;
alter table votes enable row level security;
alter table session_credits enable row level security;

-- Policies (Public Read, Service Role Write)
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Public ratings are viewable by everyone" on ratings for select using (true);
create policy "Public matches are viewable by everyone" on matches for select using (true);
-- Votes and Credits are private/internal, mostly handled by Service Role
