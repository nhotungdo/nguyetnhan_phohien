"use client";

import { ArrowRight } from "lucide-react";
import { FastImage } from "@/components/FastImage";
import { HeritageVideoSection } from "@/components/HeritageVideoSection";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { scrollToSection } from "@/lib/scrollToSection";
import { resolveCmsImage } from "@/lib/cmsImage";

export function StorySection() {
  const { language } = useLanguageStore();
  const { content: cmsContent } = useWebsiteContent();

  return (
    <>
      {/* 7. Khởi nguồn & Câu chuyện di sản */}
      <section
        id="cau-chuyen"
        className="py-12 sm:py-16 lg:py-24 bg-white overflow-hidden w-full max-w-full [contain:paint]"
      >
        <div className="container mx-auto px-4 md:px-6 w-full max-w-full">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 relative">
              <div className="aspect-square rounded-full bg-[radial-gradient(circle,rgba(247,238,221,0.9)_0%,rgba(247,238,221,0)_70%)] absolute -top-10 -left-10 w-full h-full -z-10 opacity-70 pointer-events-none" />
              <div className="w-full aspect-[4/5] rounded-[3rem] bg-[#FDE68A]/30 overflow-hidden relative border-8 border-white shadow-2xl">
                <FastImage
                  src={cmsContent.StoryImage ? resolveCmsImage(cmsContent.StoryImage) : "/images/combo3sp.jpg"}
                  fallbackSrc="/images/combo3sp.jpg"
                  alt={language === "en" ? "Pho Hien Longan Heritage Story" : "Câu chuyện di sản Nguyệt Nhãn Phố Hiến"}
                  fill
                  sizes="(max-width: 768px) 92vw, 45vw"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary [text-wrap:balance] leading-tight">
                {language === "en" ? "Famous Royal Tribute" : cmsContent.StoryTitle || "Thứ Quả Tiến Vua Trứ Danh"}
              </h2>
              <p className="text-base sm:text-lg text-foreground/80 leading-relaxed max-w-2xl [text-wrap:pretty]">
                {language === "en"
                  ? "Legend has it that in the 16th century, a mandarin patrolling through Pho Hien exactly when the longans were ripe tasted the thick, juicy, sweet and fragrant flesh, and immediately brought it back to offer to the king. Since then, Hung Yen longan became an annual royal tribute."
                  : cmsContent.StoryDescription ||
                    "Tương truyền, vào thế kỷ 16, một vị quan đi tuần qua vùng Phố Hiến đúng độ nhãn chín. Nếm thử thấy cùi dày, mọng nước, vị ngọt lịm thơm ngát, liền mang về dâng vua. Từ đó, nhãn lồng Hưng Yên trở thành sản vật tiến vua hàng năm."}
              </p>
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#F4EFE6] via-[#FAF8F5] to-transparent border-l-4 border-accent shadow-2xs">
                <p className="text-foreground/85 italic max-w-xl text-sm sm:text-base leading-relaxed [text-wrap:pretty]">
                  {language === "en"
                    ? '"Pho Hien longan, it is said that its sweetness permeates the alluvium of the Red River, blended with the sun and wind of the delta. For generations, the people here preserve the craft of making longan, as a way to preserve the homeland soul."'
                    : '"Nhãn lồng Phố Hiến, người ta nói vị ngọt của nó thấm cả cái chất phù sa sông Hồng, quyện với nắng gió của vùng châu thổ. Trăm năm nay, người dân nơi đây vẫn giữ cái nghề làm long nhãn, như một cách lưu giữ hồn quê hương."'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => scrollToSection("thuoc-phim")}
                  className="inline-flex items-center gap-2 text-accent font-bold hover:gap-3 transition-all cursor-pointer"
                >
                  {language === "en" ? "Watch documentary film" : "Xem thước phim di sản Phố Hiến"}{" "}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <span className="text-foreground/30 hidden sm:inline">•</span>
                <button
                  onClick={() => scrollToSection("lich-su")}
                  className="inline-flex items-center gap-2 text-foreground/70 hover:text-accent font-medium text-sm transition-colors cursor-pointer"
                >
                  {language === "en" ? "Explore historical timeline" : "Khám phá dòng chảy lịch sử"}{" "}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7.5. Thước phim tài liệu di sản */}
      <SectionErrorBoundary sectionName="Thước phim di sản">
        <HeritageVideoSection
          language={language as "vi" | "en"}
          posterUrl={cmsContent.StoryImage ? resolveCmsImage(cmsContent.StoryImage) : "/images/setqua.jpg"}
        />
      </SectionErrorBoundary>
    </>
  );
}

export default StorySection;
