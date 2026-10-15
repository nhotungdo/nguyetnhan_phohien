"use client";

import { useState } from "react";
import { Tag, ChevronRight, Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { discountApi } from "@/services/api.service";
import type { DiscountResult } from "@/types/api.types";

function formatVND(price: number) {
  return price.toLocaleString("vi-VN").replace(/,/g, ".") + "đ";
}

interface CartSummaryProps {
  language: "vi" | "en";
  onCheckout: (discountCode?: string) => void;
}

export function CartSummary({ language, onCheckout }: CartSummaryProps) {
  const { items, getTotalPrice, clearCart } = useCartStore();

  const [discountCode, setDiscountCode] = useState("");
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [discountError, setDiscountError] = useState("");

  const baseTotal = getTotalPrice();

  let discountAmount = 0;
  if (discountResult?.isValid) {
    if (discountResult.percentOff) {
      discountAmount = Math.round((baseTotal * discountResult.percentOff) / 100);
    } else if (discountResult.amountOff) {
      discountAmount = Math.min(discountResult.amountOff, baseTotal);
    }
  }
  const finalTotal = Math.max(0, baseTotal - discountAmount);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setIsApplying(true);
    setDiscountError("");
    try {
      const result = await discountApi.apply({ code: discountCode.trim() });
      if (result.isValid) {
        setDiscountResult(result);
      } else {
        setDiscountError(result.message || "Mã không hợp lệ.");
        setDiscountResult(null);
      }
    } catch (err) {
      setDiscountError(err instanceof Error ? err.message : "Mã không hợp lệ.");
      setDiscountResult(null);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCodeChange = (val: string) => {
    setDiscountCode(val);
    if (discountResult) setDiscountResult(null);
    if (discountError) setDiscountError("");
  };

  if (items.length === 0) return null;

  return (
    <div className="px-5 py-4 border-t border-[#FDE68A]/40 space-y-4 bg-[#FFFDF8]">
      {/* Discount code */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 border border-[#FDE68A] rounded-xl px-3 py-2 bg-white focus-within:border-[#B45309] transition-colors">
            <Tag className="w-4 h-4 text-accent shrink-0" />
            <input
              type="text"
              value={discountCode}
              onChange={(e) => handleCodeChange(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleApplyDiscount()}
              placeholder={language === "en" ? "Discount code" : "Nhập mã giảm giá"}
              className="flex-1 bg-transparent text-sm outline-none text-primary placeholder:text-foreground/40"
              disabled={isApplying}
            />
          </div>
          <button
            onClick={handleApplyDiscount}
            disabled={!discountCode.trim() || isApplying}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
          >
            {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === "en" ? "Apply" : "Áp Dụng")}
          </button>
        </div>

        {/* Discount result */}
        {discountResult?.isValid && (
          <div className="flex items-center gap-2 text-green-600 text-xs font-medium bg-green-50 border border-green-200 px-3 py-2 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>
              {discountResult.percentOff
                ? `Giảm ${discountResult.percentOff}% — tiết kiệm ${formatVND(discountAmount)}`
                : `Giảm ${formatVND(discountAmount)}`}
            </span>
          </div>
        )}
        {discountError && (
          <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{discountError}</span>
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-foreground/70">
          <span>{language === "en" ? "Subtotal" : "Tạm tính"}</span>
          <span>{formatVND(baseTotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>{language === "en" ? "Discount" : "Giảm giá"}</span>
            <span>-{formatVND(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base text-primary pt-1.5 border-t border-[#FDE68A]/60">
          <span>{language === "en" ? "Total" : "Tổng cộng"}</span>
          <span className="text-accent">{formatVND(finalTotal)}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => onCheckout(discountResult?.isValid ? discountCode.trim() : undefined)}
          className="w-full bg-gradient-to-r from-[#B45309] to-[#D97706] hover:from-[#92400E] hover:to-[#B45309] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#B45309]/25 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {language === "en" ? "Place Order" : "Đặt Hàng Ngay"}
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={clearCart}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-foreground/50 hover:text-red-400 transition-colors py-1"
        >
          <Trash2 className="w-3 h-3" />
          {language === "en" ? "Clear cart" : "Xóa tất cả"}
        </button>
      </div>
    </div>
  );
}
