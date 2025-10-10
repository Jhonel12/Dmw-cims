# Session Timeout Implementation Guide

## Overview
This implementation adds a 1-minute idle timeout to your authentication system. If a user doesn't make any API request for 1 minute, their session will automatically expire.

## Backend Implementation

### 1. Middleware: `CheckTokenActivity`
Location: `backend/app/Http/Middleware/CheckTokenActivity.php`

**How it works:**
- Tracks the last activity time for each token in the cache
- On every request, checks if more than 60 seconds (1 minute) have passed since the last activity
- If idle time exceeds the limit, the token is deleted and a 401 response is returned
- If within the limit, updates the last activity timestamp

**Configuration:**
```php
// Change this value to adjust the timeout duration
$idleTimeout = 60; // 1 minute in seconds
// Examples:
// 300 = 5 minutes
// 600 = 10 minutes
// 1800 = 30 minutes
```

### 2. Routes Registration
Location: `backend/routes/api.php`

All protected routes now use the middleware:
```php
Route::middleware(['auth:sanctum', 'check.token.activity'])->group(function () {
    // Your protected routes
});
```

### 3. Middleware Registration
Location: `backend/bootstrap/app.php`

The middleware is registered as an alias:
```php
$middleware->alias([
    'check.token.activity' => \App\Http\Middleware\CheckTokenActivity::class,
]);
```

## Response Format

When a session expires, the API returns:
```json
{
    "success": false,
    "message": "Session expired due to inactivity",
    "code": "SESSION_EXPIRED"
}
```
HTTP Status: `401 Unauthorized`

## Important: Two Different Endpoints

### `/api/auth/check` - Token Validation (Doesn't Reset Timer) ✅
Use this for:
- Periodic token checks
- Route guards
- Background validation
- Any check that shouldn't extend the session

**Does NOT update the activity timer!**

```bash
GET /api/auth/check
Authorization: Bearer YOUR_TOKEN

Response:
{
    "success": true,
    "message": "Token is valid",
    "data": {
        "valid": true
    }
}
```

### `/api/auth/me` - Get User Info (Resets Timer) 🔄
Use this for:
- Loading user profile
- Actual user actions
- When you need full user data
- When user interaction should extend the session

**Updates the activity timer!**

```bash
GET /api/auth/me
Authorization: Bearer YOUR_TOKEN

Response:
{
    "success": true,
    "data": {
        "user": { ... },
        "token": "...",
        "token_type": "Bearer"
    }
}
```

## Frontend Implementation

To handle this on the frontend, you should:

### 1. Update Token Verification to Use `/check` Endpoint

**IMPORTANT:** Use `/api/auth/check` instead of `/api/auth/me` for periodic validation!

```typescript
// In your auth service or route guards
export const checkTokenValidity = async () => {
  try {
    // Use /check endpoint - won't reset activity timer
    const response = await apiClient.get('/auth/check');
    return response.data.success;
  } catch (error) {
    return false;
  }
};

// Only use /me when you actually need user data
export const getCurrentUser = async () => {
  // This WILL reset the activity timer
  const response = await apiClient.get('/auth/me');
  return response.data;
};
```

### 2. Add Response Interceptor
In your API client (`frontend/src/services/api-client.ts`):

```typescript
// Add to your axios interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.code;
      
      if (errorCode === 'SESSION_EXPIRED') {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Show notification to user
        console.log('Your session has expired due to inactivity');
        
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### 3. Optional: Add Activity Warning
You can add a warning before the session expires:

```typescript
let inactivityTimer: NodeJS.Timeout;
let warningTimer: NodeJS.Timeout;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  clearTimeout(warningTimer);
  
  // Show warning at 50 seconds (10 seconds before expiry)
  warningTimer = setTimeout(() => {
    console.log('Your session will expire in 10 seconds');
    // Or show a modal/toast
  }, 50000);
  
  // Auto logout at 60 seconds
  inactivityTimer = setTimeout(() => {
    console.log('Session expired, logging out...');
    // Call logout API or redirect to login
  }, 60000);
}

// Reset timer on user activity
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);
```

## Testing

### Test the Timeout:
1. Login to your application
2. Wait for 1 minute without making any API requests
3. Try to make an API request (e.g., load a page)
4. You should be logged out with a "Session expired" message

### Test Activity Extension:
1. Login to your application
2. Make API requests every 30 seconds
3. Your session should remain active as long as you're making requests

## Adjusting the Timeout Duration

To change the timeout duration, modify the `$idleTimeout` variable in:
`backend/app/Http/Middleware/CheckTokenActivity.php`

```php
// Change from 60 seconds to your desired duration
$idleTimeout = 300; // 5 minutes
$idleTimeout = 600; // 10 minutes
$idleTimeout = 1800; // 30 minutes
```

## Cache Requirements

This implementation uses Laravel's cache system. Make sure your cache driver is properly configured in `.env`:

```env
CACHE_DRIVER=file  # Or redis, memcached, etc.
```

## Production Considerations

1. **Cache Driver**: For production, consider using Redis or Memcached instead of file cache for better performance
2. **Timeout Duration**: 1 minute is very short. Consider increasing to 15-30 minutes for production
3. **User Experience**: Implement a warning notification before the session expires
4. **Grace Period**: Consider adding a grace period or "extend session" button

## Troubleshooting

### Session expires immediately:
- Check that your cache is working properly
- Verify the cache driver is configured correctly
- Check Laravel logs: `backend/storage/logs/laravel.log`

### Session doesn't expire:
- Make sure the middleware is registered correctly
- Check that routes are using the middleware
- Verify cache is storing values (check `storage/framework/cache/`)

### Multiple device handling:
- Each token has its own activity tracking
- Multiple devices/tabs will each track their own activity
- Logging out on one device doesn't affect others

## Notes

- This implementation uses token-based session tracking, not traditional Laravel sessions
- Each access token is tracked independently
- The cache stores the last activity timestamp for each token
- When a token is deleted, the cache entry is also cleaned up
