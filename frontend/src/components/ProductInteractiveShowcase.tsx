"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  Crown,
  Plus,
  ShoppingCart, 
  Eye, 
  ChevronRight, 
  Award, 
  Check, 
  Layers,
  Info
} from "lucide-react";
import { FastImage } from "@/components/FastImage";
import { EASE_OUT_EXPO } from "@/components/LandingMotion";
import type { ProductResponse } from "@/types/api.types";
import { DEFAULT_FALLBACK_PRODUCTS } from "@/data/defaultProducts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

interface ProductInteractiveShowcaseProps {
  products: ProductResponse[];
  language: "vi" | "en";
  cmsContent: Record<string, string>;
  onOrderProduct: (productId: string) => void;
  onOpenGallery: (product: ProductResponse) => void;
  onAddToCart?: (product: ProductResponse) => void;
}

// Dữ liệu mở rộng điểm chạm (Hotspots) cho sản phẩm
const PRODUCT_HOTSPOTS = [
  {
    id: "preservation",
    x: 68,
    y: 24,
    title: "Bảo quản kín khí 12 tháng",
    desc: "Đóng gói tiêu chuẩn vô trùng, giữ trọn độ dẻo và hương thơm nhãn lồng nguyên bản.",
    badge: "Hạn dùng 12 Tháng",
  },
  {
    id: "color",
    x: 32,
    y: 48,
    title: "Sắc vàng cánh gián hổ phách",
    desc: "Màu tự nhiên từ quy trình sấy nhiệt nóng đối lưu, tuyệt đối không dùng phẩm màu hay xông lưu huỳnh.",
    badge: "Tự Nhiên 100%",
  },
  {
    id: "texture",
    x: 64,
    y: 66,
    title: "Cùi dày mọng ráo mặt",
    desc: "Tuyển chọn từ nhãn Hương Chi loại 1 bãi bồi Phố Hiến, cắn dẻo sần sật, ngọt thanh tao.",
    badge: "Hương Chi Loại 1",
  },
];

