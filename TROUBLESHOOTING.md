# Troubleshooting Supabase 406/400 Errors

## Common Issues and Solutions

### 406 Error (Not Acceptable)

**Cause:** This typically happens when:
1. Using `.single()` on a query that returns no rows
2. Missing or incorrect headers in API requests
3. API version mismatch

**Solution:** 
- Changed all `.single()` calls to `.maybeSingle()` for optional queries (like settings)
- Updated Supabase client configuration to include proper headers

### 400 Error (Bad Request)

**Cause:** This typically happens when:
1. Table doesn't exist
2. RLS policies are blocking the request
3. Invalid data format or missing required fields

**Solution:**
1. **Verify tables exist:** Run the `supabase-migration.sql` script in your Supabase SQL Editor
2. **Check RLS policies:** Ensure Row Level Security is properly configured
3. **Verify user authentication:** Make sure the user is properly authenticated

## Steps to Fix

### 1. Verify Database Schema

Run this in your Supabase SQL Editor to check if tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_roles', 'flights', 'airlines', 'agencies', 'settings', 'managed_users');
```

All 6 tables should be listed.

### 2. Check RLS Policies

Verify RLS is enabled and policies exist:

```sql
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_roles', 'flights', 'airlines', 'agencies', 'settings', 'managed_users');
```

### 3. Test Direct Query

Try querying directly in Supabase SQL Editor:

```sql
-- Test user_roles query (replace with your user_id)
SELECT * FROM user_roles WHERE user_id = 'your-user-id-here';

-- Test settings query
SELECT * FROM settings WHERE user_id = 'your-user-id-here';
```

### 4. Check Environment Variables

Ensure your `.env` file has the correct values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** 
- The URL should NOT have `/rest/v1` at the end
- The anon key should be the full key from your Supabase dashboard

### 5. Verify User Authentication

Check in browser console:
```javascript
// In browser console after login
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

If session is null, the user is not authenticated.

### 6. Check Browser Console for Detailed Errors

Open browser DevTools → Network tab and look for:
- Request URL
- Request headers
- Response status
- Response body (error details)

## Common Fixes

### Fix 1: Re-run Migration Script

If tables don't exist or are incomplete:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire `supabase-migration.sql` file
3. Run it (this will create/update tables safely with `IF NOT EXISTS`)

### Fix 2: Disable RLS Temporarily (Testing Only)

**⚠️ WARNING: Only for testing! Re-enable RLS after testing.**

```sql
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
-- ... etc for other tables
```

After testing, re-enable:
```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
-- ... etc
```

### Fix 3: Check Supabase Project Status

1. Go to Supabase Dashboard
2. Check if your project is paused (free tier projects pause after inactivity)
3. If paused, click "Restore" to reactivate

### Fix 4: Verify API Keys

1. Go to Supabase Dashboard → Settings → API
2. Copy the **Project URL** (should be like `https://xxxxx.supabase.co`)
3. Copy the **anon/public** key
4. Update your `.env` file
5. Restart your dev server (`npm run dev`)

## Still Having Issues?

1. **Check Supabase Logs:**
   - Dashboard → Logs → API Logs
   - Look for detailed error messages

2. **Test with Supabase Client Directly:**
   ```javascript
   // In browser console
   import { supabase } from './src/supabase';
   const { data, error } = await supabase.from('user_roles').select('*');
   console.log('Data:', data, 'Error:', error);
   ```

3. **Verify Network Connectivity:**
   - Check if you can access `https://your-project.supabase.co`
   - Check for CORS errors in browser console

4. **Check Supabase Status:**
   - Visit https://status.supabase.com
   - Check if there are any service outages
