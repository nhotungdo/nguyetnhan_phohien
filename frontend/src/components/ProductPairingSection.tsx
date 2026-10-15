"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, UtensilsCrossed, Wine, Check, Clock, Heart, ArrowRight } from "lucide-react";
import { EASE_OUT_EXPO } from "@/components/LandingMotion";

interface Recipe {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  tagline: string;
  desc: string;
  time: string;
  healthBenefit: string;
  ingredients: { name: string; amount: string }[];
  instruction: string;
}

const RECIPES: Recipe[] = [
  {
    id: "tra-cuc",
    name: "Trà Dưỡng Nhan Hoa Cúc Long Nhãn",
    nameEn: "Imperial Longan Chrysanthemum Tea",
    category: "Thức Uống Dưỡng Tâm",
    tagline: "Vị ngọt thanh dịu dàng xoa dịu tâm trí sau ngày dài làm việc",
    desc: "Sự hòa quyện giữa vị ngọt đượm của long nhãn sấy củi, hương cúc tiến vua thơm ngát và kỷ tử đỏ tạo nên tách trà bổ huyết, sáng mắt và trẻ hóa làn da.",
    time: "5 - 7 Phút",
    healthBenefit: "Bổ khí huyết, ngủ sâu giấc, sáng da",
    ingredients: [
      { name: "Long nhãn Nguyệt Nhãn", amount: "5 - 7 hạt" },
      { name: "Hoa cúc chi Phố Hiến", amount: "4 - 5 bông" },
      { name: "Kỷ tử đỏ Ninh Hạ", amount: "10 hạt" },
      { name: "Táo đỏ thái lát", amount: "3 - 4 lát" },
    ],
    instruction: "Hãm tất cả nguyên liệu trong 300ml nước sôi 90°C trong 5 phút. Vị ngọt tự nhiên của long nhãn hòa quyện không cần thêm đường.",
  },
  {
    id: "che-sen",
    name: "Chè Long Nhãn Lồng Hạt Sen",
    nameEn: "Royal Lotus Seed in Longan Sweet Soup",
    category: "Món Tráng Miệng Thượng Phẩm",
    tagline: "Biểu tượng thanh tao nức tiếng ẩm thực đất kinh kỳ",
    desc: "Từng hạt sen bở bùi được khéo léo bọc trọn bên trong múi cùi long nhãn vàng óng. Nước đường phèn nấu cùng lá dứa tạo nên dư vị thanh khiết khó quên.",
    time: "20 - 25 Phút",
    healthBenefit: "Thanh nhiệt, dưỡng tỳ vị, giảm stress",
    ingredients: [
      { name: "Long nhãn Nguyệt Nhãn", amount: "100g" },
      { name: "Hạt sen tươi (hoặc khô)", amount: "150g" },
      { name: "Đường phèn kết tinh", amount: "80g" },
      { name: "Lá dứa thơm", amount: "2 nhánh" },
    ],
    instruction: "Nấu hạt sen chín mềm bở, lồng từng hạt sen vào lòng múi nhãn đã ngâm nở nhẹ. Đun cùng nước đường phèn lá dứa, dùng ấm hoặc ướp lạnh đều tuyệt đỉnh.",
  },
  {
    id: "ruou-quy",
    name: "Rượu Long Nhãn Khí Huyết Đại Bổ",
    nameEn: "Rejuvenating Longan Herbal Liquor",
    category: "Rượu Thuốc Quý Gia Truyền",
    tagline: "Món quà trân quý gửi trao đấng sinh thành và tri kỷ",
    desc: "Long nhãn loại đặc biệt ngâm trong cốt rượu nếp cái hoa vàng chuẩn men ta 40 độ. Rượu ngâm sau 3 tháng chuyển màu vàng cánh gián óng ả, ngọt êm dịu mà không cay gắt.",
    time: "Ngâm 60 - 90 Ngày",
    healthBenefit: "Tăng cường sinh lực, mạnh gân cốt, ấm tỳ vị",
    ingredients: [
      { name: "Long nhãn loại đặc biệt", amount: "500g" },
      { name: "Rượu nếp cái hoa vàng 40°", amount: "3 - 4 Lít" },
      { name: "Kỷ tử / Đương quy (tùy chọn)", amount: "50g" },
      { name: "Bình gốm hoặc thủy tinh", amount: "1 chiếc" },
    ],
    instruction: "Xếp long nhãn vào bình, rót ngập rượu nếp cái hoa vàng. Đậy kín đặt nơi thoáng mát. Mỗi ngày dùng 1 chén nhỏ 20-30ml trong bữa ăn để bồi bổ sức khỏe.",
  },
];

