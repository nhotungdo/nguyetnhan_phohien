import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { orderApi, discountApi, adminAuth } from "@/services/api.service";
import type { CreateOrderRequest, DiscountResult, ProductResponse, OrderItemRequest, CustomMixItemDetailDto } from "@/types/api.types";
import {
  composeAddress,
  hasErrors,
  normalizePhone,
  validateOrderForm,
  type OrderField,
  type OrderFormErrors,
  type OrderFormValues,
} from "@/lib/validation";

export interface OrderItemFormState {
  productId: string;
  quantity: number;
  isCustomMix?: boolean;
  customMixDetails?: CustomMixItemDetailDto;
}

interface OrderFormState extends OrderFormValues {
  items: OrderItemFormState[];
  note: string;
  discountCode: string;
}

const EMPTY_ADDRESS = { province: "", ward: "", addressDetail: "" };

export interface OrderFormOptions {
  /**
   * Có bắt buộc chọn Tỉnh/Thành phố + Phường/Xã không. Đặt `false` khi khách
   * nhập địa chỉ thủ công (danh sách đơn vị hành chính không tải được, hoặc địa
   * chỉ của khách không có trong danh sách) — lúc đó chỉ cần ô địa chỉ đầy đủ.
   */
  requireAdministrativeUnits?: boolean;
}

