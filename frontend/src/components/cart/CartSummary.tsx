"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";

function formatVND(price: number) {
  return price.toLocaleString("vi-VN").replace(/,/g, ".") + "đ";
}

interface CartSummaryProps {
  language: "vi" | "en";
  onCheckout: () => void;
}

export function CartSummary({ language, onCheckout }: CartSummaryProps) {
  const { items, getTotalPrice } = useCartStore();
  const baseTotal = getTotalPrice();

  if (items.length === 0) return null;

  return (
    <div className="px-5 py-4 border-t border-[#FDE68A]/40 space-y-3 bg-[#FFFDF8]">
      {/* Price breakdown */}
      <div className="flex justify-between items-center text-sm font-bold text-primary">
        <span>{language === "en" ? "Total" : "Tổng tiền"}:</span>
        <span className="text-accent text-lg font-extrabold">{formatVND(baseTotal)}</span>
      </div>

      {/* Duy nhất 1 nút "Mua sản phẩm" chuyển sang form đặt hàng */}
      <div>
        <button
          onClick={onCheckout}
          className="w-full bg-gradient-to-r from-[#B45309] to-[#D97706] hover:from-[#92400E] hover:to-[#B45309] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#B45309]/25 active:scale-[0.98] flex items-center justify-center gap-2 text-base cursor-pointer"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{language === "en" ? "Buy Products" : "Mua sản phẩm"}</span>
        </button>
      </div>
    </div>
  );
}
