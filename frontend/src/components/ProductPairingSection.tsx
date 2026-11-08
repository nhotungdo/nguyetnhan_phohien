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
  Play,
  ShieldCheck,
  AlertTriangle,
  X,
  Eye,
  CheckCircle2,
  XCircle,
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
  youtubeId?: string;
}

const RECIPES: Recipe[] = [
  {
    id: "tra-cuc",
    youtubeId: "62Da133k_aw",
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
    youtubeId: "6XLEmHUX8Rs",
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
    youtubeId: "xYEddncbdlk",
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

  const heritagePillars = [
    {
      badge: language === "en" ? "Royal Origin" : "Gốc Tích Trứ Danh",
      icon: "🧺",
      title: language === "en" ? "The Royal Bamboo Cage" : "Chiếc Lồng Tre Dâng Vua",
      desc:
        language === "en"
          ? "Centuries ago, to protect prime honeyed clusters for King's tribute from birds, artisans wove bamboo cages enveloping each bunch on high branches. Hence the name 'Longan in Cages'."
          : "Xưa kia để dâng quả ngọt tiến Vua tránh chim muông rỉa hỏng, tiền nhân đan lồng tre chụp kín từng chùm nhãn đầu cành. Danh xưng 'Nhãn Lồng' bất hủ sinh ra từ sự trân quý ấy.",
    },
    {
      badge: language === "en" ? "Sacred Wellness" : "Đạo Nghĩa Trao Gửi",
      icon: "🎁",
      title: language === "en" ? "Gift of Honor & Health" : "Thức Quà Hiếu Kính & Tri Ân",
      desc:
        language === "en"
          ? "A soothing elixir to nourish blood and deep restful sleep for parents, as well as an exquisite diplomatic present carrying the pure soul of Vietnamese terroir to partners worldwide."
          : "Thức quà thơm thảo dâng bậc sinh thành an giấc ngủ sâu, dưỡng huyết an thần; đồng thời là tặng phẩm ngoại giao tinh tế đượm tình quê gửi đối tác, kiều bào muôn phương.",
    },
    {
      badge: language === "en" ? "Living Artisan Soul" : "Tâm Hồn Làng Nghề",
      icon: "👨‍🌾",
      title: language === "en" ? "Guarding Pho Hien's Honor" : "Nghề Canh Lửa Trắng Đêm",
      desc:
        language === "en"
          ? "\"To achieve amber clarity without sugar, kiln masters stay awake all night adjusting air circulation. Keeping this craft is safeguarding the proud honor of Pho Hien.\""
          : "\"Muốn nhãn lên màu hổ phách óng ánh tự nhiên, người thợ lò phải thức trắng thâu đêm canh củi, giữ nhiệt đối lưu. Giữ nghề làm nhãn là giữ lấy cái danh dự của đất Phố Hiến.\"",
    },
  ];

  return (
    <section
      id="am-thuc"
      className="py-16 sm:py-24 bg-gradient-to-b from-[#FFFDF8] via-[#FAF6F0] to-[#FFFDF8] relative overflow-hidden border-t border-border w-full max-w-full [contain:paint] scroll-mt-20 sm:scroll-mt-24"
    >
      {/* Anchor alias để tương thích cả liên kết cũ van-hoa */}
      <span id="van-hoa" className="sr-only" />
      {/* Nền trang trí hoa văn ánh sáng dùng Radial Gradient thuần (không dùng filter blur để an toàn WebKit) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[radial-gradient(circle,rgba(253,230,138,0.35)_0%,rgba(253,230,138,0)_70%)] rounded-full" />
        <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-[radial-gradient(circle,rgba(217,119,6,0.18)_0%,rgba(217,119,6,0)_70%)] rounded-full" />
      </div>

      <div className="container mx-auto px-4 md:px-6 w-full max-w-full">
        {/* PHẦN 1: HỒN QUÊ TRONG TỪNG THỚ NHÃN (Văn hóa ẩm thực Phố Hiến) */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-16 sm:mb-20">
          {/* Cột chữ văn hóa */}
          <div className="lg:col-span-7">
            <Reveal>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary text-accent text-xs md:text-sm font-semibold border border-border shadow-xs mb-4">
                <span>
                  {language === "en"
                    ? "Pho Hien Culinary Heritage & Living Culture"
                    : "Di Sản Văn Hóa & Nghệ Thuật Ẩm Thực Phố Hiến"}
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight mb-5 leading-tight [text-wrap:balance]">
                {language === "en" ? "Hometown Soul in Every Fiber" : "Hồn Quê Trong Từng Thớ Nhãn"}
              </h2>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="text-foreground/80 text-base md:text-lg leading-relaxed mb-6 sm:mb-8 max-w-2xl [text-wrap:pretty]">
                {language === "en"
                  ? "Pho Hien longan is not merely a sweet specialty, but the living crystal of Red River alluvium, artisan devotion, and centuries of graceful culinary lifestyle. Each amber fiber carries the warmth and hospitality of the ancient trading port."
                  : "Long nhãn Phố Hiến không chỉ là một thức quả ngọt ngào, mà là kết tinh của phù sa sông Hồng, của bàn tay nghệ nhân và nếp sống tao nhã trăm năm. Từng thớ cùi dẻo quánh chứa đựng cả tấm lòng thơm thảo của người xứ nhãn gửi trao muôn phương."}
              </p>
            </Reveal>

            {/* 3 Thẻ nét đẹp văn hóa sống */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5"
            >
              {heritagePillars.map((pill, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeUp}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white/95 border border-border shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                        {pill.icon}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-accent border border-amber-200/60">
                        {pill.badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-primary text-sm mb-1.5 [text-wrap:balance]">{pill.title}</h3>
                    <p className="text-xs text-foreground/75 leading-relaxed [text-wrap:pretty]">{pill.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Cột ảnh văn hóa tôn vinh với vòng trang trí quay */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
              {/* Vòng hào quang phía sau dùng Radial Gradient */}
              <div
                className="absolute inset-0 rounded-full scale-95 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at center, rgba(253, 230, 138, 0.45) 0%, rgba(180, 83, 9, 0.15) 55%, transparent 72%)",
                }}
              />

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
                    <span className="font-bold text-sm text-primary">
                      {language === "en" ? "Tea Tasting Culture" : "Văn Hóa Thưởng Trà"}
                    </span>
                    <span className="text-xs text-stone-800 font-medium mt-1">
                      {language === "en" ? "Pho Hien's Premier Specialty Fruit" : "Đệ Nhất Danh Quả Phố Hiến"}
                    </span>
                  </div>
                )}
              </div>

              {/* Huy hiệu nổi bật góc ảnh */}
              <div className="absolute -bottom-2 -left-2 sm:bottom-2 sm:left-2 bg-white px-3.5 py-2 rounded-2xl border border-border shadow-lg flex items-center gap-2">
                <Award className="w-4 h-4 text-accent shrink-0" />
                <span className="text-xs font-bold text-primary">
                  {language === "en" ? "Royal Tribute Legacy" : "Sản Vật Tiến Vua"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PHẦN 1.5: GÓC NGƯỜI SÀNH — BÍ QUYẾT PHÂN BIỆT LONG NHÃN TIẾN VUA VỚI NHÃN TẨM ĐƯỜNG / HÓA CHẤT */}
        <div className="mb-16 sm:mb-20 pt-8 sm:pt-10 border-t border-border">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            className="text-center max-w-3xl mx-auto mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-secondary text-accent text-xs font-semibold border border-border shadow-xs mb-3">
              <Eye className="w-3.5 h-3.5 text-accent" />
              <span>{language === "en" ? "Connoisseur's Tasting Guide" : "Góc Người Sành Ẩm Thực"}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight mb-3 [text-wrap:balance]">
              {language === "en"
                ? "How to Identify Authentic Royal Tribute Longan"
                : "Bí Quyết Nhận Biết Long Nhãn Chuẩn Vị Tiến Vua"}
            </h3>
            <p className="text-foreground/80 text-sm sm:text-base leading-relaxed [text-wrap:pretty]">
              {language === "en"
                ? "Never let your palate be deceived by sugar-soaked or sulfur-fumigated longan. Pho Hien gourmets share 4 golden sensory checkpoints to always choose genuine royal perfection."
                : "Đừng để vị giác bị đánh lừa bởi những mẻ nhãn trôi nổi tẩm đường hay sấy lưu huỳnh. Người Phố Hiến đúc kết 4 tiêu chuẩn vàng giúp bạn an tâm chọn đúng thức quà thượng hạng:"}
            </p>
          </motion.div>

          {/* Bảng so sánh 2 cột trực quan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
            {/* Cột 1: Nguyệt Nhãn Phố Hiến (Chuẩn Cung Đình) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#FAF8F5] via-white to-[#F4EFE6] border-2 border-primary/80 shadow-lg relative overflow-hidden flex flex-col justify-between"
            >
              <div
                aria-hidden
                className="absolute top-0 right-0 w-44 h-44 bg-[radial-gradient(circle,rgba(15,62,48,0.1)_0%,transparent_70%)] pointer-events-none"
              />

              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold border border-emerald-300/80 shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{language === "en" ? "Royal Heritage Standard" : "Nguyệt Nhãn Phố Hiến (Chuẩn Cung Đình)"}</span>
                  </div>
                  <span className="text-xs font-semibold text-primary bg-[#F4EFE6] border border-[#E8DFC8] px-2.5 py-0.5 rounded-full">
                    {language === "en" ? "100% Pure" : "100% Thuần Khiết"}
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      label: language === "en" ? "Color & Clarity" : "Sắc Màu Hổ Phách",
                      desc:
                        language === "en"
                          ? "Natural translucent amber gold. When held against sunlight, the longan pulp is clear and lustrous with zero dark soot."
                          : "Vàng óng cánh gián, hổ phách tự nhiên. Soi dưới ánh sáng thấy cùi trong veo, múi dẻo đều, tuyệt đối không bị ám khói.",
                    },
                    {
                      label: language === "en" ? "Texture & Touch" : "Độ Ráo & Cảm Giác Tay",
                      desc:
                        language === "en"
                          ? "Thick pulp, completely dry to the touch with zero stickiness. Chewing reveals a firm, springy, satisfying chewiness."
                          : "Cùi dày, khô ráo bấm ngón tay không hề dính nhớp. Khi nhai cảm nhận rõ độ dai dẻo sần sật đặc trưng không bị bở.",
                    },
                    {
                      label: language === "en" ? "Palate & Aftertaste" : "Hương Vị Nguyên Bản",
                      desc:
                        language === "en"
                          ? "Delicate mellow sweetness on the tip of the tongue, expanding into a rich honeyed aftertaste deep in the throat. Pure floral aroma."
                          : "Ngọt thanh tao nơi đầu lưỡi, sau đó đượm sâu hậu vị thơm bùi nơi cuống họng. Đậm mùi thơm nắng gió miền phù sa, không ngọt gắt.",
                    },
                    {
                      label: language === "en" ? "Brewing in Hot Water" : "Khi Pha Trà & Nấu Chè",
                      desc:
                        language === "en"
                          ? "Water stays crystal clear with delicate fragrance. Rehydrated pulp expands round and intact, tasting like freshly peeled fruit."
                          : "Nước hãm trong veo, thoảng hương hoa cúc sen. Múi nhãn ngậm nước nở tròn đều nguyên múi, dẻo ngọt như quả tươi vừa bóc vỏ.",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div className="text-xs sm:text-sm">
                        <span className="font-bold text-primary block mb-0.5">{item.label}</span>
                        <span className="text-foreground/80 leading-relaxed">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{language === "en" ? "Guaranteed additive-free, zero sugar added, zero sulfur smoke." : "Cam kết không tẩm đường, không xông lưu huỳnh, sấy nhiệt khép kín."}</span>
              </div>
            </motion.div>

            {/* Cột 2: Nhãn trôi nổi tẩm đường / hóa chất */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-stone-50 via-white to-rose-50/40 border border-stone-300 shadow-sm relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/90 text-rose-800 text-xs font-bold border border-rose-300 shadow-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{language === "en" ? "Market Mass Imitation" : "Long Nhãn Trôi Nổi / Tẩm Ướp Trên Thị Trường"}</span>
                  </div>
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                    {language === "en" ? "Risks & Adulteration" : "Pha Tạp & Hóa Chất"}
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      label: language === "en" ? "Color & Chemical Traces" : "Màu Sắc Bất Thường",
                      desc:
                        language === "en"
                          ? "Artificial bright lemon yellow (sign of sulfur smoke to prevent mold) or dull, muddy black from discarded, bruised longan."
                          : "Màu vàng chanh tươi sáng bất thường (do xông khí lưu huỳnh chống mốc) hoặc thâm xỉn, đen đục do dùng nhãn dạt, nhãn thối.",
                    },
                    {
                      label: language === "en" ? "Texture & Stickiness" : "Bề Mặt Ướt Dính Đường",
                      desc:
                        language === "en"
                          ? "Surface is slimy and sticks to fingers due to sugar syrup coating. Thin, limp pulp that turns mushy immediately."
                          : "Bề mặt ướt dính tay do bao phủ nước đường cô đặc; cùi nhăn nheo, mỏng dính, khi bấm vào cảm giác nhão bở hoặc dai trơ.",
                    },
                    {
                      label: language === "en" ? "Harsh Chemical Taste" : "Vị Ngọt Khé Cổ Họng",
                      desc:
                        language === "en"
                          ? "Harsh, stinging sweetness right on first bite from artificial sugar. Devoid of natural aroma; often sour or burnt."
                          : "Vị ngọt khé rát cổ họng ngay ngụm đầu do đường nhân tạo lấn át; mất sạch hương thơm hoa quả, đôi khi có mùi chua lợ hoặc khen khét.",
                    },
                    {
                      label: language === "en" ? "Turbid Water & Residue" : "Nước Hãm Đục & Cặn Lắng",
                      desc:
                        language === "en"
                          ? "Water turns quickly murky with dissolved sugar sediment at the bottom. Pulp breaks apart, lifeless and flavorless."
                          : "Nước ngâm nhanh chóng bị đục ngầu, cặn đường hóa học lắng đáy ly; múi nhãn rách nát bở bung, ăn nhạt thếch không có độ giòn.",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div className="text-xs sm:text-sm">
                        <span className="font-bold text-stone-800 block mb-0.5">{item.label}</span>
                        <span className="text-stone-600 leading-relaxed">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-rose-200/60 flex items-center gap-2 text-xs text-rose-700 font-semibold">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{language === "en" ? "Often weighted down with heavy syrups and artificial preservatives." : "Thường bị tẩm nặng cân bằng nước đường và chất bảo quản độc hại."}</span>
              </div>
            </motion.div>
          </div>

          {/* Mẹo thử nhanh 30 giây tại nhà */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="max-w-5xl mx-auto mt-6 p-4 sm:p-5 rounded-2xl bg-secondary/70 border border-border text-xs sm:text-sm text-foreground/90 shadow-xs"
          >
            <p className="leading-relaxed">
              <span className="font-bold text-primary">
                {language === "en" ? "💡 30-Second At-Home Test: " : "💡 Mẹo kiểm tra nhanh 30 giây tại nhà: "}
              </span>
              {language === "en"
                ? "Drop 2 longan pieces into warm water. Authentic Pho Hien longan slowly absorbs water, plumping into a round, juicy golden piece while water stays pure. Sugar-coated longan instantly clouds the water with sweet residue, leaving limp pulp."
                : "Thả 2 múi nhãn vào cốc nước lọc ấm. Long nhãn chuẩn Phố Hiến sẽ từ từ ngậm nước nở căng mọng nguyên quả, nước vẫn giữ độ trong thanh mát. Nếu nhãn tẩm đường, nước lập tức đục ngầu do tan lớp đường áo ngoài, múi nhãn xẹp lép bở nhũn."}
            </p>
          </motion.div>
        </div>

        {/* PHẦN 2: THƯỞNG THỨC ĐÚNG ĐIỆU CÙNG NGUYỆT NHÃN (Bí quyết nghệ nhân & Công thức thực hành) */}
        <div className="pt-6 border-t border-border">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            className="text-center max-w-3xl mx-auto mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-accent text-xs font-semibold border border-border shadow-xs mb-3">
              <ChefHat className="w-3.5 h-3.5 text-accent" />
              <span>{language === "en" ? "Artisan Gastronomic Rituals" : "Cẩm Nang Pha Chế Chuẩn Vị"}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary tracking-tight mb-3 [text-wrap:balance]">
              {language === "en" ? "Gastronomic Harmony & Rituals" : "Thưởng Thức Đúng Điệu Cùng Nguyệt Nhãn"}
            </h3>
            <p className="text-foreground/80 text-sm sm:text-base leading-relaxed [text-wrap:pretty]">
              {language === "en"
                ? "Select a traditional ritual below to discover step-by-step instructions, health virtues, and artisan secrets."
                : "Chọn một phong vị dưới đây để xem chi tiết các bước chuẩn bị, định lượng nguyên liệu và bí quyết giữ trọn tinh chất."}
            </p>
          </motion.div>

          {/* Bộ 3 Tab chuyển đổi */}
          <div className="flex justify-center mb-8 sm:mb-10 w-full max-w-full">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 p-1.5 rounded-2xl sm:rounded-3xl bg-card border border-border shadow-md max-w-2xl w-full">
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
                    className={`relative px-2 sm:px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer overflow-hidden ${
                      isActive ? "text-white shadow-md" : "text-stone-700 hover:text-primary hover:bg-secondary/40"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeRecipeTab"
                        className="absolute inset-0 bg-primary rounded-xl sm:rounded-2xl shadow-sm"
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 relative z-10" />
                    <span className="truncate relative z-10">{label}</span>
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
              className="max-w-5xl mx-auto w-full bg-card rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 border border-border shadow-xl relative overflow-hidden"
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

                  {/* Huy hiệu thông số: Thời gian & Công dụng */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex items-center gap-2 bg-card px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-primary">
                      <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>
                        {language === "en" ? "Time: " : "Thời gian: "}
                        {language === "en"
                          ? activeRecipe.time
                              .replace("Phút", "Mins")
                              .replace("Ngâm", "Steep")
                              .replace("Ngày", "Days")
                          : activeRecipe.time}
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

                    <div className="space-y-1">
                      {activeRecipe.steps.map((st, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start gap-3 py-2.5 border-b border-border/60 last:border-none"
                        >
                          <div className="w-6 h-6 rounded-full bg-accent/15 text-accent font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
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
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 text-xs md:text-sm text-foreground/85">
                    <span className="font-bold text-primary block mb-1">
                      💡 {language === "en" ? "Artisan's Secret:" : "Bí quyết từ nghệ nhân:"}
                    </span>
                    <span className="leading-relaxed">
                      {language === "en" ? activeRecipe.chefTipEn : activeRecipe.chefTip}
                    </span>
                  </div>
                </div>

                {/* Cột phải: Danh sách nguyên liệu & Nút Mua ngay (Làm phẳng, không lồng card trong card) */}
                <div className="lg:col-span-5 bg-amber-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between space-y-5 w-full min-w-0 sticky top-24">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-primary/85 mb-3 flex items-center justify-between">
                      <span>{language === "en" ? "Ingredients Required" : "Nguyên Liệu Chuẩn Bị"}</span>
                      <span className="text-xs text-accent font-semibold">
                        {language === "en" ? "Serves 2 - 4" : "Khẩu phần 2 - 4 người"}
                      </span>
                    </div>

                    <div className="divide-y divide-border/60">
                      {activeRecipe.ingredients.map((ing, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2 text-xs sm:text-sm"
                        >
                          <div className="flex items-center gap-2 font-medium text-foreground">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{language === "en" && ing.nameEn ? ing.nameEn : ing.name}</span>
                          </div>
                          <span className="font-bold text-accent shrink-0 ml-2">
                            {language === "en"
                              ? ing.amount
                                  .replace("múi", "pcs")
                                  .replace("bông", "blossoms")
                                  .replace("hạt", "seeds")
                                  .replace("lát", "slices")
                                  .replace("nhánh", "leaves")
                                  .replace("bình", "jar")
                                  .replace("tùy chọn", "optional")
                                  .replace("Lít", "Liters")
                              : ing.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nút đặt mua nguyên liệu */}
                  <button
                    onClick={onOrderClick}
                    className="w-full bg-accent hover:bg-[#9A3412] text-white font-bold py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-lg shadow-accent/25 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <span>
                      {language === "en"
                        ? "Order Nguyet Nhan For This Recipe"
                        : "Đặt Mua Nguyệt Nhãn Nấu Món Này"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Video Hướng Dẫn Thực Hành Nằm Ở Phần Trống Dưới Nút Đặt Mua */}
                  {activeRecipe.youtubeId && (
                    <div className="pt-3.5 sm:pt-4 border-t border-border w-full space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                        <Play className="w-3.5 h-3.5 text-accent fill-accent shrink-0" />
                        <span>
                          {language === "en" ? "Artisan Video Demonstration" : "Video Hướng Dẫn Thực Hành"}
                        </span>
                      </div>

                      <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-md border-2 border-white bg-black group">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${activeRecipe.youtubeId}?rel=0&modestbranding=1`}
                          title={language === "en" ? `${activeRecipe.nameEn} Video Guide` : `Video cách pha chế ${activeRecipe.name}`}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>

                      <p className="text-[11px] text-foreground/75 text-center italic leading-tight">
                        {language === "en"
                          ? `Watch artisan steps for brewing ${activeRecipe.nameEn}`
                          : `Xem cận cảnh các bước pha chế ${activeRecipe.name} chuẩn vị`}
                      </p>
                    </div>
                  )}
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
