# Session Timeout Notification - Implementation Summary

## ✅ What Was Added

A user-friendly notification system that shows a toast message on the login page when the user's session expires due to inactivity.

## 📁 Files Created/Modified

### 1. **New File: `frontend/src/utils/globalToast.ts`**
A utility that allows showing toast notifications from non-React contexts (like API interceptors).

**Features:**
- Can be called from anywhere (not just React components)
- Uses browser's CustomEvent API
- Provides convenience methods: `success`, `error`, `warning`, `info`

**Note:** Currently used only by ToastContext but available for future use.

### 2. **Modified: `frontend/src/contexts/ToastContext.tsx`**
Updated to listen for global toast events.

**Changes:**
- Added `useEffect` hook to listen for global toast events
- Now toasts can be triggered from anywhere in the app

### 3. **Modified: `frontend/src/services/api-client.ts`**
Stores session expiration reason for display on login page.

**Changes:**
- Stores message in `sessionStorage` when session expires
- Redirects immediately to login page (no delay)
- Different messages for session expiration vs. generic auth errors

### 4. **Modified: `frontend/src/pages/auth/Login.tsx`**
Displays the session expiration toast when page loads.

**Changes:**
- Checks `sessionStorage` for login message on component mount
- Shows appropriate toast (warning/error) based on message type
- Clears the message after displaying to prevent showing again

### 5. **Modified: `frontend/src/contexts/AuthContext.tsx`**
Enhanced logging for better debugging.

## 🎨 Toast Notifications

### Session Expired (Inactivity)
```
⚠️ Session Expired
Your session has expired due to inactivity. Please log in again.
```
- **Type**: Warning (yellow/orange)
- **Trigger**: When backend returns `SESSION_EXPIRED` code
- **Duration**: 5 seconds (default)

### Generic Authentication Error
```
❌ Authentication Error
Your token has expired. Please log in again.
```
- **Type**: Error (red)
- **Trigger**: Other 401 errors without `SESSION_EXPIRED` code
- **Duration**: 5 seconds (default)

## 🧪 Testing

1. **Start your app and login**
2. **Wait 15 seconds** (timeout is set to 10 seconds for testing)
3. **Try to use the app** (or just wait for background token check)
4. **You should see:**
   - Immediate redirect to login page
   - Toast notification appears on login page
   - Message: "Your session has expired due to inactivity. Please log in again."

## 🔧 How It Works

### Flow:
1. User is idle for more than 10 seconds (timeout setting)
2. User makes a request OR background token check runs
3. Backend returns `401` with `SESSION_EXPIRED` code
4. API interceptor catches the error
5. **Message is stored in sessionStorage**
6. Cookies are cleared
7. User is redirected to login page immediately
8. **Login page displays the toast notification** ⚠️
9. Message is cleared from sessionStorage

### Code Flow:
```
Backend Middleware (401 + SESSION_EXPIRED)
    ↓
API Client Interceptor detects error
    ↓
Message stored in sessionStorage
    ↓
Cookies cleared
    ↓
Redirect to /login
    ↓
Login page loads
    ↓
useEffect checks sessionStorage
    ↓
Toast is displayed
    ↓
sessionStorage cleared
```

## ⚙️ Configuration

### Change Toast Message
In `api-client.ts`, you can modify the stored message:

```typescript
// For session expiration
sessionStorage.setItem('loginMessage', JSON.stringify({
  type: 'warning',
  title: 'Session Expired',
  message: 'Your custom message here'
}));

// For other auth errors
sessionStorage.setItem('loginMessage', JSON.stringify({
  type: 'error',
  title: 'Authentication Required',
  message: 'Your custom message here'
}));
```

### Change Toast Duration
The toast uses the default 5-second duration from `ToastContext`. To change it, you would need to pass duration in the stored message and handle it in `Login.tsx`.

### Change Toast Position
In `ToastContext.tsx` line 85:

```tsx
<div className="fixed top-4 right-4 z-50 space-y-2">
  {/* Change classes to move toast */}
  {/* top-4 right-4 = top-right */}
  {/* bottom-4 right-4 = bottom-right */}
  {/* top-4 left-4 = top-left */}
</div>
```

## 🎯 Benefits

1. ✅ **User-Friendly**: Clear message explaining why they were logged out, shown on login page
2. ✅ **Professional**: Uses the app's existing toast system
3. ✅ **Flexible**: Easy to customize message, duration, and position
4. ✅ **No Race Conditions**: Toast shows on login page, avoiding timing issues with redirects
5. ✅ **Reliable**: Message persists in sessionStorage during redirect
6. ✅ **Consistent**: Uses same notification system as rest of app
7. ✅ **Clean UX**: User sees toast where they need to take action (login page)

## 📝 Usage Examples

### From anywhere in the app:
```typescript
import { globalToast } from '../utils/globalToast';

// Show success
globalToast.success('Success!', 'Operation completed');

// Show error
globalToast.error('Error!', 'Something went wrong');

// Show warning
globalToast.warning('Warning!', 'Please be careful');

// Show info
globalToast.info('Info', 'Did you know...');
```

### From API interceptors:
```typescript
import { globalToast } from '../utils/globalToast';

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 500) {
      globalToast.error('Server Error', 'Please try again later');
    }
    return Promise.reject(error);
  }
);
```

## 🚀 Production Checklist

Before deploying:
- [ ] Change timeout from 10 seconds back to 60+ seconds (or desired duration)
- [ ] Test on different screen sizes (mobile, tablet, desktop)
- [ ] Test with multiple tabs open
- [ ] Verify toast is readable and doesn't block UI
- [ ] Consider adding sound/vibration for mobile users (optional)
- [ ] Test with screen readers for accessibility (optional)

## 🐛 Troubleshooting

### Toast not showing:
1. Check browser console for errors
2. Verify ToastProvider is in App.tsx
3. Check that api-client is imported correctly
4. Ensure globalToast utility is working

### Toast shows but doesn't redirect:
1. Check setTimeout in api-client (line 78)
2. Verify redirectToLogin() method works
3. Check for console errors

### Multiple toasts showing:
1. This is expected if multiple requests fail at once
2. Consider debouncing if it's excessive

## 📖 Related Files

- `backend/app/Http/Middleware/CheckTokenActivity.php` - Session timeout logic
- `backend/routes/api.php` - Routes with timeout middleware
- `frontend/src/components/ui/Toast.tsx` - Toast UI component
- `frontend/src/types/toast.ts` - Toast type definitions
