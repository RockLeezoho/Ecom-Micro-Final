import type { Product } from "../types";
import { fetchProductById } from "./productService";

type AiRecommendResponse = {
  products?: string[];
  recommended_product_ids?: string[];
};

type AiChatResponse = {
  answer: string;
  product_ids?: string[];
};

const productDetailCache = new Map<string, Product>();

async function mapProductIdsToDetails(ids: string[] = []): Promise<Product[]> {
  const uniqIds = Array.from(new Set(ids.filter(Boolean)));
  const rows = await Promise.all(
    uniqIds.map(async (id) => {
      if (productDetailCache.has(id)) {
        return productDetailCache.get(id) || null;
      }
      const product = await fetchProductById(id).catch(() => null);
      if (product) {
        productDetailCache.set(id, product);
      }
      return product;
    })
  );
  
  const validProducts = rows.filter((item): item is Product => Boolean(item));
  return validProducts;
}

// Kết nối tới AI Service qua API Gateway
export const recommendProducts = async (
  user_id: string,
  history_prods: string[] = [],
  history_acts: string[] = [],
  user_query: string = ""
) => {
  const res = await fetch("/api/ai/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, history_prods, history_acts, user_query }),
  });
  if (!res.ok) throw new Error("AI Service error");
  const data: AiRecommendResponse = await res.json();
  const productIds = data.products || data.recommended_product_ids || [];
  const productDetails = await mapProductIdsToDetails(productIds);
  return { product_ids: productIds, products: productDetails };
};

export const chatWithAIService = async (user_query: string) => {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_query }),
  });
  if (!res.ok) throw new Error("AI Service error");
  const data: AiChatResponse = await res.json();
  const products = await mapProductIdsToDetails(data.product_ids || []);
  return { answer: data.answer, product_ids: data.product_ids || [], products };
};
