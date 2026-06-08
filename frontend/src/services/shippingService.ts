export type CarrierOption = {
  code: string;
  name: string;
  contactNumber?: string;
  fee: number;
};

type RawCarrierOption = {
  code?: string;
  method?: string;
  name?: string;
  label?: string;
  contact_number?: string;
  contactNumber?: string;
  fee?: number | string;
  price?: number | string;
};

function mapCarrier(item: RawCarrierOption): CarrierOption {
  const rawCode = String(item.code || item.method || item.name || "carrier");
  const fee = Number(item.fee ?? item.price ?? 0);
  return {
    code: rawCode,
    name: String(item.name || item.label || rawCode),
    contactNumber: String(item.contact_number || item.contactNumber || "") || undefined,
    fee: Number.isFinite(fee) ? fee : 0,
  };
}

export async function listShippingCarriers(): Promise<CarrierOption[]> {
  const res = await fetch("/api/shipping/carriers/");
  if (!res.ok) {
    const fallback = await fetch("/api/shipping/methods/");
    if (!fallback.ok) {
      throw new Error("Khong the tai danh sach nha van chuyen");
    }
    const fallbackData = await fallback.json();
    const fallbackRows = Array.isArray(fallbackData) ? fallbackData : Array.isArray(fallbackData?.results) ? fallbackData.results : [];
    return fallbackRows.map(mapCarrier);
  }
  const data = await res.json();
  const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return rows.map(mapCarrier);
}
