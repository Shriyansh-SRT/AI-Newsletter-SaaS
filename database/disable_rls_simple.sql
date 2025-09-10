-- Copy and paste this into Supabase SQL Editor to disable RLS

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can view their own newsletter queue" ON newsletter_queue;
DROP POLICY IF EXISTS "Users can insert their own newsletter queue" ON newsletter_queue;
DROP POLICY IF EXISTS "Users can update their own newsletter queue" ON newsletter_queue;
DROP POLICY IF EXISTS "Users can view their own newsletter errors" ON newsletter_errors;
DROP POLICY IF EXISTS "Users can insert their own newsletter errors" ON newsletter_errors;

-- Disable RLS on all tables
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_errors DISABLE ROW LEVEL SECURITY;

-- Drop the RLS function (if it exists)
DROP FUNCTION IF EXISTS check_user_newsletter_status(UUID);

-- Verify RLS is disabled
SELECT tablename, rowsecurity as rls_enabled 
FROM pg_tables 
WHERE tablename IN ('user_preferences', 'newsletter_queue', 'newsletter_errors');
