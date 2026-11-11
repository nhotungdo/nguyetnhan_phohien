"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShoppingCart, Sparkles, BookOpen, ChevronRight, Leaf, Flame, ShieldCheck, Award, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { EASE_OUT_EXPO } from "@/components/LandingMotion";
import { FastImage } from "@/components/FastImage";
import { ProductHeroShowcase } from "@/components/ProductHeroShowcase";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { useProducts } from "@/hooks/useProducts";
import { useCartStore } from "@/stores/useCartStore";
import { DEFAULT_FALLBACK_PRODUCTS } from "@/data/defaultProducts";
import { resolveCmsImage } from "@/lib/cmsImage";

export function HomeView() {
  const router = useRouter();
  const { t, language } = useLanguageStore();
  const { content: cmsContent } = useWebsiteContent();
  const { products: apiProducts } = useProducts();
  const { addItem: addCartItem } = useCartStore();

  const brandCommitments = [
    { id: "natural", label: t.about.natural_title, icon: Leaf },
    { id: "traditional", label: t.about.traditional_title, icon: Flame },
    { id: "safe", label: t.about.safe_title, icon: ShieldCheck },
    { id: "quality", label: t.hero.quality, icon: Award },
    { id: "support", label: t.nav.support, icon: Headphones },
  ];

  const heroLines = (() => {
    if (language === "en") {
      const parts = t.hero.title.split(" ").filter(Boolean);
      return [parts[0] ?? "", parts.slice(1).join(" ")].filter(Boolean);
    }
    const words = (cmsContent.HeroTitle || "").trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return ["Hương Vị", "Truyền Thống"];
    if (words.length === 1) return [words[0]];

    let split = Math.ceil(words.length / 2);
    if (split > 0 && split < words.length) {
      const prevWord = words[split - 1].toLowerCase();
      const nextWord = words[split].toLowerCase();
      if (prevWord === "long" && nextWord.startsWith("nhãn")) {
        split += 1;
      } else if (prevWord === "phố" && nextWord.startsWith("hiến")) {
        split -= 1;
      } else if (prevWord === "hưng" && nextWord.startsWith("yên")) {
        split -= 1;
      } else if (prevWord === "tiến" && nextWord.startsWith("vua")) {
        split -= 1;
      }
    }

    const line1 = words.slice(0, split).join(" ");
    const line2 = words.slice(split).join(" ");
    return [line1, line2].filter(Boolean);
  })();
  const heroLine1 = heroLines[0];
  const heroLine2 = heroLines[1] ?? "";

  const displayProducts = (apiProducts && apiProducts.length > 0 ? apiProducts : DEFAULT_FALLBACK_PRODUCTS).slice(0, 3);

  return (
    <>
      {/* 1. Hero Banner với phông nền Chùa Chuông Phố Hiến */}
      <section id="hero" className="relative bg-[#F7F3EB] pt-28 pb-12 sm:pt-36 sm:pb-16 w-full overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
          <FastImage
            src={resolveCmsImage(cmsContent.HeroBgImage) || "/images/chuachuong_hero_bg.jpg"}
            fallbackSrc="/images/chuachuong.jpg"
            alt="Chùa Chuông Phố Hiến"
            fill
            priority
            sizes="100vw"
            className="w-full h-full object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/96 via-[#FAF8F5]/85 to-[#FAF8F5]/55 md:from-[#FAF8F5]/96 md:via-[#FAF8F5]/80 md:to-[#FAF8F5]/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/80 via-transparent to-[#FBF9F4]" />
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center w-full max-w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8 max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E8DFC8] text-primary text-xs sm:text-sm font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>{language === "en" ? "Pho Hien Heritage Delicacy" : "Thương Hiệu Di Sản Phố Hiến"}</span>
            </div>

            <h1 className="text-4xl sm:text-[40px] md:text-5xl lg:text-[52px] xl:text-[60px] font-semibold text-primary leading-[1.18] tracking-tight [text-wrap:balance]">
              <motion.span
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.25, ease: EASE_OUT_EXPO }}
                className="block text-primary"
              >
                {heroLine1}
              </motion.span>
              {heroLine2 && (
                <motion.span
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.45, ease: EASE_OUT_EXPO }}
                  className="block mt-1 sm:mt-2 text-accent"
                >
                  {heroLine2}
                </motion.span>
              )}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.55, ease: EASE_OUT_EXPO }}
              className="text-base sm:text-lg md:text-xl text-foreground/85 leading-relaxed [text-wrap:pretty] max-w-xl font-normal"
            >
              {language === "en"
                ? t.hero.subtitle
                : cmsContent.HeroSubtitle ||
                  "Long nhãn sấy khô tự nhiên, giữ trọn vị ngọt thanh tao và hương thơm đặc trưng của nhãn lồng Phố Hiến - Hưng Yên. Một món quà sức khỏe từ ngàn xưa."}
            </motion.p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-5 pt-2">
              <Link
                href="/san-pham"
                prefetch={true}
                className="bg-accent hover:bg-[#9A3412] text-white font-bold px-7 py-3.5 rounded-xl inline-flex items-center gap-2 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/40 hover:scale-105 active:scale-95 transition-all"
              >
                <span>{language === "en" ? "Explore Products" : "Xem Sản Phẩm"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/cau-chuyen"
                prefetch={true}
                className="text-primary font-bold hover:text-accent underline underline-offset-4 py-3 transition-colors"
              >
                {t.nav.story}
              </Link>
            </div>
          </motion.div>

          {/* Khối 3D Interactive Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative flex items-center justify-center"
          >
            <ProductHeroShowcase
              language={language as "vi" | "en"}
              bannerUrl={
                cmsContent.HeroBannerUrl
                  ? resolveCmsImage(cmsContent.HeroBannerUrl)
                  : displayProducts[0]?.images && displayProducts[0].images.length > 0
                    ? resolveCmsImage(displayProducts[0].images[0]?.imagePath)
                    : "/images/combo3sp.jpg"
              }
              onExploreClick={() => {
                router.push("/san-pham");
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* 2. Dải bảo chứng cam kết chất lượng thương hiệu */}
      <div className="border-y border-[#DED6C8] bg-[#FBF9F4] relative overflow-hidden">
        <div className="hidden md:block container mx-auto px-4 md:px-6 py-4">
          <ul className="flex flex-wrap items-center justify-center lg:justify-between gap-y-3 gap-x-6 lg:gap-x-8 text-[#584A3C]">
            {brandCommitments.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2.5 text-xs lg:text-[13px] xl:text-sm font-semibold tracking-tight text-[#4A3B2C] hover:text-primary transition-colors group cursor-default"
              >
                <span className="w-7 h-7 rounded-full bg-amber-100/80 border border-amber-300/50 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-amber-200/80 transition-all">
                  <item.icon aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:hidden relative w-full overflow-hidden marquee-mask py-3 select-none">
          <div className="animate-marquee-track hover:[animation-play-state:paused] active:[animation-play-state:paused]">
            {[...brandCommitments, ...brandCommitments].map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                aria-hidden={index >= brandCommitments.length}
                className="flex items-center gap-2 px-3.5 whitespace-nowrap text-xs font-semibold text-[#4A3B2C]"
              >
                <span className="w-6 h-6 rounded-full bg-amber-100/90 border border-amber-300/60 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
                  <item.icon aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                </span>
                <span>{item.label}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 ml-2.5 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Bộ Sưu Tập Tinh Hoa (Top 3 Bestseller Showcase Preview) */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-accent bg-amber-100/80 px-3.5 py-1.5 rounded-full border border-amber-300/50">
              {language === "en" ? "Selected Royal Tribute" : "Tinh Hoa Phẩm Vật Tiến Vua"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary [text-wrap:balance]">
              {language === "en" ? "Signature Pho Hien Longan" : "Bộ Sưu Tập Sản Phẩm Tiêu Biểu"}
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Những dòng sản phẩm được nghệ nhân sấy nhiệt đối lưu tỉ mỉ, giữ trọn vị ngọt thanh dịu và màu vàng hổ phách tự nhiên.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {displayProducts.map((prod, index) => {
              const imageSrc =
                prod.images && prod.images.length > 0
                  ? resolveCmsImage(prod.images[0].imagePath)
                  : "/images/combo3sp.jpg";

              return (
                <div
                  key={prod.id || index}
                  className="bg-[#FCFBF7] rounded-3xl border border-[#E8DFC8] overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-white/60">
                    <FastImage
                      src={imageSrc}
                      fallbackSrc="/images/combo3sp.jpg"
                      alt={prod.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {prod.size && (
                      <span className="absolute top-3.5 left-3.5 bg-primary/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                        {prod.size}
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-lg sm:text-xl text-primary line-clamp-1 group-hover:text-accent transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 mt-1 leading-relaxed">
                        {prod.description || (language === "en" ? "100% authentic Pho Hien dried longan." : "Long nhãn Hưng Yên sấy nhiệt đối lưu tự nhiên, chuẩn vị tiến vua.")}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E8DFC8]/60 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-stone-500 block">Giá niêm yết</span>
                        <span className="text-lg font-bold text-accent">
                          {language === "en"
                            ? `$${(prod.price / 25000).toFixed(2).replace(',', '.')}`
                            : `${prod.price.toLocaleString("vi-VN").replace(/,/g, '.')}đ`}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          addCartItem(prod);
                          router.push("/san-pham#dat-hang");
                        }}
                        className="bg-accent hover:bg-[#9A3412] text-white p-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                        title="Thêm vào giỏ và đặt mua"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/san-pham"
              prefetch={true}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3.5 rounded-full transition-all shadow-md hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <span>Xem Toàn Bộ Sản Phẩm & Bảng So Sánh</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Teaser Khởi Nguồn & Câu Chuyện Di Sản */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-[#FAF8F5] to-white border-t border-[#E8DFC8]/60">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border-4 border-white shadow-xl">
              <FastImage
                src={cmsContent.StoryImage ? resolveCmsImage(cmsContent.StoryImage) : "/images/combo3sp.jpg"}
                fallbackSrc="/images/combo3sp.jpg"
                alt="Câu chuyện di sản Nguyệt Nhãn Phố Hiến"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <span className="text-white text-sm font-semibold italic">
                  &ldquo;Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến&rdquo;
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-accent bg-amber-100/80 px-3.5 py-1.5 rounded-full border border-amber-300/50">
                Khởi Nguồn Thế Kỷ 16
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary leading-tight [text-wrap:balance]">
                {cmsContent.StoryTitle || "Thứ Quả Tiến Vua Trứ Danh Đất Hưng Yên"}
              </h2>
              <p className="text-stone-700 text-base leading-relaxed [text-wrap:pretty]">
                Tương truyền vào thế kỷ 16, một vị quan đi tuần qua vùng Phố Hiến đúng độ nhãn chín. Nếm thử thấy cùi dày, mọng nước, vị ngọt lịm thơm ngát, liền mang về dâng vua. Từ đó, nhãn lồng Hưng Yên trở thành sản vật tiến vua hàng năm.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/cau-chuyen"
                  prefetch={true}
                  className="inline-flex items-center gap-2 bg-accent hover:bg-[#9A3412] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 text-sm sm:text-base"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Đọc Toàn Bộ Câu Chuyện & Xem Thước Phim</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/am-thuc"
                  prefetch={true}
                  className="text-primary font-bold hover:text-accent underline underline-offset-4 text-sm sm:text-base"
                >
                  Khám phá văn hóa ẩm thực
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Banner Studio Tự Chọn Hạt Độc Bản */}
      <section className="bg-secondary/70 border-y border-border py-12 sm:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-amber-200/60 px-3 py-1 rounded-full mb-3 inline-block">
              Trải Nghiệm Độc Bản
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-primary">
              {language === "en" ? "Bespoke Custom Mix Studio" : "Phối Một Hộp Hạt Theo Ý Bạn"}
            </h2>
            <p className="mt-2 text-foreground/80 leading-relaxed text-sm sm:text-base">
              Tự tay lựa chọn tỉ lệ 5 loại hạt, chọn mẫu bao bì hộp quà cao cấp và in tem nhãn mang tên riêng của bạn hoặc người thương.
            </p>
          </div>
          <Link
            href="/tu-chon-hat"
            prefetch={true}
            className="inline-flex items-center gap-2 bg-card border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl px-6 py-3.5 font-bold transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95 shrink-0 text-sm sm:text-base"
          >
            <span>{t.nav.custom_mix || "Vào Studio Tự Chọn Hạt"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 6. Lối tắt Đặt Hàng Trực Tuyến Nhanh */}
      <section className="py-14 sm:py-18 bg-[#451A03] text-white">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl space-y-4">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#FDE68A] leading-tight">
            Thưởng Thức Hương Vị Tinh Túy Ngay Hôm Nay
          </h2>
          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Cam kết chất lượng tuyệt hảo, đóng gói kín khí giữ trọn độ dẻo và hương thơm tự nhiên giao tận tay bạn.
          </p>
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/san-pham#dat-hang"
              prefetch={true}
              className="inline-flex items-center gap-2 bg-accent hover:bg-[#9A3412] text-white font-bold px-8 py-4 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95 text-base sm:text-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Đặt Hàng Trực Tuyến Nhanh</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomeView;
