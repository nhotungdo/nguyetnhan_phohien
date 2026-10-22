"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { CartItemRow } from "./CartItemRow";
import { CartSummary } from "./CartSummary";

export interface CartDrawerProps {
  language: "vi" | "en";
  onCheckout: () => void;
  onBrowseProducts?: () => void;
}

export function CartDrawer({ language, onCheckout, onBrowseProducts }: CartDrawerProps) {
  const { items, isOpen, closeCart, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleBrowseProducts = () => {
    document.body.style.overflow = "";
    closeCart();
    setTimeout(() => {
      if (onBrowseProducts) {
        onBrowseProducts();
      } else {
        const element = document.getElementById("san-pham");
        if (element) {
          const headerOffset = 76;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    }, 50);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="cart-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            key="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 35 }}
            className="fixed right-0 top-0 h-full w-full max-w-[420px] z-[91] flex flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#FDE68A]/60 shrink-0 bg-[#FFFDF8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B45309] to-[#D97706] flex items-center justify-center shadow-sm">
                  <ShoppingBag className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                </div>
                <div>
                  <h2 className="font-bold text-primary text-base leading-tight">
                    {language === "en" ? "Your Cart" : "Giỏ Hàng"}
                  </h2>
                  <p className="text-xs text-foreground/50">
                    {totalItems === 0
                      ? (language === "en" ? "Empty" : "Trống")
                      : `${totalItems} ${language === "en" ? "item(s)" : "sản phẩm"}`}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#FDE68A]/30 text-primary transition-colors"
                aria-label="Đóng giỏ hàng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-[#FDE68A]/20 flex items-center justify-center">
                    <ShoppingCart className="w-9 h-9 text-accent/40" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary mb-1">
                      {language === "en" ? "Your cart is empty" : "Giỏ hàng trống"}
                    </p>
                    <p className="text-sm text-foreground/50">
                      {language === "en"
                        ? "Add products to get started"
                        : "Thêm sản phẩm vào giỏ để bắt đầu"}
                    </p>
                  </div>
                  <button
                    onClick={handleBrowseProducts}
                    className="mt-2 px-6 py-2.5 bg-accent text-white font-bold rounded-full text-sm hover:bg-accent/90 transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow"
                  >
                    {language === "en" ? "Browse Products" : "Xem Sản Phẩm"}
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <CartItemRow key={item.productId} item={item} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Summary + Checkout */}
            <CartSummary language={language} onCheckout={onCheckout} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CartDrawer;
