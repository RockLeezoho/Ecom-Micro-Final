export type PaymentMethod = {
  code: string;
  name: string;
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
