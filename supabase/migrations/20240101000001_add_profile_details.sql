-- Add detailed profile fields
alter table profiles 
add column if not exists followers int default 0,
add column if not exists public_repos int default 0,
add column if not exists company text,
add column if not exists location text,
add column if not exists blog text,
add column if not exists twitter_username text,
add column if not exists gh_created_at timestamp with time zone;

-- Create index for followers for potential sorting/filtering
create index if not exists idx_profiles_followers on profiles(followers desc);
