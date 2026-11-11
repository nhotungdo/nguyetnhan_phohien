"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";
import { EASE_OUT_EXPO, Reveal } from "@/components/LandingMotion";
import { ProductScrollytelling } from "@/components/ProductScrollytelling";
import { ProductPairingSection } from "@/components/ProductPairingSection";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { scrollToSection } from "@/lib/scrollToSection";
import { resolveCmsImage } from "@/lib/cmsImage";

export function HistorySection() {
  const router = useRouter();
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: timelineScroll } = useScroll({
    target: timelineRef,
    offset: ["start 80%", "end 65%"],
  });
  const timelineScaleY = useSpring(timelineScroll, { stiffness: 90, damping: 30, restDelta: 0.001 });

  const { t, language } = useLanguageStore();
  const { content: cmsContent } = useWebsiteContent();

  return (
    <>
      {/* 8. Dòng chảy lịch sử Phố Hiến */}
      <section
        id="lich-su"
        className="py-12 sm:py-16 lg:py-24 bg-background border-t border-border/30 overflow-hidden w-full max-w-full [contain:paint]"
      >
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl w-full max-w-full">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-8 [text-wrap:balance]">
              {t.history.title}
            </h2>
          </Reveal>
          <div
            ref={timelineRef}
            className="relative border-l-2 border-accent pl-6 sm:pl-8 ml-3 sm:ml-4 md:ml-0 md:pl-0 md:border-l-0 text-left md:text-center space-y-8 sm:space-y-12"
          >
            {/* Trục thời gian vẽ dần theo cuộn */}
            <div
              aria-hidden
              className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 h-full w-[2px] bg-[#E8DFC8] rounded-full overflow-hidden"
            >
              <motion.div
                style={{ scaleY: timelineScaleY }}
                className="w-full h-full origin-top bg-gradient-to-b from-accent to-[#D97706]"
              />
            </div>

            <div className="relative md:flex items-center justify-between gap-8">
              <div className="md:w-1/2 text-right hidden md:block">
                <h3 className="text-xl sm:text-2xl font-bold text-accent [text-wrap:balance]">
                  {t.history.c16_title}
                </h3>
                <p className="text-foreground/80 [text-wrap:pretty]">
                  {t.history.c16_desc.split(". ")[0]}.
                </p>
              </div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                className="absolute z-10 -left-[33px] sm:-left-[41px] top-1.5 md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-ml-[8px] w-4 h-4 rounded-full bg-accent ring-4 ring-background"
              />
              <div className="md:w-1/2 md:text-left">
                <h3 className="text-lg sm:text-2xl font-bold text-accent md:hidden [text-wrap:balance]">
                  {t.history.c16_title}
                </h3>
                <p className="text-sm text-foreground/80 md:hidden mb-2 [text-wrap:pretty]">
                  {t.history.c16_desc.split(". ")[0]}.
                </p>
                <div className="bg-white/95 p-3.5 sm:p-4 rounded-xl border border-border/80 text-xs sm:text-sm text-foreground/85 leading-relaxed shadow-2xs [text-wrap:pretty]">
                  {t.history.c16_desc.split(". ")[1]}
                </div>
              </div>
            </div>

            <div className="relative md:flex items-center justify-between gap-8 flex-row-reverse">
              <div className="md:w-1/2 text-left hidden md:block">
                <h3 className="text-xl sm:text-2xl font-bold text-accent [text-wrap:balance]">
                  {t.history.tree_title}
                </h3>
                <p className="text-foreground/80 [text-wrap:pretty]">
                  {language === "en" ? "Historical monument at Hien Pagoda." : "Di tích lịch sử tại Chùa Hiến."}
                </p>
              </div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                className="absolute z-10 -left-[33px] sm:-left-[41px] top-1.5 md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-ml-[8px] w-4 h-4 rounded-full bg-accent ring-4 ring-background"
              />
              <div className="md:w-1/2 md:text-right">
                <h3 className="text-lg sm:text-2xl font-bold text-accent md:hidden [text-wrap:balance]">
                  {t.history.tree_title}
                </h3>
                <p className="text-sm text-foreground/80 md:hidden mb-2 [text-wrap:pretty]">
                  {language === "en" ? "Historical monument at Hien Pagoda." : "Di tích lịch sử tại Chùa Hiến."}
                </p>
                <div className="bg-white/95 p-3.5 sm:p-4 rounded-xl border border-border/80 text-xs sm:text-sm text-foreground/85 leading-relaxed shadow-2xs [text-wrap:pretty]">
                  {t.history.tree_desc}
                </div>
              </div>
            </div>

            <div className="relative md:flex items-center justify-between gap-8">
              <div className="md:w-1/2 text-right hidden md:block">
                <h3 className="text-xl sm:text-2xl font-bold text-accent [text-wrap:balance]">
                  {t.history.year2010_title}
                </h3>
                <p className="text-foreground/80 [text-wrap:pretty]">
                  {t.history.year2010_desc.split(". ")[0]}.
                </p>
              </div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                className="absolute z-10 -left-[33px] sm:-left-[41px] top-1.5 md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-ml-[8px] w-4 h-4 rounded-full bg-accent ring-4 ring-background"
              />
              <div className="md:w-1/2 md:text-left">
                <h3 className="text-lg sm:text-2xl font-bold text-accent md:hidden [text-wrap:balance]">
                  {t.history.year2010_title}
                </h3>
                <p className="text-sm text-foreground/80 md:hidden mb-2 [text-wrap:pretty]">
                  {t.history.year2010_desc.split(". ")[0]}.
                </p>
                <div className="bg-white/95 p-3.5 sm:p-4 rounded-xl border border-border/80 text-xs sm:text-sm text-foreground/85 leading-relaxed shadow-2xs [text-wrap:pretty]">
                  {t.history.year2010_desc.split(". ")[1]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Scrollytelling Hành trình nghệ nhân chế biến long nhãn */}
      <ProductScrollytelling language={language as "vi" | "en"} />

      {/* 10. Văn hóa ẩm thực Phố Hiến & Thưởng thức đúng điệu */}
      <ProductPairingSection
        language={language as "vi" | "en"}
        cultureImage={cmsContent.CultureImage ? resolveCmsImage(cmsContent.CultureImage) : undefined}
        onOrderClick={() => {
          const el = document.getElementById("dat-hang");
          if (el) {
            scrollToSection("dat-hang");
          } else {
            router.push("/san-pham#dat-hang");
          }
        }}
      />
    </>
  );
}

export default HistorySection;
