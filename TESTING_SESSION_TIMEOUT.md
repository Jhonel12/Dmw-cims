# Testing Session Timeout - Step by Step Guide

## ✅ What Was Fixed

### The Problem:
The frontend was checking cookies on page load and immediately marking users as authenticated, even if the backend token had expired. The background token verification was failing but being ignored.

### The Solution:
1. **Updated `AuthContext.tsx`**: Now properly logs out users when token verification returns 401
2. **Updated `api-client.ts`**: Enhanced error handling to specifically detect `SESSION_EXPIRED` code

## 🧪 How to Test (3 Methods)

### Method 1: Browser Test (Recommended)

1. **Start your backend server** (if not running):
   ```bash
   cd backend
   php artisan serve
   ```

2. **Start your frontend** (if not running):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your app and login**:
   - Navigate to http://localhost:5173 (or your frontend URL)
   - Login with your credentials
   - ✅ You should see the dashboard

4. **Open Developer Console**:
   - Press `F12`
   - Go to "Console" tab
   - You should see logs like:
     - "Initializing auth state"
     - "Token set in API client"

5. **Close the browser tab completely** (not just minimize!)

6. **⏱️ WAIT 65-70 seconds** (be patient!)

7. **Reopen your app in a new tab**:
   - Navigate to http://localhost:5173
   - Watch the Console logs carefully

8. **Expected Results**:
   ```
   Console logs:
   ✅ "Initializing auth state"
   ✅ "401 Unauthorized: Session expired due to inactivity"
   ✅ "Session expired due to inactivity - redirecting to login"
   ✅ "Background token verification failed"
   ✅ "Session expired - logging out user"
   
   Network tab:
   ✅ Request to /auth/me returns 401
   ✅ Response: {"success":false,"message":"Session expired due to inactivity","code":"SESSION_EXPIRED"}
   
   UI:
   ✅ Automatically redirected to login page
   ```

### Method 2: Network Tab Monitoring

1. Login to your app
2. Open DevTools (F12) → **Network tab**
3. Keep the tab open and **do nothing for 65 seconds**
4. Then click on any link or reload the page
5. Look for the `/api/auth/me` request in Network tab
6. Click on it and check:
   - **Status**: 401
   - **Response**: 
     ```json
     {
       "success": false,
       "message": "Session expired due to inactivity",
       "code": "SESSION_EXPIRED"
     }
     ```

### Method 3: cURL Test (Backend Only)

Test the backend directly:

```bash
# 1. Login and get token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Copy the token from the response

# 2. Test immediately (should work)
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Response should be successful with user data

# 3. WAIT 65 seconds, then test again (should fail)
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected response:
# {"success":false,"message":"Session expired due to inactivity","code":"SESSION_EXPIRED"}
```

## 🔍 Debugging Tips

### If session doesn't expire:

1. **Check backend cache**:
   ```bash
   cd backend
   php artisan cache:clear
   ```

2. **Check if middleware is applied**:
   - Open `backend/routes/api.php`
   - Verify protected routes have: `Route::middleware(['auth:sanctum', 'check.token.activity'])`

3. **Check timeout duration**:
   - Open `backend/app/Http/Middleware/CheckTokenActivity.php`
   - Line 28 should be: `$idleTimeout = 60;`

4. **Clear browser cache**:
   - Close all tabs
   - Clear cookies for your app domain
   - Try again

### If you get immediate 401 errors:

1. **Check if you're calling `/auth/me` too frequently**
   - Every call resets the timer
   - Make sure you're not polling it every few seconds

2. **Check your .env file**:
   ```
   CACHE_DRIVER=file
   SESSION_DRIVER=file
   ```

## 📊 Expected Console Output

### On Login:
```
✅ Loaded token from storage: true
✅ Token set in API client: true
✅ Initializing auth state
```

### After 1 Minute Idle (when reopening):
```
✅ Loaded token from storage: true
✅ Initializing auth state
❌ 401 Unauthorized: Session expired due to inactivity
❌ Session expired due to inactivity - redirecting to login
❌ Background token verification failed
❌ Session expired - logging out user
➡️ [Redirect to /login]
```

## ⚙️ Configuration

To change the timeout duration, edit:
**File**: `backend/app/Http/Middleware/CheckTokenActivity.php`
**Line**: 28

```php
$idleTimeout = 60;   // 1 minute (current - for testing)
$idleTimeout = 300;  // 5 minutes
$idleTimeout = 900;  // 15 minutes (recommended for production)
$idleTimeout = 1800; // 30 minutes
```

## 🎯 What Actions Reset the Timer?

### ✅ Actions that RESET the timer (extends session):
- Loading any protected page
- Fetching OFW records
- Creating/updating clients
- Any API call to routes with `check.token.activity` middleware

### ❌ Actions that DON'T reset the timer:
- Calling `/api/auth/check` endpoint (token validation only)
- Public routes (login, register)
- Just having the tab open (no requests)

## 📝 Notes

- The timer tracks **actual API requests**, not tab activity
- Closing the tab doesn't immediately expire the session
- Multiple tabs/devices are tracked independently
- Each token has its own activity timer
- The cache stores the timestamp, not the full user data

## ✅ Success Criteria

You'll know it's working when:
1. ✅ You can login and use the app normally
2. ✅ After 1 minute of inactivity (no API requests), the next request fails
3. ✅ You see "Session expired due to inactivity" in console
4. ✅ You're automatically redirected to login
5. ✅ You can login again successfully

## 🚀 Ready for Production

Once testing is complete, remember to:
1. Increase timeout to 15-30 minutes
2. Add user-friendly notification/toast when session expires
3. Consider adding a "session about to expire" warning at 30 seconds before
4. Test with multiple concurrent users
5. Monitor cache performance in production
