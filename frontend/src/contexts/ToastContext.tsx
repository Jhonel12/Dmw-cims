import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import Toast from '../components/ui/Toast';
import type { Toast as ToastType, ToastContextType } from '../types/toast';
import { listenForGlobalToasts } from '../utils/globalToast';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  // Listen for global toast events (from non-React contexts)
  useEffect(() => {
    const cleanup = listenForGlobalToasts((type, title, message) => {
      showToast({ type, title, message });
    });
    return cleanup;
  }, []);

  const showToast = (toast: Omit<ToastType, 'id'>): string => {
    const id = generateId();
    const newToast: ToastType = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message?: string, options?: Partial<ToastType>): string => {
    return showToast({
      type: 'success',
      title,
      message,
      ...options
    });
  };

  const showError = (title: string, message?: string, options?: Partial<ToastType>): string => {
    return showToast({
      type: 'error',
      title,
      message,
      ...options
    });
  };

  const showWarning = (title: string, message?: string, options?: Partial<ToastType>): string => {
    return showToast({
      type: 'warning',
      title,
      message,
      ...options
    });
  };

  const showInfo = (title: string, message?: string, options?: Partial<ToastType>): string => {
    return showToast({
      type: 'info',
      title,
      message,
      ...options
    });
  };

  const value: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={hideToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
