"use client";

import { motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore, type CartItem } from "@/stores/useCartStore";
import { FastImage, resolveImageUrl } from "@/components/FastImage";

function resolveCartImage(imagePath?: string): string {
  if (!imagePath) return "/images/setqua.jpg";
  return resolveImageUrl(imagePath);
}

function formatVND(price: number) {
  return price.toLocaleString("vi-VN").replace(/,/g, ".") + "đ";
}

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const itemKey = item.id || item.productId;

  const ingredientsSummary = item.customMixDetails?.ingredients
    ?.map((i) => `${i.name || "Hạt"} (${i.weightGrams}g)`)
    .join(" · ");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      className="flex items-start gap-3 py-3.5 border-b border-[#FDE68A]/40 last:border-0"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#FDE68A]/60 bg-[#FDE68A]/10 relative mt-0.5">
        <FastImage
          src={resolveCartImage(item.imageUrl)}
          fallbackSrc="/images/setqua.jpg"
          alt={item.productName}
          fill
          sizes="64px"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {item.isCustomMix && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full mb-1">
            ✨ Tự Chọn Hạt
          </span>
        )}
        <p className="font-semibold text-primary text-sm leading-snug line-clamp-2">{item.productName}</p>
        <span className="inline-block mt-0.5 text-[10px] font-bold text-accent bg-[#FEF3C7] px-2 py-0.5 rounded-full">
          {item.size}
        </span>

        {/* Công thức hạt tự chọn */}
        {item.isCustomMix && ingredientsSummary && (
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed bg-[#FFFDF8] p-1.5 rounded-md border border-[#FDE68A]/40">
            <span className="font-medium text-amber-900">Thành phần:</span> {ingredientsSummary}
            {item.customMixDetails?.customLabelMessage && (
              <span className="block italic text-[10px] text-foreground/70 mt-0.5">
                Lời chúc: &ldquo;{item.customMixDetails.customLabelMessage}&rdquo;
              </span>
            )}
          </p>
        )}

        <p className="text-accent font-bold text-sm mt-1">{formatVND(item.price)}</p>
      </div>

      {/* Quantity stepper + delete */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <button
          onClick={() => removeItem(itemKey)}
          className="text-gray-300 hover:text-red-400 transition-colors p-1"
          aria-label="Xóa sản phẩm"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-1 bg-[#FDE68A]/20 rounded-full px-1 py-0.5 border border-[#FDE68A]/60">
          <button
            onClick={() => updateQuantity(itemKey, item.quantity - 1)}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#FDE68A]/60 transition-colors text-primary disabled:opacity-40"
            aria-label="Giảm số lượng"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-6 text-center text-sm font-bold text-primary select-none">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(itemKey, item.quantity + 1)}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#FDE68A]/60 transition-colors text-primary"
            aria-label="Tăng số lượng"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <p className="text-xs text-foreground/60 font-medium">{formatVND(item.price * item.quantity)}</p>
      </div>
    </motion.div>
  );
}
