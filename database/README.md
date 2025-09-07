# Database Setup

This directory contains all database migrations and setup files for the Sendly newsletter application.

## 📁 File Structure

```
database/
├── migrations/
│   ├── 001_user_preferences.sql      # User preferences table with RLS
│   ├── 002_newsletter_tables.sql     # Newsletter queue and error tables
│   └── 003_subscription_fields.sql  # Stripe subscription fields
└── README.md                         # This file
```

## 🚀 Setup Instructions

### 1. Run Migrations in Order

Execute these SQL files in your Supabase SQL editor in this order:

1. **001_user_preferences.sql** - Creates user preferences table with RLS policies
2. **002_newsletter_tables.sql** - Creates newsletter queue and error tables
3. **003_subscription_fields.sql** - Adds Stripe subscription fields

### 2. Verify RLS Policies

After running migrations, verify that Row Level Security is enabled:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('user_preferences', 'newsletter_queue', 'newsletter_errors');
```

### 3. Test RLS Policies

```sql
-- This should only return current user's data
SELECT * FROM user_preferences;
```

## 🔒 Security Features

### Row Level Security (RLS)

- ✅ **User Preferences**: Users can only access their own preferences
- ✅ **Newsletter Queue**: Users can only see their own pending newsletters
- ✅ **Error Logs**: Users can only see their own error messages
- ✅ **Subscription Data**: Users can only access their own subscription info

### Policies Applied

- `SELECT`: Users can view their own data
- `INSERT`: Users can create their own records
- `UPDATE`: Users can modify their own records
- `DELETE`: Cascade delete when user is deleted

## 📊 Tables Overview

### `user_preferences`

- Stores user newsletter preferences
- Includes subscription plan and Stripe data
- RLS enabled with user-specific policies

### `newsletter_queue`

- Stores pending newsletter emails
- Tracks status (pending, sent, failed)
- RLS enabled for user data isolation

### `newsletter_errors`

- Logs newsletter sending errors
- Includes run_id for debugging
- RLS enabled for user privacy

## 🔧 Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🚨 Important Notes

- **Never commit `.env` files** to version control
- **Always test RLS policies** before production
- **Backup database** before running migrations
- **Run migrations in order** to avoid conflicts