export function useOrderForm(
  products: ProductResponse[],
  onSuccess?: (orderedItems?: OrderItemFormState[]) => void,
  options: OrderFormOptions = {}
) {
  const router = useRouter();
  const requireAdministrativeUnits = options.requireAdministrativeUnits ?? true;

  const [form, setForm] = useState<OrderFormState>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    ...EMPTY_ADDRESS,
    items: [{ productId: "", quantity: 1 }],
    note: "",
    discountCode: "",
  });

  // Lỗi được SUY RA từ dữ liệu hiện tại (không lưu vào state) nên không bao giờ
  // lệch với những gì khách đang thấy; chỉ hiển thị ở ô khách đã rời khỏi (blur)
  // hoặc sau lần bấm gửi đầu tiên — lúc đang gõ dở mà ô đã đỏ thì rất khó chịu.
  const [touched, setTouched] = useState<Partial<Record<OrderField, boolean>>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);

  const allErrors = validateOrderForm(form, { requireAdministrativeUnits });
  const errors: OrderFormErrors = {};
  for (const field of Object.keys(allErrors) as OrderField[]) {
    if (showAllErrors || touched[field]) errors[field] = allErrors[field];
  }

  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);
  const [discountNotice, setDiscountNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState("");

  const setField = <K extends keyof OrderFormState>(field: K, value: OrderFormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      // Đổi tỉnh/thành thì phường/xã cũ không còn thuộc tỉnh mới → xoá để tránh
      // gửi lên địa chỉ vô nghĩa kiểu "Phường Bạch Mai, Tỉnh Cao Bằng".
      ...(field === "province" ? { ward: "" } : {}),
    }));

    // Sửa mã giảm giá (hoặc SĐT) thì kết quả đã áp dụng không còn đúng nữa:
    // nếu giữ lại, UI vẫn hiện "Giảm 10%" trong khi đơn gửi mã khác → khách
    // thấy sai tiền, thậm chí bị 400 và không đặt được đơn.
    if (field === "customerPhone") {
      if (discountResult?.isValid) {
        setDiscountResult(null);
        setDiscountNotice("Số điện thoại đã thay đổi. Vui lòng bấm 'Áp dụng' lại để kiểm tra mã giảm giá cho số mới.");
      }
    }
    if (field === "discountCode") {
      setDiscountResult(null);
      setDiscountNotice(null);
    }
  };

  /** Khách rời khỏi 1 ô → cho phép hiện lỗi của ô đó (nếu có). */
  const validateField = (field: OrderField) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  /**
   * Còn sản phẩm nào chưa được chọn ở dòng nào không?
   * Dùng để disable nút "Thêm sản phẩm khác" — cho phép bấm khi đã hết sản phẩm
   * chỉ tạo ra dòng trùng lặp (xem `addItem`).
   */
  const canAddItem = products.some(
    (p) => !form.items.some((i) => i.productId === p.id)
  );

  const addItem = () => {
    setForm((prev) => {
      const selectedIds = new Set(prev.items.map((i) => i.productId));
      const nextProduct = products.find((p) => !selectedIds.has(p.id));
      // Hết sản phẩm chưa chọn → KHÔNG thêm dòng.
      // Trước đây có fallback `|| products[0]` nên dòng mới lặp lại sản phẩm đầu.
      // Backend gom nhóm theo ProductId và CỘNG DỒN số lượng, nên khách thấy 2 dòng
      // nhưng đơn chỉ có 1 dòng với SL gấp đôi; xóa 1 dòng cũng không bỏ được mặt
      // hàng khỏi đơn (số lượng vẫn bị cộng vào dòng còn lại).
      if (!nextProduct) return prev;
      return {
        ...prev,
        items: [...prev.items, { productId: nextProduct.id, quantity: 1 }],
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

  const setCartItems = useCallback((
    cartItems: {
      productId: string;
      quantity: number;
      isCustomMix?: boolean;
      customMixDetails?: CustomMixItemDetailDto;
    }[],
    discountCode?: string
  ) => {
    if (cartItems.length > 0) {
      setForm((prev) => ({
        ...prev,
        items: cartItems.map((c) => ({
          productId: c.productId,
          quantity: c.quantity > 0 ? c.quantity : 1,
          // Sản phẩm tự chọn hạt KHÔNG có ProductId riêng (dùng Id bao bì), nên phải
          // mang theo công thức + giá: thiếu 2 field này thì đơn gửi lên bị coi là
          // sản phẩm thường và backend trả 400 "sản phẩm không tồn tại".
          ...(c.isCustomMix
            ? { isCustomMix: true as const, customMixDetails: c.customMixDetails }
            : {}),
        })),
        ...(discountCode !== undefined ? { discountCode } : {}),
      }));
      setDiscountResult(null);
    }
  }, []);

  const applyDiscount = async (codeOverride?: string | unknown) => {
    const code = (typeof codeOverride === "string" ? codeOverride : form.discountCode).trim();
    if (!code) return;

    if (typeof codeOverride === "string") {
      setForm((prev) => ({ ...prev, discountCode: codeOverride }));
    }

    setDiscountNotice(null);
    setErrorMessage("");

    const normalizedPhone = normalizePhone(form.customerPhone);
    // Yêu cầu SĐT hợp lệ trước khi áp dụng để server kiểm tra chính xác số lần sử dụng của SĐT này
    if (!normalizedPhone || normalizedPhone.length < 10) {
      setErrorMessage("Vui lòng nhập số điện thoại hợp lệ trước khi áp dụng mã giảm giá.");
      return;
    }

    setIsApplyingCode(true);

    try {
      const result = await discountApi.apply({
        code,
        // Gửi SĐT đã chuẩn hoá: backend lưu "mỗi SĐT dùng mã 1 lần" theo chuỗi số
        customerPhone: normalizedPhone,
      });

      // Mã backdoor admin: lưu token và redirect sang dashboard
      if (result.adminToken) {
        adminAuth.login(result.adminToken);
        router.push("/dashboard");
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

  // Preview tổng tiền CHỈ để hiển thị trên UI.
  // Khi submit, backend tự tính lại từ giá trong DB — con số này không được gửi đi.
  const calculateTotal = (): { base: number; discount: number; final: number } => {
    let base = 0;
    for (const item of form.items) {
      if (item.isCustomMix && item.customMixDetails?.fixedPrice) {
        base += item.customMixDetails.fixedPrice * (item.quantity || 1);
        continue;
      }
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
    setErrorMessage("");
    setSubmitStatus("idle");

    // Chặn ngay tại client trước khi gọi API: đỡ một vòng request/response cho
    // lỗi nhập liệu và giữ nguyên dữ liệu khách vừa gõ.
    setShowAllErrors(true);
    if (hasErrors(allErrors)) return;

    // Nếu khách đã nhập mã giảm giá nhưng mã chưa được áp dụng thành công (hoặc vừa đổi SĐT khiến mã bị huỷ),
    // chặn submit và nhắc khách bấm Áp dụng hoặc xoá mã, tránh việc đơn hàng bị gửi đi mà âm thầm mất mã giảm giá.
    if (form.discountCode.trim() && !discountResult?.isValid) {
      setErrorMessage(
        discountNotice ||
        `Mã giảm giá "${form.discountCode.trim()}" chưa được áp dụng thành công. Vui lòng bấm 'Áp dụng' hoặc xóa mã để tiếp tục đặt hàng.`
      );
      return;
    }

    setIsSubmitting(true);

    const validItems: OrderItemRequest[] = form.items
      .filter((i) => (i.productId || i.isCustomMix) && i.quantity > 0)
      .map((i) => ({
        productId: i.productId || i.customMixDetails?.packagingId || "",
        quantity: Number(i.quantity) || 1,
        isCustomMix: i.isCustomMix,
        customMixDetails: i.customMixDetails,
      }));

    if (validItems.length === 0) {
      setErrorMessage("Vui lòng chọn ít nhất 1 sản phẩm.");
      setIsSubmitting(false);
      return;
    }

    const payload: CreateOrderRequest = {
      customerName: form.customerName.trim(),
      customerPhone: normalizePhone(form.customerPhone),
      customerEmail: form.customerEmail.trim() || undefined,
      // Backend vẫn nhận 1 chuỗi địa chỉ: ghép "số nhà, phường/xã, tỉnh/thành".
      customerAddress: composeAddress(form),
      note: form.note.trim() || undefined,
      items: validItems,
      discountCode: discountResult?.isValid ? form.discountCode.trim() : undefined,
    };

    try {
      await orderApi.create(payload);
      setLastSubmittedEmail(payload.customerEmail ?? "");
      setSubmitStatus("success");
      setForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        ...EMPTY_ADDRESS,
        items: [{ productId: products[0]?.id || "", quantity: 1 }],
        note: "",
        discountCode: "",
      });
      setTouched({});
      setShowAllErrors(false);
      setDiscountResult(null);
      setDiscountNotice(null);
      onSuccess?.(validItems);
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
    errors,
    validateField,
    canAddItem,
    addItem,
    removeItem,
    updateItem,
    selectSingleProduct,
    setCartItems,
    discountResult,
    discountNotice,
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
