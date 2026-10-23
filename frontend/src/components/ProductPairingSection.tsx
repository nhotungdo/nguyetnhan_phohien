"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee,
  UtensilsCrossed,
  Wine,
  Check,
  Clock,
  Heart,
  ArrowRight,
  ChefHat,
  Flame,
  Award,
} from "lucide-react";
import { EASE_OUT_EXPO, fadeUp, Reveal, staggerContainer } from "@/components/LandingMotion";
import { FastImage } from "@/components/FastImage";

interface Recipe {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  tagline: string;
  taglineEn: string;
  desc: string;
  descEn: string;
  time: string;
  healthBenefit: string;
  healthBenefitEn: string;
  ingredients: { name: string; nameEn?: string; amount: string }[];
  steps: { title: string; desc: string; titleEn?: string; descEn?: string }[];
  chefTip: string;
  chefTipEn: string;
}

const RECIPES: Recipe[] = [
  {
    id: "tra-cuc",
    name: "Trà Dưỡng Nhan Hoa Cúc Long Nhãn",
    nameEn: "Imperial Longan Chrysanthemum Tea",
    category: "Thức Uống Dưỡng Tâm",
    categoryEn: "Mindful Wellness Tea",
    tagline: "Vị ngọt thanh dịu dàng xoa dịu tâm trí sau ngày dài làm việc",
    taglineEn: "A serene honeyed infusion to soothe the mind after a long day",
    desc: "Sự hòa quyện giữa vị ngọt đượm của long nhãn Phố Hiến sấy nhiệt nóng (sấy đối lưu), hương cúc tiến vua thơm ngát, kỷ tử đỏ và táo đỏ tạo nên tách trà ấm bổ huyết, sáng mắt và dưỡng sắc hồng hào.",
    descEn: "A harmonic blend of convection-dried Pho Hien longan, imperial chrysanthemum, red goji berries, and jujube dates creating a warming tea for vitality, clarity, and glowing skin.",
    time: "5 - 7 Phút",
    healthBenefit: "Bổ khí huyết, ngủ sâu giấc, sáng da",
    healthBenefitEn: "Nourishes vitality, aids deep sleep, beautifies complexion",
    ingredients: [
      { name: "Long nhãn Nguyệt Nhãn", nameEn: "Nguyet Nhan dried longan", amount: "5 - 7 múi (15g)" },
      { name: "Hoa cúc chi Phố Hiến", nameEn: "Pho Hien imperial chrysanthemum", amount: "4 - 5 bông" },
      { name: "Kỷ tử đỏ Ninh Hạ", nameEn: "Red goji berries", amount: "10 hạt" },
      { name: "Táo đỏ thái lát", nameEn: "Sliced red dates", amount: "3 - 4 lát" },
      { name: "Nước sôi tinh khiết (90°C)", nameEn: "Pure hot water (90°C)", amount: "350ml" },
    ],
    steps: [
      {
        title: "Đánh thức hương vị",
        titleEn: "Awaken the aroma",
        desc: "Tráng ấm chén bằng nước sôi. Cho trà hoa cúc và lát táo đỏ vào ấm, tráng nhanh một lần nước nóng rồi gạn bỏ.",
        descEn: "Rinse teapot and cups with boiling water. Add chrysanthemum and dates, rinse quickly with hot water and discard.",
      },
      {
        title: "Hãm cùng thảo mộc",
        titleEn: "Infuse with herbs",
        desc: "Cho long nhãn và kỷ tử đỏ vào ấm cùng các nguyên liệu đã tráng.",
        descEn: "Add dried longan and goji berries into the pot alongside the rinsed botanicals.",
      },
      {
        title: "Ủ dưỡng chất",
        titleEn: "Steep & unfurl",
        desc: "Rót 350ml nước sôi khoảng 90°C vào ấm, đậy nắp ủ trong 5 - 7 phút để múi long nhãn nở bung và tiết trọn tinh chất.",
        descEn: "Pour 350ml water at 90°C, cover and steep 5-7 minutes for the longan to unfurl and release its essence.",
      },
      {
        title: "Thưởng thức thanh khiết",
        titleEn: "Savor pure sweetness",
        desc: "Rót ra tách dùng khi còn ấm. Vị ngọt mật tự nhiên của long nhãn sấy đối lưu lan tỏa êm dịu, hoàn toàn không cần thêm đường.",
        descEn: "Pour into teacups while warm. The natural honey sweetness of convection-dried longan shines without needing any added sugar.",
      },
    ],
    chefTip: "Không hãm bằng nước sôi 100°C sùng sục để tránh làm cháy cánh hoa cúc; nước 85-90°C giữ nguyên vẹn vitamin và vị ngọt thanh quý giá.",
    chefTipEn: "Avoid boiling water at 100°C to preserve delicate chrysanthemum petals; 85-90°C retains full vitamins and elegant natural sweetness.",
  },
  {
    id: "che-sen",
    name: "Chè Long Nhãn Lồng Hạt Sen",
    nameEn: "Royal Lotus Seed in Longan Sweet Soup",
    category: "Món Tráng Miệng Thượng Phẩm",
    categoryEn: "Royal Sweet Delicacy",
    tagline: "Biểu tượng thanh tao nức tiếng ẩm thực cung đình Phố Hiến",
    taglineEn: "The quintessential symbol of royal Pho Hien banquet dessert",
    desc: "Từng hạt sen bở bùi thơm ngát được nghệ nhân khéo léo lồng trọn bên trong múi cùi long nhãn vàng óng. Nước đường phèn nấu cùng lá dứa tạo nên dư vị thanh khiết khó quên.",
    descEn: "Each fluffy, fragrant lotus seed is delicately enveloped inside a succulent golden longan pocket, bathed in clear rock sugar and aromatic pandan syrup.",
    time: "20 - 25 Phút",
    healthBenefit: "Thanh nhiệt, an thần, dưỡng tỳ vị",
    healthBenefitEn: "Cools the body, relieves stress, nurtures digestive wellness",
    ingredients: [
      { name: "Long nhãn Nguyệt Nhãn", nameEn: "Nguyet Nhan dried longan", amount: "100g" },
      { name: "Hạt sen tươi (hoặc khô)", nameEn: "Fresh (or dried) lotus seeds", amount: "150g" },
      { name: "Đường phèn kết tinh", nameEn: "Natural rock sugar", amount: "80g" },
      { name: "Lá dứa thơm", nameEn: "Fresh pandan leaves", amount: "2 nhánh" },
      { name: "Nước lọc tinh khiết", nameEn: "Pure filtered water", amount: "800ml" },
    ],
    steps: [
      {
        title: "Hầm nhừ hạt sen",
        titleEn: "Simmer lotus seeds",
        desc: "Hầm hạt sen với nước trên lửa vừa trong 15 - 20 phút cho đến khi hạt sen chín bở tơi, mềm mịn mà không vỡ nát.",
        descEn: "Simmer lotus seeds over medium heat for 15-20 minutes until tender and fluffy without falling apart.",
      },
      {
        title: "Nấu nước đường phèn",
        titleEn: "Brew rock sugar syrup",
        desc: "Thêm đường phèn và lá dứa vào nồi hạt sen, đun sôi liu riu cho đường ngấm vào sen rồi vớt hạt sen ra đĩa để nguội bớt.",
        descEn: "Add rock sugar and pandan to the pot, gently simmer to infuse sweetness, then lift lotus seeds out to cool slightly.",
      },
      {
        title: "Khéo léo lồng nhãn",
        titleEn: "Artfully wrap seeds",
        desc: "Ngâm sơ long nhãn qua nước ấm cho dẻo mềm, nhẹ nhàng nhồi từng hạt sen tròn trịa vào lòng múi cùi nhãn.",
        descEn: "Lightly soften longan in warm water, then delicately tuck each round lotus seed into the golden longan pocket.",
      },
      {
        title: "Nấu nhanh giữ độ giòn",
        titleEn: "Flash-simmer for crunch",
        desc: "Thả long nhãn lồng hạt sen vào nồi nước đường, đun sôi lăn tăn đúng 2 phút rồi tắt bếp ngay để giữ trọn độ giòn sần sật.",
        descEn: "Add stuffed longans into the simmering syrup for exactly 2 minutes then remove from heat to preserve the crisp snap.",
      },
    ],
    chefTip: "Đun long nhãn quá 3 phút sẽ làm múi nhãn bị nhũn và mất đi độ giòn dai trứ danh. Thưởng thức ướp lạnh là đỉnh cao giải nhiệt mùa hạ.",
    chefTipEn: "Simmering longan beyond 3 minutes will soften its signature crunch. Chilling before serving elevates this summer classic.",
  },
  {
    id: "ruou-quy",
    name: "Rượu Long Nhãn Khí Huyết Đại Bổ",
    nameEn: "Rejuvenating Longan Herbal Liquor",
    category: "Rượu Thuốc Quý Gia Truyền",
    categoryEn: "Herbal Longevity Liquor",
    tagline: "Món quà trân quý gửi trao đấng sinh thành và tri kỷ",
    taglineEn: "A venerable restorative gift for beloved parents and cherished companions",
    desc: "Long nhãn loại đặc biệt ngâm trong cốt rượu nếp cái hoa vàng chuẩn men ta 40 độ. Rượu ngâm sau 3 tháng chuyển màu vàng cánh gián óng ả, vị ngọt êm dịu mà không cay gắt.",
    descEn: "Premium whole dried longan slowly steeped in traditional 40° sticky rice wine. After 3 months, it transforms into an amber elixir with a smooth honeyed finish.",
    time: "Ngâm 60 - 90 Ngày",
    healthBenefit: "Bồi bổ khí huyết, mạnh gân cốt, ấm tỳ vị",
    healthBenefitEn: "Fortifies blood & energy, strengthens joints, warms the body",
    ingredients: [
      { name: "Long nhãn đặc biệt Nguyệt Nhãn", nameEn: "Special grade Nguyet Nhan longan", amount: "500g" },
      { name: "Rượu nếp cái hoa vàng 40°", nameEn: "Traditional 40° sticky rice wine", amount: "3 - 4 Lít" },
      { name: "Kỷ tử đỏ / Đương quy sao thơm", nameEn: "Goji berries / Angelica root", amount: "50g (tùy chọn)" },
      { name: "Bình gốm Bát Tràng hoặc thủy tinh", nameEn: "Ceramic crock or glass jar", amount: "1 bình" },
    ],
    steps: [
      {
        title: "Khử trùng bình ngâm",
        titleEn: "Sterilize container",
        desc: "Tráng bình gốm hoặc bình thủy tinh bằng nước sôi già, úp ngược để ráo và lau khô hoàn toàn không còn giọt nước.",
        descEn: "Rinse ceramic or glass vessel with boiling water, invert to dry completely with zero residual moisture.",
      },
      {
        title: "Xếp lớp nguyên liệu",
        titleEn: "Layer herbs & longan",
        desc: "Rải đều 500g long nhãn vào đáy bình, có thể điểm xuyết thêm 50g kỷ tử đỏ để tăng thêm sắc vàng đỏ quý phái.",
        descEn: "Evenly place 500g dried longan into the base, optionally adding 50g red goji berries for a rich crimson-gold hue.",
      },
      {
        title: "Rót ngập cốt rượu nếp",
        titleEn: "Pour artisanal wine",
        desc: "Rót 3 - 4 lít rượu nếp cái hoa vàng chuẩn men trấu truyền thống ngập hoàn toàn phần long nhãn.",
        descEn: "Pour 3-4 liters of traditional handcrafted sticky rice wine until longan is thoroughly submerged.",
      },
      {
        title: "Ủ kín & Thưởng thức",
        titleEn: "Seal, mature & enjoy",
        desc: "Đậy kín nắp bình, bảo quản nơi thoáng mát. Sau 60 - 90 ngày rượu ngấu, mỗi ngày dùng 1 chén hạt mít (20-30ml) trong bữa ăn.",
        descEn: "Airtight seal and store in a cool pantry. After 60-90 days, savor 20-30ml daily with meals for wholesome vitality.",
      },
    ],
    chefTip: "Nên chọn rượu nếp men ta truyền thống hạ thổ hoặc khử aldehyde kỹ lưỡng; cùi nhãn càng dày thì rượu ngâm càng thơm đậm và sóng sánh.",
    chefTipEn: "Use genuine traditional-yeast rice wine; the thicker the dried longan pulp, the richer and more velvet-smooth the finished infusion.",
  },
];

