"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { Crown, ArrowRight, Flame, Leaf, Award } from "lucide-react";
import { FastImage } from "@/components/FastImage";

interface ProductHeroShowcaseProps {
  bannerUrl?: string;
  onExploreClick?: () => void;
}

export function ProductHeroShowcase({ bannerUrl, onExploreClick }: ProductHeroShowcaseProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  // Tự động fallback sang /images/setqua.jpg nếu bannerUrl từ CMS bị 404 hoặc mất file trên server
  const heroImage = bannerUrl || "/images/setqua.jpg";

  // Dùng useMotionValue thay cho useState để cập nhật GPU transform trực tiếp mà KHÔNG gây re-render component
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateXSpring = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 220, damping: 22 });
  const rotateYSpring = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 220, damping: 22 });

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

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-lg aspect-square flex items-center justify-center select-none"
      style={{ perspective: 1200 }}
    >
      {/* Vòng tròn hào quang xoay chậm phía sau */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#FDE68A]/70 via-[#FEF3C7]/90 to-[#D5B477]/50 shadow-2xl blur-sm flex items-center justify-center overflow-hidden animate-[spin_90s_linear_infinite] -z-10">
        <div className="absolute inset-4 border border-[#B45309]/20 rounded-full border-dashed" />
      </div>

      {/* Quầng sáng vàng hổ phách thở nhẹ (Pulsing Amber Glow) dùng radial gradient thay vì blur-3xl */}
      <div className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(253,230,138,0.4)_0%,rgba(253,230,138,0)_70%)] animate-pulse -z-20 pointer-events-none" />

      {/* Thẻ ảnh 3D Parallax chính */}
      <motion.div
        className="relative w-[85%] aspect-[4/5] rounded-[2.5rem] bg-white p-3 shadow-2xl border-4 border-white overflow-hidden cursor-pointer will-change-transform"
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateXSpring,
          rotateY: prefersReducedMotion ? 0 : rotateYSpring,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        onClick={onExploreClick}
      >
        <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-[#FFFDF8]">
          <FastImage
            src={heroImage}
            fallbackSrc="/images/setqua.jpg"
            alt="Nguyệt Nhãn Phố Hiến - Long nhãn tiến vua"
            fill
            priority
            sizes="(max-width: 768px) 90vw, 500px"
            className="object-cover transition-transform duration-700 hover:scale-105"
          />

          {/* Dải gradient che nhẹ chân ảnh để tăng độ tương phản */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

          {/* Vệt ánh kim lướt qua định kỳ */}
          <span aria-hidden className="sheen absolute inset-0 z-20 pointer-events-none" />

          {/* Nhãn sản phẩm ép kim nổi ở góc dưới */}
          <div className="absolute bottom-5 left-5 right-5 z-20 flex items-center justify-between text-white drop-shadow-md">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#FDE68A] flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                Ngự Phẩm Hoàng Gia
              </div>
              <div className="text-base font-bold">Nguyệt Nhãn Phố Hiến</div>
            </div>
            <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
              <ArrowRight className="w-4 h-4 text-white" />
            </span>
          </div>
        </div>
      </motion.div>

      {/* Huy hiệu nổi 1: Đặc sản tiến vua (Góc trên trái) */}
      <motion.div
        animate={prefersReducedMotion ? {} : { y: [-5, 5, -5] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
        className="absolute top-0 sm:-top-3 left-1 sm:-left-4 z-30 bg-white px-2.5 py-1 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-xl border border-[#FDE68A] flex items-center gap-1.5 sm:gap-2.5 pointer-events-none scale-85 sm:scale-100 origin-top-left"
      >
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-sm shrink-0">
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div>
          <div className="text-[10px] sm:text-xs uppercase font-bold text-stone-600 leading-tight">Truyền thống</div>
          <div className="text-[11px] sm:text-sm font-bold text-primary leading-tight">Đặc Sản Tiến Vua</div>
        </div>
      </motion.div>

      {/* Huy hiệu nổi 2: 100% Tự Nhiên (Góc dưới trái) */}
      <motion.div
        animate={prefersReducedMotion ? {} : { y: [5, -5, 5] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, delay: 0.8 }}
        className="absolute bottom-1 sm:-bottom-4 left-1 sm:-left-2 z-30 bg-white px-2.5 py-1 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-xl border border-[#FDE68A] flex items-center gap-1.5 sm:gap-2.5 pointer-events-none scale-85 sm:scale-100 origin-bottom-left"
      >
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shrink-0">
          <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div>
          <div className="text-[10px] sm:text-xs uppercase font-bold text-stone-600 leading-tight">Cam kết</div>
          <div className="text-[11px] sm:text-sm font-bold text-primary leading-tight">100% Tự Nhiên</div>
        </div>
      </motion.div>

      {/* Huy hiệu nổi 3: Sấy nhiệt nóng (sấy đối lưu) (Góc phải giữa - chỉ hiện trên tablet/desktop tránh tràn mép mobile) */}
      <motion.div
        animate={prefersReducedMotion ? {} : { y: [-4, 4, -4] }}
        transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity, delay: 1.4 }}
        className="hidden sm:flex absolute right-1 sm:-right-4 top-1/3 z-30 bg-white px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-xl border border-[#FDE68A] items-center gap-2 sm:gap-2.5 pointer-events-none scale-90 sm:scale-100 origin-right"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
          <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div>
          <div className="text-xs uppercase font-bold text-stone-600 leading-tight">Phương pháp</div>
          <div className="text-xs sm:text-sm font-bold text-primary leading-tight">Sấy Nhiệt Nóng (Đối Lưu)</div>
        </div>
      </motion.div>
    </div>
  );
}
