"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FastImage } from "@/components/FastImage";
import {
  ShoppingBag,
  Star,
  Sparkles,
  ShieldCheck,
  Rotate3d,
  ArrowRight,
  Flame,
  CheckCircle2,
  Info,
  X
} from "lucide-react";

interface ProductHeroShowcaseProps {
  bannerUrl?: string;
  language?: "vi" | "en";
  onExploreClick?: () => void;
}

interface HotspotItem {
  id: string;
  top: string;
  left: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  tagVi: string;
  tagEn: string;
}

const PRODUCT_HOTSPOTS: HotspotItem[] = [
  {
    id: "tui-zip",
    top: "54%",
    left: "41%",
    titleVi: "Túi Zip Trân Châu Tứ Dã",
    titleEn: "Tran Chau Tu Da Pouch",
    descVi: "150g Long Nhãn sấy đối lưu vàng ươm, dẻo ngọt tự nhiên, tiện mang theo.",
    descEn: "150g convection-dried golden longan, naturally sweet & tender.",
    tagVi: "Tiện Lợi • 150g",
    tagEn: "Travel-friendly • 150g",
  },
  {
    id: "hop-qua",
    top: "65%",
    left: "58%",
    titleVi: "Hộp Lễ Vọng Nguyệt Quai Tre",
    titleEn: "Vong Nguyet Luxury Bamboo Box",
    descVi: "Hộp quà thủ công dệt lụa đỏ son, quai tre nguyên khối chuẩn tiến vua.",
    descEn: "Artisan crimson red gift hamper with authentic handcrafted bamboo handle.",
    tagVi: "Set Quà Hoàng Gia",
    tagEn: "Royal Heritage Set",
  },
  {
    id: "hu-nhua",
    top: "48%",
    left: "77%",
    titleVi: "Hũ Ngự Thiện Tiến Vua",
    titleEn: "Ngu Thien Royal Jar",
    descVi: "Hũ kín khí nắp vân gỗ tự nhiên, kết hợp hoàn hảo cùng hạt dinh dưỡng.",
    descEn: "Airtight canister with natural wood lid, ideal with premium nuts.",
    tagVi: "Thượng Hạng • 500g",
    tagEn: "Signature • 500g",
  },
];

