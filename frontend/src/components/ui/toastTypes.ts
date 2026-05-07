export type ToastTone = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  description: string;
};

export type ToastInput = Omit<ToastItem, 'id'>;