export interface ProductPairingSectionProps {
  language?: "vi" | "en";
  cultureImage?: string;
  onOrderClick?: () => void;
}

export function ProductPairingSection({
  language = "vi",
  cultureImage,
  onOrderClick,
}: ProductPairingSectionProps) {
  const [activeId, setActiveId] = useState("tra-cuc");
  const activeRecipe = RECIPES.find((r) => r.id === activeId) || RECIPES[0];

  const culturalPills = [
    {
      icon: "🍵",
      title: language === "en" ? "Imperial Tea Ritual" : "Pha Trà Tiếp Khách",
      desc: language === "en" ? "Serenity & mindful harmony" : "Khơi mở đàm đạo, an thần dưỡng sắc",
    },
    {
      icon: "🥣",
      title: language === "en" ? "Summer Lotus Soup" : "Chè Sen Tiến Vua",
      desc: language === "en" ? "Royal summer refreshment" : "Bở bùi thanh mát nức tiếng kinh kỳ",
    },
    {
      icon: "🍶",
      title: language === "en" ? "Restorative Elixir" : "Rượu Ngâm Đại Bổ",
      desc: language === "en" ? "Heartfelt gift of vitality" : "Ấm tỳ bổ huyết, trao trọn ân tình",
    },
  ];

  return (
    <section
      id="van-hoa"
      className="py-16 sm:py-24 bg-gradient-to-b from-[#FFFDF8] via-[#FAF4E6] to-[#FFFDF8] relative overflow-hidden border-t border-[#FDE68A]/40 w-full max-w-full scroll-mt-20 sm:scroll-mt-24"
    >
      {/* Nền trang trí hoa văn ánh sáng */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[radial-gradient(circle,rgba(253,230,138,0.3)_0%,transparent_70%)] rounded-full blur-2xl" />
        <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-[radial-gradient(circle,rgba(217,119,6,0.15)_0%,transparent_70%)] rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 w-full max-w-full">
        {/* PHẦN 1: HỒN QUÊ TRONG TỪNG THỚ NHÃN (Văn hóa ẩm thực Phố Hiến) */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-16 sm:mb-20">
          {/* Cột chữ văn hóa */}
          <div className="lg:col-span-7">
            <Reveal>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary text-accent text-xs md:text-sm font-semibold border border-[#FDE68A] shadow-xs mb-4">
                <span>
                  {language === "en"
                    ? "Pho Hien Culinary Heritage & Living Culture"
                    : "Di Sản Văn Hóa & Nghệ Thuật Ẩm Thực Phố Hiến"}
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight mb-5 leading-tight">
                {language === "en" ? "Hometown Soul in Every Fiber" : "Hồn Quê Trong Từng Thớ Nhãn"}
              </h2>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="text-foreground/80 text-base md:text-lg leading-relaxed mb-6 sm:mb-8">
                {language === "en"
                  ? "Pho Hien culinary culture lies not only in flavor, but in the artful and mindful way of enjoyment. Longan is both a soothing, cooling treasure in summer lotus seed sweet soups, and a revered herbal elixir when infused with royal tea or steeped in traditional wine to welcome esteemed guests."
                  : "Văn hóa ẩm thực Phố Hiến không chỉ nằm ở hương vị, mà còn ở cách thưởng thức tao nhã lưu truyền trăm năm. Long nhãn vừa là thức quà ngọt mát giải nhiệt trong bát chè sen ngày hạ, vừa là vị thuốc quý bồi bổ khí huyết khi hãm trà hoa, ngâm rượu thơm thiết đãi khách quý."}
              </p>
            </Reveal>

            {/* 3 Thẻ nét đẹp văn hóa */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5"
            >
              {culturalPills.map((pill, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeUp}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white/90 border border-[#FDE68A]/70 shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {pill.icon}
                  </div>
                  <h4 className="font-bold text-primary text-sm mb-1">{pill.title}</h4>
                  <p className="text-xs text-foreground/70 leading-snug">{pill.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Cột ảnh văn hóa tôn vinh với vòng trang trí quay */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
              {/* Vòng hào quang phía sau */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#B45309]/20 to-[#FDE68A]/40 rounded-full blur-xl scale-95" />

              {/* Vòng xoay nét đứt trang trí */}
              <div className="absolute inset-2 border-2 border-accent/40 border-dashed rounded-full animate-[spin_35s_linear_infinite] pointer-events-none" />
              <div className="absolute inset-6 border border-[#B45309]/30 rounded-full pointer-events-none" />

              {/* Khối chứa ảnh tròn */}
              <div className="absolute inset-8 rounded-full overflow-hidden bg-gradient-to-br from-[#FFFDF8] to-[#F5E8C7] shadow-2xl border-4 border-white flex items-center justify-center">
                {cultureImage ? (
                  <FastImage
                    src={cultureImage}
                    alt={language === "en" ? "Pho Hien Longan Culture" : "Văn hóa thưởng trà long nhãn Phố Hiến"}
                    fill
                    sizes="(max-width: 768px) 85vw, 420px"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-accent">
                    <span className="text-5xl mb-3">🍵</span>
                    <span className="font-bold text-sm text-primary">Văn Hóa Thưởng Trà</span>
                    <span className="text-xs text-foreground/60 mt-1">Đệ Nhất Danh Quả Phố Hiến</span>
                  </div>
                )}
              </div>

              {/* Huy hiệu nổi bật góc ảnh */}
              <div className="absolute -bottom-2 -left-2 sm:bottom-2 sm:left-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#FDE68A] shadow-lg flex items-center gap-2">
                <Award className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs font-bold text-primary">
                  {language === "en" ? "Royal Tribute Legacy" : "Sản Vật Tiến Vua"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PHẦN 2: THƯỞNG THỨC ĐÚNG ĐIỆU CÙNG NGUYỆT NHÃN (Bí quyết nghệ nhân & Công thức thực hành) */}
        <div className="pt-6 border-t border-[#FDE68A]/60">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            className="text-center max-w-3xl mx-auto mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-accent text-xs font-semibold border border-[#FDE68A] shadow-xs mb-3">
              <ChefHat className="w-3.5 h-3.5 text-accent" />
              <span>{language === "en" ? "Artisan Gastronomic Rituals" : "Cẩm Nang Pha Chế Chuẩn Vị"}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight mb-3">
              {language === "en" ? "Gastronomic Harmony & Rituals" : "Thưởng Thức Đúng Điệu Cùng Nguyệt Nhãn"}
            </h3>
            <p className="text-foreground/80 text-sm sm:text-base leading-relaxed">
              {language === "en"
                ? "Select a traditional ritual below to discover step-by-step instructions, health virtues, and artisan secrets."
                : "Chọn một phong vị dưới đây để xem chi tiết các bước chuẩn bị, định lượng nguyên liệu và bí quyết giữ trọn tinh chất."}
            </p>
          </motion.div>

          {/* Bộ 3 Tab chuyển đổi */}
          <div className="flex justify-center mb-8 sm:mb-10 w-full max-w-full">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 p-1.5 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-md border border-[#FDE68A]/80 shadow-md max-w-2xl w-full">
              {RECIPES.map((r) => {
                const isActive = r.id === activeId;
                const Icon = r.id === "tra-cuc" ? Coffee : r.id === "che-sen" ? UtensilsCrossed : Wine;
                const label =
                  language === "en"
                    ? r.id === "tra-cuc"
                      ? "Herbal Tea"
                      : r.id === "che-sen"
                      ? "Sweet Soup"
                      : "Medicinal Wine"
                    : r.id === "tra-cuc"
                    ? "Trà Long Nhãn"
                    : r.id === "che-sen"
                    ? "Chè Hạt Sen"
                    : "Rượu Đại Bổ";

                return (
                  <button
                    key={r.id}
                    onClick={() => setActiveId(r.id)}
                    className={`relative px-2 sm:px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
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
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chi tiết công thức món được chọn */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRecipe.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="max-w-5xl mx-auto w-full bg-white/95 rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 border border-[#FDE68A]/80 shadow-xl relative overflow-hidden"
            >
              <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start w-full min-w-0">
                {/* Cột trái: Tên món, Giới thiệu & Các bước thực hiện */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-6 w-full min-w-0">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-accent bg-secondary px-3 py-1 rounded-full mb-2">
                      <Flame className="w-3 h-3 text-accent" />
                      <span>{language === "en" ? activeRecipe.categoryEn : activeRecipe.category}</span>
                    </div>

                    <h4 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary leading-tight">
                      {language === "en" ? activeRecipe.nameEn : activeRecipe.name}
                    </h4>

                    <p className="text-xs sm:text-sm text-accent font-medium italic mt-1">
                      &ldquo;{language === "en" ? activeRecipe.taglineEn : activeRecipe.tagline}&rdquo;
                    </p>
                  </div>

                  <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed">
                    {language === "en" ? activeRecipe.descEn : activeRecipe.desc}
                  </p>

                  {/* 2 huy hiệu thông số: Thời gian & Công dụng */}
                  <div className="flex flex-wrap gap-2.5">
                    <div className="inline-flex items-center gap-2 bg-[#FFFDF8] px-3.5 py-2 rounded-xl border border-[#FDE68A] text-xs font-semibold text-primary">
                      <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>
                        {language === "en" ? "Time: " : "Thời gian: "}
                        {activeRecipe.time}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800">
                      <Heart className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {language === "en" ? activeRecipe.healthBenefitEn : activeRecipe.healthBenefit}
                      </span>
                    </div>
                  </div>

                  {/* Các bước thực hiện chi tiết */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-accent" />
                      <span>{language === "en" ? "Step-by-Step Preparation" : "Các Bước Thực Hiện Chuẩn Vị"}</span>
                    </div>

                    <div className="space-y-2.5">
                      {activeRecipe.steps.map((st, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start gap-3 p-3 rounded-2xl bg-[#FFFDF8] border border-[#FDE68A]/60"
                        >
                          <div className="w-6 h-6 rounded-full bg-accent text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {sIdx + 1}
                          </div>
                          <div className="text-xs sm:text-sm text-foreground/85">
                            <span className="font-bold text-primary block mb-0.5">
                              {language === "en" && st.titleEn ? st.titleEn : st.title}
                            </span>
                            <span className="leading-relaxed">
                              {language === "en" && st.descEn ? st.descEn : st.desc}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bí quyết nghệ nhân */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-secondary/40 border border-[#FDE68A] text-xs md:text-sm text-foreground/85">
                    <span className="font-bold text-primary block mb-1">
                      💡 {language === "en" ? "Artisan's Secret:" : "Bí quyết từ nghệ nhân:"}
                    </span>
                    <span className="leading-relaxed">
                      {language === "en" ? activeRecipe.chefTipEn : activeRecipe.chefTip}
                    </span>
                  </div>
                </div>

                {/* Cột phải: Danh sách nguyên liệu & Nút Mua ngay */}
                <div className="lg:col-span-5 bg-gradient-to-br from-[#FFFDF8] to-[#FAF4E6] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#FDE68A] shadow-md flex flex-col justify-between space-y-5 w-full min-w-0 sticky top-24">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-primary/85 mb-3 flex items-center justify-between">
                      <span>{language === "en" ? "Ingredients Required" : "Nguyên Liệu Chuẩn Bị"}</span>
                      <span className="text-[11px] text-accent font-semibold">
                        {language === "en" ? "Serves 2 - 4" : "Khẩu phần 2 - 4 người"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {activeRecipe.ingredients.map((ing, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/95 border border-[#FDE68A]/40 text-xs sm:text-sm"
                        >
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{language === "en" && ing.nameEn ? ing.nameEn : ing.name}</span>
                          </div>
                          <span className="font-bold text-accent shrink-0 ml-2">{ing.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nút đặt mua nguyên liệu */}
                  <button
                    onClick={onOrderClick}
                    className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <span>
                      {language === "en"
                        ? "Order Nguyet Nhan For This Recipe"
                        : "Đặt Mua Nguyệt Nhãn Nấu Món Này"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default ProductPairingSection;
