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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

interface ProductInteractiveShowcaseProps {
  products: ProductResponse[];
  language: "vi" | "en";
  cmsContent: Record<string, string>;
  onOrderProduct: (productId: string) => void;
  onOpenGallery: (product: ProductResponse) => void;
}

// Dữ liệu mở rộng điểm chạm (Hotspots) cho sản phẩm
const PRODUCT_HOTSPOTS = [
  {
    id: "color",
    x: 35,
    y: 38,
    title: "Sắc vàng cánh gián hổ phách",
    desc: "Màu tự nhiên từ lò sấy củi nhãn, tuyệt đối không dùng phẩm màu hay xông lưu huỳnh.",
    badge: "Tự Nhiên 100%",
  },
  {
    id: "texture",
    x: 62,
    y: 52,
    title: "Cùi dày mọng ráo mặt",
    desc: "Tuyển chọn từ nhãn Hương Chi loại 1 bãi bồi Phố Hiến, cắn dẻo sần sật, ngọt thanh tao.",
    badge: "Hương Chi Loại 1",
  },
  {
    id: "preservation",
    x: 75,
    y: 30,
    title: "Bảo quản kín khí 12 tháng",
    desc: "Đóng gói tiêu chuẩn vô trùng, giữ trọn độ dẻo và hương thơm củi nhãn nguyên bản.",
    badge: "Hạn dùng 12 Tháng",
  },
];

// Dữ liệu chỉ số cảm quan
const PRODUCT_METRICS = [
  { label: "Độ ngọt thanh tự nhiên", labelEn: "Natural Sweetness", value: 98, color: "from-amber-400 to-amber-600" },
  { label: "Độ dẻo mọng cùi nhãn", labelEn: "Texture & Chewy", value: 95, color: "from-emerald-500 to-teal-600" },
  { label: "Mùi thơm củi nhãn đặc trưng", labelEn: "Smoked Longan Aroma", value: 100, color: "from-orange-400 to-red-500" },
  { label: "Tỷ lệ hạt loại 1 tròn đều", labelEn: "Grade A Uniformity", value: 99, color: "from-yellow-400 to-amber-500" },
];

const DEFAULT_FALLBACK_PRODUCTS: ProductResponse[] = [
  {
    id: "default-dac-biet",
    name: "Long Nhãn Loại Đặc Biệt",
    price: 350000,
    size: "Hộp 500g",
    description: "Nhãn lồng cùi dày Hương Chi, sấy thủ công bằng củi nhãn 100%, hạt đều tăm tắp, màu vàng cánh gián hổ phách sang trọng, dẻo ngọt thanh tao.",
    isActive: true,
    displayOrder: 1,
    images: [{ id: "img-1", imagePath: "/images/hopnhua.jpg", displayOrder: 1 }],
  },
  {
    id: "default-tui-zip",
    name: "Long Nhãn Dạng Túi Zip",
    price: 320000,
    size: "Túi 500g",
    description: "Thiết kế túi zip tiện dụng bảo quản hàng ngày, khóa kín khí giữ nguyên vị dẻo thơm, phù hợp pha trà, nấu chè giải nhiệt hoặc ngâm rượu bồi bổ.",
    isActive: true,
    displayOrder: 2,
    images: [{ id: "img-2", imagePath: "/images/tuizip.jpg", displayOrder: 1 }],
  },
  {
    id: "default-set-qua",
    name: "Set Quà Tặng Cao Cấp Hoàng Gia",
    price: 850000,
    size: "Set 1kg (2 Hộp)",
    description: "Hộp quà thiết kế trang nhã mang đậm bản sắc văn hóa Phố Hiến ngàn năm, kết hợp túi xách sang trọng, là món quà sức khỏe vô giá gửi tặng người thân, đối tác.",
    isActive: true,
    displayOrder: 3,
    images: [{ id: "img-3", imagePath: "/images/setqua.jpg", displayOrder: 1 }],
  },
];