export function ProductPairingSection({
  language = "vi",
  onOrderClick,
}: {
  language?: "vi" | "en";
  onOrderClick?: () => void;
}) {
  const [activeId, setActiveId] = useState("tra-cuc");
  const activeRecipe = RECIPES.find((r) => r.id === activeId) || RECIPES[0];

  return (
    <section className="py-24 bg-gradient-to-b from-[#FFFDF8] via-[#F8F3E8] to-[#FFFDF8] relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        {/* Tiêu đề phân khu */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-accent text-xs md:text-sm font-semibold border border-[#FDE68A] shadow-sm mb-4">
            <Coffee className="w-4 h-4 text-accent" />
            <span>Nghệ Thuật Thưởng Thức Đa Giác Quan</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold text-primary tracking-tight mb-4">
            {language === "en" ? "Gastronomic Harmony & Rituals" : "Thưởng Thức Đúng Điệu Cùng Nguyệt Nhãn"}
          </h2>
          <p className="text-foreground/80 text-base md:text-lg leading-relaxed">
            Long nhãn không chỉ là món ăn chơi bổ dưỡng mà còn là vị thuốc quý trong y học cổ truyền, mang lại giá trị sức khỏe bền lâu cho cả gia đình.
          </p>
        </motion.div>

        {/* Bộ chuyển đổi 3 cách dùng */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 p-1.5 rounded-2xl sm:rounded-3xl bg-white/85 backdrop-blur-md border border-[#FDE68A]/60 shadow-lg max-w-2xl w-full">
            {RECIPES.map((r) => {
              const isActive = r.id === activeId;
              const Icon = r.id === "tra-cuc" ? Coffee : r.id === "che-sen" ? UtensilsCrossed : Wine;
              const shortName = r.id === "tra-cuc" ? "Trà Dưỡng" : r.id === "che-sen" ? "Chè Hạt Sen" : "Rượu Quý";
              const fullName = r.id === "tra-cuc" ? "Trà Long Nhãn" : r.id === "che-sen" ? "Chè Hạt Sen" : "Rượu Đại Bổ";

              return (
                <button
                  key={r.id}
                  onClick={() => setActiveId(r.id)}
                  className={`relative px-2 sm:px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs md:text-sm font-bold flex items-center justify-center gap-1 sm:gap-2 transition-all ${
                    isActive ? "text-white shadow-md" : "text-foreground/75 hover:text-primary hover:bg-secondary/40"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeRecipeTab"
                      className="absolute inset-0 bg-gradient-to-r from-[#B45309] to-[#D97706] rounded-xl sm:rounded-2xl -z-10 shadow-sm"
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline truncate">{fullName}</span>
                  <span className="sm:hidden truncate">{shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nội dung chi tiết của món được chọn */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRecipe.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="max-w-5xl mx-auto bg-white/95 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 md:p-10 lg:p-12 border border-[#FDE68A]/70 shadow-2xl relative overflow-hidden"
          >
            <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
              {/* Cột trái: Thông tin món, công dụng, hướng dẫn */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                <div>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-accent bg-secondary px-2.5 sm:px-3 py-1 rounded-full">
                    {activeRecipe.category}
                  </span>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mt-2.5 sm:mt-3 mb-1.5 sm:mb-2">
                    {activeRecipe.name}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-accent font-medium italic">
                    &ldquo;{activeRecipe.tagline}&rdquo;
                  </p>
                </div>

                <p className="text-foreground/80 text-xs sm:text-sm md:text-base leading-relaxed">
                  {activeRecipe.desc}
                </p>

                {/* 2 huy hiệu thông số */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 py-1 sm:py-2">
                  <div className="flex items-center gap-2 bg-[#FFFDF8] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#FDE68A] text-xs font-semibold text-primary">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
                    <span>Thời gian: {activeRecipe.time}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800">
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                    <span>{activeRecipe.healthBenefit}</span>
                  </div>
                </div>

                {/* Hướng dẫn pha chế */}
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-secondary/30 border border-[#FDE68A]/60 text-xs md:text-sm text-foreground/85">
                  <span className="font-bold text-primary block mb-1">💡 Bí quyết nghệ nhân:</span>
                  <span>{activeRecipe.instruction}</span>
                </div>
              </div>

              {/* Cột phải: Thẻ nguyên liệu & Nút mua ngay */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#FFFDF8] to-[#F8F3E8] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#FDE68A] shadow-md flex flex-col justify-between space-y-4 sm:space-y-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary/80 mb-3 sm:mb-4 flex items-center justify-between">
                    <span>Nguyên Liệu Chuẩn Bị</span>
                    <span className="text-[10px] sm:text-[11px] text-accent font-semibold">Khẩu phần 2 - 4 người</span>
                  </div>

                  <div className="space-y-2">
                    {activeRecipe.ingredients.map((ing, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-white/90 border border-border/40 text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-foreground">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{ing.name}</span>
                        </div>
                        <span className="font-bold text-accent shrink-0 ml-2">{ing.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={onOrderClick}
                  className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Đặt Mua Nguyệt Nhãn Nấu Món Này</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
