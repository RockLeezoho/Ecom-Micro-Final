import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft,
  Package,
  MapPin,
  Truck,
  CreditCard,
  MessageSquare,
  AlertCircle,
  Loader,
  X,
} from "lucide-react";
import { Order } from "../../types";
import { t } from "../../utils/translate";
import { getAccessToken } from "../../services/authService";
import { fetchShippingAddressById } from "../../services/customerService";

const ORDER_ITEM_IMAGE_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='12' fill='%23f3f4f6'/%3E%3Cpath d='M28 30h40v36H28z' fill='%23e5e7eb'/%3E%3Cpath d='M34 38l8 8 8-8 14 14' fill='none' stroke='%239ca3af' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='40' cy='40' r='4' fill='%239ca3af'/%3E%3C/svg%3E";

const formatShippingAddress = (shippingAddress: unknown): string => {
  if (!shippingAddress) {
    return "No address provided";
  }

  if (typeof shippingAddress === "string") {
    const trimmedAddress = shippingAddress.trim();
    if (!trimmedAddress) {
      return "No address provided";
    }

    try {
      return formatShippingAddress(JSON.parse(trimmedAddress));
    } catch {
      return trimmedAddress;
    }
  }

  if (typeof shippingAddress !== "object") {
    return String(shippingAddress);
  }

  const addressData = shippingAddress as Record<string, unknown>;
  const addressText =
    addressData.address_text ?? addressData.full_address ?? addressData.address;

  if (typeof addressText === "string" && addressText.trim()) {
    return addressText.trim();
  }

  const structuredParts = [
    addressData.recipient_name,
    addressData.phone,
    addressData.street,
    addressData.ward,
    addressData.district,
    addressData.city,
  ]
    .filter((part) => typeof part === "string" && part.trim())
    .map((part) => String(part).trim());

  if (structuredParts.length > 0) {
    return structuredParts.join(", ");
  }

  if (typeof addressData.address_id === "string" && addressData.address_id.trim()) {
    return `Địa chỉ đã lưu (ID: ${addressData.address_id.trim()})`;
  }

  const fallbackPairs = Object.entries(addressData)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim())
    .map(([key, value]) => `${key}: ${String(value)}`);

  return fallbackPairs.length > 0 ? fallbackPairs.join("\n") : "No address provided";
};

const extractShippingAddressId = (shippingAddress: unknown): string | null => {
  if (!shippingAddress) {
    return null;
  }

  if (typeof shippingAddress === "string") {
    const trimmedAddress = shippingAddress.trim();
    if (!trimmedAddress) {
      return null;
    }

    try {
      return extractShippingAddressId(JSON.parse(trimmedAddress));
    } catch {
      return null;
    }
  }

  if (typeof shippingAddress !== "object") {
    return null;
  }

  const addressData = shippingAddress as Record<string, unknown>;
  return typeof addressData.address_id === "string" && addressData.address_id.trim()
    ? addressData.address_id.trim()
    : null;
};

const isSavedAddressFallback = (addressLabel: string): boolean =>
  addressLabel.startsWith("Địa chỉ đã lưu (ID:");

const extractRecipientInfo = (shippingAddress: unknown): RecipientInfo | null => {
  if (!shippingAddress || typeof shippingAddress !== "object") {
    return null;
  }

  const addressData = shippingAddress as Record<string, unknown>;
  const name =
    typeof addressData.recipient_name === "string" && addressData.recipient_name.trim()
      ? addressData.recipient_name.trim()
      : typeof addressData.username === "string" && addressData.username.trim()
        ? addressData.username.trim()
        : null;
  const phoneNumber =
    typeof addressData.recipient_phone === "string" && addressData.recipient_phone.trim()
      ? addressData.recipient_phone.trim()
      : typeof addressData.phone_number === "string" && addressData.phone_number.trim()
        ? addressData.phone_number.trim()
        : typeof addressData.phone === "string" && addressData.phone.trim()
          ? addressData.phone.trim()
          : null;

  if (!name && !phoneNumber) {
    return null;
  }

  return {
    name: name || "Chưa cập nhật",
    phoneNumber: phoneNumber || "Chưa cập nhật",
  };
};

const formatOrderItemName = (item: Record<string, unknown>): string => {
  const candidateNames = [
    item.name_product,
    item.product_name,
    item.productName,
    item.name,
    item.title,
  ];

  for (const candidate of candidateNames) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  const productIdentifier = item.product_id ?? item.productId ?? item.id;
  if (typeof productIdentifier === "string" && productIdentifier.trim()) {
    return `Sản phẩm #${productIdentifier.trim().slice(0, 8)}`;
  }

  return "Sản phẩm";
};

