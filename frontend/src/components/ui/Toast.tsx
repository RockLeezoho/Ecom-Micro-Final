import React from 'react';
import { toastBadgeClassName, toastContainerClassName, toastSymbol } from './toastStyles';
import type { ToastItem } from './toastTypes';

interface ToastProps {
  toast: ToastItem;
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
  return (
    <div className={toastContainerClassName(toast.tone)}>
      <div className="flex items-start gap-3">
        <div className={toastBadgeClassName(toast.tone)}>
          {toastSymbol(toast.tone)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-wide">{toast.title}</p>
          <p className="mt-0.5 text-xs font-medium opacity-80 truncate">{toast.description}</p>
        </div>
      </div>
    </div>
  );
};

export default Toast;
