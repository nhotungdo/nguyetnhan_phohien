"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee,
  UtensilsCrossed,
  Wine,
  Heart,
  Clock,
  ChefHat,
  Flame,
  Award,
  ArrowRight,
  ShoppingCart,
  Leaf,
  ShieldCheck,
  Play,
  ExternalLink,
} from "lucide-react";
import { EASE_OUT_EXPO } from "@/components/LandingMotion";
import { FastImage } from "@/components/FastImage";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useProducts } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/useCartStore";
import { DEFAULT_FALLBACK_PRODUCTS } from "@/data/defaultProducts";
import type { ProductResponse } from "@/types/api.types";

interface RecipeItem {
  id: string;
  youtubeId: string;
  name: string;
  nameEn: string;
  category: string;
  categoryEn: string;
  tagline: string;
  taglineEn: string;
  desc: string;
  descEn: string;
  time: string;
  timeEn: string;
  healthBenefit: string;
  healthBenefitEn: string;
  icon: typeof Coffee;
  ingredients: { name: string; nameEn: string; amount: string; amountEn: string }[];
  steps: { title: string; titleEn: string; desc: string; descEn: string }[];
  chefTip: string;
  chefTipEn: string;
}

const CULINARY_RECIPES: RecipeItem[] = [
  {
    id: "tra-cuc",
    youtubeId: "62Da133k_aw",
    name: "Trà Dưỡng Nhan Hoa Cúc Chi Long Nhãn",
    nameEn: "Imperial Longan Chrysanthemum Wellness Tea",
    category: "Thức Uống Dưỡng Tâm",
    categoryEn: "Mindful Wellness Tea",
    tagline: "Vị ngọt mật thanh tao xoa dịu tâm trí, an giấc ngủ sâu",
    taglineEn: "A serene honeyed infusion to soothe the mind after a long day",
    desc: "Sự hòa quyện giữa vị ngọt đượm của long nhãn sấy đối lưu Phố Hiến, cúc chi tiến vua, kỷ tử đỏ và lát táo đỏ tạo nên tách trà ấm bổ khí huyết, dưỡng sắc hồng hào.",
    descEn: "A harmonic blend of convection-dried Pho Hien longan, imperial chrysanthemum, red goji berries, and jujube dates creating a warming tea for vitality, clarity, and glowing skin.",
    time: "5 - 7 Phút",
    timeEn: "5 - 7 Mins",
    healthBenefit: "Bổ khí huyết, ngủ sâu giấc, sáng da",
    healthBenefitEn: "Nourishes vitality, aids deep sleep, beautifies complexion",
    icon: Coffee,
    ingredients: [
      { name: "Long nhãn Nguyệt Nhãn", nameEn: "Nguyet Nhan dried longan", amount: "5 - 7 múi (15g)", amountEn: "5 - 7 pieces (15g)" },
      { name: "Hoa cúc chi Phố Hiến", nameEn: "Pho Hien chrysanthemum", amount: "4 - 5 bông", amountEn: "4 - 5 blossoms" },
      { name: "Kỷ tử đỏ Ninh Hạ", nameEn: "Red goji berries", amount: "8 - 10 hạt", amountEn: "8 - 10 berries" },
      { name: "Táo đỏ thái lát", nameEn: "Sliced red dates", amount: "3 - 4 lát", amountEn: "3 - 4 slices" },
      { name: "Nước sôi tinh khiết (85°C - 90°C)", nameEn: "Pure hot water (85°C - 90°C)", amount: "350ml", amountEn: "350ml" },
    ],
    steps: [
      {
        title: "Đánh thức hương hoa",
        titleEn: "Awaken the aroma",
        desc: "Tráng ấm bằng nước nóng. Cho cúc chi và lát táo đỏ vào ấm, rót một ít nước sôi tráng nhanh trong 5 giây rồi gạn bỏ.",
        descEn: "Warm the pot. Add chrysanthemum and dates, rinse quickly with hot water for 5 seconds and discard.",
      },
      {
        title: "Hãm cùng thảo mộc",
        titleEn: "Infuse with botanicals",
        desc: "Cho long nhãn và kỷ tử đỏ vào ấm cùng các nguyên liệu. Rót 350ml nước nóng 85°C – 90°C ngập nguyên liệu.",
        descEn: "Place dried longan and goji berries into the pot. Pour 350ml hot water (85°C – 90°C) over the botanicals.",
      },
      {
        title: "Ủ dưỡng chất & Thưởng thức",
        titleEn: "Steep & Savor",
        desc: "Đậy nắp ủ 5 – 7 phút cho múi long nhãn nở căng mọng và tiết trọn vị mật tự nhiên. Rót ra tách dùng khi còn ấm, không cần thêm đường.",
        descEn: "Cover and steep 5-7 minutes for the longan to unfurl its golden sweetness. Savor warm without any added sugar.",
      },
    ],
    chefTip: "Tránh hãm trà bằng nước sôi 100°C sùng sục để không làm cháy cánh hoa cúc; nhiệt độ 85°C - 90°C giữ trọn vẹn vitamin và vị ngọt thanh quý giá.",
    chefTipEn: "Avoid boiling water at 100°C to preserve delicate petals; 85°C - 90°C preserves natural vitamins and mellow honeyed aroma.",
  },
  {
    id: "che-sen",
    youtubeId: "6XLEmHUX8Rs",
    name: "Chè Long Nhãn Lồng Hạt Sen Cung Đình",
    nameEn: "Royal Lotus Seed in Longan Sweet Soup",
    category: "Món Tráng Miệng Thượng Phẩm",
    categoryEn: "Royal Sweet Delicacy",
    tagline: "Biểu tượng thanh tao nức tiếng ẩm thực ngự thiện Phố Hiến",
    taglineEn: "The quintessential symbol of royal Pho Hien banquet dessert",
    desc: "Từng hạt sen bở bùi ngát hương được nghệ nhân khéo léo lồng trọn bên trong múi long nhãn vàng óng. Nước đường phèn nấu cùng lá dứa tạo nên dư vị ngọt mát khó quên.",
    descEn: "Each tender lotus seed is delicately tucked inside a succulent golden longan pocket, bathed in clear rock sugar and fragrant pandan syrup.",
    time: "20 - 25 Phút",
    timeEn: "20 - 25 Mins",
    healthBenefit: "Thanh nhiệt, an thần, dưỡng tỳ vị",
    healthBenefitEn: "Cools the body, relieves stress, nurtures digestive wellness",
    icon: UtensilsCrossed,
    ingredients: [
      { name: "Long nhãn Nguyệt Nhãn", nameEn: "Nguyet Nhan dried longan", amount: "100g", amountEn: "100g" },
      { name: "Hạt sen tươi (hoặc khô)", nameEn: "Fresh or dried lotus seeds", amount: "150g", amountEn: "150g" },
      { name: "Đường phèn kết tinh", nameEn: "Natural rock sugar", amount: "70 - 80g", amountEn: "70 - 80g" },
      { name: "Lá dứa thơm", nameEn: "Fresh pandan leaves", amount: "2 nhánh", amountEn: "2 leaves" },
      { name: "Nước lọc tinh khiết", nameEn: "Pure filtered water", amount: "800ml", amountEn: "800ml" },
    ],
    steps: [
      {
        title: "Hầm sen chín bở",
        titleEn: "Simmer lotus seeds",
        desc: "Hầm hạt sen với nước trên lửa vừa trong 15 – 20 phút cho chín bở tơi mịn mà không bị vỡ nát.",
        descEn: "Simmer lotus seeds over medium heat for 15-20 minutes until tender and fluffy without disintegrating.",
      },
      {
        title: "Nấu nước đường & Lồng sen",
        titleEn: "Sweet syrup & Stuffing",
        desc: "Thêm đường phèn và lá dứa vào nồi, đun liu riu cho thấm rồi vớt hạt sen ra. Ngâm sơ long nhãn cho dẻo rồi nhẹ nhàng nhồi từng hạt sen vào lòng múi cùi.",
        descEn: "Dissolve rock sugar and pandan, lift lotus seeds out. Lightly soften longan and delicately tuck each seed into the longan pocket.",
      },
      {
        title: "Đun nhanh giữ độ giòn",
        titleEn: "Flash-simmer for crunch",
        desc: "Thả long nhãn lồng hạt sen vào nồi nước đường, đun sôi lăn tăn đúng 2 phút rồi tắt bếp ngay để giữ trọn độ giòn sần sật trứ danh.",
        descEn: "Drop stuffed longans into the simmering syrup for exactly 2 minutes then take off heat to preserve the crisp snap.",
      },
    ],
    chefTip: "Đun long nhãn quá 3 phút sẽ làm múi cùi bị nhũn và mất đi độ giòn dai. Thưởng thức ướp lạnh là đỉnh cao giải nhiệt mùa hạ.",
    chefTipEn: "Simmering beyond 3 minutes turns the longan mushy. Chilling thoroughly before serving elevates this summer classic.",
  },
  {
    id: "yen-chung",
    youtubeId: "DTKkNiV61GQ",
    name: "Tổ Yến Chưng Long Nhãn Táo Đỏ",
    nameEn: "Imperial Bird's Nest with Longan & Red Dates",
    category: "Món Ngự Thiện Đại Bổ",
    categoryEn: "Imperial Restorative Tonic",
    tagline: "Tinh túy bồi bổ nguyên khí, phục hồi sinh lực và dưỡng nhan",
    taglineEn: "A revered royal tonic restoring vital energy and radiant beauty",
    desc: "Sợi yến sào giòn dai thanh khiết quyện cùng vị ngọt mật tự nhiên của long nhãn sấy đối lưu và hương thơm nồng ấm của táo đỏ kỷ tử tạo nên bát canh bồi bổ thượng hạng.",
    descEn: "Delicate bird's nest strands harmonized with the honeyed richness of dried longan and nourishing red dates, creating a royal restorative delight.",
    time: "25 - 30 Phút",
    timeEn: "25 - 30 Mins",
    healthBenefit: "Tăng cường miễn dịch, phục hồi thể lực, sáng mịn làn da",
    healthBenefitEn: "Boosts immune resilience, revives energy, rejuvenates skin",
    icon: Heart,
    ingredients: [
      { name: "Tổ yến tinh chế", nameEn: "Refined bird's nest", amount: "5g", amountEn: "5g" },
      { name: "Long nhãn Nguyệt Nhãn", nameEn: "Nguyet Nhan dried longan", amount: "5 - 7 múi", amountEn: "5 - 7 pieces" },
      { name: "Táo đỏ cao cấp", nameEn: "Premium red dates", amount: "2 - 3 quả thái lát", amountEn: "2 - 3 sliced dates" },
      { name: "Kỷ tử đỏ", nameEn: "Red goji berries", amount: "10 hạt", amountEn: "10 berries" },
      { name: "Đường phèn thanh ngọt", nameEn: "Rock sugar", amount: "1 thìa nhỏ (tùy vị)", amountEn: "1 tsp (to taste)" },
    ],
    steps: [
      {
        title: "Ngâm nở sợi yến",
        titleEn: "Soak bird's nest",
        desc: "Ngâm tổ yến trong nước lọc tinh khiết khoảng 20 phút cho sợi yến tơi mềm, gạn sạch nước qua rây.",
        descEn: "Soak bird's nest in pure water for 20 minutes until tender, then drain gently through a sieve.",
      },
      {
        title: "Chưng cách thủy yến",
        titleEn: "Double-boil gently",
        desc: "Cho yến vào thố chưng cùng 150ml nước lọc, đậy nắp chưng cách thủy trên lửa nhỏ trong 20 phút.",
        descEn: "Place nest into a ceramic cup with 150ml water. Double-boil over gentle heat for 20 minutes.",
      },
      {
        title: "Hòa quyện long nhãn",
        titleEn: "Infuse longan & finish",
        desc: "Mở nắp cho long nhãn, táo đỏ, kỷ tử và đường phèn vào thố, chưng tiếp 5 phút cuối rồi tắt bếp dùng ấm.",
        descEn: "Add longan, dates, goji, and rock sugar. Double-boil for the final 5 minutes and serve warm.",
      },
    ],
    chefTip: "Chỉ cho long nhãn vào 5 phút cuối để nước yến ngấm trọn vị mật hoa mà cùi nhãn vẫn giữ được độ dẻo thơm nguyên bản.",
    chefTipEn: "Always add longan during the last 5 minutes so the broth absorbs the honeyed nectar while the pulp stays tenderly chewy.",
  },
  {
    id: "ruou-quy",
    youtubeId: "xYEddncbdlk",
    name: "Rượu Long Nhãn Khí Huyết Đại Bổ",
    nameEn: "Rejuvenating Longan Herbal Longevity Liquor",
    category: "Rượu Thuốc Quý Gia Truyền",
    categoryEn: "Herbal Longevity Liquor",
    tagline: "Món quà trân quý hiếu kính đấng sinh thành và tri âm",
    taglineEn: "A venerable restorative gift for beloved parents and cherished companions",
    desc: "Long nhãn đặc biệt sấy nhiệt nóng ngâm cùng cốt rượu nếp cái hoa vàng chuẩn men trấu truyền thống. Rượu ngâm chuyển màu vàng cánh gián óng ả, vị ngọt êm dịu không cay gắt.",
    descEn: "Premium whole dried longan steeped in traditional 40° sticky rice wine. It transforms into an amber elixir with a smooth honeyed finish.",
    time: "Ngâm 60 - 90 Ngày",
    timeEn: "Infuse 60 - 90 Days",
    healthBenefit: "Bồi bổ khí huyết, mạnh gân cốt, ấm tỳ vị",
    healthBenefitEn: "Fortifies blood & energy, strengthens joints, warms the body",
    icon: Wine,
    ingredients: [
      { name: "Long nhãn đặc biệt Nguyệt Nhãn", nameEn: "Special grade Nguyet Nhan longan", amount: "500g", amountEn: "500g" },
      { name: "Rượu nếp cái hoa vàng 40°", nameEn: "Traditional 40° sticky rice wine", amount: "3 - 4 Lít", amountEn: "3 - 4 Liters" },
      { name: "Kỷ tử đỏ (tùy chọn)", nameEn: "Red goji berries (optional)", amount: "50g", amountEn: "50g" },
      { name: "Bình gốm Bát Tràng hoặc thủy tinh", nameEn: "Ceramic crock or glass jar", amount: "1 bình sạch", amountEn: "1 sterilized jar" },
    ],
    steps: [
      {
        title: "Khử trùng bình ngâm",
        titleEn: "Sterilize container",
        desc: "Tráng bình bằng nước sôi già, úp ngược để ráo và lau khô hoàn toàn không còn giọt nước thừa.",
        descEn: "Rinse container with boiling water, invert to dry completely with zero residual moisture.",
      },
      {
        title: "Xếp lớp long nhãn",
        titleEn: "Layer longan & botanicals",
        desc: "Rải đều 500g cùi nhãn vào đáy bình, có thể điểm xuyết thêm 50g kỷ tử đỏ để tăng sắc vàng óng quý phái.",
        descEn: "Place 500g dried longan evenly into the base, optionally adding 50g goji berries for rich crimson-gold color.",
      },
      {
        title: "Rót ngập cốt rượu & Ủ ngấu",
        titleEn: "Pour wine & mature",
        desc: "Rót ngập cốt rượu nếp cái hoa vàng. Đậy kín nắp, bảo quản nơi thoáng mát từ 60 – 90 ngày. Dùng 1 chén nhỏ (20-30ml) trong bữa ăn.",
        descEn: "Pour traditional sticky rice wine until submerged. Seal tightly in a cool pantry for 60-90 days. Savor 20-30ml with meals.",
      },
    ],
    chefTip: "Chọn cùi nhãn càng dày và khô ráo thì rượu ngâm càng thơm đượm, sóng sánh và không bị đục cặn.",
    chefTipEn: "Thicker and drier longan pulp yields a velvet-smooth, crystal amber liquor without cloudiness.",
  },
];

