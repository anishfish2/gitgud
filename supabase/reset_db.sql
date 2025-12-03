-- WARNING: This will delete ALL data in your tables!
-- Run this in the Supabase SQL Editor

TRUNCATE TABLE votes CASCADE;
TRUNCATE TABLE matches CASCADE;
TRUNCATE TABLE ratings CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE session_credits CASCADE;

-- Optional: Reset sequences if you want IDs to restart (though UUIDs don't need this)
-- ALTER SEQUENCE ... RESTART WITH 1;
