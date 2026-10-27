"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProductResponse, CustomMixItemDetailDto } from "@/types/api.types";

export interface CartItem {
  /** Định danh duy nhất của dòng sản phẩm trong giỏ (đặc biệt quan trọng với Custom Mix) */
  id?: string;
  productId: string;
  productName: string;
  price: number;
  size: string;
  imageUrl?: string;
  quantity: number;
  /** Cờ đánh dấu sản phẩm tự phối hạt độc bản */
  isCustomMix?: boolean;
  /** Toàn bộ công thức phối hạt, tên nhãn, lời chúc */
  customMixDetails?: CustomMixItemDetailDto;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  // Actions
  addItem: (product: ProductResponse) => void;
  addCustomMixItem: (customMix: CustomMixItemDetailDto, quantity?: number, imageUrl?: string) => void;
  removeItem: (idOrProductId: string) => void;
  updateQuantity: (idOrProductId: string, qty: number) => void;
  syncProductPrices: (products: ProductResponse[]) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  // Derived
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product: ProductResponse) => {
        set((state) => {
          const existing = state.items.find((i) => !i.isCustomMix && (i.id === product.id || i.productId === product.id));
          if (existing) {
            const key = existing.id || existing.productId;
            return {
              items: state.items.map((i) =>
                (i.id || i.productId) === key
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
              isOpen: true,
            };
          }
          const newItem: CartItem = {
            id: product.id,
            productId: product.id,
            productName: product.name,
            price: product.price,
            size: product.size,
            imageUrl: product.images?.[0]?.imagePath,
            quantity: 1,
            isCustomMix: false,
          };
          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      addCustomMixItem: (customMix: CustomMixItemDetailDto, quantity = 1, imageUrl?: string) => {
        set((state) => {
          // Kiểm tra xem đã có sản phẩm Custom Mix cùng cấu hình chưa (cùng bao bì, cùng tên, cùng thông điệp và thành phần hạt)
          const sameConfig = state.items.find((i) => {
            if (!i.isCustomMix || !i.customMixDetails) return false;
            const d = i.customMixDetails;
            if (i.productId !== customMix.packagingId) return false;
            if (i.productName !== customMix.customProductName) return false;
            if ((d.customLabelMessage || "") !== (customMix.customLabelMessage || "")) return false;

            const listA = d.ingredients || [];
            const listB = customMix.ingredients || [];
            if (listA.length !== listB.length) return false;

            return listA.every((itemA) => {
              const itemB = listB.find((b) => b.ingredientId === itemA.ingredientId);
              return itemB != null && itemB.weightGrams === itemA.weightGrams;
            });
          });

          if (sameConfig) {
            const key = sameConfig.id || sameConfig.productId;
            return {
              items: state.items.map((i) =>
                (i.id || i.productId) === key
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
              isOpen: true,
            };
          }

          const defaultImg =
            customMix.targetWeightGrams === 150
              ? "/images/tuizip.jpg"
              : customMix.targetWeightGrams === 300
              ? "/images/hopnhua.jpg"
              : "/images/setqua.jpg";

          const cartItemId = `custom-${customMix.packagingId}-${Date.now()}`;
          const newItem: CartItem = {
            id: cartItemId,
            productId: customMix.packagingId,
            productName: customMix.customProductName || "Sản phẩm Tự Chọn Hạt",
            price: customMix.fixedPrice,
            size: `${customMix.packagingName} (${customMix.targetWeightGrams}g)`,
            imageUrl: imageUrl || defaultImg,
            quantity: Math.max(1, quantity),
            isCustomMix: true,
            customMixDetails: customMix,
          };

          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      removeItem: (idOrProductId: string) =>
        set((state) => ({
          items: state.items.filter((i) => {
            if (i.id) return i.id !== idOrProductId;
            return i.productId !== idOrProductId;
          }),
        })),

      updateQuantity: (idOrProductId: string, qty: number) => {
        if (qty < 1) {
          get().removeItem(idOrProductId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => {
            const isMatch = i.id ? i.id === idOrProductId : i.productId === idOrProductId;
            return isMatch ? { ...i, quantity: qty } : i;
          }),
        }));
      },

      syncProductPrices: (products: ProductResponse[]) => {
        if (!products || products.length === 0) return;
        const productMap = new Map(products.map((p) => [p.id, p]));
        set((state) => {
          let hasChanges = false;
          const updatedItems = state.items.map((item) => {
            if (item.isCustomMix) return item;
            const latest = productMap.get(item.productId);
            if (
              latest &&
              (item.price !== latest.price ||
                item.productName !== latest.name ||
                item.size !== latest.size)
            ) {
              hasChanges = true;
              return {
                ...item,
                price: latest.price,
                productName: latest.name,
                size: latest.size,
                imageUrl: latest.images?.[0]?.imagePath || item.imageUrl,
              };
            }
            return item;
          });
          return hasChanges ? { items: updatedItems } : state;
        });
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      getTotalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    }),
    {
      name: "nguyetnhan-cart",
      storage: createJSONStorage(() => localStorage),
      // Only persist items (not drawer open state)
      partialize: (state) => ({ items: state.items }),
    }
  )
);
