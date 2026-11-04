"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Play, Sparkles, Film, ExternalLink } from "lucide-react";
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
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const [isPlaying, setIsPlaying] = useState(false);

  // Thumbnail độ phân giải cao từ YouTube kèm fallback sang ảnh poster của thương hiệu
  const ytThumbnail = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  const [activeThumb, setActiveThumb] = useState(ytThumbnail);

  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <section
      id="thuoc-phim"
      ref={containerRef}
      className="py-20 sm:py-28 bg-[#181109] text-amber-50 relative overflow-hidden w-full max-w-full"
    >
      {/* Hiệu ứng ánh sáng hoàng kim nền */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-amber-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-5xl">
        {/* Tiêu đề & Giới thiệu Thước Phim */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-4 mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide shadow-xs">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === "en" ? "Heritage Documentary Film" : "Thước Phim Ký Sự Di Sản"}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-amber-100 tracking-tight leading-tight [text-wrap:balance]">
            {language === "en" ? "First is Kinh Ky, Second is Pho Hien" : "Thứ Nhất Kinh Kỳ, Thứ Nhì Phố Hiến"}
          </h2>

          <p className="text-sm sm:text-base text-amber-200/80 max-w-2xl mx-auto leading-relaxed [text-wrap:pretty]">
            {language === "en"
              ? "Immerse yourself in the bustling memory of the ancient Pho Hien trading port and the centuries-old heritage of Hung Yen royal tribute longan."
              : "Ngược dòng lịch sử về với thương cảng Phố Hiến sầm uất bậc nhất xứ Đàng Ngoài, nơi đất thiêng kết tinh phù sa sông Hồng để sản sinh thức quả tiến vua nức tiếng."}
          </p>
        </motion.div>

        {/* Khung Chiếu Phim Cinema 16:9 Cao Cấp */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl shadow-black/80 bg-black group"
        >
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            {/* Khi đã bấm Play: Nhúng YouTube Iframe mượt mà với autoplay */}
            {isPlaying ? (
              <iframe
                src={embedUrl}
                title="Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến - Nguyệt Nhãn Phố Hiến"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              /* Poster Bìa khi chưa bấm phát (YouTube Facade - Tối ưu 100% tốc độ tải trang) */
              <div
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 bg-stone-950/60 backdrop-blur-[1px] cursor-pointer flex flex-col items-center justify-center z-20 transition-all hover:bg-stone-950/40 select-none"
              >
                {/* Ảnh nền bìa */}
                <div className="absolute inset-0 -z-10 opacity-60">
                  <FastImage
                    src={activeThumb}
                    alt="Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến"
                    fill
                    className="object-cover"
                    onError={() => {
                      if (activeThumb !== posterUrl) {
                        setActiveThumb(posterUrl);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                {/* Nút Play Hoàng Gia có sóng lan tỏa */}
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-amber-500/30 animate-ping" />
                  <span className="absolute w-20 h-20 sm:w-26 sm:h-26 rounded-full bg-amber-500/20 animate-pulse" />
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-stone-950 flex items-center justify-center shadow-2xl shadow-amber-500/50 group-hover:scale-110 transition-transform duration-300">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-stone-950 ml-1" />
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 text-center px-4 space-y-1.5">
                  <span className="inline-block text-xs sm:text-sm font-bold text-amber-200 tracking-wider uppercase bg-black/75 px-4 sm:px-5 py-1.5 rounded-full border border-amber-400/50 backdrop-blur-md shadow-md">
                    {language === "en" ? "Click to Watch Film" : "Nhấn để xem thước phim"}
                  </span>
                  <p className="text-[11px] sm:text-xs text-amber-300/80 font-medium">
                    {language === "en" ? "Full HD · YouTube 1080p" : "Chất lượng Full HD · Âm thanh sống động"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Trích dẫn ca dao Phố Hiến & Link xem trên YouTube */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-amber-950/50 border border-amber-500/25 text-xs sm:text-sm text-amber-200/90 shadow-md"
        >
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 hidden sm:block" />
            <p className="italic leading-relaxed">
              &ldquo;Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến — Đất cổ danh vang, lưu giữ vẹn nguyên hương vị tiến vua.&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://youtu.be/${youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 hover:text-white bg-amber-900/60 hover:bg-amber-900 px-3 py-1.5 rounded-full border border-amber-500/40 transition-colors"
            >
              <span>Xem trên YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
