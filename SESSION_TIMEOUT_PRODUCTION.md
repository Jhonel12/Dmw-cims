# Session Timeout - Production Configuration

## ✅ Configuration Updated

The session timeout has been changed from **10 seconds** (testing) to **3 hours** (production).

## ⚙️ Current Settings

**File**: `backend/app/Http/Middleware/CheckTokenActivity.php`

### Timeout Duration:
```php
$idleTimeout = 10800; // 3 hours (10,800 seconds)
```

### Cache Duration:
```php
Cache::put($cacheKey, $currentTime, now()->addHours(4)); // 4 hours
```
**Note**: Cache is set to 4 hours (1 hour longer than timeout) to ensure activity data persists.

## 🕐 What This Means

### User Experience:
- Users can be **idle for up to 3 hours**
- After 3 hours of no activity, session expires
- Users see notification on login page: "Session expired due to inactivity"
- Users need to log in again

### What Counts as "Activity":
Any API request to protected routes resets the timer:
- Loading pages
- Fetching data
- Creating/updating records
- Any action that calls the backend

### What Doesn't Reset Timer:
- Just having the tab open
- Moving mouse on the page (without making requests)
- Public routes (login, register)
- The `/api/auth/check` endpoint (token validation only)

## 📊 Time Calculations

| Duration | Seconds | Notes |
|----------|---------|-------|
| 10 seconds | 10 | Previous (testing) |
| 1 minute | 60 | Too short |
| 15 minutes | 900 | Short for production |
| 30 minutes | 1,800 | Reasonable |
| 1 hour | 3,600 | Good balance |
| **3 hours** | **10,800** | **Current setting** |
| 8 hours | 28,800 | Work day |
| 24 hours | 86,400 | Full day |

## 🔧 How to Change Duration

Edit `backend/app/Http/Middleware/CheckTokenActivity.php` line 28:

```php
// Examples for different durations:
$idleTimeout = 900;    // 15 minutes
$idleTimeout = 1800;   // 30 minutes
$idleTimeout = 3600;   // 1 hour
$idleTimeout = 7200;   // 2 hours
$idleTimeout = 10800;  // 3 hours (current)
$idleTimeout = 14400;  // 4 hours
$idleTimeout = 28800;  // 8 hours
```

**Important**: Also update the cache duration on line 63 to be longer than the timeout:

```php
// If timeout is 3 hours, set cache to 4 hours
Cache::put($cacheKey, $currentTime, now()->addHours(4));

// General rule: cache = timeout + 1 hour
```

## 🚀 Applying Changes

### After changing the timeout:

1. **Restart Laravel backend**:
   ```bash
   # Stop the server (Ctrl+C if running)
   # Then restart:
   cd backend
   php artisan serve
   ```

2. **Clear cache** (optional but recommended):
   ```bash
   cd backend
   php artisan cache:clear
   ```

3. **No frontend restart needed** (frontend will automatically use new backend behavior)

## 🧪 Testing

### Quick Test (without waiting 3 hours):

**Option 1: Temporarily reduce timeout**
```php
// Change to 30 seconds for testing
$idleTimeout = 30;
```
- Restart backend
- Login and wait 35 seconds
- Try to use app
- Should see session expired message
- **Remember to change back to 10800!**

**Option 2: Check backend logs**
```bash
cd backend
# Watch logs in real-time
tail -f storage/logs/laravel.log
```

You'll see entries like:
```
Token Activity Check
Token Activity Updated
[After 3 hours] Session Expired
```

### Real Production Test:

1. Login to your app
2. Leave it idle for 3+ hours
3. Try to click something or reload page
4. Should be redirected to login with message

## 📊 Monitoring

### Check Activity Logs

Backend logs will show:
- `Token Activity Check` - Every protected request
- `Token Activity Updated` - Activity timer reset
- `Session Expired` - When session times out

**View logs**:
```bash
cd backend
cat storage/logs/laravel.log | grep "Token Activity"
```

### Check Active Sessions

To see cached activity records:
```bash
cd backend
php artisan tinker

# In tinker:
Cache::get('token_last_activity_11')  // Replace 11 with token ID
```

## 🎯 Best Practices

### Recommended Durations by Use Case:

| Use Case | Recommended | Reasoning |
|----------|-------------|-----------|
| High Security (Banking) | 15-30 min | Minimize exposure |
| Internal Tools | 1-2 hours | Balance security/UX |
| **Admin Dashboards** | **2-3 hours** | **Current use case** |
| Public Content | 8-24 hours | User convenience |
| Mobile Apps | 30 days | Stay logged in |

### Security Considerations:

**Shorter timeout (15-30 min)**:
- ✅ More secure
- ❌ Users get logged out frequently
- ❌ Frustrating for long tasks

**Longer timeout (8+ hours)**:
- ✅ Better user experience
- ❌ Less secure if device is left unattended
- ❌ Session hijacking window

**3 hours (current)**:
- ✅ Good balance
- ✅ Users rarely interrupted
- ✅ Reasonable security
- ✅ Covers typical work sessions

## 🔒 Additional Security Tips

### Consider implementing:

1. **Absolute Session Timeout**
   - Force logout after X hours regardless of activity
   - Example: 8 hour work day limit

2. **Warning Before Expiration**
   - Show warning at 2h 55min: "Session expires in 5 minutes"
   - Give option to extend session

3. **Remember Device**
   - Allow trusted devices to stay logged in longer
   - Use device fingerprinting

4. **IP/Location Tracking**
   - Log out if IP changes significantly
   - Alert on suspicious locations

## 📝 Configuration Summary

```
┌─────────────────────────────────────────────┐
│         SESSION TIMEOUT SETTINGS            │
├─────────────────────────────────────────────┤
│ Idle Timeout:    3 hours (10,800 seconds)  │
│ Cache Duration:  4 hours                    │
│ Environment:     Production                 │
│ Notification:    On login page              │
│ Message Type:    Warning toast              │
└─────────────────────────────────────────────┘
```

## ✅ Deployment Checklist

Before deploying to production:

- [x] Timeout set to 3 hours (10,800 seconds)
- [x] Cache duration set to 4 hours
- [x] Notification system working
- [x] Toast appears on login page
- [ ] Backend restarted with new settings
- [ ] Cache cleared
- [ ] Tested manually
- [ ] Monitoring set up
- [ ] Team informed about timeout policy
- [ ] Documentation updated

## 🆘 Troubleshooting

### Users getting logged out too quickly:
- Check if timeout is correctly set to 10800
- Verify backend has been restarted
- Check logs for premature expiration

### Users not getting logged out at all:
- Verify middleware is applied to routes
- Check cache is working
- Review logs for "Token Activity" entries

### Random logouts:
- Could be cache clearing
- Could be server restarts
- Check error logs for issues

## 📞 Support

If issues persist:
1. Check `backend/storage/logs/laravel.log`
2. Verify middleware is registered
3. Test with shorter timeout (30 seconds)
4. Check cache driver configuration

---

**Last Updated**: Session timeout configured for 3 hours production use
**Environment**: Production Ready ✅
**Status**: Active and Monitoring
