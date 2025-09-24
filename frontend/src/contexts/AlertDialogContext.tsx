import React, { createContext, useContext, useState, ReactNode } from 'react';
import AlertDialog from '../components/ui/AlertDialog';
import type { AlertDialogProps } from '../types/alertDialog';

interface AlertDialogContextType {
  showAlert: (options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>) => Promise<boolean>;
  showConfirm: (options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm' | 'type'>) => Promise<boolean>;
  showWarning: (options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm' | 'type'>) => Promise<boolean>;
  showDanger: (options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm' | 'type'>) => Promise<boolean>;
  showSuccess: (options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm' | 'type'>) => Promise<boolean>;
  showInfo: (options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm' | 'type'>) => Promise<boolean>;
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined);

interface AlertDialogProviderProps {
  children: ReactNode;
}

export const AlertDialogProvider: React.FC<AlertDialogProviderProps> = ({ children }) => {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>;
    resolve: (value: boolean) => void;
  }>({
    isOpen: false,
    options: {
      title: '',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'warning',
      isLoading: false
    },
    resolve: () => {}
  });

  const showAlert = (options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        options,
        resolve
      });
    });
  };

  const showConfirm = (options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm' | 'type'>): Promise<boolean> => {
    return showAlert({ ...options, type: 'info' });
  };

  const showWarning = (options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm' | 'type'>): Promise<boolean> => {
    return showAlert({ ...options, type: 'warning' });
  };

  const showDanger = (options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm' | 'type'>): Promise<boolean> => {
    return showAlert({ ...options, type: 'danger' });
  };

  const showSuccess = (options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm' | 'type'>): Promise<boolean> => {
    return showAlert({ ...options, type: 'success' });
  };

  const showInfo = (options: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'onConfirm' | 'type'>): Promise<boolean> => {
    return showAlert({ ...options, type: 'info' });
  };

  const handleClose = () => {
    setAlertState(prev => ({
      ...prev,
      isOpen: false
    }));
    alertState.resolve(false);
  };

  const handleConfirm = () => {
    setAlertState(prev => ({
      ...prev,
      isOpen: false
    }));
    alertState.resolve(true);
  };

  return (
    <AlertDialogContext.Provider value={{
      showAlert,
      showConfirm,
      showWarning,
      showDanger,
      showSuccess,
      showInfo
    }}>
      {children}
      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        {...alertState.options}
      />
    </AlertDialogContext.Provider>
  );
};

export const useAlertDialog = (): AlertDialogContextType => {
  const context = useContext(AlertDialogContext);
  if (context === undefined) {
    throw new Error('useAlertDialog must be used within an AlertDialogProvider');
  }
  return context;
};
