-- Disable RLS for user_preferences table
-- This will remove all RLS policies and disable row level security

-- 1. Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;

-- 2. Disable RLS for user_preferences table
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled (optional - for confirmation)
-- You can run this to check if RLS is disabled:
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename = 'user_preferences';