export function ProductHeroShowcase({
  bannerUrl,
  language = "vi",
  onExploreClick,
}: ProductHeroShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<HotspotItem | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(
      "ontouchstart" in window || navigator.maxTouchPoints > 0
    );
  }, []);

  // Motion values for smooth 3D tilting
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for silky, weighted 3D tilt
  const springConfig = { damping: 22, stiffness: 260, mass: 0.6 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-14, 14]), springConfig);

  // Dynamic specular lighting position
  const sheenLeft = useTransform(mouseX, [-0.5, 0.5], ["15%", "85%"]);
  const sheenTop = useTransform(mouseY, [-0.5, 0.5], ["15%", "85%"]);

  // Dynamic shadow displacement based on tilt
  const shadowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [18, -18]), springConfig);
  const shadowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [26, 8]), springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
    setIsHovered(true);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || !e.touches[0]) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(-0.5, Math.min(0.5, (touch.clientX - rect.left) / rect.width - 0.5));
    const y = Math.max(-0.5, Math.min(0.5, (touch.clientY - rect.top) / rect.height - 0.5));
    mouseX.set(x);
    mouseY.set(y);
    setIsHovered(true);
  }, [mouseX, mouseY]);

  const handleTouchEnd = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

  const imageSource = bannerUrl || "/images/setqua3.jpg";

  return (
    <figure className="w-full max-w-lg lg:max-w-xl mx-auto select-none">
      {/* 3D Perspective Canvas Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full aspect-[4/3] sm:aspect-[1/1] sm:max-h-[500px] cursor-pointer"
        style={{ perspective: 1200 }}
      >
        {/* Tilting 3D Card */}
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          animate={
            !isHovered && !isTouchDevice
              ? {
                  rotateY: [-2, 2, -2],
                  rotateX: [-1.5, 1.5, -1.5],
                  y: [0, -5, 0],
                }
              : {}
          }
          transition={
            !isHovered && !isTouchDevice
              ? {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : undefined
          }
          className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-visible bg-gradient-to-br from-[#FAF8F5] via-[#F4EFE6] to-[#E8DFC8] border-2 border-[#D97706]/40 p-2 sm:p-2.5 shadow-[0_25px_50px_-12px_rgba(15,62,48,0.25)] transition-shadow duration-300 group"
        >
          {/* Layer 0: Royal Ambient Shadow Effect */}
          <motion.div
            style={{
              x: shadowX,
              y: shadowY,
              transform: "translateZ(-20px)",
            }}
            className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/30 to-amber-900/30 blur-2xl -z-10 pointer-events-none opacity-60 group-hover:opacity-85 transition-opacity"
          />

          {/* Layer 1: Image Frame Container */}
          <div
            className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-900 shadow-inner"
            style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }}
          >
            <FastImage
              src={imageSource}
              fallbackSrc="/images/setqua3.jpg"
              alt="Bộ Sưu Tập Nguyệt Nhãn Phố Hiến"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 600px"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Subtle Vignette Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20 pointer-events-none" />

            {/* Layer 2: Dynamic Holographic Sunlight Sheen */}
            <motion.div
              style={{
                left: sheenLeft,
                top: sheenTop,
                transform: "translate(-50%, -50%) translateZ(45px)",
              }}
              className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full pointer-events-none mix-blend-overlay opacity-60 group-hover:opacity-90 transition-opacity blur-xl"
              style-dynamic="true"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-r from-amber-200/50 via-white/70 to-amber-300/40" />
            </motion.div>

            {/* Layer 3: Floating 3D Badges (Elevated in 3D Space) */}
            {/* Top-Left: Royal Heritage Badge */}
            <div
              style={{ transform: "translateZ(55px)" }}
              className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-[#F3D498]/60 text-white shadow-lg"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#F3D498] flex items-center gap-1">
                <span>👑</span>
                <span>{language === "en" ? "Royal Heritage" : "Đặc Sản Tiến Vua"}</span>
              </span>
            </div>

            {/* Top-Right: Natural Process Badge */}
            <div
              style={{ transform: "translateZ(50px)" }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/75 backdrop-blur-md border border-emerald-400/50 text-white shadow-lg"
            >
              <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold text-emerald-100">
                {language === "en" ? "100% Convection Dried" : "100% Sấy Đối Lưu"}
              </span>
            </div>

            {/* Layer 4: Interactive 3D Product Hotspots */}
            {PRODUCT_HOTSPOTS.map((spot) => {
              const isSelected = activeHotspot?.id === spot.id;
              return (
                <div
                  key={spot.id}
                  style={{
                    top: spot.top,
                    left: spot.left,
                    transform: "translate(-50%, -50%) translateZ(65px)",
                  }}
                  className="absolute z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHotspot(isSelected ? null : spot);
                  }}
                >
                  {/* Beacon Ping */}
                  <div className="relative group/hotspot">
                    <span className="absolute -inset-1.5 rounded-full bg-amber-400/40 animate-ping" />
                    <button
                      type="button"
                      className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-md border-2 ${
                        isSelected
                          ? "bg-amber-400 text-stone-900 border-white scale-110"
                          : "bg-white/90 text-amber-900 border-amber-400 hover:scale-110"
                      }`}
                      aria-label={language === "en" ? spot.titleEn : spot.titleVi}
                    >
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>

                    {/* Desktop Hover / Selected Tooltip */}
                    {(isSelected || isHovered) && (
                      <div
                        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 sm:w-60 p-2.5 rounded-xl bg-stone-900/95 backdrop-blur-md text-white border border-amber-400/50 shadow-2xl transition-all duration-200 z-40 ${
                          isSelected ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover/hotspot:opacity-100 group-hover/hotspot:scale-100 pointer-events-none group-hover/hotspot:pointer-events-auto"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                            {language === "en" ? spot.tagEn : spot.tagVi}
                          </span>
                          {isSelected && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveHotspot(null);
                              }}
                              className="text-stone-400 hover:text-white p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-[#F3D498] leading-tight">
                          {language === "en" ? spot.titleEn : spot.titleVi}
                        </h4>
                        <p className="text-[11px] text-stone-300 leading-snug mt-1">
                          {language === "en" ? spot.descEn : spot.descVi}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Layer 5: High-Conversion Instant Purchase Floating Dock */}
            <div
              style={{ transform: "translateZ(75px)" }}
              className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3.5 sm:left-3.5 sm:right-3.5 z-20"
            >
              <div className="rounded-xl sm:rounded-2xl bg-black/75 backdrop-blur-md p-2.5 sm:p-3 border border-[#F3D498]/40 shadow-xl flex items-center justify-between gap-2 text-white">
                {/* Social Proof & Rating */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 leading-none">
                      <span className="font-bold text-xs sm:text-sm text-white">4.9/5</span>
                      <span className="text-[10px] text-amber-200/90 hidden sm:inline">
                        {language === "en" ? "(1.2k+ reviews)" : "(1.200+ đánh giá)"}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-300 truncate mt-0.5">
                      {language === "en" ? "Authentic Pho Hien Specialty" : "Long Nhãn sấy đối lưu tiến vua"}
                    </p>
                  </div>
                </div>

                {/* Instant Action CTA Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onExploreClick) onExploreClick();
                  }}
                  className="shrink-0 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#B45309] hover:from-[#92400E] hover:to-[#B45309] text-white text-xs sm:text-sm font-extrabold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer border border-amber-300/40 group/btn"
                >
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200 group-hover/btn:scale-110 transition-transform" />
                  <span>{language === "en" ? "Shop Now" : "Mua Ngay"}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Caption with Interactive 3D Guide */}
      <figcaption className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-600 px-1">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-100/80 border border-amber-300/60 flex items-center justify-center text-amber-800">
            <Rotate3d className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <span className="font-medium text-stone-700">
            {language === "en"
              ? "Touch or hover to rotate in 3D & view details"
              : "Rê chuột hoặc chạm để xoay 3D • Khám phá điểm chạm"}
          </span>
        </div>

        <button
          type="button"
          onClick={onExploreClick}
          className="text-primary hover:text-accent font-bold transition-colors cursor-pointer flex items-center gap-1 group/link"
        >
          <span>{language === "en" ? "Explore Full Collection" : "Xem tất cả sản phẩm"}</span>
          <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
        </button>
      </figcaption>
    </figure>
  );
}
