-- Add columns for extended profile data
alter table profiles 
add column if not exists readme_content text,
add column if not exists top_repos jsonb; -- Array of { name, description, stars, language, url }
