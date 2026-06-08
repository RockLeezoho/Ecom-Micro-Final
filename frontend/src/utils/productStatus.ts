export type ProductStatus = 'NEW' | 'SELLING' | 'DISCONTINUED' | 'ACTIVE' | 'INACTIVE';

export function getProductStatusLabel(status?: string): string {
  switch (status) {
    case 'NEW':
      return 'Mới';
    case 'SELLING':
    case 'ACTIVE':
      return 'Đang bán';
    case 'DISCONTINUED':
    case 'INACTIVE':
      return 'Ngừng bán';
    default:
      return 'Chưa rõ';
  }
}

export function getProductStatusTone(status?: string): string {
  switch (status) {
    case 'NEW':
      return 'bg-blue-50 text-blue-700 ring-blue-100';
    case 'SELLING':
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    case 'DISCONTINUED':
    case 'INACTIVE':
      return 'bg-red-50 text-red-700 ring-red-100';
    default:
      return 'bg-gray-50 text-gray-600 ring-gray-100';
  }
}

export function getProductStatusDot(status?: string): string {
  switch (status) {
    case 'NEW':
      return 'bg-blue-500';
    case 'SELLING':
    case 'ACTIVE':
      return 'bg-emerald-500';
    case 'DISCONTINUED':
    case 'INACTIVE':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}