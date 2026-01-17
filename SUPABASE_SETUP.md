# Supabase Email Confirmation Setup

## Problem
By default, Supabase requires users to confirm their email before they can sign in. This causes an "Email not confirmed" error when trying to sign in after registration.

## Solution Options

### Option 1: Disable Email Confirmation (Recommended for Development/Internal Tools)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to: **Authentication** → **Settings** → **Auth**
4. Scroll down to **Email Auth** section
5. Toggle **"Confirm email"** to **OFF**
6. Click **Save**

After this, users will be able to sign in immediately after registration without email confirmation.

### Option 2: Keep Email Confirmation Enabled (Recommended for Production)

If you want to keep email confirmation enabled for security:

1. Users will receive a confirmation email after registration
2. They must click the link in the email to confirm their account
3. After confirmation, they can sign in normally

The app is now configured to:
- Show a helpful message after registration if email confirmation is required
- Show a clear error message if someone tries to sign in without confirming their email

### Option 3: Auto-Confirm Users via Database Trigger (Advanced)

If you want to auto-confirm users but still use email confirmation for other purposes, you can create a database trigger that automatically confirms users when they're added to the `user_roles` table.

Run this SQL in your Supabase SQL Editor:

```sql
-- Function to auto-confirm user email
CREATE OR REPLACE FUNCTION auto_confirm_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Update auth.users to set email_confirmed_at
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = NEW.user_id
    AND email_confirmed_at IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that runs after inserting into user_roles
CREATE TRIGGER auto_confirm_on_user_role_insert
AFTER INSERT ON user_roles
FOR EACH ROW
EXECUTE FUNCTION auto_confirm_user_email();
```

**Note:** This requires enabling the `SECURITY DEFINER` function which has elevated privileges. Use with caution.

## Current Configuration

The app now handles both scenarios:
- ✅ If email confirmation is **disabled**: Users can sign in immediately
- ✅ If email confirmation is **enabled**: Users see helpful messages about checking their email

## Testing

1. Try registering a new user
2. If email confirmation is enabled, check your email and click the confirmation link
3. Then try signing in

If you want to disable email confirmation for easier testing, use Option 1 above.
