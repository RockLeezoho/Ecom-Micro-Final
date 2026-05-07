import React, { useMemo, useState } from 'react';
import ToastViewport from '../ui/ToastViewport';
import type { ToastItem, ToastInput } from '../ui/toastTypes';
import { ToastContext } from './toastContext';
function buildToastId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (toast: ToastInput) => {
    const id = buildToastId();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2600);
  };

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} />
    </ToastContext.Provider>
  );
};