const formatOrderCategoryLabel = (categorySlug: unknown): string => {
  if (typeof categorySlug !== "string") {
    return "Chưa phân loại";
  }

  const normalizedSlug = categorySlug.trim().toLowerCase();
  if (!normalizedSlug) {
    return "Chưa phân loại";
  }

  if (normalizedSlug.includes("sach-luu-tru") || normalizedSlug.includes("book")) {
    return t("category_books");
  }

  if (
    normalizedSlug.includes("thiet-bi-dien-tu") ||
    normalizedSlug.includes("electronic") ||
    normalizedSlug.includes("device")
  ) {
    return t("category_electronics");
  }

  if (
    normalizedSlug.includes("thoi-trang-may-mac") ||
    normalizedSlug.includes("fashion") ||
    normalizedSlug.includes("cloth")
  ) {
    return t("category_fashion");
  }

  return categorySlug.trim();
};

const mapOrderItemCategory = (categorySlug: unknown): Order["items"][number]["category"] => {
  if (typeof categorySlug !== "string") {
    return "sach-luu-tru";
  }

  const normalizedSlug = categorySlug.trim().toLowerCase();
  if (normalizedSlug.includes("thiet-bi-dien-tu") || normalizedSlug.includes("electronic") || normalizedSlug.includes("device")) {
    return "thiet-bi-dien-tu";
  }

  if (normalizedSlug.includes("thoi-trang-may-mac") || normalizedSlug.includes("fashion") || normalizedSlug.includes("cloth")) {
    return "thoi-trang-may-mac";
  }

  return "sach-luu-tru";
};

interface OrderDetailsProps {
  orderId: string;
  onBack: () => void;
  onReview: (productId: string) => void;
}

type RecipientInfo = {
  name: string;
  phoneNumber: string;
};

type CustomerInfo = {
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  address_id: string | null;
};

