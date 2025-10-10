# Testing Remember Me Feature

## ✅ Current Configuration (Testing Mode)

**Without "Remember Me"**: 10 seconds timeout ⏱️
**With "Remember Me"**: 30 days timeout (won't expire during testing) ✅

## 🧪 How to Test

### Test 1: Normal Login (Should Expire After 10 Seconds)

1. **Restart your backend server**:
   ```bash
   cd backend
   php artisan serve
   ```

2. **Login WITHOUT checking "Remember me"**:
   - Email: `admin@example.com`
   - Password: `admin123`
   - Leave checkbox **unchecked** ☐

3. **Watch the console** (F12):
   - You'll see: `Remember me: false`

4. **Wait 15 seconds** (don't click anything!)

5. **Try to click something or reload page**

6. **Expected Result**:
   ```
   ❌ Redirected to login page
   ⚠️ Toast: "Session Expired - Your session has expired due to inactivity"
   ```

### Test 2: Remember Me Login (Should NOT Expire)

1. **Login WITH "Remember me" checked**:
   - Email: `admin@example.com`
   - Password: `admin123`
   - Check the checkbox ☑️ "Remember me for 30 days"

2. **Watch the console** (F12):
   - You'll see: `Remember me: true`

3. **Wait 15 seconds** (don't click anything!)

4. **Try to click something or reload page**

5. **Expected Result**:
   ```
   ✅ Still logged in!
   ✅ No redirect
   ✅ Everything works normally
   ```

## 📊 Test Comparison

| Test | Remember Me | Wait Time | Result |
|------|-------------|-----------|--------|
| Test 1 | ☐ Unchecked | 15 seconds | ❌ Logged out |
| Test 2 | ☑️ Checked | 15 seconds | ✅ Still logged in |

## 🔍 Backend Logs

Check what's happening in backend logs:

```bash
cd backend
tail -f storage/logs/laravel.log | grep "Token Activity"
```

### Normal Login Logs (after 10+ seconds):
```
Token Activity Check
- remember_me: false
- timeout_limit: 10
- idle_time: 12
- is_expired: true

Session Expired
- token_id: 11
- idle_seconds: 12
```

### Remember Me Login Logs (after 10+ seconds):
```
Token Activity Check
- remember_me: true
- timeout_limit: 2592000
- idle_time: 12
- is_expired: false

Token Activity Updated
```

## 🎬 Step-by-Step Test Script

### Quick Test (2 minutes):

```
1. Open backend logs in one terminal:
   cd backend
   tail -f storage/logs/laravel.log

2. Open frontend in browser with console (F12)

3. Test Normal Login:
   - Login without remember me
   - Count to 15
   - Reload page
   - Should see "Session Expired" ✓

4. Test Remember Me:
   - Login WITH remember me checked
   - Count to 15
   - Reload page
   - Should still be logged in ✓
```

## ✅ Success Criteria

The feature is working if:

1. ✅ Normal login expires after 10 seconds
2. ✅ Remember me login does NOT expire after 10 seconds
3. ✅ Toast notification shows on login page when expired
4. ✅ Backend logs show correct `remember_me` value
5. ✅ Checkbox works and passes value to backend

## 🎯 After Testing

Once you've confirmed it works, change back to production values:

**File**: `backend/app/Http/Middleware/CheckTokenActivity.php`
**Line**: 35

```php
// Change from:
$idleTimeout = $isRememberMe ? 2592000 : 10;

// To:
$idleTimeout = $isRememberMe ? 2592000 : 10800;
//                                       ^^^^^ 3 hours
```

Don't forget to restart backend after changing!

## 🐛 If It's Not Working

### Normal login not expiring:
1. Check you didn't check the remember me box
2. Verify backend was restarted
3. Check logs show `remember_me: false`
4. Clear cache: `php artisan cache:clear`

### Remember me still expires:
1. Verify checkbox is checked
2. Check console shows `Remember me: true`
3. Check backend logs show `remember_me: true`
4. Verify token has 'remember' ability

### Checkbox not doing anything:
1. Check console for `remember` value in login request
2. Restart TypeScript server (VS Code: Ctrl+Shift+P → Restart TS Server)
3. Clear browser cache
4. Rebuild frontend

## 📝 Quick Checklist

Before testing:
- [ ] Backend changes saved
- [ ] Backend server restarted
- [ ] Frontend showing checkbox
- [ ] Console open (F12)
- [ ] Backend logs tailing (optional but helpful)

During testing:
- [ ] Test 1: Normal login expires at 10 seconds ✓
- [ ] Test 2: Remember me stays logged in ✓
- [ ] Toast notification appears ✓
- [ ] Logs show correct remember_me status ✓

After successful test:
- [ ] Change timeout back to 10800 (3 hours)
- [ ] Restart backend
- [ ] Update team/documentation

---

**Current Mode**: 🧪 TESTING (10 seconds / 30 days)
**Production Mode**: 🚀 (3 hours / 30 days)

Happy testing! 🎉


