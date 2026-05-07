import { createContext } from 'react';
import type { ToastInput } from '../ui/toastTypes';

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
export type { ToastContextValue };