function formatPrice(amount: number, language: "vi" | "en") {
  if (language === "en") {
    return `$${(amount / 25000).toFixed(2)}`;
  }
  return amount.toLocaleString("vi-VN").replace(/,/g, ".") + "đ";
}

export function PhoHienCulinaryView() {
  const router = useRouter();
  const { language } = useLanguageStore();
  const { products: apiProducts } = useProducts();
  const { addItem: addCartItem, closeCart } = useCartStore();

  const [activeRecipeId, setActiveRecipeId] = useState<string>("tra-cuc");
  const activeRecipe = CULINARY_RECIPES.find((r) => r.id === activeRecipeId) || CULINARY_RECIPES[0];

  const showcaseProducts: ProductResponse[] = (
    apiProducts && apiProducts.length > 0 ? apiProducts : DEFAULT_FALLBACK_PRODUCTS
  ).slice(0, 3);

  const culinaryPillars = [
    {
      icon: "🍵",
      badge: language === "en" ? "Tea & Contemplation" : "Thưởng Trà Đàm Đạo",
      title: language === "en" ? "Refined Tea Rituals" : "Thưởng Trà Đối Ẩm",
      desc:
        language === "en"
          ? "Replacing artificial sugar with naturally sweet convection-dried longan, harmonizing with chrysanthemum and lotus tea for deep inner tranquility."
          : "Đưa long nhãn vào tách trà sen, cúc chi thay cho đường nhân tạo. Vị ngọt mật thanh tao xoa dịu tâm trí, an thần và dưỡng nhan khi đối ẩm tri âm.",
    },
    {
      icon: "🪷",
      badge: language === "en" ? "Royal Dessert" : "Món Tráng Miệng Hoàng Gia",
      title: language === "en" ? "The Royal Sweet Delicacy" : "Chè Sen Tiến Vua",
      desc:
        language === "en"
          ? "Lotus seeds tucked into golden longan pockets, simmered with rock sugar and pandan for a crisp, light, and digestive wellness dessert."
          : "Từng hạt sen bở bùi lồng trong múi nhãn vàng óng, nấu cùng đường phèn lá dứa. Món tráng miệng thanh mát giải nhiệt, giữ trọn độ giòn sần sật.",
    },
    {
      icon: "🏺",
      badge: language === "en" ? "Virtuous Tribute" : "Tặng Phẩm Nghĩa Tình",
      title: language === "en" ? "Tribute to Parents & Friends" : "Bình Rượu Nếp Thơm Thảo",
      desc:
        language === "en"
          ? "Longan infused with traditional sticky rice wine to strengthen bones, warm the stomach, and serve as an esteemed gift for elders."
          : "Cốt rượu nếp cái hoa vàng ngâm cùng cùi nhãn Hương Chi bồi bổ khí huyết, ấm tỳ vị. Món quà sức khỏe trân quý gửi trao đấng sinh thành.",
    },
  ];

  const goldenSecrets = [
    {
      step: "01",
      icon: "🌡️",
      title: language === "en" ? "Ideal Water Temperature (85°C – 90°C)" : "Nhiệt Độ Nước Lý Tưởng (85°C – 90°C)",
      desc:
        language === "en"
          ? "Never brew delicate dried longan and herbs with 100°C boiling water. 85°C - 90°C gently releases natural glucose without destroying vital vitamins."
          : "Tuyệt đối không hãm long nhãn cùng thảo mộc bằng nước sôi sùng sục 100°C. Nước 85°C - 90°C giúp glucose tự nhiên tan đều mà không làm chua nước.",
    },
    {
      step: "02",
      icon: "⏱️",
      title: language === "en" ? "The 2-Minute Golden Rule in Sweet Soup" : "Quy Tắc 2 Phút Vàng Khi Nấu Chè",
      desc:
        language === "en"
          ? "Simmer stuffed longan in rock sugar syrup for strictly 2 minutes, then remove from heat. Overcooking makes the pulp soggy and limp."
          : "Khi nấu chè, chỉ thả long nhãn vào nước đường sôi lăn tăn đúng 2 phút rồi tắt bếp. Đun lâu cùi nhãn sẽ bị nhũn bở và mất đi độ giòn dai trứ danh.",
    },
    {
      step: "03",
      icon: "🌿",
      title: language === "en" ? "Pure Floral Honey Sweetness" : "Vị Ngọt Mật Thay Thế Đường Tinh Luyện",
      desc:
        language === "en"
          ? "Convection-dried Huong Chi longan carries concentrated natural nectar, completely eliminating the need for added table sugar in daily tea rituals."
          : "Long nhãn sấy nhiệt đối lưu giữ trọn vị ngọt đậm đà từ mật hoa nhãn bãi bồi. Khi hãm trà dưỡng nhan, bạn hoàn toàn không cần thêm đường tinh luyện.",
    },
  ];

  return (
    <div className="bg-[#FAF8F5] text-stone-900 min-h-screen">
      {/* KHỐI 1: TRIẾT LÝ ẨM THỰC "ĂN HƯƠNG ĂN HOA" */}
      <section className="py-12 sm:py-16 container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-accent text-xs sm:text-sm font-bold uppercase tracking-wider block mb-2">
            {language === "en" ? "Living Gastronomy" : "Nếp Sống Tao Nhã"}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary tracking-tight [text-wrap:balance]">
            {language === "en" ? "“Savoring Fragrance, Savoring Flowers”" : "Triết Lý Ẩm Thực “Ăn Hương, Ăn Hoa”"}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-stone-600 leading-relaxed [text-wrap:pretty]">
            {language === "en"
              ? "To Pho Hien gourmets, dried longan is not merely sweet, but a refined ingredient elevating daily moments into mindful ceremonies."
              : "Người Phố Hiến xem long nhãn không chỉ là thức quả ngọt ngào, mà là một vị thuốc dưỡng sinh, một nốt hương tao nhã để lắng lòng và thết đãi người thương."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {culinaryPillars.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: idx * 0.15, ease: EASE_OUT_EXPO }}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DFC8] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="text-[11px] font-bold uppercase px-3 py-1 rounded-full bg-amber-50 text-accent border border-amber-200">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-primary mb-2.5">
                  {item.title}
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm leading-relaxed [text-wrap:pretty]">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center text-xs font-semibold text-accent gap-1">
                <span>{language === "en" ? "Signature Pho Hien tradition" : "Nét đẹp truyền thống Phố Hiến"}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. KHỐI 2: BỘ TỨ NGỰ THIỆN TIẾN VUA (INTERACTIVE RECIPE SHOWCASE) */}
      <section id="bo-tu-ngu-thien" className="py-14 sm:py-20 bg-[#F4EFE6] border-y border-[#E8DFC8]/80 scroll-mt-20">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#E8DFC8] text-accent text-xs font-bold uppercase tracking-wider mb-3">
              <ChefHat className="w-3.5 h-3.5 text-accent" />
              <span>{language === "en" ? "Royal Banquet Recipes" : "Công Thức Ngự Thiện Tiến Vua"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary tracking-tight [text-wrap:balance]">
              {language === "en" ? "The 4 Imperial Longan Preparations" : "Bộ Tứ Thực Đơn Hoàng Gia"}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-stone-600 leading-relaxed [text-wrap:pretty]">
              {language === "en"
                ? "Select a preparation below to view precise measurements, culinary steps, and artisan secrets."
                : "Chọn từng món dưới đây để xem định lượng nguyên liệu chuẩn xác, các bước thực hiện và mẹo vàng từ nghệ nhân."}
            </p>
          </div>

          {/* TAB CHUYỂN ĐỔI 4 MÓN */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl mx-auto mb-8 sm:mb-10">
            {CULINARY_RECIPES.map((recipe) => {
              const isActive = recipe.id === activeRecipeId;
              const IconComp = recipe.icon;
              return (
                <button
                  key={recipe.id}
                  onClick={() => setActiveRecipeId(recipe.id)}
                  className={`py-3 px-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer text-center sm:text-left ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-md scale-102"
                      : "bg-white text-stone-700 border-[#E8DFC8] hover:bg-[#FAF8F5] hover:border-amber-300"
                  }`}
                >
                  <IconComp className={`w-4 h-4 shrink-0 ${isActive ? "text-[#FDE68A]" : "text-accent"}`} />
                  <span className="truncate max-w-full">
                    {language === "en"
                      ? recipe.id === "tra-cuc"
                        ? "Wellness Tea"
                        : recipe.id === "che-sen"
                        ? "Lotus Soup"
                        : recipe.id === "yen-chung"
                        ? "Bird's Nest"
                        : "Herbal Wine"
                      : recipe.id === "tra-cuc"
                      ? "Trà Dưỡng Nhan"
                      : recipe.id === "che-sen"
                      ? "Chè Sen Long Nhãn"
                      : recipe.id === "yen-chung"
                      ? "Yến Chưng Nhãn"
                      : "Rượu Đại Bổ"}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shrink-0 ${
                      isActive ? "bg-white/20 text-[#FDE68A]" : "bg-amber-100 text-accent"
                    }`}
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Video</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* CHI TIẾT MÓN ĂN ĐANG ĐƯỢC CHỌN */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRecipe.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="bg-white rounded-3xl border border-[#E8DFC8] p-6 sm:p-8 md:p-10 shadow-lg relative overflow-hidden"
            >
              {/* Tiêu đề món & Thẻ thông số */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
                <div>
                  <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-1">
                    {language === "en" ? activeRecipe.categoryEn : activeRecipe.category}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-primary">
                    {language === "en" ? activeRecipe.nameEn : activeRecipe.name}
                  </h3>
                  <p className="mt-1 text-sm text-stone-600 italic">
                    “{language === "en" ? activeRecipe.taglineEn : activeRecipe.tagline}”
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span>{language === "en" ? activeRecipe.timeEn : activeRecipe.time}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === "en" ? activeRecipe.healthBenefitEn : activeRecipe.healthBenefit}</span>
                  </div>
                </div>
              </div>

              {/* 2 Cột: Nguyên liệu & Quy trình chế biến */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 sm:pt-8">
                {/* Cột trái: Định lượng nguyên liệu (5 cột) */}
                <div className="lg:col-span-5 space-y-4">
                  <h4 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-700" />
                    <span>{language === "en" ? "Essential Ingredients" : "Nguyên Liệu Chuẩn Định Lượng"}</span>
                  </h4>
                  <ul className="space-y-2.5">
                    {activeRecipe.ingredients.map((ing, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs sm:text-sm"
                      >
                        <span className="font-semibold text-stone-800">
                          {language === "en" ? ing.nameEn : ing.name}
                        </span>
                        <span className="text-accent font-bold px-2 py-0.5 rounded-md bg-amber-100/80 text-xs">
                          {language === "en" ? ing.amountEn : ing.amount}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Nút gợi ý mua nguyên liệu */}
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-amber-200/70 text-xs text-stone-700 space-y-2">
                    <span className="font-bold text-primary block">
                      {language === "en" ? "Ready for cooking?" : "Cần nguyên liệu chuẩn gốc Phố Hiến?"}
                    </span>
                    <p className="text-[12px] leading-relaxed">
                      {language === "en"
                        ? "Nguyet Nhan longan is 100% convection-dried, retaining whole juicy pulp for flawless dishes."
                        : "Long nhãn Nguyệt Nhãn là dòng cùi dày sấy đối lưu 100% tự nhiên, đảm bảo độ giòn ngọt chuẩn vị cho món ăn."}
                    </p>
                    <Link
                      href="/san-pham"
                      className="text-accent font-bold inline-flex items-center gap-1 hover:underline text-xs"
                    >
                      <span>{language === "en" ? "Order premium longan" : "Xem sản phẩm phù hợp"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Cột phải: Các bước thực hiện & Mẹo vàng (7 cột) */}
                <div className="lg:col-span-7 space-y-5">
                  <h4 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
                    <Flame className="w-4 h-4 text-accent" />
                    <span>{language === "en" ? "Preparation Steps" : "3 Bước Chế Biến Chuẩn Vị"}</span>
                  </h4>

                  <div className="space-y-3.5">
                    {activeRecipe.steps.map((st, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200 flex items-start gap-3.5"
                      >
                        <span className="w-6 h-6 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          {idx + 1}
                        </span>
                        <div>
                          <h5 className="font-bold text-sm text-primary mb-1">
                            {language === "en" ? st.titleEn : st.title}
                          </h5>
                          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed [text-wrap:pretty]">
                            {language === "en" ? st.descEn : st.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mẹo vàng nghệ nhân */}
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300/80 text-xs sm:text-sm text-stone-800">
                    <div className="flex items-center gap-2 font-bold text-accent mb-1">
                      <Award className="w-4 h-4 text-accent" />
                      <span>{language === "en" ? "Artisan's Secret Tip:" : "Bí quyết vàng từ nghệ nhân:"}</span>
                    </div>
                    <p className="leading-relaxed [text-wrap:pretty]">
                      {language === "en" ? activeRecipe.chefTipEn : activeRecipe.chefTip}
                    </p>
                  </div>
                </div>
              </div>

              {/* VIDEO HƯỚNG DẪN THỰC HÀNH TƯƠNG ỨNG TỪNG MÓN */}
              {activeRecipe.youtubeId && (
                <div className="mt-8 pt-6 sm:pt-8 border-t border-stone-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2 font-bold text-base sm:text-lg text-primary">
                      <Play className="w-4 h-4 text-accent fill-accent shrink-0" />
                      <span>
                        {language === "en"
                          ? `Video Guide: How to prepare ${activeRecipe.nameEn}`
                          : `Video Hướng Dẫn: Cách chế biến ${activeRecipe.name}`}
                      </span>
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${activeRecipe.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1.5 shrink-0"
                    >
                      <span>{language === "en" ? "Watch on YouTube" : "Xem trên YouTube"}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="relative w-full aspect-video sm:aspect-21/9 lg:aspect-16/7 max-h-[380px] rounded-2xl overflow-hidden shadow-md border-2 border-stone-100 bg-black group">
                    <iframe
                      key={activeRecipe.youtubeId}
                      src={`https://www.youtube-nocookie.com/embed/${activeRecipe.youtubeId}?rel=0&modestbranding=1`}
                      title={language === "en" ? `${activeRecipe.nameEn} Video Guide` : `Video cách làm ${activeRecipe.name}`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                  <p className="text-xs text-stone-500 text-center mt-2.5 italic">
                    {language === "en"
                      ? `Step-by-step video demonstration for ${activeRecipe.nameEn}`
                      : `Xem cận cảnh các bước thao tác chế biến ${activeRecipe.name} chuẩn phong vị nghệ nhân`}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 4. KHỐI 3: CẨM NANG BỎ TÚI CỦA NGƯỜI SÀNH ẨM THỰC */}
      <section className="py-14 sm:py-20 container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-accent text-xs sm:text-sm font-bold uppercase tracking-wider block mb-2">
            {language === "en" ? "Connoisseur's Rules" : "Cẩm Nang Bỏ Túi"}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary tracking-tight [text-wrap:balance]">
            {language === "en" ? "3 Secrets for Maximum Flavor" : "3 Bí Quyết Thưởng Thức Của Người Sành"}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-stone-600 leading-relaxed [text-wrap:pretty]">
            {language === "en"
              ? "Simple golden rules to unlock the full therapeutic essence and crunchy texture of authentic dried longan."
              : "Những nguyên tắc vàng giúp giữ trọn vẹn vị ngọt thanh tao, sắc hổ phách và dược tính quý giá của long nhãn."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {goldenSecrets.map((rule, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.12, ease: EASE_OUT_EXPO }}
              className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E8DFC8] shadow-xs relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{rule.icon}</span>
                <span className="text-2xl font-black text-amber-200">
                  {rule.step}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-primary mb-2 [text-wrap:balance]">
                {rule.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed [text-wrap:pretty]">
                {rule.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. KHỐI 4: NGUYÊN LIỆU CHUẨN VỊ & CTA ĐẶT HÀNG */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-[#FAF8F5] to-[#F4EFE6] border-t border-[#E8DFC8]/70">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-accent text-xs sm:text-sm font-bold uppercase tracking-wider block mb-2">
              {language === "en" ? "Handcrafted Selection" : "Nguyên Liệu Tuyển Chọn"}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary tracking-tight [text-wrap:balance]">
              {language === "en" ? "Artisan Ingredients for Every Recipe" : "Sản Vật Hoàn Hảo Cho Từng Món Ngon"}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-stone-600 leading-relaxed [text-wrap:pretty]">
              {language === "en"
                ? "Experience genuine convection-dried longan, strictly free from artificial sugars and chemical bleaches."
                : "Nguyên liệu chế biến hoàn hảo từ nhãn lồng Hương Chi Hưng Yên, sấy đối lưu tiệt trùng, an toàn tuyệt đối."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {showcaseProducts.map((prod) => {
              const imageSrc =
                prod.images && prod.images.length > 0 && prod.images[0].imagePath
                  ? prod.images[0].imagePath
                  : "/images/hopnhua.jpg";

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl border border-[#E8DFC8] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                    <FastImage
                      src={imageSrc}
                      alt={prod.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 360px"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-primary border border-stone-200">
                      {prod.size || (language === "en" ? "Standard" : "Chuẩn vị")}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-primary mb-1">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-3">
                        {prod.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <span className="text-lg font-extrabold text-accent">
                        {formatPrice(prod.price, language as "vi" | "en")}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            addCartItem(prod);
                          }}
                          className="p-2 sm:p-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-accent transition-all active:scale-95 cursor-pointer shadow-2xs"
                          title={language === "en" ? "Add to cart" : "Thêm vào giỏ hàng"}
                          aria-label={language === "en" ? "Add to cart" : "Thêm vào giỏ hàng"}
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            addCartItem(prod);
                            closeCart();
                            router.push("/san-pham#dat-hang");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-accent hover:bg-[#9A3412] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                          title={language === "en" ? "Buy Now" : "Mua Ngay"}
                        >
                          <span>{language === "en" ? "Buy Now" : "Mua Ngay"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Banner CTA cuối trang */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-primary via-[#164E3D] to-primary text-white text-center max-w-4xl mx-auto shadow-xl relative overflow-hidden">
            <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 text-[#FDE68A]">
              {language === "en" ? "Savor Pho Hien Royalty at Home" : "Thưởng Thức Phong Vị Hoàng Gia Ngay Tại Nhà"}
            </h3>
            <p className="text-emerald-100/90 text-sm sm:text-base max-w-2xl mx-auto mb-6 leading-relaxed">
              {language === "en"
                ? "Order authentic royal longan today to prepare nourishing herbal teas and fragrant desserts for your family."
                : "Đặt mua long nhãn chính hãng sấy đối lưu ngay hôm nay để tự tay pha chế những tách trà thanh tao và bát chè hạt sen ngọt lành cho gia đình."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/san-pham"
                className="bg-accent hover:bg-[#9A3412] text-white font-bold px-7 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all text-sm sm:text-base"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{language === "en" ? "Order Products Now" : "Đặt Mua Sản Phẩm Ngay"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PhoHienCulinaryView;
