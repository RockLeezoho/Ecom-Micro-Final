import type { ToastTone } from './Toast';

export const toastContainerClassName = (tone: ToastTone): string =>
  `rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md ${
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
      : tone === 'error'
        ? 'border-rose-200 bg-rose-50/95 text-rose-900'
        : 'border-sky-200 bg-sky-50/95 text-sky-900'
  }`;

export const toastBadgeClassName = (tone: ToastTone): string =>
  `mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
    tone === 'success'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'error'
        ? 'bg-rose-100 text-rose-700'
        : 'bg-sky-100 text-sky-700'
  }`;

export const toastSymbol = (tone: ToastTone): string => {
  if (tone === 'success') return '✓';
  if (tone === 'error') return '!';
  return '→';
};
