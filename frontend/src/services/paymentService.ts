export type PaymentMethod = {
  code: string;
  name: string;
};

export type PaymentQrInfo = {
  paymentId: string;
  referenceNumber: string;
  paymentUrl: string;
  qrImageUrl: string;
  expiresAt?: string | null;
};

export async function simulatePaymentSuccess(payload: { payment_id?: string; reference_number?: string }) {
  const res = await fetch("/api/payments/simulate-success/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Khong the gia lap thanh toan");
  }
  return res.json();
}

export async function getPaymentQr(payload: { payment_id?: string; reference_number?: string }): Promise<PaymentQrInfo> {
  const params = new URLSearchParams();
  if (payload.payment_id) params.set('payment_id', payload.payment_id);
  if (payload.reference_number) params.set('reference_number', payload.reference_number);
  const res = await fetch(`/api/payments/qr/?${params.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Khong the tao ma QR thanh toan');
  }
  const data = await res.json();
  return {
    paymentId: String(data.payment_id || payload.payment_id || ''),
    referenceNumber: String(data.reference_number || payload.reference_number || ''),
    paymentUrl: String(data.payment_url || ''),
    qrImageUrl: String(data.qr_image_url || ''),
    expiresAt: data.expires_at || data.expire_at || null,
  };
}

export async function confirmBankTransfer(payload: { payment_id?: string; reference_number?: string; transaction_id?: string }) {
  const res = await fetch('/api/payments/confirm-transfer/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.detail || 'Khong the xac nhan chuyen khoan');
  }
  return res.json();
}

type RawPaymentMethod = {
  code?: string;
  method?: string;
  name?: string;
  label?: string;
};

function mapPaymentMethod(item: RawPaymentMethod): PaymentMethod {
  const code = String(item.code || item.method || item.name || "COD").toUpperCase();
  const name = String(item.name || item.label || item.method || code);
  return { code, name };
}

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const res = await fetch("/api/payments/methods/");
  if (!res.ok) {
    throw new Error("Khong the tai phuong thuc thanh toan");
  }
  const data = await res.json();
  const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return rows.map(mapPaymentMethod);
}
