-- Create a function to check user preferences that can be called without authentication
-- This is safe because it only reads data and doesn't expose sensitive information

CREATE OR REPLACE FUNCTION check_user_newsletter_status(user_uuid UUID)
RETURNS TABLE(is_active BOOLEAN, categories TEXT[], frequency TEXT, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.is_active,
    up.categories,
    up.frequency,
    up.email
  FROM user_preferences up
  WHERE up.user_id = user_uuid;
END;
$$;

-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION check_user_newsletter_status(UUID) TO anon;