const OrderDetailsView: React.FC<OrderDetailsProps> = ({
  orderId,
  onBack,
  onReview,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details from API
  useEffect(() => {
    const fetchOrderDetails = async () => {

      try {
        setLoading(true);
        setCustomerInfo(null);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        const token = getAccessToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/orders/${orderId}/`, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch order details: ${response.statusText}`,
          );
        }

        const data = await response.json();
        
        // Use customer info from API (backend extracts from shipping_address)
        if (data.customer) {
          setCustomerInfo(data.customer as CustomerInfo);
        } else {
          // Fallback: extract from shipping_address if customer object not available
          const recipientFromSnapshot = extractRecipientInfo(data.shipping_address);
          if (recipientFromSnapshot) {
            setCustomerInfo({
              customer_name: recipientFromSnapshot.name,
              customer_phone: recipientFromSnapshot.phoneNumber,
              customer_address: null,
              address_id: extractShippingAddressId(data.shipping_address),
            });
          }
        }
        
        const shippingAddressId = extractShippingAddressId(data.shipping_address);
        let shippingAddressLabel = formatShippingAddress(data.shipping_address);

        if (shippingAddressId && isSavedAddressFallback(shippingAddressLabel)) {
          try {
            const savedAddress = await fetchShippingAddressById(shippingAddressId);
            if (savedAddress?.address?.trim()) {
              shippingAddressLabel = savedAddress.address.trim();
            }
          } catch {
            // Keep the ID fallback if the address lookup is unavailable.
          }
        }

        // Map API response to Order type
        const mappedOrder: Order = {
          id: data.id,
          customerId: data.user_id,
          items: data.items.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            name: formatOrderItemName(item),
            price: parseFloat(item.sales_price),
            quantity: item.quantity,
            image: item.image_url || item.image || ORDER_ITEM_IMAGE_FALLBACK,
            category: mapOrderItemCategory(item.category_slug),
            subCategory: formatOrderCategoryLabel(item.category_slug),
            rating: 0,
            origin: "",
            description: "",
          })),
          totalAmount: parseFloat(data.total_price),
          shippingFee: parseFloat(data.shipping_fee),
          address:
            shippingAddressLabel,
          shippingMethod:
            data.shipping_method === "EXPRESS" ? "express" : "standard",
          paymentMethod: mapPaymentMethod(
            data.payments?.[0]?.payment_method || data.payment_method || "cod",
          ),
          status: mapOrderStatus(data.status),
          paymentStatus: data.is_paid ? "paid" : "unpaid",
          createdAt: data.created_at,
          carrier: data.carrier,
        };

        setOrder(mappedOrder);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Map backend order status to frontend status
  const mapOrderStatus = (status: string): Order["status"] => {
    const statusMap: Record<string, Order["status"]> = {
      PENDING: "awaiting_confirmation",
      PROCESSING: "awaiting_pickup",
      SHIPPED: "awaiting_delivery",
      COMPLETED: "delivered",
      CANCELLED: "canceled",
      awaiting_confirmation: "awaiting_confirmation",
      awaiting_pickup: "awaiting_pickup",
      awaiting_delivery: "awaiting_delivery",
      delivered: "delivered",
    };
    return statusMap[status] || "awaiting_confirmation";
  };

  // Map backend payment method to frontend payment method
  const mapPaymentMethod = (method: string): Order["paymentMethod"] => {
    const methodMap: Record<string, Order["paymentMethod"]> = {
      COD: "cod",
      BANK_TRANSFER: "bank_transfer",
      cod: "cod",
      bank_transfer: "bank_transfer",
    };
    return methodMap[method] || "cod";
  };

  // Loading state - modal
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[28px] p-8 flex flex-col items-center justify-center w-full max-w-md"
        >
          <Loader
            size={48}
            className="mb-4 animate-spin text-primary"
          />
          <p className="text-gray-600 font-bold">{t("loading")}</p>
        </motion.div>
      </div>
    );
  }

  // Error state - modal
  if (error || !order) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[28px] p-6 w-full max-w-md"
        >
          <div className="flex items-start gap-4 mb-4">
            <AlertCircle className="text-red-600 shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-black text-red-900 mb-1">{t("error")}</h3>
              <p className="text-red-700 text-sm">
                {error || "Failed to load order details"}
              </p>
            </div>
            <button
              onClick={onBack}
              className="p-1 hover:bg-gray-100 rounded-lg transition-all shrink-0"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <button
            onClick={onBack}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl transition-all text-sm"
          >
            Quay lại
          </button>
        </motion.div>
      </div>
    );
  }
  const steps: Order["status"][] = [
    "awaiting_confirmation",
    "awaiting_pickup",
    "awaiting_delivery",
    "delivered",
  ];
  const currentStepIndex = steps.indexOf(order.status);
  const currentStatusLabel =
    order.status === "delivered"
      ? t("order_details_status_delivered")
      : order.status === "awaiting_confirmation"
        ? t("order_status_awaiting_confirmation")
        : order.status === "awaiting_pickup"
          ? t("order_status_awaiting_pickup")
          : order.status === "awaiting_delivery"
            ? t("order_status_awaiting_delivery")
            : t("order_details_status_processing");

  const paymentStatusLabel =
    order.paymentStatus === "paid"
      ? t("order_details_payment_paid")
      : t("order_details_payment_unpaid");

  const paymentMethodLabel = (() => {
    switch (order.paymentMethod) {
      case "cod":
        return "Thanh toán khi nhận hàng";
      case "bank_transfer":
        return "Chuyển khoản ngân hàng";
      case "credit_card":
        return "Thẻ tín dụng";
      case "e_wallet":
        return "Ví điện tử";
      default:
        return order.paymentMethod;
    }
  })();

  const shippingMethodLabel =
    order.shippingMethod === "standard"
      ? t("order_details_shipping_standard")
      : t("order_details_shipping_express");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[32px] shadow-2xl shadow-black/30 w-full max-h-[90vh] overflow-y-auto relative"
      >
      <button
        onClick={onBack}
        className="sticky top-6 right-6 float-right p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-600 shrink-0 z-10 mr-4"
      >
        <X size={24} />
      </button>
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-12 -mt-12">
      <div className="mb-6 sm:mb-10 flex flex-col gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 leading-tight">
            Chi tiết đơn hàng
          </h1>
          <p className="text-primary font-black uppercase text-[10px] sm:text-xs tracking-widest">
            {t("order_details_status_label")} {currentStatusLabel}
          </p>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-white rounded-[28px] sm:rounded-[40px] p-4 sm:p-10 border border-gray-100 shadow-lg sm:shadow-xl shadow-primary/5 mb-8 sm:mb-12">
        <div className="relative flex justify-between gap-1 sm:gap-0">
          {/* Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
            }}
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0"
          ></motion.div>

          {steps.map((step, index) => (
            <div
              key={step}
              className="relative z-10 flex flex-col items-center group min-w-0 flex-1"
            >
              <div
                className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all border-4 ${
                  index <= currentStepIndex
                    ? "bg-primary text-white border-primary-light"
                    : "bg-white text-gray-300 border-gray-50"
                }`}
              >
                {index < currentStepIndex ? (
                  <Package size={16} className="sm:hidden" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-current"></div>
                )}
                {index < currentStepIndex ? (
                  <Package size={20} className="hidden sm:block" />
                ) : null}
              </div>
              <span
                className={`text-[9px] sm:text-[10px] font-black uppercase tracking-tighter mt-2 sm:mt-3 text-center w-full sm:w-24 leading-tight ${
                  index <= currentStepIndex
                    ? "text-primary font-black"
                    : "text-gray-300"
                }`}
              >
                {step === "awaiting_confirmation"
                  ? t("order_status_awaiting_confirmation")
                  : step === "awaiting_pickup"
                    ? t("order_status_awaiting_pickup")
                    : step === "awaiting_delivery"
                      ? t("order_status_awaiting_delivery")
                      : t("order_status_delivered")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice-style unified view */}
      <div className="mt-8 bg-white rounded-[32px] border border-gray-100 shadow-lg shadow-primary/5 overflow-hidden">
        {/* Invoice header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 p-6 sm:p-10 border-b border-gray-100">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Đơn hàng
            </div>
            <h2 className="text-2xl font-black text-gray-900">
              #{order.id}
            </h2>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Ngày tạo
            </div>
            <p className="text-base font-bold text-gray-800">
              {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="lg:text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Trạng thái thanh toán
            </div>
            <div
              className={`inline-flex px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                order.paymentStatus === "paid"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {paymentStatusLabel}
            </div>
          </div>
        </div>

        {/* Invoice items section */}
        <div className="p-6 sm:p-10">
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-gray-100">
              <div className="col-span-1" aria-hidden="true" />
              <div className="col-span-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Sản phẩm
              </div>
              <div className="col-span-2 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                Số lượng
              </div>
              <div className="col-span-2 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                Đơn giá (VNĐ)
              </div>
              <div className="col-span-2 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                Thành tiền (VNĐ)
              </div>
            </div>
            {order.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 py-4 items-center hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
              >
                <div className="col-span-1">
                  <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        const imageElement = event.currentTarget;
                        if (imageElement.src !== ORDER_ITEM_IMAGE_FALLBACK) {
                          imageElement.src = ORDER_ITEM_IMAGE_FALLBACK;
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-5">
                  <h4 className="font-black text-gray-900 text-sm mb-1 leading-snug">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 leading-snug">
                    {item.subCategory}
                  </p>
                </div>
                <div className="col-span-2 text-center font-bold text-gray-800 tabular-nums">
                  {item.quantity}
                </div>
                <div className="col-span-2 text-right font-bold text-gray-800">
                  {item.price.toLocaleString("vi-VN")}
                </div>
                <div className="col-span-2 text-right font-black text-gray-900">
                  {(item.price * item.quantity).toLocaleString("vi-VN")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice footer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-gray-100">
          <div className="p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-gray-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
              Thông tin vận chuyển
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div>
                  <div className="text-[12px] font-black tracking-widest text-gray-400 mb-1">
                    Tên người nhận
                  </div>
                  <p className="text-sm font-bold text-gray-800 leading-relaxed whitespace-pre-line flex items-start gap-2">
                    <MessageSquare size={18} className="mt-0.5 text-primary shrink-0" />
                    {customerInfo?.customer_name || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div>
                  <div className="text-[12px] font-black tracking-widest text-gray-400 mb-1">
                    Số điện thoại
                  </div>
                  <p className="text-sm font-bold text-gray-800 leading-relaxed whitespace-pre-line flex items-start gap-2">
                    <CreditCard size={18} className="mt-0.5 text-primary shrink-0" />
                    {customerInfo?.customer_phone || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
              <div>
                <div className="text-[12px] font-black tracking-widest text-gray-400 mb-1">
                  Địa chỉ giao hàng
                </div>
                <p className="text-sm font-bold text-gray-800 leading-relaxed whitespace-pre-line flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 text-primary shrink-0" />
                  {order.address}
                </p>
              </div>
              <div>
                <div className="text-[12px] font-black tracking-widest text-gray-400 mb-1">
                  Phương thức giao hàng
                </div>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Truck size={16} className="text-primary shrink-0" />
                  {shippingMethodLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-white p-6 sm:p-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
              Thông tin thanh toán
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between gap-4">
                <div className="text-[12px] font-black tracking-widest text-gray-400 mb-1">
                  Phương thức thanh toán
                </div>
                <p className="text-sm font-bold text-gray-800 text-right flex items-center justify-end gap-2">
                  <CreditCard size={16} className="text-primary shrink-0" />
                  {paymentMethodLabel}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex justify-between gap-4">
                  <span className="text-sm font-bold text-gray-600">
                    Tổng tiền sản phẩm
                  </span>
                  <span className="text-sm font-black text-gray-900 text-right">
                    {order.totalAmount.toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-sm font-bold text-gray-600">
                    Phí vận chuyển
                  </span>
                  <span className="text-sm font-black text-gray-900 text-right">
                    {order.shippingFee.toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <div className="pt-3 border-t-2 border-gray-200 flex justify-between gap-4 items-end">
                  <span className="text-base font-black text-gray-900">
                    TỔNG CỘNG
                  </span>
                  <span className="text-2xl font-black text-primary text-right leading-none">
                    {(order.totalAmount + order.shippingFee).toLocaleString(
                      "vi-VN",
                    )}{" "}
                    VNĐ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </motion.div>
    </div>
  );
};

export default OrderDetailsView;
