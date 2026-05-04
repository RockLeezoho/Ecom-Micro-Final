export type ShippingMethod = {
  code: "standard" | "express";
  name: string;
  fee: number;
};

type RawShippingMethod = {
  code?: string;
  method?: string;
  name?: string;
  label?: string;
  fee?: number | string;
  price?: number | string;
};

function normalizeCode(raw: string): "standard" | "express" {
  const value = raw.toLowerCase();
  return value.includes("express") ? "express" : "standard";
}

function mapShippingMethod(item: RawShippingMethod): ShippingMethod {
  const rawCode = String(item.code || item.method || item.name || "standard");
  const code = normalizeCode(rawCode);
  const fee = Number(item.fee ?? item.price ?? (code === "express" ? 15000 : 5000));
  return {
    code,
    name: String(item.name || item.label || rawCode),
    fee: Number.isFinite(fee) ? fee : 0,
  };
}

export async function listShippingMethods(): Promise<ShippingMethod[]> {
  const res = await fetch("/api/shipping/methods/");
  if (!res.ok) {
    throw new Error("Khong the tai phuong thuc van chuyen");
  }
  const data = await res.json();
  const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return rows.map(mapShippingMethod);
}
