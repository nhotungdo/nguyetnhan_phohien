"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { 
  Crown,
  Plus,
  ShoppingCart, 
  Eye, 
  ChevronRight, 
  Award, 
  Check, 
  Info
} from "lucide-react";
import { FastImage } from "@/components/FastImage";
import { EASE_OUT_EXPO } from "@/components/LandingMotion";
import type { ProductResponse } from "@/types/api.types";
import { DEFAULT_FALLBACK_PRODUCTS } from "@/data/defaultProducts";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050").replace(/\/+$/, "");

interface ProductInteractiveShowcaseProps {
  products: ProductResponse[];
  language: "vi" | "en";
  cmsContent: Record<string, string>;
  onOrderProduct: (productId: string) => void;
  onOpenGallery: (product: ProductResponse) => void;
  onAddToCart?: (product: ProductResponse) => void;
}

// Dữ liệu mở rộng điểm chạm (Hotspots) cho sản phẩm theo ngôn ngữ
function getProductHotspots(lang: "vi" | "en") {
  return [
    {
      id: "preservation",
      x: 68,
      y: 24,
      title: lang === "en" ? "12-Month Airtight Preservation" : "Bảo quản kín khí 12 tháng",
      desc: lang === "en"
        ? "Aseptic sealed packaging preserves full chewiness and natural longan aroma."
        : "Đóng gói tiêu chuẩn vô trùng, giữ trọn độ dẻo và hương thơm nhãn lồng nguyên bản.",
      badge: lang === "en" ? "12-Month Shelf Life" : "Hạn dùng 12 Tháng",
    },
    {
      id: "color",
      x: 32,
      y: 48,
      title: lang === "en" ? "Amber Golden Hue" : "Sắc vàng cánh gián hổ phách",
      desc: lang === "en"
        ? "Natural color from warm convection drying, strictly free of artificial colorings or sulfur fumes."
        : "Màu tự nhiên từ quy trình sấy nhiệt nóng đối lưu, tuyệt đối không dùng phẩm màu hay xông lưu huỳnh.",
      badge: lang === "en" ? "100% Natural" : "Tự Nhiên 100%",
    },
    {
      id: "texture",
      x: 64,
      y: 66,
      title: lang === "en" ? "Thick Tender Flesh" : "Cùi dày mọng ráo mặt",
      desc: lang === "en"
        ? "Handpicked grade-1 Huong Chi longan from alluvial plains, tender texture and delicate royal sweetness."
        : "Tuyển chọn từ nhãn Hương Chi loại 1 bãi bồi Phố Hiến, cắn dẻo sần sật, ngọt thanh tao.",
      badge: lang === "en" ? "Grade 1 Huong Chi" : "Hương Chi Loại 1",
    },
  ];
}

