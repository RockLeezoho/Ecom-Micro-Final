import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Toast from './Toast';
import type { ToastItem } from './toastTypes';

interface ToastViewportProps {
  toasts: ToastItem[];
}

const ToastViewport: React.FC<ToastViewportProps> = ({ toasts }) => {
  return (
    <div className="fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-auto"
          >
            <Toast toast={toast} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastViewport;