export function ProductInteractiveShowcase({
  products,
  language,
  cmsContent,
  onOrderProduct,
  onOpenGallery,
}: ProductInteractiveShowcaseProps) {
  const prefersReducedMotion = useReducedMotion();
  const displayProducts = products && products.length > 0 ? products : DEFAULT_FALLBACK_PRODUCTS;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>("texture");
  const cardRef = useRef<HTMLDivElement>(null);
  const activeProduct = displayProducts[selectedIndex] || displayProducts[0];

  // Dùng useMotionValue thay cho useState để cập nhật GPU transform trực tiếp mà KHÔNG gây re-render component
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateXSpring = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 240, damping: 22 });
  const rotateYSpring = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 240, damping: 22 });

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
    <section id="san-pham" className="py-24 relative overflow-hidden bg-gradient-to-b from-[#FFFDF8] via-[#F8F3E8] to-[#FFFDF8]">
      {/* Nền trang trí hạt ánh sáng */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse,rgba(253,230,138,0.3)_0%,transparent_70%)] -z-10 rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6">
        {/* Tiêu đề & Lời dẫn phân khu */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-accent text-xs md:text-sm font-semibold border border-[#FDE68A] shadow-sm mb-4">
            <Crown className="w-4 h-4 text-accent" />
            <span>{language === "en" ? "King's Tribute Longan Collection" : "Bộ Sưu Tập Long Nhãn Tiến Vua"}</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-primary tracking-tight mb-4">
            {language === "en" 
              ? (cmsContent.ProductsTitle_En || "Artisanal Specialty Products") 
              : (cmsContent.ProductsTitle || "Tinh Hoa Sản Phẩm Nguyệt Nhãn")}
          </h2>
          <p className="text-foreground/80 text-base md:text-lg leading-relaxed">
            {language === "en"
              ? (cmsContent.ProductsSubtitle_En || "Hand-selected Hương Chi longan, traditionally smoked over longan firewood to preserve its golden hue and honeyed fragrance.")
              : (cmsContent.ProductsSubtitle || "Từng cùi nhãn Hương Chi được chọn lọc kỹ lưỡng, sấy củi thủ công giữ trọn sắc vàng óng ánh và hương thơm ngọt ngào trứ danh.")}
          </p>
        </motion.div>

        {/* Thanh Tab chọn sản phẩm - Có hiệu ứng Morphing Pill Indicator qua layoutId */}
        <div className="flex justify-center mb-10 sm:mb-12 px-2">
          <div className="flex sm:inline-flex items-center gap-2 p-1.5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#FDE68A]/60 shadow-lg overflow-x-auto no-scrollbar max-w-full">
            {displayProducts.map((prod, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={prod.id}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setActiveHotspot(null);
                  }}
                  className={`relative px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm md:text-base font-semibold transition-colors duration-200 z-10 flex items-center gap-2 shrink-0 ${
                    isSelected ? "text-white" : "text-foreground/70 hover:text-primary"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeShowcaseTab"
                      className="absolute inset-0 bg-gradient-to-r from-[#B45309] to-[#D97706] rounded-xl shadow-md -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="whitespace-nowrap">{prod.name}</span>
                  <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-secondary text-accent font-bold"}`}>
                    {prod.size}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Khung Showcase Chi Tiết: Chia 2 cột (Hình ảnh tương tác 3D + Thông số bóc tách) */}
        {activeProduct && (
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-6xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl md:rounded-[2.5rem] p-4 sm:p-8 md:p-10 lg:p-12 border border-[#FDE68A]/50 shadow-2xl relative">
            
            {/* Cột Trái (Ảnh 3D Parallax + Hotspot Pins) */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => setActiveHotspot(null)}
                className="relative w-full aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-[#FEF3C7]/40 via-white to-[#FDE68A]/30 border-2 border-white shadow-xl cursor-crosshair group select-none"
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
                  <FastImage
                    src={getProductImage(activeProduct, selectedIndex)}
                    fallbackSrc={["/images/hopnhua.jpg", "/images/tuizip.jpg", "/images/setqua.jpg"][selectedIndex % 3]}
                    alt={activeProduct.name}
                    fill
                    sizes="(max-width: 1024px) 90vw, 600px"
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Vệt sáng quét nhẹ qua ảnh (Sheen effect) */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                  {/* Vòng hào quang nhẹ sau ảnh */}
                  <div className="absolute -inset-4 bg-[radial-gradient(circle,rgba(253,230,138,0.35)_0%,transparent_70%)] -z-10 pointer-events-none" />
                </motion.div>

                {/* Các điểm neo Hotspots tương tác cắm trên ảnh */}
                {PRODUCT_HOTSPOTS.map((spot) => {
                  const isActive = activeHotspot === spot.id;
                  const isRightSide = spot.x > 50;
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
                        className="relative group/pin p-2 outline-none touch-manipulation"
                        aria-label={spot.title}
                      >
                        {/* Vòng xung tỏa ra */}
                        <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />
                        <span className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent text-white shadow-lg border-2 border-white font-bold text-xs transition-transform transform group-hover/pin:scale-110">
                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </span>
                      </button>

                      {/* Tooltip bừng sáng khi active - định vị thông minh trên màn hình nhỏ */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute bottom-full mb-3 w-56 sm:w-64 p-3 sm:p-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#FDE68A] text-left pointer-events-auto z-40 ${
                              isRightSide
                                ? "right-[-24px] sm:left-1/2 sm:-translate-x-1/2 sm:right-auto"
                                : "left-[-24px] sm:left-1/2 sm:-translate-x-1/2"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-accent bg-secondary px-2 py-0.5 rounded-full">
                                {spot.badge}
                              </span>
                              <Info className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-primary leading-tight mb-1">{spot.title}</h4>
                            <p className="text-[11px] sm:text-xs text-foreground/80 leading-relaxed">{spot.desc}</p>
                            {/* Mũi tên tam giác chỉ xuống */}
                            <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Nút xem bộ sưu tập ảnh góc dưới phải */}
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenGallery(activeProduct);
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 bg-black/65 hover:bg-black/85 text-white backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{language === "en" ? "Gallery" : "Xem Ảnh"}</span>
                  </button>
                </div>

                {/* Gợi ý tương tác góc dưới trái - hiện cả trên mobile để người dùng biết chạm */}
                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-foreground/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-medium border border-border/50 shadow-sm pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
                  <span className="hidden sm:inline">Chạm vào điểm tròn để khám phá đặc tính</span>
                  <span className="sm:hidden">Chạm điểm tròn để khám phá</span>
                </div>
              </div>

              {/* Băng ảnh nhỏ danh mục chọn nhanh */}
              <div className="flex items-center gap-2.5 sm:gap-3 mt-4 overflow-x-auto w-full py-1 no-scrollbar">
                {displayProducts.map((prod, idx) => {
                  const isCurrent = idx === selectedIndex;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all shrink-0 ${
                        isCurrent
                          ? "bg-secondary/60 border-accent shadow-sm"
                          : "bg-white/60 border-border/60 hover:bg-white"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden relative border border-border/40 shrink-0">
                        <FastImage
                          src={getProductImage(prod, idx)}
                          fallbackSrc={["/images/hopnhua.jpg", "/images/tuizip.jpg", "/images/setqua.jpg"][idx % 3]}
                          alt={prod.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-primary line-clamp-1">{prod.name}</div>
                        <div className="text-[11px] font-semibold text-accent">{formatPrice(prod.price)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cột Phải (Thông tin chi tiết, Thanh chỉ số cảm quan, Nút mua hàng) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                {/* Quy cách & Tên */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-accent text-xs font-bold tracking-wide uppercase">
                    <Award className="w-3.5 h-3.5" />
                    Đặc Sản Tiến Vua
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full">
                    Quy cách: {activeProduct.size}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-2 sm:mb-3">
                  {activeProduct.name}
                </h3>

                <p className="text-foreground/80 text-xs sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-6">
                  {activeProduct.description}
                </p>

                {/* Giá bán nổi bật */}
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#FFFDF8] border border-[#FDE68A]/70 mb-5 sm:mb-6 shadow-inner">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-accent font-sans">
                    {formatPrice(activeProduct.price)}
                  </div>
                  <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                    (Đã bao gồm VAT & Cam kết 100% tự nhiên)
                  </span>
                </div>

                {/* Bảng chỉ số cảm quan (Sensory Metrics) với thanh tiến trình hoạt họa */}
                <div className="space-y-3 sm:space-y-3.5 mb-6 sm:mb-8">
                  <div className="text-xs font-bold uppercase tracking-wider text-primary/70 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-accent" />
                    <span>Chỉ Số Tinh Túy Cảm Quan</span>
                  </div>

                  {PRODUCT_METRICS.map((metric, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground/85">
                          {language === "en" ? metric.labelEn : metric.label}
                        </span>
                        <span className="font-bold text-primary">{metric.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary/60 rounded-full overflow-hidden p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${metric.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: idx * 0.15, ease: EASE_OUT_EXPO }}
                          className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cam kết chất lượng 4 điểm */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 py-3 sm:py-4 border-t border-b border-border/50 mb-5 sm:mb-6 text-[11px] sm:text-xs text-foreground/80">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                    <span>Sấy củi nhãn thủ công</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                    <span>Không đường hóa học</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                    <span>Không xông lưu huỳnh</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                    <span>Giao hàng toàn quốc</span>
                  </div>
                </div>
              </div>

              {/* Nút hành động Mua Ngay */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onOrderProduct(activeProduct.id)}
                  className="flex-1 bg-gradient-to-r from-[#B45309] to-[#D97706] hover:from-[#92400E] hover:to-[#B45309] text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-[#B45309]/25 flex items-center justify-center gap-2.5 transition-all text-base cursor-pointer"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{language === "en" ? "Order This Product" : "Đặt Mua Sản Phẩm Này"}</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