// Dữ liệu chỉ số cảm quan
const PRODUCT_METRICS = [
  { label: "Độ ngọt thanh tự nhiên", labelEn: "Natural Sweetness", value: 98, color: "from-amber-400 to-amber-600" },
  { label: "Độ dẻo mọng cùi nhãn", labelEn: "Texture & Chewy", value: 95, color: "from-emerald-500 to-teal-600" },
  { label: "Hương thơm nhãn lồng tự nhiên", labelEn: "Natural Longan Aroma", value: 100, color: "from-orange-400 to-red-500" },
  { label: "Tỷ lệ hạt loại 1 tròn đều", labelEn: "Grade A Uniformity", value: 99, color: "from-yellow-400 to-amber-500" },
];


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
  const cardRef = useRef<HTMLDivElement>(null);
  const activeProduct = displayProducts[selectedIndex] || displayProducts[0];

  // Dùng useMotionValue thay cho useState để cập nhật GPU transform trực tiếp mà KHÔNG gây re-render component
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateXSpring = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { stiffness: 240, damping: 22 });
  const rotateYSpring = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 240, damping: 22 });

  // Xử lý hiệu ứng 3D tilt theo góc chuột trực tiếp qua GPU mà không trigger re-render
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const formatPrice = (price: number) => {
    if (language === "en") {
      return `$${(price / 25000).toFixed(2)}`;
    }
    return `${price.toLocaleString("vi-VN").replace(/,/g, ".")}đ`;
  };

  // Xác định ảnh hiển thị: ưu tiên ảnh từ API, fallback sang ảnh cục bộ theo index
  const getProductImage = (prod?: ProductResponse, idx = 0) => {
    if (prod?.images?.[0]?.imagePath) {
      const p = prod.images[0].imagePath;
      if (p.startsWith("/images/") || p.startsWith("http")) return p;
      return `${API_URL}${p}`;
    }
    const fallbacks = ["/images/hopnhua.jpg", "/images/tuizip.jpg", "/images/setqua.jpg"];
    return fallbacks[idx % fallbacks.length];
  };

  return (
    <section id="san-pham" className="py-10 sm:py-16 scroll-mt-20 sm:scroll-mt-24 relative overflow-hidden bg-gradient-to-b from-[#FFFDF8] via-[#F8F3E8] to-[#FFFDF8] w-full max-w-full">
      {/* Nền trang trí hạt ánh sáng */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[800px] max-w-[150vw] h-[400px] bg-[radial-gradient(ellipse,rgba(253,230,138,0.25)_0%,transparent_70%)] rounded-full pointer-events-none" />
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

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight mb-2.5">
            {language === "en" 
              ? (cmsContent.ProductsTitle_En || "Artisanal Specialty Products") 
              : (cmsContent.ProductsTitle || "Tinh Hoa Sản Phẩm Nguyệt Nhãn")}
          </h2>
          <p className="text-foreground/80 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            {language === "en"
              ? (cmsContent.ProductsSubtitle_En || "Hand-selected Hương Chi longan, dried using hot air convective drying to preserve its golden hue and honeyed fragrance.")
              : (cmsContent.ProductsSubtitle || "Từng cùi nhãn Hương Chi được chọn lọc kỹ lưỡng, sấy nhiệt nóng (sấy đối lưu) giữ trọn sắc vàng óng ánh và hương thơm ngọt ngào trứ danh.")}
          </p>
        </motion.div>

        {/* Thanh Tab chọn sản phẩm */}
        <div className="flex justify-center mb-6 sm:mb-8 px-2 w-full max-w-full">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/85 backdrop-blur-md border border-[#FDE68A]/60 shadow-md overflow-x-auto no-scrollbar max-w-full">
            {displayProducts.map((prod, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={prod.id}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setActiveHotspot(null);
                  }}
                  className={`relative px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 z-10 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected ? "text-white" : "text-foreground/70 hover:text-primary"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeShowcaseTab"
                      className="absolute inset-0 bg-gradient-to-r from-[#B45309] to-[#D97706] rounded-xl shadow-xs -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="whitespace-nowrap">{prod.name}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-secondary text-accent font-bold"}`}>
                    {prod.size}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Khung Showcase Chi Tiết: Chia 2 cột tỷ lệ 5:7 cân đối, vừa vặn màn hình */}
        {activeProduct && (
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full max-w-5xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl p-4 sm:p-6 lg:p-7 border border-[#FDE68A]/70 shadow-md relative overflow-hidden">
            
            {/* Cột Trái (Ảnh 3D Parallax + Hotspot Pins) */}
            <div className="lg:col-span-5 flex flex-col items-center w-full min-w-0 max-w-full">
              <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => setActiveHotspot(null)}
                className="relative w-full aspect-[4/5] max-h-[360px] sm:max-h-[400px] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-[#FEF3C7]/40 via-white to-[#FDE68A]/30 border border-[#FDE68A]/50 shadow-sm cursor-crosshair group select-none flex items-center justify-center"
                style={{
                  perspective: 1000,
                }}
              >
                {/* Lớp ảnh tương tác với 3D tilt */}
                <motion.div
                  className="w-full h-full relative flex items-center justify-center will-change-transform"
                  style={{
                    rotateX: prefersReducedMotion ? 0 : rotateXSpring,
                    rotateY: prefersReducedMotion ? 0 : rotateYSpring,
                    transformStyle: "preserve-3d",
                  }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  {/* Background mờ nhẹ tôn chiều sâu ảnh */}
                  <FastImage
                    src={getProductImage(activeProduct, selectedIndex)}
                    fallbackSrc={["/images/hopnhua.jpg", "/images/tuizip.jpg", "/images/setqua.jpg"][selectedIndex % 3]}
                    alt=""
                    fill
                    className="object-cover blur-xl opacity-25 scale-110 pointer-events-none -z-10"
                  />

                  {/* Ảnh chính đầy đủ, không bị phóng to cắt xén */}
                  <FastImage
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
                  <div className="absolute -inset-4 bg-[radial-gradient(circle,rgba(253,230,138,0.35)_0%,transparent_70%)] -z-10 pointer-events-none" />
                </motion.div>

                {/* Các điểm neo Hotspots tương tác cắm trên ảnh */}
                {PRODUCT_HOTSPOTS.map((spot) => {
                  const isActive = activeHotspot === spot.id;
                  const isRightSide = spot.x > 50;
                  const isTopHalf = spot.y < 40;
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
                      >
                        <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />
                        <span className="relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-accent text-white shadow-md border-2 border-white font-bold text-xs transition-transform transform group-hover/pin:scale-110">
                          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </span>
                      </button>

                      {/* Tooltip bừng sáng khi active - định vị thông minh trên dưới tránh tràn mép */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
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
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                  <span className="hidden sm:inline">Chạm điểm tròn để khám phá</span>
                  <span className="sm:hidden">Chạm điểm tròn</span>
                </div>
              </div>

              {/* Băng ảnh nhỏ chọn sản phẩm: chia lưới 3 cột vừa vặn, không bị cắt xén tên */}
              <div className="grid grid-cols-3 gap-2 mt-3 w-full">
                {displayProducts.map((prod, idx) => {
                  const isCurrent = idx === selectedIndex;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => {
                        setSelectedIndex(idx);
                        setActiveHotspot(null);
                      }}
                      className={`flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 p-1.5 rounded-xl border text-center sm:text-left transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-amber-50/90 border-accent ring-1 ring-accent/30 shadow-xs"
                          : "bg-white/70 border-border/60 hover:bg-white hover:border-accent/40"
                      }`}
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden relative border border-border/40 shrink-0 bg-white">
                        <FastImage
                          src={getProductImage(prod, idx)}
                          fallbackSrc={["/images/hopnhua.jpg", "/images/tuizip.jpg", "/images/setqua.jpg"][idx % 3]}
                          alt={prod.name}
                          fill
                          sizes="36px"
                          className="object-contain p-0.5"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-primary line-clamp-2 leading-tight" title={prod.name}>
                          {prod.name}
                        </div>
                        <div className="text-xs font-semibold text-accent leading-tight">
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
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-accent text-[11px] sm:text-xs font-bold tracking-wide uppercase shrink-0">
                    <Award className="w-3 h-3" />
                    Đặc Sản Tiến Vua
                  </span>
                  <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full shrink-0">
                    Quy cách: {activeProduct.size}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-primary mb-1.5 break-words leading-snug">
                  {activeProduct.name}
                </h3>

                <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed mb-3 break-words line-clamp-2">
                  {activeProduct.description}
                </p>

                {/* Giá bán nổi bật */}
                <div className="flex flex-wrap items-baseline gap-2.5 mb-3.5 pt-0.5">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#78350F] font-sans shrink-0">
                    {formatPrice(activeProduct.price)}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    (Đã bao gồm VAT & Cam kết 100% tự nhiên)
                  </span>
                </div>

                {/* Bảng chỉ số cảm quan (Sensory Metrics) với bố cục 2 cột gọn gàng */}
                <div className="space-y-2 mb-3.5 w-full">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-accent" />
                    <span>Chỉ Số Tinh Túy Cảm Quan</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {PRODUCT_METRICS.map((metric, idx) => (
                      <div key={idx} className="space-y-0.5 w-full">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span className="text-foreground/85 truncate">
                            {language === "en" ? metric.labelEn : metric.label}
                          </span>
                          <span className="font-bold text-primary ml-1 shrink-0">{metric.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden p-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${metric.value}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: idx * 0.1, ease: EASE_OUT_EXPO }}
                            className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cam kết chất lượng 4 điểm */}
                <div className="grid grid-cols-2 gap-2 py-2.5 border-t border-b border-border/50 mb-3.5 text-[11px] sm:text-xs text-foreground/80 w-full">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Sấy nhiệt nóng (đối lưu)</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Không đường hóa học</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Không xông lưu huỳnh</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Giao hàng toàn quốc</span>
                  </div>
                </div>
              </div>

              {/* Nút hành động Mua Ngay */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1 w-full">
                {onAddToCart && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAddToCart(activeProduct)}
                    className="flex-1 border-2 border-accent text-accent hover:bg-[#FEF3C7] font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>{language === "en" ? "Add to Cart" : "Thêm vào giỏ"}</span>
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOrderProduct(activeProduct.id)}
                  className="flex-[1.2] bg-gradient-to-r from-[#92400E] to-[#B45309] hover:from-[#78350F] hover:to-[#92400E] text-white font-bold py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl shadow-md shadow-[#92400E]/20 flex items-center justify-center gap-2 transition-all text-xs sm:text-sm md:text-base cursor-pointer whitespace-nowrap"
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>{language === "en" ? "Order Now" : "Đặt Mua Ngay"}</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </motion.button>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
