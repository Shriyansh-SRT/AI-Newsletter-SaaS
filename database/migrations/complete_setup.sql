-- Complete database setup for Sendly newsletter app
-- Run this SQL in your Supabase SQL editor

-- 1. Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  categories TEXT[] NOT NULL DEFAULT ARRAY['artificial intelligence', 'machine learning'],
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly')),
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create newsletter_queue table
CREATE TABLE IF NOT EXISTS newsletter_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  newsletter_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  run_id TEXT
);

-- 3. Create newsletter_errors table
CREATE TABLE IF NOT EXISTS newsletter_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  run_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security for ALL tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_errors ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create RLS policies for newsletter_queue
CREATE POLICY "Users can view their own newsletter queue" ON newsletter_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own newsletter queue" ON newsletter_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own newsletter queue" ON newsletter_queue
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Create RLS policies for newsletter_errors
CREATE POLICY "Users can view their own newsletter errors" ON newsletter_errors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own newsletter errors" ON newsletter_errors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Add subscription-related columns to user_preferences (ONCE ONLY)
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_newsletter_sent TIMESTAMP WITH TIME ZONE;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_stripe_customer_id ON user_preferences(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_subscription_id ON user_preferences(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_last_newsletter_sent ON user_preferences(last_newsletter_sent);

CREATE INDEX IF NOT EXISTS idx_newsletter_queue_user_id ON newsletter_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_queue_status ON newsletter_queue(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_queue_created_at ON newsletter_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_newsletter_errors_user_id ON newsletter_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_errors_created_at ON newsletter_errors(created_at);

-- 10. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Create trigger to automatically update updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 12. Update existing records to have default values
UPDATE user_preferences 
SET subscription_plan = 'free', subscription_status = 'active' 
WHERE subscription_plan IS NULL;
