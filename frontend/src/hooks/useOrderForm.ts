import { useState } from "react";
import { orderApi, discountApi } from "@/services/api.service";
import type { CreateOrderRequest, DiscountResult, ProductResponse, OrderItemRequest } from "@/types/api.types";

export interface OrderItemFormState {
  productId: string;
  quantity: number;
}

interface OrderFormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  items: OrderItemFormState[];
  note: string;
  discountCode: string;
}

export function useOrderForm(
  products: ProductResponse[],
  onSuccess?: () => void
) {
  const [form, setForm] = useState<OrderFormState>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    items: [{ productId: "", quantity: 1 }],
    note: "",
    discountCode: "",
  });

  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState("");

  const setField = <K extends keyof OrderFormState>(field: K, value: OrderFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setForm((prev) => {
      const selectedIds = new Set(prev.items.map((i) => i.productId));
      const nextProduct = products.find((p) => !selectedIds.has(p.id)) || products[0];
      return {
        ...prev,
        items: [...prev.items, { productId: nextProduct?.id || "", quantity: 1 }],
      };
    });
    setDiscountResult(null);
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setDiscountResult(null);
  };

  const updateItem = (index: number, field: keyof OrderItemFormState, value: string | number) => {
    setForm((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
      return { ...prev, items: newItems };
    });
    setDiscountResult(null);
  };

  const selectSingleProduct = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      items: [{ productId, quantity: 1 }],
    }));
    setDiscountResult(null);
  };

  const applyDiscount = async () => {
    if (!form.discountCode.trim()) return;

    setIsApplyingCode(true);
    setErrorMessage("");

    try {
      // Mã giảm giá chỉ có tác dụng giảm giá — không có nhánh nào cấp quyền admin
      // ở đây (đăng nhập admin duy nhất qua /admin-login).
      const result = await discountApi.apply({ code: form.discountCode.trim() });
      setDiscountResult(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Mã không hợp lệ.";
      setErrorMessage(message);
      setDiscountResult(null);
    } finally {
      setIsApplyingCode(false);
    }
  };

  // Preview tổng tiền CHỈ để hiển thị trên UI.
  // Khi submit, backend tự tính lại từ giá trong DB — con số này không được gửi đi.
  const calculateTotal = (): { base: number; discount: number; final: number } => {
    let base = 0;
    for (const item of form.items) {
      if (!item.productId) continue;
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        base += product.price * (item.quantity || 1);
      }
    }

    let discount = 0;
    if (discountResult?.isValid) {
      if (discountResult.percentOff) {
        discount = Math.round((base * discountResult.percentOff) / 100);
      } else if (discountResult.amountOff) {
        discount = Math.min(discountResult.amountOff, base);
      }
    }

    return { base, discount, final: Math.max(0, base - discount) };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSubmitStatus("idle");

    const validItems: OrderItemRequest[] = form.items
      .filter((i) => i.productId && i.quantity > 0)
      .map((i) => ({ productId: i.productId, quantity: Number(i.quantity) || 1 }));

    if (validItems.length === 0) {
      setErrorMessage("Vui lòng chọn ít nhất 1 sản phẩm.");
      setIsSubmitting(false);
      return;
    }

    const payload: CreateOrderRequest = {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail || undefined,
      customerAddress: form.customerAddress,
      note: form.note || undefined,
      items: validItems,
      discountCode: discountResult?.isValid ? form.discountCode.trim() : undefined,
    };

    try {
      await orderApi.create(payload);
      setLastSubmittedEmail(form.customerEmail || "");
      setSubmitStatus("success");
      setForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: "",
        items: [{ productId: products[0]?.id || "", quantity: 1 }],
        note: "",
        discountCode: "",
      });
      setDiscountResult(null);
      onSuccess?.();
    } catch (err: unknown) {
      setSubmitStatus("error");
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi. Vui lòng thử lại.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    setField,
    addItem,
    removeItem,
    updateItem,
    selectSingleProduct,
    discountResult,
    isSubmitting,
    isApplyingCode,
    submitStatus,
    errorMessage,
    lastSubmittedEmail,
    applyDiscount,
    calculateTotal,
    handleSubmit,
  };
}
