"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Play, Film, ExternalLink, Clock, Landmark, Trees, Flame, ArrowRight } from "lucide-react";
import { FastImage } from "@/components/FastImage";

interface HeritageVideoSectionProps {
  language?: "vi" | "en";
  posterUrl?: string;
  youtubeId?: string;
}

export function HeritageVideoSection({
  language = "vi",
  posterUrl = "/images/setqua.jpg",
  youtubeId = "X8e-QWaVGQk",
}: HeritageVideoSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.15 });
  const [isPlaying, setIsPlaying] = useState(false);

  // Thumbnail YouTube HD với fallback sang ảnh sản phẩm
  const ytThumbnail = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  const [activeThumb, setActiveThumb] = useState(ytThumbnail);

  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  // 3 Điểm nhấn lịch sử trong thước phim
  const highlights = [
    {
      icon: Landmark,
      tag: language === "en" ? "16th - 17th Century" : "Thế Kỷ 16 - 17",
      title: language === "en" ? "Legendary Trading Port" : "Thương Cảng Đệ Nhị",
      desc: language === "en" 
        ? "Pho Hien was the most bustling international trading hub of Dang Ngoai, connecting Asian and European merchants."
        : "Nơi tàu buôn tấp nập của thương nhân Á - Âu, làm nên danh xưng bất hủ 'Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến'.",
    },
    {
      icon: Trees,
      tag: language === "en" ? "300+ Years Monument" : "Chứng Tích 300+ Năm",
      title: language === "en" ? "The Heritage Mother Tree" : "Cây Nhãn Tổ Chùa Hiến",
      desc: language === "en"
        ? "The living ancestor tree at Hien Pagoda, origin of the legendary thick-pulled, sweet honeyed royal longan."
        : "Cây nhãn tổ linh thiêng tại Chùa Hiến, nơi cội nguồn sinh ra giống nhãn lồng cùi dày mọng mật trứ danh.",
    },
    {
      icon: Flame,
      tag: language === "en" ? "Royal Artisanal Craft" : "Tuyệt Kỹ Cung Đình",
      title: language === "en" ? "Tribute to the King" : "Thức Quả Tiến Vua",
      desc: language === "en"
        ? "Crafted with meticulous convection drying to preserve translucent amber color and natural sweetness."
        : "Quy trình sấy nhiệt nóng đối lưu tuần hoàn khí, lưu giữ sắc vàng hổ phách và vị ngọt thanh quý giá.",
    },
  ];

  return (
    <section
      id="thuoc-phim"
      ref={containerRef}
      className="relative py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-[#180C06] via-[#211008] to-[#150904] text-amber-50 overflow-hidden w-full max-w-full"
    >
      {/* 1. Hiệu ứng ánh sáng nền rạp chiếu phim (Cinema Ambient Light) */}
      <div 
        aria-hidden 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] md:w-[850px] h-[350px] sm:h-[500px] bg-gradient-to-tr from-amber-600/20 via-yellow-600/15 to-transparent rounded-full blur-[120px] sm:blur-[160px] pointer-events-none" 
      />
      <div 
        aria-hidden 
        className="absolute bottom-10 left-1/4 w-[280px] sm:w-[450px] h-[280px] sm:h-[450px] bg-amber-700/10 rounded-full blur-[130px] pointer-events-none" 
      />

      {/* Đường chỉ vàng ngăn cách thanh lịch */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
        {/* 2. Tiêu đề phong cách Hoàng gia Di sản */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 mb-10 sm:mb-16"
        >
          {/* Huy hiệu ký sự */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/15 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Film className="w-4 h-4 text-amber-400" />
            <span className="uppercase tracking-widest text-[11px] sm:text-xs">
              {language === "en" ? "Heritage Documentary Archive" : "Tư Liệu Ký Sự Di Sản"}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          </div>

          {/* Tiêu đề chính */}
          <h2 className="text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.18] [text-wrap:balance]">
            <span className="bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 bg-clip-text text-transparent drop-shadow-sm">
              {language === "en" ? "First is Kinh Ky, Second is Pho Hien" : "Thứ Nhất Kinh Kỳ, Thứ Nhì Phố Hiến"}
            </span>
          </h2>

          {/* Đoạn dẫn dắt */}
          <p className="text-sm sm:text-base md:text-lg text-amber-200/80 max-w-3xl mx-auto leading-relaxed [text-wrap:pretty] font-normal">
            {language === "en"
              ? "Follow the historical footsteps back to the 16th century, exploring the legendary port along the Red River where nature, culture, and artisanal devotion gave birth to the royal tribute longan."
              : "Ngược dòng thời gian về thế kỷ 16, ghé thăm đô thị cổ sầm uất ven bờ sông Hồng bồi đắp phù sa — Nơi đất thiêng hội tụ để hun đúc nên linh hồn thức quả tiến vua lưu truyền trăm năm."}
          </p>
        </motion.div>

        {/* 3. Khung Chiếu Phim Độc Bản (Bespoke Cinema Screen) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto max-w-5xl"
        >
          {/* Viền hào quang vàng tỏa rộng quanh khung video */}
          <div 
            aria-hidden 
            className="absolute -inset-1.5 sm:-inset-2 rounded-[28px] sm:rounded-[38px] bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-600/30 blur-xl opacity-75 group-hover:opacity-100 transition-opacity pointer-events-none" 
          />

          {/* Khung viền kép kim loại sang trọng */}
          <div className="relative p-2 sm:p-3.5 rounded-[24px] sm:rounded-[36px] bg-gradient-to-b from-amber-500/30 via-amber-900/30 to-black/80 border border-amber-400/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="relative aspect-video w-full rounded-[18px] sm:rounded-[28px] overflow-hidden bg-black shadow-inner">
              {isPlaying ? (
                /* Trình phát YouTube chuẩn 1080p tự động kích hoạt */
                <iframe
                  src={embedUrl}
                  title="Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến - Nguyệt Nhãn Phố Hiến"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                /* Bìa Phim Hoàng Gia Tương Tác (Cinema Facade Cover) */
                <div
                  onClick={() => setIsPlaying(true)}
                  className="group relative w-full h-full cursor-pointer overflow-hidden flex flex-col justify-between p-4 sm:p-8 select-none"
                >
                  {/* Ảnh nền bìa video sắc nét */}
                  <div className="absolute inset-0 -z-10 transition-transform duration-700 ease-out group-hover:scale-105">
                    <FastImage
                      src={activeThumb}
                      alt="Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến"
                      fill
                      sizes="(max-width: 768px) 100vw, 1100px"
                      className="object-cover"
                      onError={() => {
                        if (activeThumb !== posterUrl) {
                          setActiveThumb(posterUrl);
                        }
                      }}
                    />
                    {/* Lớp gradient điện ảnh tạo chiều sâu ánh sáng */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/30" />
                    <div className="absolute inset-0 bg-radial-[circle_at_center] from-transparent via-black/20 to-black/60" />
                  </div>

                  {/* Thanh Header bên trong Video */}
                  <div className="flex items-center justify-between w-full relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/30 text-amber-200 text-xs font-semibold shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>HD 1080p</span>
                      <span className="text-white/40">•</span>
                      <span className="text-amber-300 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 14:24
                      </span>
                    </div>

                    <span className="hidden sm:inline-flex items-center text-xs text-amber-200/90 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 font-medium">
                      Nguyệt Nhãn Phố Hiến
                    </span>
                  </div>

                  {/* Nút Play Hoàng Gia Chính Giữa (Royal Seal Play Button) */}
                  <div className="relative flex flex-col items-center justify-center my-auto py-4">
                    {/* Vòng hào quang xung quanh */}
                    <div className="relative flex items-center justify-center">
                      <span className="absolute w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-amber-500/25 animate-ping duration-1000" />
                      <span className="absolute w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-amber-400/20 animate-pulse" />
                      
                      {/* Nút chính mô phỏng huy hiệu đồng đúc */}
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-[#92400E] via-[#D97706] to-[#FDE68A] p-0.5 shadow-[0_10px_35px_rgba(217,119,6,0.6)] group-hover:scale-110 group-hover:shadow-[0_15px_45px_rgba(245,158,11,0.8)] transition-all duration-300">
                        <div className="w-full h-full rounded-full bg-gradient-to-b from-[#78350F] to-[#451A03] flex items-center justify-center border border-amber-300/60">
                          <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 fill-amber-200 text-amber-200 ml-1 transition-transform group-hover:scale-110" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-6 text-center space-y-1">
                      <span className="inline-block text-xs sm:text-sm font-bold text-amber-100 uppercase tracking-widest bg-black/75 px-5 py-1.5 rounded-full border border-amber-400/50 backdrop-blur-md shadow-md group-hover:border-amber-300 group-hover:text-amber-200 transition-colors">
                        {language === "en" ? "Watch Heritage Film" : "Khởi Chiếu Thước Phim"}
                      </span>
                      <p className="text-[11px] sm:text-xs text-amber-300/70 font-medium">
                        {language === "en" ? "Original Sound · Cinematic Colors" : "Âm thanh nguyên bản · Tư liệu lịch sử trọn vẹn"}
                      </p>
                    </div>
                  </div>

                  {/* Thanh Footer bên trong video */}
                  <div className="flex items-center justify-between text-xs text-amber-200/80 relative z-10 pt-2 border-t border-white/10">
                    <span className="font-medium text-[11px] sm:text-xs tracking-wide">
                      {language === "en" ? "Documentary Series on Pho Hien Culture" : "Tài liệu chuyên đề: Đất & Người Phố Hiến"}
                    </span>
                    <span className="text-[11px] sm:text-xs text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {language === "en" ? "Play Video" : "Xem ngay"} <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* 4. Ba Điểm Nhấn Tinh Hoa Trong Thước Phim (3 Heritage Chapters) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
        >
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative group p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-amber-950/40 to-black/50 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-black/40"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:bg-amber-500/25 group-hover:scale-105 transition-all">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block">
                      {item.tag}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-amber-100 group-hover:text-amber-200 transition-colors">
                      {item.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-amber-200/70 leading-relaxed [text-wrap:pretty]">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* 5. Khung Thư Pháp Ca Dao Cổ & Link YouTube */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-8 sm:mt-10 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-950/60 via-[#2A140A]/70 to-amber-950/60 border border-amber-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left"
        >
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 block text-center sm:text-left">
              {language === "en" ? "Timeless Folk Heritage" : "Ca Dao Cổ Phố Hiến"}
            </span>
            <p 
              style={{ fontFamily: "var(--font-dancing)" }}
              className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-100 tracking-wide"
            >
              &ldquo;Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến&rdquo;
            </p>
            <p className="text-xs text-amber-200/75 italic">
              {language === "en" 
                ? "Preserving the authentic royal tribute taste through centuries of Vietnamese culture."
                : "Lưu truyền nguyên vẹn tinh túy ngự phẩm tiến vua qua ngàn năm văn hiến."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://youtu.be/${youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-200 px-5 py-2.5 rounded-full shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Xem trên YouTube</span>
              <ExternalLink className="w-4 h-4 text-stone-950" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
