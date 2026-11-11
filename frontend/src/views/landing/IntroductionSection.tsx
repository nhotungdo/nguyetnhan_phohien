"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle, Leaf, Flame, ShieldCheck } from "lucide-react";
import { fadeUp, staggerContainer } from "@/components/LandingMotion";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";

export function IntroductionSection() {
  const prefersReducedMotion = useReducedMotion();
  const { t, language } = useLanguageStore();
  const { content: cmsContent } = useWebsiteContent();

  return (
    <section
      id="gioi-thieu"
      className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-[#FCFBF7] via-white to-amber-50/20 relative overflow-hidden w-full max-w-full [contain:paint]"
    >
      {/* Hào quang nền dịu nhẹ tôn lên phong vị truyền thống */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 w-[420px] max-w-full h-[420px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 10% 10%, rgba(254, 243, 199, 0.45) 0%, rgba(253, 230, 138, 0.15) 45%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-[420px] max-w-full h-[420px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 90% 90%, rgba(254, 243, 199, 0.35) 0%, rgba(253, 230, 138, 0.12) 45%, transparent 70%)",
        }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10 w-full max-w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center space-y-5"
        >
          {/* Huy hiệu di sản */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#F4EFE6] border border-[#E8DFC8] text-primary text-xs sm:text-sm font-semibold shadow-xs">
            <span>{language === "en" ? "Hung Yen Royal Delicacy" : "Di Sản Phẩm Vật Tiến Vua"}</span>
          </div>

          {/* Tiêu đề chính thức */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary tracking-tight leading-tight [text-wrap:balance]">
            {language === "en" ? t.about.title : cmsContent.AboutTitle || t.about.title}
          </h2>

          {/* Vạch hoa văn phân cách hoàng gia đối xứng */}
          <div className="flex items-center justify-center gap-3 py-1" aria-hidden="true">
            <span className="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent via-[#A4723E] to-[#D97706]" />
            <span className="w-2 h-2 rotate-45 bg-[#A4723E] rounded-xs shadow-xs" />
            <span className="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent via-[#A4723E] to-[#D97706]" />
          </div>

          {/* Đoạn văn giới thiệu thương hiệu */}
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto font-normal [text-wrap:pretty]">
            {language === "en" ? t.about.desc : cmsContent.AboutDescription || t.about.desc}
          </p>

          {/* 3 Thẻ bảo chứng chất lượng & nguồn gốc */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-3 text-xs sm:text-sm font-medium text-stone-700">
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8DFC8] shadow-xs">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <span>{language === "en" ? "100% Ancient Orchard" : "Nhãn Lồng Hương Chi Cổ Thụ"}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8DFC8] shadow-xs">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <span>{language === "en" ? "Convection Heat Drying" : "Sấy Đối Lưu Khép Kín"}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8DFC8] shadow-xs">
              <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              <span>{language === "en" ? "No Additives • Pure" : "Chuẩn Vị • Không Phụ Gia"}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid md:grid-cols-3 gap-8 mt-16 sm:mt-20 items-stretch"
        >
          {[
            { title: t.about.natural_title, desc: t.about.natural_desc, icon: Leaf },
            { title: t.about.traditional_title, desc: t.about.traditional_desc, icon: Flame },
            { title: t.about.safe_title, desc: t.about.safe_desc, icon: ShieldCheck },
          ].map((val, i) => {
            const CardIcon = val.icon;
            return (
              <motion.div
                variants={fadeUp}
                whileHover={prefersReducedMotion ? undefined : { y: -8 }}
                key={i}
                className="relative overflow-hidden bg-white p-7 sm:p-8 rounded-3xl border border-[#E8DFC8] hover:border-primary/50 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between h-full"
              >
                <div
                  aria-hidden="true"
                  className="absolute right-0 top-0 w-36 h-36 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: "radial-gradient(circle at 80% 20%, rgba(243, 212, 152, 0.45) 0%, transparent 70%)",
                  }}
                />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#F4EFE6] text-accent flex items-center justify-center">
                      <CardIcon className="w-6 h-6 text-primary" strokeWidth={2.2} />
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#F4EFE6] text-primary border border-[#E8DFC8]">
                      {language === "en" ? `Value 0${i + 1}` : `Giá Trị 0${i + 1}`}
                    </span>
                  </div>

                  <h3 className="relative text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors [text-wrap:balance] min-h-[3.25rem] flex items-center">
                    {val.title}
                  </h3>
                  <p className="relative text-stone-600 leading-relaxed text-base [text-wrap:pretty]">
                    {val.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default IntroductionSection;
