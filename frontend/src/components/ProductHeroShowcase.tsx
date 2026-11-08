"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FastImage } from "@/components/FastImage";
import { ShoppingBag, ArrowRight } from "lucide-react";

interface ProductHeroShowcaseProps {
  bannerUrl?: string;
  language?: "vi" | "en";
  onExploreClick?: () => void;
}

export function ProductHeroShowcase({
  bannerUrl,
  language = "vi",
  onExploreClick,
}: ProductHeroShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
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
        onClick={onExploreClick}
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
                  rotateY: [-2.5, 2.5, -2.5],
                  rotateX: [-1.8, 1.8, -1.8],
                  y: [0, -6, 0],
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

          {/* Layer 1: Image Frame Container - 100% PURE & CLEAN (NO ICONS ON PHOTO) */}
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

            {/* Subtle Vignette Gradient for Depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/15 pointer-events-none" />

            {/* Layer 2: Dynamic Holographic Sunlight Sheen */}
            <motion.div
              style={{
                left: sheenLeft,
                top: sheenTop,
                transform: "translate(-50%, -50%) translateZ(45px)",
              }}
              className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full pointer-events-none mix-blend-overlay opacity-60 group-hover:opacity-90 transition-opacity blur-xl"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-r from-amber-200/50 via-white/70 to-amber-300/40" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* High-Conversion Caption & Instant Buy Button Below Card */}
      <figcaption className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600 px-1">
        <div>
          <p className="font-bold text-sm text-primary leading-tight">
            Nguyệt Nhãn Phố Hiến
          </p>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {language === "en"
              ? "Royal Heritage Collection • Touch or hover to rotate in 3D"
              : "Bộ Sưu Tập Tiến Vua • Rê chuột hoặc chạm để xoay 3D"}
          </p>
        </div>

        <button
          type="button"
          onClick={onExploreClick}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#B45309] to-[#D97706] hover:from-[#92400E] hover:to-[#B45309] text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300/40"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-amber-200" />
          <span>{language === "en" ? "Explore & Buy" : "Khám Phá & Mua Ngay"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </figcaption>
    </figure>
  );
}
