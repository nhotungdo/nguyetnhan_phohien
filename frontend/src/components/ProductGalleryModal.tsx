"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { FastImage } from "@/components/FastImage";
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
    <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="text-xl font-bold text-primary">{product.name}</h3>
            <p className="text-accent font-semibold text-lg">{formatPrice(product.price, language)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main image */}
        <div className="relative bg-[#FDE68A]/10 aspect-[16/9] flex items-center justify-center overflow-hidden">
          {images.length > 0 ? (
            <FastImage
              src={`${API_URL}${images[currentIdx].imagePath}`}
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
              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center transition-all">
                <ChevronLeft className="w-5 h-5 text-primary" />
              </button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center transition-all">
                <ChevronRight className="w-5 h-5 text-primary" />
              </button>
              <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {currentIdx + 1} / {images.length}
              </span>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto border-t bg-muted/10">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${idx === currentIdx ? "border-accent shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-90"}`}
              >
                <FastImage
                  src={`${API_URL}${img.imagePath}`}
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
        <div className="p-5 flex items-start justify-between gap-4 border-t">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
            <span className="inline-block mt-2 bg-secondary text-accent text-xs font-bold px-3 py-1 rounded-full">{product.size}</span>
          </div>
          <button
            onClick={() => { onOrder(); onClose(); }}
            className="shrink-0 flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-sm"
          >
            <ShoppingCart className="w-5 h-5" />
            {language === "en" ? "Order Now" : "Đặt Hàng Ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}
