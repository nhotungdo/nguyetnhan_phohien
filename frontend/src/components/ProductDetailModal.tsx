"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { FastImage } from "@/components/FastImage";
import { resolveCmsImage } from "@/lib/cmsImage";
import type { ProductResponse } from "@/types/api.types";
import { findProductDetail, type ProductDetailInfo } from "@/data/productDetailsData";

interface ProductDetailModalProps {
  product: ProductResponse;
  language: "vi" | "en";
  onClose: () => void;
  onOrder: () => void;
  onAddToCart?: (product: ProductResponse, quantity?: number) => void;
}

function formatPrice(price: number, language: string) {
  if (language === "en") {
    return `$${(price / 25000).toFixed(2)}`;
  }
  return `${price.toLocaleString("vi-VN").replace(/,/g, ".")}đ`;
}

export function ProductDetailModal({
  product,
  language,
  onClose,
  onOrder,
  onAddToCart,
}: ProductDetailModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "culinary" | "storage">("overview");
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Lấy dữ liệu chi tiết chuyên sâu của sản phẩm
  const detailInfo: ProductDetailInfo = findProductDetail(product);

  // Lấy ảnh trực tiếp từ database (product.images)
  const dbImages = product.images && product.images.length > 0
    ? [...product.images]
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((img) => resolveCmsImage(img.imagePath))
        .filter(Boolean)
    : [];

  // Ưu tiên tuyệt đối danh sách ảnh từ DB. Chỉ khi DB hoàn toàn chưa có ảnh mới dùng imageUrl hoặc fallback của chính sản phẩm đó.
  const images = dbImages.length > 0
    ? dbImages
    : product.imageUrl
      ? [resolveCmsImage(product.imageUrl)]
      : detailInfo.fallbackImages && detailInfo.fallbackImages.length > 0
        ? detailInfo.fallbackImages.map((p) => resolveCmsImage(p))
        : ["/images/combo3sp.jpg"];

  const imageCount = images.length;
  const prev = () => setCurrentIdx((i) => (i - 1 + imageCount) % imageCount);
  const next = () => setCurrentIdx((i) => (i + 1) % imageCount);

  // Hỗ trợ vuốt tay chuyển ảnh trên màn hình cảm ứng Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 40) {
      next();
    } else if (diff < -40) {
      prev();
    }
    setTouchStartX(null);
  };

  // Điều hướng bằng bàn phím
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCurrentIdx((i) => (i - 1 + imageCount) % imageCount);
      if (e.key === "ArrowRight") setCurrentIdx((i) => (i + 1) % imageCount);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, imageCount]);

  const handleAddToCart = () => {
    if (onAddToCart) {
      for (let i = 0; i < quantity; i++) {
        onAddToCart(product);
      }
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (onAddToCart) {
      for (let i = 0; i < quantity; i++) {
        onAddToCart(product);
      }
    }
    onOrder();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 30 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-stone-900 border-t sm:border border-[#E8DFC8] rounded-t-[28px] sm:rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[92dvh] sm:max-h-[94vh] flex flex-col my-0 sm:my-auto"
      >
        {/* THANH GẠT ĐIỀU HƯỚNG BOTTOM SHEET TRÊN MOBILE */}
        <div className="w-12 h-1.5 rounded-full bg-stone-300 mx-auto mt-2.5 -mb-1 sm:hidden shrink-0" />

        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-4 py-2.5 sm:px-6 sm:py-4 border-b border-[#E8DFC8] bg-[#FAF8F5] shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-100 text-[#92400E] border border-amber-300 shrink-0">
                <Award className="w-3 h-3 text-[#B45309]" />
                {language === "en" ? detailInfo.badgeEn : detailInfo.badgeVi}
              </span>
              <span className="text-xs font-semibold text-stone-500 hidden sm:inline">
                {language === "en" ? `Packaging: ${product.size || detailInfo.size}` : `Quy cách: ${product.size || detailInfo.size}`}
              </span>
            </div>
            <h2 className="text-sm sm:text-xl font-extrabold text-primary truncate mt-0.5">
              {product.name || (language === "en" ? detailInfo.nameEn : detailInfo.nameVi)}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-stone-100 sm:bg-transparent hover:bg-stone-200 text-stone-600 rounded-full transition-colors shrink-0 cursor-pointer"
            aria-label={language === "en" ? "Close" : "Đóng"}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* THÂN MODAL: CHIA 2 CỘT TRÊN DESKTOP, THỨ TỰ BỐ CỤC TỐI ƯU TRÊN MOBILE */}
        <div className="overflow-y-auto flex-1 overscroll-contain grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E8DFC8]">
          {/* CỘT TRÁI (MD: 5 CỘT): MEDIA & HÌNH ẢNH SẢN PHẨM */}
          <div className="md:col-span-5 p-3 sm:p-5 flex flex-col bg-[#FCFBF8]">
            {/* KHUNG ẢNH CHÍNH (COMPACT VỪA VẶN TRÊN MOBILE, VUÔNG TRÊN DESKTOP) */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative aspect-[4/3] sm:aspect-square max-h-[220px] sm:max-h-[280px] md:max-h-none w-full rounded-2xl overflow-hidden bg-white border border-[#E8DFC8] shadow-inner flex items-center justify-center shrink-0 select-none touch-pan-y"
            >
              <FastImage
                src={images[currentIdx] || "/images/combo3sp.jpg"}
                fallbackSrc={images[0] || "/images/combo3sp.jpg"}
                alt={`${product.name} - ảnh ${currentIdx + 1}`}
                fill
                priority
                sizes="(max-width: 768px) 96vw, 380px"
                className="w-full h-full object-contain p-2 sm:p-3 pointer-events-none"
              />

              {/* Nút chuyển ảnh trước / sau */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 bg-white/90 hover:bg-white text-stone-800 shadow-md rounded-full flex items-center justify-center transition-all cursor-pointer border border-[#E8DFC8]"
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft className="w-4 h-4 text-primary" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 bg-white/90 hover:bg-white text-stone-800 shadow-md rounded-full flex items-center justify-center transition-all cursor-pointer border border-[#E8DFC8]"
                    aria-label="Ảnh sau"
                  >
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </button>
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs">
                    {currentIdx + 1} / {images.length}
                  </span>
                </>
              )}
            </div>

            {/* Dải ảnh nhỏ chuyển nhanh */}
            {images.length > 1 && (
              <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto no-scrollbar py-0.5">
                {images.map((img, idx) => (
                  <button
                    key={`thumb-${idx}`}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer bg-white ${
                      idx === currentIdx
                        ? "border-accent ring-2 ring-accent/30 shadow-xs scale-105"
                        : "border-[#E8DFC8] opacity-65 hover:opacity-100"
                    }`}
                  >
                    <FastImage
                      src={img}
                      fallbackSrc={images[0] || "/images/combo3sp.jpg"}
                      alt=""
                      width={56}
                      height={56}
                      className="w-full h-full object-cover p-0.5"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Khối cam kết vàng nổi bật dưới ảnh (CHỈ HIỆN TRÊN DESKTOP để không choán diện tích Mobile) */}
            <div className="hidden md:block mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-primary text-[11px] uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>{language === "en" ? "Quality Commitment" : "Cam Kết Chất Lượng Vàng"}</span>
              </div>
              <ul className="space-y-1.5 text-stone-700 text-[11.5px] leading-tight">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{language === "en" ? "Convection dried longan + 4 nutritious nuts" : "Long nhãn sấy đối lưu + 4 loại hạt dinh dưỡng"}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{language === "en" ? "Macadamia, Cashews, Almonds, Pumpkin seeds" : "Hạt điều, Macca, Bí xanh, Hạnh nhân giòn bùi"}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{language === "en" ? "Natural wood lid with airtight safety seal" : "Nắp gỗ tự nhiên & màng nhôm niêm phong kín khí"}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{language === "en" ? "Inspect before payment" : "Đồng kiểm hàng trước khi thanh toán"}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CỘT PHẢI (MD: 7 CỘT): GIÁ, QUY CÁCH, HỆ THỐNG 4 TABS CHI TIẾT */}
          <div className="md:col-span-7 flex flex-col justify-between bg-white">
            <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4">
              {/* Giá niêm yết & Quy cách chuẩn */}
              <div className="flex items-baseline justify-between gap-3 border-b border-[#E8DFC8]/60 pb-2.5 sm:pb-3">
                <div>
                  <span className="text-[11px] sm:text-xs text-stone-500 block">
                    {language === "en" ? "Official Price (VAT incl.)" : "Giá niêm yết (Đã gồm VAT)"}
                  </span>
                  <div className="text-xl sm:text-3xl font-extrabold text-accent">
                    {formatPrice(product.price, language)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] sm:text-xs text-stone-500 block">
                    {language === "en" ? "Packaging" : "Quy cách chuẩn"}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-primary bg-[#F7F3EB] px-2.5 py-1 rounded-full border border-[#E8DFC8] inline-block">
                    {product.size || detailInfo.size}
                  </span>
                </div>
              </div>

              {/* Dải 3 micro-cam kết nhanh trên Mobile (Gọn nhẹ, vuốt ngang mượt mà) */}
              <div className="flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-semibold text-stone-700">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/70 shrink-0">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{language === "en" ? "Longan & 4 Nuts" : "Long nhãn & 4 hạt mix"}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/70 shrink-0">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{language === "en" ? "Natural Wood Lid" : "Nắp gỗ & seal kín"}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/70 shrink-0">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{language === "en" ? "Inspect Upon Delivery" : "Đồng kiểm khi nhận"}</span>
                </span>
              </div>

              {/* THANH ĐIỀU HƯỚNG 4 TABS */}
              <div className="flex gap-1 p-1 bg-[#F5EFE6] rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`flex-1 min-w-[76px] sm:min-w-[85px] py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-lg text-center transition-all cursor-pointer whitespace-nowrap text-[11.5px] sm:text-xs ${
                    activeTab === "overview"
                      ? "bg-accent text-white font-bold shadow-xs"
                      : "text-stone-600 hover:text-primary"
                  }`}
                >
                  {language === "en" ? "Overview" : "Tổng quan"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("specs")}
                  className={`flex-1 min-w-[76px] sm:min-w-[85px] py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-lg text-center transition-all cursor-pointer whitespace-nowrap text-[11.5px] sm:text-xs ${
                    activeTab === "specs"
                      ? "bg-accent text-white font-bold shadow-xs"
                      : "text-stone-600 hover:text-primary"
                  }`}
                >
                  {language === "en" ? "Specs" : "Thông số"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("culinary")}
                  className={`flex-1 min-w-[76px] sm:min-w-[85px] py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-lg text-center transition-all cursor-pointer whitespace-nowrap text-[11.5px] sm:text-xs ${
                    activeTab === "culinary"
                      ? "bg-accent text-white font-bold shadow-xs"
                      : "text-stone-600 hover:text-primary"
                  }`}
                >
                  {language === "en" ? "Recipes" : "Món ngon"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("storage")}
                  className={`flex-1 min-w-[76px] sm:min-w-[85px] py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-lg text-center transition-all cursor-pointer whitespace-nowrap text-[11.5px] sm:text-xs ${
                    activeTab === "storage"
                      ? "bg-accent text-white font-bold shadow-xs"
                      : "text-stone-600 hover:text-primary"
                  }`}
                >
                  {language === "en" ? "Storage" : "Bảo quản"}
                </button>
              </div>

              {/* NỘI DUNG TỪNG TAB */}
              <div className="min-h-[200px]">
                {/* TAB 1: TỔNG QUAN & HỒ SƠ CẢM QUAN */}
                {activeTab === "overview" && (
                  <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-accent italic mb-1">
                        &ldquo;{language === "en" ? detailInfo.taglineEn : detailInfo.taglineVi}&rdquo;
                      </p>
                      <p className="text-[11.5px] sm:text-sm text-stone-700 leading-relaxed">
                        {language === "en" ? detailInfo.overviewEn : detailInfo.overviewVi}
                      </p>
                    </div>

                    {/* Chỉ số cảm quan 4 trục */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-[#FCFBF8] border border-[#E8DFC8] space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-wider">
                          {language === "en" ? "Sensory Tasting Profile" : "Hồ Sơ Cảm Quan Thưởng Vị"}
                        </h4>
                        <span className="text-[10px] sm:text-[11px] text-accent font-semibold">
                          {language === "en" ? "scale / 10" : "thang điểm 10"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                        <div>
                          <div className="flex justify-between mb-0.5 text-[10.5px] sm:text-[11px]">
                            <span className="text-stone-600 truncate">{language === "en" ? "Nut Crispiness" : "Độ giòn bùi hạt"}</span>
                            <span className="font-bold text-primary">{detailInfo.sensory.nutCrispiness}/10</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${detailInfo.sensory.nutCrispiness * 10}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-0.5 text-[10.5px] sm:text-[11px]">
                            <span className="text-stone-600 truncate">{language === "en" ? "Longan Chewiness" : "Độ dẻo mọng nhãn"}</span>
                            <span className="font-bold text-primary">{detailInfo.sensory.longanChewiness}/10</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${detailInfo.sensory.longanChewiness * 10}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-0.5 text-[10.5px] sm:text-[11px]">
                            <span className="text-stone-600 truncate">{language === "en" ? "Natural Sweetness" : "Vị ngọt thanh dịu"}</span>
                            <span className="font-bold text-primary">{detailInfo.sensory.naturalSweetness}/10</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${detailInfo.sensory.naturalSweetness * 10}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-0.5 text-[10.5px] sm:text-[11px]">
                            <span className="text-stone-600 truncate">{language === "en" ? "Rich Nutty Aroma" : "Hương thơm ngậy"}</span>
                            <span className="font-bold text-primary">{detailInfo.sensory.harmoniousAroma}/10</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${detailInfo.sensory.harmoniousAroma * 10}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Danh sách 5 thành phần hạt & long nhãn phối trộn */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                      <h4 className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>{language === "en" ? "5 Ingredients in this Blend" : "Bộ 5 Thành Phần Long Nhãn & Hạt Dinh Dưỡng Mix"}</span>
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        {detailInfo.ingredientsList.map((ing, i) => (
                          <div key={i} className="flex items-start gap-2 bg-white/95 p-2 rounded-xl border border-amber-200/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-primary block leading-tight text-[11px] sm:text-[11.5px]">
                                {language === "en" ? ing.nameEn : ing.nameVi}
                              </span>
                              <span className="text-[10.5px] sm:text-[11px] text-stone-600 block leading-tight mt-0.5">
                                {language === "en" ? ing.characteristicEn : ing.characteristicVi}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: THÔNG SỐ KỸ THUẬT & XUẤT XỨ */}
                {activeTab === "specs" && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="border border-[#E8DFC8] rounded-2xl overflow-hidden divide-y divide-[#E8DFC8]/60 text-xs">
                      {detailInfo.specifications.map((spec, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-3 p-2.5 sm:p-3 hover:bg-[#FAF8F5]"
                        >
                          <span className="font-semibold text-stone-500 sm:text-stone-600 text-[11px] sm:text-xs sm:w-2/5">
                            {language === "en" ? spec.labelEn : spec.labelVi}
                          </span>
                          <span className="font-bold text-primary text-xs sm:text-right sm:w-3/5">
                            {language === "en" ? spec.valueEn : spec.valueVi}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: GỢI Ý MÓN NGON ẨM THỰC */}
                {activeTab === "culinary" && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                      {detailInfo.culinaryUsages.map((use, idx) => (
                        <div key={idx} className="p-2.5 sm:p-3 rounded-xl bg-[#FCFBF8] border border-[#E8DFC8] space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                            <span className="text-sm shrink-0">{use.icon}</span>
                            <span className="truncate">{language === "en" ? use.titleEn : use.titleVi}</span>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-relaxed">
                            {language === "en" ? use.descEn : use.descVi}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1 text-center">
                      <Link
                        href="/am-thuc#bo-tu-ngu-thien"
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-[#92400E] hover:underline"
                      >
                        <span>{language === "en" ? "View Royal Imperial Recipes with Videos" : "Xem video hướng dẫn Bộ Tứ Thực Đơn Hoàng Gia"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* TAB 4: HƯỚNG DẪN BẢO QUẢN */}
                {activeTab === "storage" && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="p-3 sm:p-4 rounded-2xl bg-[#FCFBF8] border border-[#E8DFC8] space-y-2">
                      <h4 className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>{language === "en" ? "Optimal Preservation Guide" : "Quy Tắc Bảo Quản Giữ Sắc Vàng"}</span>
                      </h4>
                      <ul className="space-y-1.5 sm:space-y-2 text-xs text-stone-700">
                        {(language === "en" ? detailInfo.storageTipsEn : detailInfo.storageTipsVi).map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                            <span className="text-[11.5px] sm:text-xs leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-[11px] sm:text-xs">
                        {language === "en"
                          ? "Free 1-to-1 exchange within 7 days if any defect is detected."
                          : "Đổi trả 1-1 miễn phí trong 7 ngày nếu sản phẩm ẩm mốc hoặc không đúng cam kết."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* THANH ĐẶT HÀNG & CHỌN SỐ LƯỢNG (STICKY FOOTER CỦA MODAL) */}
            <div className="p-3 sm:p-4 md:p-5 border-t border-[#E8DFC8] bg-[#FAF8F5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
              {/* Bộ chọn số lượng + Tổng tiền */}
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="flex items-center border border-[#E8DFC8] rounded-xl bg-white shadow-2xs overflow-hidden h-10 sm:h-11">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-9 h-full flex items-center justify-center hover:bg-stone-100 text-stone-700 disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center font-bold text-sm text-primary select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-full flex items-center justify-center hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer active:scale-95"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tổng tiền hiển thị trên Mobile */}
                <div className="sm:hidden text-right leading-tight">
                  <span className="text-[10.5px] text-stone-500 block">
                    {language === "en" ? "Subtotal" : "Tổng tiền"}
                  </span>
                  <span className="text-base font-extrabold text-accent">
                    {formatPrice(product.price * quantity, language)}
                  </span>
                </div>
              </div>

              {/* Nhóm 2 nút Thêm giỏ và Mua ngay */}
              <div className="flex items-center gap-2">
                {onAddToCart && (
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 h-11 sm:h-11 border-2 border-accent text-accent hover:bg-amber-50 font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>{language === "en" ? "Added!" : "Đã Thêm!"}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>{language === "en" ? "Add to Cart" : "Thêm Giỏ"}</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 h-11 sm:h-11 bg-accent hover:bg-[#9A3412] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <span>{language === "en" ? "Buy Now" : "Mua Ngay"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ProductDetailModal;
