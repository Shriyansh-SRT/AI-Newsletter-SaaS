-- Add subscription-related columns to user_preferences table
-- Run this in your Supabase SQL editor

ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_stripe_customer_id 
ON user_preferences(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_subscription_id 
ON user_preferences(subscription_id);

-- Update existing records to have default values
UPDATE user_preferences 
SET subscription_plan = 'free', subscription_status = 'active' 
WHERE subscription_plan IS NULL;
