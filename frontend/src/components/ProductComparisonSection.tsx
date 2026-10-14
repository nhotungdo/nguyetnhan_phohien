"use client";

import { motion } from "framer-motion";
import { Check, X, ShieldCheck, Sparkles } from "lucide-react";
import { EASE_OUT_EXPO } from "@/components/LandingMotion";

interface ComparisonRow {
  criteria: string;
  nguyetNhan: string;
  market: string;
}

const COMPARISONS: ComparisonRow[] = [
  {
    criteria: "Nguồn gốc nhãn tươi",
    nguyetNhan: "100% Nhãn lồng Hương Chi cổ thụ tuyển chọn từ bãi bồi sông Hồng (Hưng Yên).",
    market: "Nhãn lai, nhãn trôi nổi nhập lẫn lộn, cùi mỏng và nước nhiều dễ chua.",
  },
  {
    criteria: "Phương pháp làm khô",
    nguyetNhan: "Sấy củi nhãn già thủ công 36 giờ liên tục, canh lửa truyền thống ngàn năm.",
    market: "Sấy điện công nghiệp nhanh hoặc xông lưu huỳnh (diêm sinh), than tổ ong.",
  },
  {
    criteria: "Màu sắc & Hương thơm",
    nguyetNhan: "Vàng cánh gián hổ phách trong vắt, thơm lừng mùi khói củi nhãn đặc trưng.",
    market: "Xỉn đen do sấy vụng, hoặc vàng chói mắt bất thường do tẩy hóa chất lưu huỳnh.",
  },
  {
    criteria: "Chất vị & Độ dẻo",
    nguyetNhan: "Cùi dày ráo mặt, cắn sần sật, dẻo thơm ngọt thanh tao không khé cổ.",
    market: "Nhũn ướt, tẩm ướp đường hóa học ngọt gắt lợ cổ họng, hạt bị dính bết.",
  },
  {
    criteria: "Bảo quản & An toàn",
    nguyetNhan: "Đóng gói vô trùng, hút chân không, hạn dùng 12 tháng tự nhiên không chất bảo quản.",
    market: "Đóng túi nilon sơ sài, nhanh chảy nước, dễ nấm mốc hoặc chứa dư lượng SO2 độc hại.",
  },
];

export function ProductComparisonSection({ language = "vi" }: { language?: "vi" | "en" }) {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-accent text-xs md:text-sm font-semibold border border-[#FDE68A] shadow-sm mb-4">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span>Minh Bạch Chất Lượng</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-primary tracking-tight mb-4">
            {language === "en" ? "Purity Uncompromised: The Nguyệt Nhãn Standard" : "Khác Biệt Làm Nên Đẳng Cấp Nguyệt Nhãn"}
          </h2>
          <p className="text-foreground/80 text-base md:text-lg leading-relaxed">
            Chúng tôi kiên định với phương pháp làm nghề tử tế — không chạy theo số lượng, đặt sức khỏe người dùng và uy tín danh thơm Phố Hiến lên hàng đầu.
          </p>
        </motion.div>

        {/* Bảng so sánh thẻ kép 2 cột */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-stretch">
          
          {/* Cột Trái: Nguyệt Nhãn Phố Hiến (Thượng hạng) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="rounded-[2.5rem] bg-gradient-to-b from-[#FFFDF8] to-[#F8F3E8] p-8 md:p-10 border-2 border-accent shadow-2xl relative overflow-hidden flex flex-col justify-between"
          >
            {/* Nhãn nổi "Tiêu chuẩn hoàng gia" */}
            <div className="absolute top-0 right-0 bg-accent text-white text-[11px] font-bold uppercase tracking-wider px-6 py-2 rounded-bl-2xl shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Chuẩn Tiến Vua
            </div>

            <div>
              <div className="text-accent font-bold text-xs uppercase tracking-widest mb-2">Đặc Sản Chính Gốc</div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-primary mb-6">
                Nguyệt Nhãn Phố Hiến
              </h3>

              <div className="space-y-6">
                {COMPARISONS.map((row, idx) => (
                  <div key={idx} className="space-y-1.5 pb-4 border-b border-[#FDE68A]/60 last:border-none">
                    <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{row.criteria}</span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed pl-5 font-medium">
                      {row.nguyetNhan}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold text-center">
              ✓ Hoàn tiền 200% nếu phát hiện tẩm ướp đường hoặc chất bảo quản độc hại
            </div>
          </motion.div>

          {/* Cột Phải: Long nhãn đại trà trôi nổi */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="rounded-[2.5rem] bg-gray-50/80 p-8 md:p-10 border border-gray-200 shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="text-muted-foreground font-bold text-xs uppercase tracking-widest mb-2">Hàng Đại Trà Thị Trường</div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-500 mb-6">
                Long Nhãn Trôi Nổi
              </h3>

              <div className="space-y-6">
                {COMPARISONS.map((row, idx) => (
                  <div key={idx} className="space-y-1.5 pb-4 border-b border-gray-200 last:border-none">
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                      <X className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{row.criteria}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed pl-5">
                      {row.market}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium text-center">
              ⚠ Nguy cơ tồn dư lưu huỳnh gây kích ứng hô hấp, tẩm đường làm tăng đường huyết
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
