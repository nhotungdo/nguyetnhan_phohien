"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, ArrowRight, Flame, Leaf, Award } from "lucide-react";
import { FastImage } from "@/components/FastImage";

interface ProductHeroShowcaseProps {
  bannerUrl?: string;
  onExploreClick?: () => void;
}

export function ProductHeroShowcase({ bannerUrl, onExploreClick }: ProductHeroShowcaseProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  const imageSrc = bannerUrl || "/images/setqua.jpg";

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-lg aspect-square flex items-center justify-center select-none"
      style={{ perspective: 1200 }}
    >
      {/* Vòng tròn hào quang xoay chậm phía sau */}
      <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#FDE68A]/70 via-[#FEF3C7]/90 to-[#D5B477]/50 shadow-2xl blur-sm flex items-center justify-center overflow-hidden animate-[spin_90s_linear_infinite] -z-10">
        <div className="absolute inset-4 border border-[#B45309]/20 rounded-full border-dashed" />
      </div>

      {/* Quầng sáng vàng hổ phách thở nhẹ (Pulsing Amber Glow) */}
      <div className="absolute -inset-6 rounded-full bg-[#FDE68A]/40 blur-3xl animate-pulse -z-20 pointer-events-none" />

      {/* Thẻ ảnh 3D Parallax chính */}
      <motion.div
        className="relative w-[85%] aspect-[4/5] rounded-[2.5rem] bg-white p-3 shadow-2xl border-4 border-white overflow-hidden cursor-pointer"
        animate={{
          rotateX: prefersReducedMotion ? 0 : isHovered ? -mousePos.y * 16 : 3,
          rotateY: prefersReducedMotion ? 0 : isHovered ? mousePos.x * 16 : -4,
          scale: isHovered ? 1.03 : 1,
        }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        onClick={onExploreClick}
      >
        <div className="relative w-full h-full rounded-[2rem] overflow-hidden bg-[#FFFDF8]">
          <FastImage
            src={imageSrc}
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
        animate={prefersReducedMotion ? {} : { y: [-6, 6, -6] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
        className="absolute -top-3 -left-4 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-[#FDE68A] flex items-center gap-2.5 pointer-events-none"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-sm">
          <Award className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Truyền thống</div>
          <div className="text-xs font-bold text-primary">Đặc Sản Tiến Vua</div>
        </div>
      </motion.div>

      {/* Huy hiệu nổi 2: 100% Tự Nhiên (Góc dưới trái) */}
      <motion.div
        animate={prefersReducedMotion ? {} : { y: [6, -6, 6] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity, delay: 0.8 }}
        className="absolute -bottom-4 -left-2 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-[#FDE68A] flex items-center gap-2.5 pointer-events-none"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
          <Leaf className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Cam kết</div>
          <div className="text-xs font-bold text-primary">100% Tự Nhiên</div>
        </div>
      </motion.div>

      {/* Huy hiệu nổi 3: Sấy củi 36h (Góc phải giữa) */}
      <motion.div
        animate={prefersReducedMotion ? {} : { y: [-5, 5, -5] }}
        transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity, delay: 1.4 }}
        className="absolute -right-4 top-1/3 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-[#FDE68A] flex items-center gap-2.5 pointer-events-none"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
          <Flame className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-muted-foreground">Thủ công</div>
          <div className="text-xs font-bold text-primary">Sấy Củi Nhãn 36h</div>
        </div>
      </motion.div>
    </div>
  );
}
