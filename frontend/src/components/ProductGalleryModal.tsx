"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Plus,
  Package,
  Check,
  Flame,
  ShieldCheck,
} from "lucide-react";
import { FastImage, resolveImageUrl } from "@/components/FastImage";
import type { ProductResponse } from "@/types/api.types";

interface ProductGalleryProps {
  product: ProductResponse;
  language: "vi" | "en";
  onClose: () => void;
  onOrder: () => void;
  onAddToCart?: (product: ProductResponse) => void;
}

function formatPrice(price: number, language: string) {
  if (language === "en") {
    return `$${(price / 25000).toFixed(2)}`;
  }
  return `${price.toLocaleString("vi-VN").replace(/,/g, ".")}đ`;
}

export function ProductGalleryModal({
  product,
  language,
  onClose,
  onOrder,
  onAddToCart,
}: ProductGalleryProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  // Đảm bảo luôn có ít nhất 1 ảnh hiển thị, tránh lỗi tính toán modulo khi images rỗng
  const rawImages = product.images && product.images.length > 0
    ? product.images
    : [{ id: "default-fallback", imagePath: "/images/hopnhua.jpg", displayOrder: 1 }];

  const images = rawImages;

  const prev = useCallback(
    () => setCurrentIdx((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const next = useCallback(
    () => setCurrentIdx((i) => (i + 1) % images.length),
    [images.length]
  );

  // Điều hướng bằng bàn phím
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
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card text-foreground border border-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col my-auto"
      >
        {/* HEADER CỐ ĐỊNH */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-border bg-muted/20 shrink-0">
          <div className="min-w-0 pr-3">
            <h3 className="text-base sm:text-xl font-bold text-primary truncate leading-tight">
              {product.name}
            </h3>
            <p className="text-accent font-bold text-sm sm:text-lg mt-0.5">
              {formatPrice(product.price, language)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors shrink-0 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* THÂN MODAL CUỘN TỰ NHIÊN: ẢNH + THUMBNAILS + MÔ TẢ ĐẦY ĐỦ RÕ RÀNG */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* KHUNG HIỂN THỊ ẢNH CHÍNH */}
          <div className="relative bg-gradient-to-b from-amber-500/10 via-background to-background aspect-[16/10] sm:aspect-[16/9] max-h-[380px] flex items-center justify-center overflow-hidden shrink-0 border-b border-border/50">
            {images.length > 0 ? (
              <FastImage
                src={resolveImageUrl(images[currentIdx].imagePath)}
                fallbackSrc="/images/setqua.jpg"
                alt={`${product.name} - ảnh ${currentIdx + 1}`}
                fill
                priority
                sizes="(max-width: 768px) 96vw, 768px"
                className="w-full h-full object-contain p-2 sm:p-4"
              />
            ) : (
              <div className="text-muted-foreground text-center p-10">
                <div className="text-5xl mb-2">📷</div>
                <p>Chưa có ảnh cho sản phẩm này</p>
              </div>
            )}

            {/* Nút chuyển ảnh trước / sau */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-card/90 hover:bg-card text-foreground shadow-md rounded-full flex items-center justify-center transition-all cursor-pointer border border-border"
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-card/90 hover:bg-card text-foreground shadow-md rounded-full flex items-center justify-center transition-all cursor-pointer border border-border"
                  aria-label="Ảnh sau"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </button>
                <span className="absolute top-3 right-3 bg-black/70 text-white text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-xs">
                  {currentIdx + 1} / {images.length}
                </span>
              </>
            )}
          </div>

          {/* DẢI ẢNH THU NHỎ (THUMBNAILS) */}
          {images.length > 1 && (
            <div className="flex gap-2 p-2.5 sm:p-3 overflow-x-auto border-b border-border/60 bg-muted/15 shrink-0 no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-card ${
                    idx === currentIdx
                      ? "border-accent shadow-md scale-105 ring-2 ring-accent/30"
                      : "border-border/60 opacity-60 hover:opacity-100"
                  }`}
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

          {/* KHU VỰC THÔNG TIN SẢN PHẨM RÕ NÉT, ĐỘ TƯƠNG PHẢN CAO */}
          <div className="p-4 sm:p-6 space-y-4">
            {/* Hàng thẻ thông tin nổi bật */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold px-3 py-1 rounded-full text-xs shadow-xs">
                <Package className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Quy cách: {product.size}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold px-2.5 py-1 rounded-full text-xs">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>100% Tự nhiên</span>
              </span>

              <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-900 border border-orange-200 font-semibold px-2.5 py-1 rounded-full text-xs">
                <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span>Sấy nhiệt nóng (sấy đối lưu)</span>
              </span>

              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-200 font-semibold px-2.5 py-1 rounded-full text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Không chất bảo quản</span>
              </span>
            </div>

            {/* Mô tả sản phẩm đầy đủ, font chữ rõ ràng, không bị cắt xén */}
            <div className="bg-muted/20 border border-border/80 rounded-2xl p-4 sm:p-5">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>{language === "en" ? "Product Description" : "Mô Tả Chi Tiết"}</span>
              </h4>
              <p className="text-sm sm:text-base text-foreground font-normal leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER ĐẶT HÀNG & GIÁ BÁN (CỐ ĐỊNH PHÍA DƯỚI) */}
        <div className="p-3.5 sm:p-4 border-t border-border bg-card/95 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-baseline justify-between sm:justify-start gap-2">
            <span className="text-xs text-muted-foreground font-medium sm:hidden">
              {language === "en" ? "Price:" : "Giá bán:"}
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-primary">
              {formatPrice(product.price, language)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onAddToCart && (
              <button
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 border-2 border-accent text-accent hover:bg-accent/10 font-bold px-4 py-2.5 rounded-xl transition-all text-xs sm:text-sm active:scale-95 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{language === "en" ? "Add to Cart" : "Thêm vào giỏ"}</span>
              </button>
            )}
            <button
              onClick={() => {
                onOrder();
                onClose();
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 text-xs sm:text-sm cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{language === "en" ? "Order Now" : "Đặt Hàng Ngay"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
