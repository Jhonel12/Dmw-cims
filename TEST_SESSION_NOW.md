# Quick Session Timeout Test

## Test RIGHT NOW - Follow these exact steps:

### Step 1: Login and Note the Time
1. Open your app: http://localhost:5173 (or your URL)
2. Login with your credentials
3. **Write down the current time**: ___:___
4. Open Browser Console (F12)
5. You should see: `✅ Token verification successful`

### Step 2: Make One More Request
1. Click on any page/menu item
2. **Write down this time**: ___:___
3. This is your "last activity" time

### Step 3: Close and Wait
1. **CLOSE the browser tab completely**
2. **Set a timer for 70 seconds** (use your phone)
3. **DO NOT reopen the tab until 70 seconds have passed!**
4. Go make coffee, check your phone, whatever - just wait!

### Step 4: Reopen After 70 Seconds
1. After the timer finishes, open a NEW tab
2. Navigate to your app
3. Open Console immediately (F12)
4. **What do you see?**

## Expected Results:

### If it works (session expired):
```
Console:
🔍 Starting background token verification...
❌ Background token verification failed: (error)
❌ Error status: 401
❌ Error data: {success: false, message: "Session expired due to inactivity", code: "SESSION_EXPIRED"}
🚪 Session expired - logging out user
[Redirected to login page]
```

### If it's not working (still logged in):
```
Console:
🔍 Starting background token verification...
✅ Token verification successful: Object
INITIALIZE_AUTH action: Object
ProtectedRoute - Authenticated, rendering children
```

## If You See "Still Logged In":

Check these things:

### 1. Did you wait the FULL 70 seconds?
   - The timeout is 60 seconds
   - You need to wait MORE than 60 seconds
   - Use a timer! Don't guess!

### 2. Check your backend is using the new middleware:
   Open: `backend/routes/api.php` line 38
   Should say: `Route::middleware(['auth:sanctum', 'check.token.activity'])`

### 3. Restart Laravel server:
   If you haven't restarted since we added the middleware:
   ```bash
   # Stop the server (Ctrl+C)
   # Then start it again:
   cd backend
   php artisan serve
   ```

### 4. Clear cache:
   ```bash
   cd backend
   php artisan cache:clear
   ```

## Quick Backend Test (Alternative):

If the browser test is confusing, test the backend directly:

```bash
# 1. Login (save this token!)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"password"}'

# 2. Immediately test (should work)
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_FROM_STEP_1"

# 3. Wait 70 seconds (use a timer!)
# ... wait ...
# ... still waiting ...
# ... almost there ...

# 4. Test again (should fail)
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_FROM_STEP_1"

# Expected: {"success":false,"message":"Session expired due to inactivity","code":"SESSION_EXPIRED"}
```

## Debugging Checklist:

- [ ] I waited MORE than 60 seconds (used a timer)
- [ ] I closed the browser tab completely
- [ ] My backend is running
- [ ] I restarted the backend after adding middleware
- [ ] The route has both middlewares: `auth:sanctum` AND `check.token.activity`
- [ ] I cleared the cache with `php artisan cache:clear`

## Current Timeout Setting:

**File**: `backend/app/Http/Middleware/CheckTokenActivity.php`
**Line 28**: `$idleTimeout = 60;` (1 minute)

To test faster, you can temporarily change to 10 seconds:
```php
$idleTimeout = 10; // 10 seconds for quick testing
```

Then restart Laravel server and test again!