export function ProductInteractiveShowcase({
  products,
  language,
  cmsContent,
  onOrderProduct,
  onOpenGallery,
  onAddToCart,
}: ProductInteractiveShowcaseProps) {
  const prefersReducedMotion = useReducedMotion();
  const displayProducts = products && products.length > 0 ? products : DEFAULT_FALLBACK_PRODUCTS;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const addedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeProduct = displayProducts[selectedIndex] || displayProducts[0];
  const hotspots = getProductHotspots(language);

  useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current);
    };
  }, []);

  const handleAddToCartClick = () => {
    if (onAddToCart && activeProduct) {
      onAddToCart(activeProduct);
      setIsAdded(true);
      if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current);
      addedTimeoutRef.current = setTimeout(() => setIsAdded(false), 1800);
    }
  };

  const formatPrice = (price: number) => {
    if (language === "en") {
      return `$${(price / 25000).toFixed(2)}`;
    }
    return `${price.toLocaleString("vi-VN").replace(/,/g, ".")}đ`;
  };

  // Xác định ảnh hiển thị: ưu tiên ảnh từ API theo displayOrder, fallback sang ảnh cục bộ theo index
  const getProductImage = (prod?: ProductResponse, idx = 0) => {
    if (prod?.images && prod.images.length > 0) {
      const sorted = [...prod.images].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      const p = sorted[0]?.imagePath;
      if (p) {
        if (p.startsWith("/images/") || p.startsWith("http://") || p.startsWith("https://") || p.startsWith("data:")) {
          return p;
        }
        if (p.startsWith("/uploads/") || p.startsWith("uploads/")) {
          return p.startsWith("/") ? p : `/${p}`;
        }
        const base = API_URL.replace(/\/+$/, "");
        const path = p.startsWith("/") ? p : `/${p}`;
        return `${base}${path}`;
      }
    }
    const fallbacks = ["/images/hopnhua.jpg", "/images/tuizip.jpg", "/images/setqua.jpg"];
    return fallbacks[idx % fallbacks.length];
  };

  return (
    <section id="san-pham" className="py-10 sm:py-16 scroll-mt-20 sm:scroll-mt-24 relative overflow-hidden bg-white w-full max-w-full [contain:paint]">
      {/* Nền trang trí hạt ánh sáng */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-[radial-gradient(ellipse,rgba(253,230,138,0.25)_0%,rgba(253,230,138,0)_70%)] rounded-full pointer-events-none" />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 w-full max-w-full">
        {/* Tiêu đề & Lời dẫn phân khu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="text-center max-w-3xl mx-auto mb-6 sm:mb-8"
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-secondary text-accent text-xs font-semibold border border-[#FDE68A] shadow-xs mb-3">
            <Crown className="w-3.5 h-3.5 text-accent" />
            <span>{language === "en" ? "King's Tribute Longan Collection" : "Bộ Sưu Tập Long Nhãn Tiến Vua"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary tracking-tight mb-2.5 [text-wrap:balance]">
            {language === "en" 
              ? (cmsContent.ProductsTitle_En || "Artisanal Specialty Products") 
              : (cmsContent.ProductsTitle || "Tinh Hoa Sản Phẩm Nguyệt Nhãn")}
          </h1>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto [text-wrap:pretty]">
            {language === "en"
              ? (cmsContent.ProductsSubtitle_En || "Hand-selected Hương Chi longan, dried using hot air convective drying to preserve its golden hue and honeyed fragrance.")
              : (cmsContent.ProductsSubtitle || "Từng cùi nhãn Hương Chi được chọn lọc kỹ lưỡng, sấy nhiệt nóng (sấy đối lưu) giữ trọn sắc vàng óng ánh và hương thơm ngọt ngào trứ danh.")}
          </p>
        </motion.div>

        {/* Thanh Tab chọn sản phẩm */}
        <div className="flex justify-center mb-6 sm:mb-8 px-2 w-full max-w-full">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-[#FDE68A]/60 shadow-md overflow-x-auto no-scrollbar max-w-full">
            {displayProducts.map((prod, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={prod.id}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setActiveHotspot(null);
                  }}
                  className={`relative px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer overflow-hidden ${
                    isSelected ? "text-white" : "text-stone-700 hover:text-primary"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeShowcaseTab"
                      className="absolute inset-0 bg-primary rounded-xl shadow-xs"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="whitespace-nowrap relative z-10">{prod.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full relative z-10 ${isSelected ? "bg-black/20 text-white font-bold" : "bg-secondary text-primary font-bold"}`}>
                    {prod.size}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Khung Showcase Chi Tiết: Chia 2 cột tỷ lệ 5:7 cân đối, vừa vặn màn hình */}
        {activeProduct && (
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full max-w-5xl mx-auto bg-card rounded-3xl p-4 sm:p-6 lg:p-7 border border-border shadow-md hover:shadow-xl hover:border-accent/40 transition-all duration-500 relative overflow-hidden group">
            {/* Vệt hào quang góc trên mềm mại */}
            <div
              className="absolute top-0 right-0 w-80 h-80 pointer-events-none -z-0 opacity-60 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: "radial-gradient(circle at 100% 0%, rgba(253, 230, 138, 0.4) 0%, transparent 70%)",
              }}
            />
            
            {/* Cột Trái (Ảnh 3D Parallax + Hotspot Pins) */}
            <div className="lg:col-span-5 flex flex-col items-center w-full min-w-0 max-w-full">
              <div
                ref={cardRef}
                onClick={() => setActiveHotspot(null)}
                className="relative w-full aspect-[4/5] max-h-[360px] sm:max-h-[400px] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-amber-50/40 via-white to-amber-100/20 cursor-crosshair group select-none flex items-center justify-center"
                style={{
                  perspective: 1000,
                }}
              >
                {/* Lớp ảnh tương tác với 3D tilt */}
                <motion.div
                  className="w-full h-full relative flex items-center justify-center will-change-transform"
                  style={{
                    rotateX: 0,
                    rotateY: 0,
                    transformStyle: "preserve-3d",
                  }}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  {/* Background mờ nhẹ tôn chiều sâu ảnh */}
                  <FastImage
                    key={`bg-${activeProduct.id}-${getProductImage(activeProduct, selectedIndex)}`}
                    src={getProductImage(activeProduct, selectedIndex)}
                    fallbackSrc={["/images/hopnhua.jpg", "/images/tuizip.jpg", "/images/setqua.jpg"][selectedIndex % 3]}
                    alt=""
                    fill
                    className="object-cover blur-xl opacity-25 scale-110 pointer-events-none -z-10"
                  />

                  {/* Ảnh chính đầy đủ, không bị phóng to cắt xén */}
                  <FastImage
                    key={`main-${activeProduct.id}-${getProductImage(activeProduct, selectedIndex)}`}
                    src={getProductImage(activeProduct, selectedIndex)}
                    fallbackSrc={["/images/hopnhua.jpg", "/images/tuizip.jpg", "/images/setqua.jpg"][selectedIndex % 3]}
                    alt={activeProduct.name}
                    fill
                    sizes="(max-width: 1024px) 90vw, 450px"
                    priority
                    className="object-contain p-2 sm:p-3 transition-transform duration-700 group-hover:scale-105 drop-shadow-md"
                  />

                  {/* Vệt sáng quét nhẹ qua ảnh (Sheen effect) */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {/* Vòng hào quang nhẹ sau ảnh */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(253,230,138,0.35)_0%,rgba(253,230,138,0)_70%)] -z-10 pointer-events-none" />
                </motion.div>

                {/* Các điểm neo Hotspots tương tác cắm trên ảnh */}
                {hotspots.map((spot) => {
                  const isActive = activeHotspot === spot.id;
                  const isRightSide = spot.x > 50;
                  const isTopHalf = spot.y < 40;
                  const tooltipId = `hotspot-${spot.id}-tooltip`;
                  return (
                    <div
                      key={spot.id}
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
                    >
                      {/* Nút bấm Hotspot có xung lan tỏa */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveHotspot(isActive ? null : spot.id);
                        }}
                        onMouseEnter={() => setActiveHotspot(spot.id)}
                        className="relative group/pin p-2 outline-none touch-manipulation cursor-pointer"
                        aria-label={spot.title}
                        aria-expanded={isActive}
                        aria-controls={tooltipId}
                      >
                        <span className="absolute inset-0 rounded-full bg-accent/10" />
                        <span className="relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-accent text-white shadow-md border-2 border-white font-bold text-xs transition-transform transform group-hover/pin:scale-110">
                          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </span>
                      </button>

                      {/* Tooltip bừng sáng khi active - định vị thông minh trên dưới tránh tràn mép */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            id={tooltipId}
                            role="tooltip"
                            initial={{ opacity: 0, y: isTopHalf ? -8 : 8, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: isTopHalf ? -8 : 8, scale: 0.9 }}
                            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute ${isTopHalf ? "top-full mt-2" : "bottom-full mb-2"} w-52 sm:w-60 max-w-[calc(100vw-3.5rem)] p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-[#FDE68A] text-left pointer-events-auto z-40 ${
                              isRightSide
                                ? "-right-2 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto"
                                : "-left-2 sm:left-1/2 sm:-translate-x-1/2"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-accent bg-secondary px-2 py-0.5 rounded-full">
                                {spot.badge}
                              </span>
                              <Info className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-primary leading-tight mb-0.5">{spot.title}</h4>
                            <p className="text-xs text-foreground/80 leading-relaxed">{spot.desc}</p>
                            {/* Mũi tên tam giác */}
                            <div className={`hidden sm:block absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent ${
                              isTopHalf 
                                ? "bottom-full border-b-6 border-b-white" 
                                : "top-full border-t-6 border-t-white"
                            }`} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Nút xem bộ sưu tập ảnh góc dưới phải */}
                <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenGallery(activeProduct);
                    }}
                    className="flex items-center gap-1.5 bg-black/65 hover:bg-black/85 text-white backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{language === "en" ? "Gallery" : "Xem Ảnh"}</span>
                  </button>
                </div>

                {/* Gợi ý tương tác góc dưới trái */}
                <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-foreground/80 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border border-border/50 shadow-xs pointer-events-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <span className="hidden sm:inline">
                    {language === "en" ? "Tap hotspots to explore" : "Chạm điểm tròn để khám phá"}
                  </span>
                  <span className="sm:hidden">
                    {language === "en" ? "Tap hotspots" : "Chạm điểm tròn"}
                  </span>
                </div>
              </div>

              {/* Băng ảnh nhỏ chọn sản phẩm: chia lưới 3 cột vừa vặn, không bị cắt xén tên */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-3 w-full">
                {displayProducts.map((prod, idx) => {
                  const isCurrent = idx === selectedIndex;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => {
                        setSelectedIndex(idx);
                        setActiveHotspot(null);
                      }}
                      className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-1.5 rounded-xl text-center sm:text-left transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-[#F4EFE6] ring-1 ring-primary/40 shadow-xs"
                          : "bg-white/80 hover:bg-white border border-border/40"
                      }`}
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden relative border border-border/40 shrink-0 bg-white">
                        <FastImage
                          key={`thumb-${prod.id}-${getProductImage(prod, idx)}`}
                          src={getProductImage(prod, idx)}
                          fallbackSrc={["/images/hopnhua.jpg", "/images/tuizip.jpg", "/images/setqua.jpg"][idx % 3]}
                          alt={prod.name}
                          fill
                          sizes="36px"
                          className="object-contain p-0.5"
                        />
                      </div>
                      <div className="min-w-0 flex-1 w-full">
                        <div className="text-[11px] sm:text-xs font-bold text-primary truncate sm:line-clamp-2 leading-tight" title={prod.name}>
                          {prod.name}
                        </div>
                        <div className="text-xs font-bold text-accent leading-tight mt-0.5">
                          {formatPrice(prod.price)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cột Phải (Thông tin chi tiết, Thanh chỉ số cảm quan, Nút mua hàng) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4 w-full min-w-0 max-w-full">
              <div className="w-full">
                {/* Quy cách & Tên */}
                <div className="flex items-center justify-between gap-2 mb-1.5 w-full">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#A61C45] text-white text-[11px] sm:text-xs font-bold tracking-wide uppercase shadow-xs shrink-0">
                    <Award className="w-3 h-3 text-[#F3D498]" />
                    {language === "en" ? "Royal Tribute Delicacy" : "Đặc Sản Tiến Vua"}
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full shrink-0">
                    {language === "en" ? "Net wt: " : "Quy cách: "}{activeProduct.size}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-1.5 break-words leading-snug [text-wrap:balance]">
                  {activeProduct.name}
                </h3>

                <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed mb-3 break-words line-clamp-2 [text-wrap:pretty]">
                  {activeProduct.description}
                </p>

                {/* Giá bán nổi bật */}
                <div className="flex flex-wrap items-baseline gap-2.5 mb-3.5 pt-0.5">
                  <div className="text-2xl sm:text-3xl font-extrabold text-accent font-sans shrink-0">
                    {formatPrice(activeProduct.price)}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {language === "en" ? "(VAT incl. & 100% all-natural pledge)" : "(Đã bao gồm VAT & Cam kết 100% tự nhiên)"}
                  </span>
                </div>

                {/* Cam kết chất lượng 4 điểm */}
                <div className="grid grid-cols-2 gap-2 py-2.5 border-t border-b border-border/50 mb-3.5 text-xs text-foreground/80 w-full">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{language === "en" ? "Convection dried" : "Sấy nhiệt nóng (đối lưu)"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{language === "en" ? "No added sugar" : "Không đường hóa học"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{language === "en" ? "Zero sulfur fumes" : "Không xông lưu huỳnh"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{language === "en" ? "Nationwide delivery" : "Giao hàng toàn quốc"}</span>
                  </div>
                </div>
              </div>

              {/* Nút hành động Mua Ngay */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1 w-full">
                {onAddToCart && (
                  <motion.button
                    whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    onClick={handleAddToCartClick}
                    className={`flex-1 border-2 font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                      isAdded
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/30"
                        : "border-accent text-accent hover:bg-accent/10 hover:border-accent"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 shrink-0 animate-badge-pop" />
                        <span>{language === "en" ? "Added to Cart!" : "Đã Thêm Vào Giỏ!"}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 shrink-0" />
                        <span>{language === "en" ? "Add to Cart" : "Thêm vào giỏ"}</span>
                      </>
                    )}
                  </motion.button>
                )}
                <motion.button
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  onClick={() => onOrderProduct(activeProduct.id)}
                  className="flex-[1.2] bg-accent hover:bg-[#9A3412] text-white font-bold py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/40 flex items-center justify-center gap-2 transition-all text-xs sm:text-sm md:text-base cursor-pointer whitespace-nowrap group"
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>{language === "en" ? "Order Now" : "Đặt Mua Ngay"}</span>
                  <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
