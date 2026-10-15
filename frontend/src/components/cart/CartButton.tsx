"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";

export function CartButton() {
  const { getTotalItems, toggleCart } = useCartStore();
  const totalItems = getTotalItems();

  return (
    <motion.button
      id="cart-floating-button"
      onClick={toggleCart}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      aria-label={`Giỏ hàng (${totalItems} sản phẩm)`}
      className="fixed bottom-36 right-3.5 sm:bottom-24 sm:right-6 z-[80] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#B45309] to-[#D97706] shadow-xl shadow-[#B45309]/40 flex items-center justify-center text-white transition-all hover:shadow-2xl hover:shadow-[#B45309]/50"
    >
      {/* Ping effect when cart has items */}
      {totalItems > 0 && (
        <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
      )}

      <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />

      {/* Badge */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.span
            key={totalItems}
            initial={{ scale: 0, y: 4 }}
            animate={{ scale: [1.35, 1], y: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm z-20"
          >
            {totalItems > 99 ? "99+" : totalItems}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default CartButton;
