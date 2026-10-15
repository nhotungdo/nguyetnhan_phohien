"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { FastImage, resolveImageUrl } from "@/components/FastImage";
import type { ProductResponse } from "@/types/api.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

interface ProductGalleryProps {
  product: ProductResponse;
  language: "vi" | "en";
  onClose: () => void;
  onOrder: () => void;
}

function formatPrice(price: number, language: string) {
  if (language === "en") {
    return `$${(price / 25000).toFixed(2)}`;
  }
  return `${price.toLocaleString("vi-VN").replace(/,/g, ".")}đ`;
}

export function ProductGalleryModal({ product, language, onClose, onOrder }: ProductGalleryProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const images = product.images;

  const prev = useCallback(() => setCurrentIdx(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrentIdx(i => (i + 1) % images.length), [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b shrink-0">
          <div>
            <h3 className="text-base sm:text-xl font-bold text-primary line-clamp-1">{product.name}</h3>
            <p className="text-accent font-semibold text-sm sm:text-lg">{formatPrice(product.price, language)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-primary" aria-label="Đóng">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Main image */}
        <div className="relative bg-[#FDE68A]/10 aspect-[4/3] sm:aspect-[16/9] flex items-center justify-center overflow-hidden shrink-0">
          {images.length > 0 ? (
            <FastImage
              src={resolveImageUrl(images[currentIdx].imagePath)}
              fallbackSrc="/images/setqua.jpg"
              alt={`${product.name} - ảnh ${currentIdx + 1}`}
              fill
              priority
              sizes="(max-width: 768px) 96vw, 720px"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-muted-foreground text-center p-10">
              <div className="text-5xl mb-2">📷</div>
              <p>Chưa có ảnh cho sản phẩm này</p>
            </div>
          )}

          {images.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center transition-all" aria-label="Ảnh trước">
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </button>
              <button onClick={next} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center transition-all" aria-label="Ảnh sau">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </button>
              <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-black/60 text-white text-[11px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full">
                {currentIdx + 1} / {images.length}
              </span>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 p-2.5 sm:p-4 overflow-x-auto border-t bg-muted/10 shrink-0 no-scrollbar">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${idx === currentIdx ? "border-accent shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-90"}`}
              >
                <FastImage
                  src={resolveImageUrl(img.imagePath)}
                  fallbackSrc="/images/setqua.jpg"
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Description + CTA */}
        <div className="p-3.5 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-t overflow-y-auto">
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">{product.description}</p>
            <span className="inline-block mt-1 sm:mt-2 bg-secondary text-accent text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full">{product.size}</span>
          </div>
          <button
            onClick={() => { onOrder(); onClose(); }}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-sm active:scale-95 text-sm"
          >
            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{language === "en" ? "Order Now" : "Đặt Hàng Ngay"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
