export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  showSuccess: (title: string, message?: string, options?: Partial<Toast>) => string;
  showError: (title: string, message?: string, options?: Partial<Toast>) => string;
  showWarning: (title: string, message?: string, options?: Partial<Toast>) => string;
  showInfo: (title: string, message?: string, options?: Partial<Toast>) => string;
}
