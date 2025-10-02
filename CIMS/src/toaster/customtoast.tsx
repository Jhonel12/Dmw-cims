import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface CustomToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const CustomToast: React.FC<CustomToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircleIcon className="w-6 h-6" />,
          bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700',
          accentColor: 'bg-green-500'
        };
      case 'error':
        return {
          icon: <XCircleIcon className="w-6 h-6" />,
          bgColor: 'bg-gradient-to-r from-red-50 to-rose-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700',
          accentColor: 'bg-red-500'
        };
      case 'warning':
        return {
          icon: <ExclamationTriangleIcon className="w-6 h-6" />,
          bgColor: 'bg-gradient-to-r from-yellow-50 to-amber-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700',
          accentColor: 'bg-yellow-500'
        };
      case 'info':
        return {
          icon: <InformationCircleIcon className="w-6 h-6" />,
          bgColor: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700',
          accentColor: 'bg-blue-500'
        };
      default:
        return {
          icon: <InformationCircleIcon className="w-6 h-6" />,
          bgColor: 'bg-gradient-to-r from-gray-50 to-slate-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700',
          accentColor: 'bg-gray-500'
        };
    }
  };

  const config = getToastConfig();

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        relative max-w-sm w-full ${config.bgColor} border-l-4 ${config.borderColor} 
        rounded-lg shadow-lg backdrop-blur-sm
      `}
      style={{
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* DMW-inspired accent line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${config.accentColor} rounded-t-lg`} />
      
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${config.iconColor}`}>
            {config.icon}
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-bold ${config.titleColor}`}>
              {title}
            </h3>
            {message && (
              <p className={`mt-1 text-sm ${config.messageColor}`}>
                {message}
              </p>
            )}
          </div>
          
          <button
            onClick={() => onClose(id)}
            className={`
              ml-4 flex-shrink-0 rounded-full p-1.5 transition-colors duration-200
              hover:bg-black hover:bg-opacity-10 ${config.titleColor}
            `}
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className={`h-1 ${config.accentColor} rounded-b-lg`}
      />
    </motion.div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: CustomToastProps[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <CustomToast
            key={toast.id}
            {...toast}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Toast Hook for easy usage
interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = React.useState<CustomToastProps[]>([]);

  const addToast = (type: CustomToastProps['type'], options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: CustomToastProps = {
      id,
      type,
      ...options,
      onClose: (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }
    };

    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (options: ToastOptions) => addToast('success', options);
  const error = (options: ToastOptions) => addToast('error', options);
  const warning = (options: ToastOptions) => addToast('warning', options);
  const info = (options: ToastOptions) => addToast('info', options);

  return {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast
  };
};

export default CustomToast;
