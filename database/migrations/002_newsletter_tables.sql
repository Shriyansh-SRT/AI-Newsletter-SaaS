-- Additional tables needed for newsletter queue system
-- Run this SQL in your Supabase SQL editor

-- Newsletter queue table for storing pending emails
CREATE TABLE IF NOT EXISTS newsletter_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  newsletter_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  run_id TEXT
);

-- Newsletter errors table for logging errors
CREATE TABLE IF NOT EXISTS newsletter_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  run_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE newsletter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_errors ENABLE ROW LEVEL SECURITY;

-- RLS policies for newsletter_queue
CREATE POLICY "Users can view their own newsletter queue" ON newsletter_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own newsletter queue" ON newsletter_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own newsletter queue" ON newsletter_queue
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for newsletter_errors
CREATE POLICY "Users can view their own newsletter errors" ON newsletter_errors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own newsletter errors" ON newsletter_errors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_queue_user_id ON newsletter_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_queue_status ON newsletter_queue(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_queue_created_at ON newsletter_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_newsletter_errors_user_id ON newsletter_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_errors_created_at ON newsletter_errors(created_at);
