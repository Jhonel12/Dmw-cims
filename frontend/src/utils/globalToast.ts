/**
 * Global Toast Utility
 * This allows showing toasts from non-React contexts (like API interceptors)
 */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface GlobalToastEvent {
  type: ToastType;
  title: string;
  message?: string;
}

// Custom event for global toasts
const TOAST_EVENT = 'global-toast';

/**
 * Show a toast notification from anywhere in the app
 */
export const showGlobalToast = (type: ToastType, title: string, message?: string) => {
  const event = new CustomEvent<GlobalToastEvent>(TOAST_EVENT, {
    detail: { type, title, message }
  });
  window.dispatchEvent(event);
};

/**
 * Listen for global toast events
 */
export const listenForGlobalToasts = (
  callback: (type: ToastType, title: string, message?: string) => void
) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<GlobalToastEvent>;
    const { type, title, message } = customEvent.detail;
    callback(type, title, message);
  };

  window.addEventListener(TOAST_EVENT, handler);

  // Return cleanup function
  return () => {
    window.removeEventListener(TOAST_EVENT, handler);
  };
};

// Convenience methods
export const globalToast = {
  success: (title: string, message?: string) => showGlobalToast('success', title, message),
  error: (title: string, message?: string) => showGlobalToast('error', title, message),
  warning: (title: string, message?: string) => showGlobalToast('warning', title, message),
  info: (title: string, message?: string) => showGlobalToast('info', title, message),
};
