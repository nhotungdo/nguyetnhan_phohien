"use client";

import { ProductDetailModal } from "@/components/ProductDetailModal";
import type { ProductResponse } from "@/types/api.types";

interface ProductGalleryProps {
  product: ProductResponse;
  language: "vi" | "en";
  onClose: () => void;
  onOrder: () => void;
  onAddToCart?: (product: ProductResponse, quantity?: number) => void;
}

export function ProductGalleryModal({
  product,
  language,
  onClose,
  onOrder,
  onAddToCart,
}: ProductGalleryProps) {
  return (
    <ProductDetailModal
      product={product}
      language={language}
      onClose={onClose}
      onOrder={onOrder}
      onAddToCart={onAddToCart}
    />
  );
}

export default ProductGalleryModal;
