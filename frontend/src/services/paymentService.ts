export type PaymentMethod = {
  code: string;
  name: string;
};

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
