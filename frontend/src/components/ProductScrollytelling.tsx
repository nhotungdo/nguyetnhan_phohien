"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";
import { Trees, Scissors, Flame, Crown, CheckCircle2 } from "lucide-react";
import { EASE_OUT_EXPO } from "@/components/LandingMotion";

interface StepItem {
  step: string;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  icon: typeof Trees;
  badge: string;
  highlight: string;
}

const STEPS: StepItem[] = [
  {
    step: "01",
    title: "Tuyển Trái Nhãn Hương Chi Bãi Bồi",
    titleEn: "Selection of Heritage Longan",
    desc: "Thu hoạch từ các cây nhãn Hương Chi cổ thụ tại vùng bãi bồi phù sa sông Hồng. Từng chùm nhãn được hái vào sáng sớm khi sương vừa tan để quả giữ nguyên độ mọng nước.",
    descEn: "Harvested from ancient orchards along the fertile Red River silt, handpicked at dawn when dew clears to retain optimal juiciness.",
    icon: Trees,
    badge: "Nguyên liệu chọn lọc",
    highlight: "100% Cùi nhãn loại 1",
  },
  {
    step: "02",
    title: "Xoáy Cùi Thủ Công Bằng Bút Đồng",
    titleEn: "Artisanal Pulp Carving",
    desc: "Nghệ nhân dùng đầu bút xoáy đặc chế tách hạt điêu luyện, giữ nguyên múi cùi nhãn tròn vo như hình mặt trăng khuyết, cùi ráo không bị chảy nước.",
    descEn: "Skilled artisans utilize traditional brass carving pens to remove seeds seamlessly, preserving the crescent-moon shape.",
    icon: Scissors,
    badge: "Bí quyết làng nghề",
    highlight: "Cùi ráo nguyên múi",
  },
  {
    step: "03",
    title: "Sấy Lửa Củi Nhãn Ròng Rã 36 Giờ",
    titleEn: "36-Hour Longan Firewood Curing",
    desc: "Chỉ đốt bằng củi của chính thân cây nhãn già đã hong khô. Nhiệt độ lò được người thợ canh chỉnh thủ công ngày đêm, tạo nên mùi khói thơm ấm áp không loại máy sấy điện nào có được.",
    descEn: "Cured continuously over aged longan wood embers at controlled temperatures, infusing a deep smoky sweetness.",
    icon: Flame,
    badge: "Phương pháp ngàn năm",
    highlight: "Hương khói tự nhiên",
  },
  {
    step: "04",
    title: "Ngự Phẩm Vàng Óng Chuẩn Hoàng Gia",
    titleEn: "Royal Golden Tribute Finished",
    desc: "Từng hạt long nhãn thành phẩm lên màu hổ phách vàng ruộm, dẻo quánh tự nhiên, ngọt thanh không khé cổ. Đóng hộp kín vô trùng sẵn sàng phục vụ khách quý.",
    descEn: "Translucent amber golden gems with chewy texture and refined honeyed flavor, vacuum sealed to royal standards.",
    icon: Crown,
    badge: "Tiến vua trọn vị",
    highlight: "Sắc vàng hổ phách",
  },
];

export function ProductScrollytelling({ language = "vi" }: { language?: "vi" | "en" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 75%", "end 60%"],
  });

  const lineHeight = useSpring(scrollYProgress, { stiffness: 80, damping: 25, restDelta: 0.001 });

  return (
    <section ref={containerRef} className="py-24 bg-[#FFFDF8] relative overflow-hidden border-t border-b border-[#FDE68A]/40">
      {/* Nền trang trí */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FDE68A]/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#EDF3E9]/60 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto px-4 md:px-6">
        {/* Tiêu đề mục */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-accent text-xs md:text-sm font-semibold border border-[#FDE68A] shadow-sm mb-4">
            <Flame className="w-4 h-4 text-accent" />
            <span>{language === "en" ? "Artisan Craftsmanship Journey" : "Kỳ Công Nghệ Nhân Phố Hiến"}</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-primary tracking-tight mb-4">
            {language === "en" ? "From Ancient Orchards to Royal Banquets" : "Hành Trình Tinh Túy Từ Vườn Nhãn Đến Bàn Tiệc"}
          </h2>
          <p className="text-foreground/80 text-base md:text-lg leading-relaxed">
            {language === "en"
              ? "Every jar of Nguyệt Nhãn undergoes a meticulous 4-step traditional crafting procedure spanning over 36 hours of artisan labor."
              : "Mỗi mẻ Nguyệt Nhãn là kết tinh của 4 công đoạn thủ công tỉ mỉ suốt hơn 36 giờ giữ lửa, mang trọn vẹn tinh hoa đất trời Hưng Yên."}
          </p>
        </motion.div>

        {/* Trục Timeline hoạt họa chạy theo cuộn */}
        <div className="relative max-w-5xl mx-auto">
          {/* Cột mốc dây tơ vàng dẫn hướng ở giữa (Desktop) hoặc bên trái (Mobile) */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 bg-[#FDE68A]/40 rounded-full overflow-hidden">
            <motion.div
              style={{ scaleY: prefersReducedMotion ? 1 : lineHeight }}
              className="w-full h-full bg-gradient-to-b from-[#B45309] via-[#D97706] to-[#B68A45] origin-top"
            />
          </div>

          {/* Danh sách 4 bước */}
          <div className="space-y-16 md:space-y-24">
            {STEPS.map((item, index) => {
              const isEven = index % 2 === 0;
              const Icon = item.icon;

              return (
                <div key={item.step} className="relative flex flex-col md:flex-row items-center">
                  {/* Điểm neo hạt phát sáng giữa trục */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="w-12 h-12 rounded-full bg-white border-4 border-[#FDE68A] shadow-xl flex items-center justify-center text-accent font-bold text-sm"
                    >
                      <Icon className="w-5 h-5 text-accent" />
                    </motion.div>
                  </div>

                  {/* Khối nội dung thẻ bên trái (chẵn) hoặc bên phải (lẻ) */}
                  <div
                    className={`w-full md:w-1/2 pl-16 md:pl-0 ${
                      isEven ? "md:pr-16 md:text-right" : "md:pl-16 md:ml-auto md:text-left"
                    }`}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
                      className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-3xl border border-[#FDE68A]/60 shadow-xl hover:shadow-2xl transition-all group"
                    >
                      <div
                        className={`flex items-center gap-3 mb-3 ${
                          isEven ? "md:justify-end" : "justify-start"
                        }`}
                      >
                        <span className="text-2xl font-black text-[#FDE68A] group-hover:text-accent transition-colors">
                          {item.step}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-accent bg-secondary px-3 py-1 rounded-full">
                          {item.badge}
                        </span>
                      </div>

                      <h3 className="text-xl md:text-2xl font-bold text-primary mb-3">
                        {language === "en" ? item.titleEn : item.title}
                      </h3>

                      <p className="text-foreground/80 text-sm md:text-base leading-relaxed mb-4">
                        {language === "en" ? item.descEn : item.desc}
                      </p>

                      <div
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 ${
                          isEven ? "md:ml-auto" : ""
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{item.highlight}</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
