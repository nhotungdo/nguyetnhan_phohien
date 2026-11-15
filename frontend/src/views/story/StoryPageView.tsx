"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Landmark,
  Leaf,
  Flame,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Crown,
  ArrowRight,
  BookOpen,
  Layers,
  Coffee,
  Trees,
  Award,
} from "lucide-react";
import { FastImage } from "@/components/FastImage";
import { HeritageVideoSection } from "@/components/HeritageVideoSection";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { resolveCmsImage } from "@/lib/cmsImage";

export function StoryPageView() {
  const { language } = useLanguageStore();
  const isEn = language === "en";
  const { content } = useWebsiteContent();

  const heroBg = resolveCmsImage(content.Story_HeroBg) || "/images/chuachuong_hero_bg.jpg";
  const chuaHienImg = resolveCmsImage(content.Story_ChuaHien) || "/images/chuachuong.jpg";
  const ingredientsImg = resolveCmsImage(content.Story_Ingredients) || "/images/combo3sp.jpg";
  const posterUrl = resolveCmsImage(content.Story_PosterUrl) || "/images/setqua.jpg";

  // Tab chuyển đổi góc nhìn nguyên liệu di sản
  const [activeIngredientTab, setActiveIngredientTab] = useState<"longan" | "lotus" | "nuts">("longan");

  // 4 Giai đoạn chế tác thủ công (Lời văn tinh gọn, cô đọng)
  const craftPhases = [
    {
      title: isEn ? "Ancient Grove Harvest" : "Hái Sớm Vườn Cổ",
      subtitle: isEn ? "Peak Autumn Dawn" : "Sớm Mai Tiết Thu",
      desc: isEn
        ? "Handpicked at dawn from ancient alluvial orchards — selecting only plump, thick-pulled Huong Chi fruit."
        : "Thu hái cữ sớm mai trên bãi bồi sông Hồng, tuyển trái Hương Chi vỏ rám vàng, cùi dày hạt tiêu.",
      icon: Trees,
    },
    {
      title: isEn ? "Bamboo Blade 'Xoáy Long'" : "Xoáy Cùi Bút Tre",
      subtitle: isEn ? "Generational Mastery" : "Tuyệt Kỹ Bí Truyền",
      desc: isEn
        ? "A single swift bamboo curve removes the seed while keeping the lotus pulp cup completely intact."
        : "Đường dao tre uốn lượn tách hạt thoăn thoắt, giữ trọn đài múi sen tròn vẹn, không dập nước.",
      icon: Leaf,
    },
    {
      title: isEn ? "Longan Wood Fire Convection" : "Lửa Than Củi Nhãn",
      subtitle: isEn ? "36-Hour Gentle Heat" : "36 Giờ Tuần Hoàn",
      desc: isEn
        ? "Gentle convection drying with longan firewood caramelizes natural nectar into glowing amber."
        : "Sấy đối lưu bằng than củi nhãn già, cô đọng mật ngọt đất trời thành múi long dẻo quánh hổ phách.",
      icon: Flame,
    },
    {
      title: isEn ? "Ceramic Jar Curing" : "Ủ Chum Sành Cổ",
      subtitle: isEn ? "Natural Balance" : "Hạ Hỏa Gia Truyền",
      desc: isEn
        ? "Rested in earthenware jars to balance moisture and deepen aroma naturally without sulfur or chemicals."
        : "Ủ chum đất nung cân bằng độ ẩm, giữ hương thơm sâu lắng tự nhiên, tuyệt đối không diêm sinh.",
      icon: Landmark,
    },
  ];

  // 3 Trụ cột triết lý thương hiệu kèm hình ảnh thực tế
  const brandVisualPillars = [
    {
      word: "Nguyệt",
      tag: isEn ? "The Autumn Moon" : "Trăng Rằm Mùa Thu",
      title: isEn ? "Wholeness & Reunion" : "Vẹn Tròn Đoàn Viên",
      desc: isEn
        ? "Symbolizes golden harvest time along the river, warmth of family reunion, and sweet peace beside warm tea."
        : "Mùa thu hoạch rực vàng bên bãi bồi sông Hồng, biểu trưng cho sự sum vầy gia đình ấm áp bên tách trà thơm.",
      image: resolveCmsImage(content.Story_Pillar_Nguyet) || "/images/anhdep1.png",
      fallbackImage: "/images/combo3sp.jpg",
    },
    {
      word: "Nhãn",
      tag: isEn ? "Dragon Eye Jewel" : "Thức Quả Mắt Rồng",
      title: isEn ? "Imperial Wellness" : "Tinh Hoa Dưỡng Sinh",
      desc: isEn
        ? "Ancient imperial delicacy that nourishes blood, calms the spirit, and promotes longevity and vitality."
        : "Quả ngọc trời ban, vị thuốc ngự thiện bồi bổ khí huyết, an thần dưỡng tâm và bồi đắp sức khỏe trường thọ.",
      image: resolveCmsImage(content.Story_Pillar_Nhan) || "/images/nuts/longnhanomsen.jpg",
      fallbackImage: "/images/combo3sp.jpg",
    },
    {
      word: "Phố Hiến",
      tag: isEn ? "Historic Homeland" : "Cội Nguồn Phố Cảng",
      title: isEn ? "Living Cultural Pride" : "Niềm Tự Hào Di Sản",
      desc: isEn
        ? "Rooted in the eternal pride of Hung Yen's ancient trading port and 300-year-old mother tree heritage."
        : "Gắn liền với thương cảng sầm uất thế kỷ 16–17 và cây nhãn tổ Chùa Hiến hơn 3 thế kỷ lưu giữ thức quả tiến vua.",
      image: resolveCmsImage(content.Story_Pillar_PhoHien) || "/images/chuachuong.jpg",
      fallbackImage: "/images/chuachuong_hero_bg.jpg",
    },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden [contain:paint] bg-[#FAF8F5] text-stone-900 selection:bg-[#EBDBC6] selection:text-[#3D263A]">
      
      {/* ======================================================== */}
      {/* 1. HERO BANNER: THƯỚC PHIM CẢM XÚC DI SẢN               */}
      {/* ======================================================== */}
      <section className="relative min-h-[560px] sm:min-h-[620px] lg:min-h-[660px] flex items-center justify-center bg-[#132A22] text-[#FAF8F5] overflow-hidden px-4 sm:px-6 lg:px-12 py-16 sm:py-24">
        {/* Hình nền mờ ảo giàu chất thơ */}
        <div className="absolute inset-0 z-0">
          <FastImage
            src={heroBg}
            fallbackSrc="/images/chuachuong_hero_bg.jpg"
            alt="Di tích lịch sử Phố Hiến Hưng Yên"
            fill
            priority
            sizes="100vw"
            className="w-full h-full object-cover object-center opacity-30 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F221B]/90 via-[#132A22]/80 to-[#FAF8F5]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.18)_0%,transparent_75%)]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#E7CBA0] text-sm sm:text-base font-semibold shadow-sm">
            <Crown className="w-4 h-4 text-[#E7CBA0]" />
            <span className="tracking-widest uppercase text-xs sm:text-sm">
              {isEn ? "Royal Heritage Chronicle" : "Ký Sự Di Sản Hoàng Gia"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-medium text-white tracking-tight leading-[1.15] [text-wrap:balance]">
            {isEn
              ? "A Tale from the Land of Longan"
              : "Một Câu Chuyện Từ Miền Đất Nhãn"}
          </h1>

          <p className="font-serif italic text-xl sm:text-2xl md:text-3xl text-[#E9D5B4] max-w-2xl mx-auto leading-relaxed">
            &ldquo;Nơi hương vị truyền thống được nâng niu qua từng món quà.&rdquo;
          </p>

          <p className="text-base sm:text-lg md:text-xl text-stone-300 max-w-2xl mx-auto font-normal leading-relaxed [text-wrap:pretty]">
            {isEn
              ? "Journey back to the 16th-century Red River port, discovering the 300-year-old mother tree of Hien Pagoda and the artisanal craft of royal tribute longan."
              : "Hành trình tìm về thương cảng sầm uất thế kỷ 16–17, nơi giọt phù sa sông Hồng kết tinh thành thức quả ngọc tiến vua chốn hoàng cung."}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#vung-dat-pho-hien"
              className="inline-flex items-center gap-2.5 px-7 py-3 sm:py-3.5 rounded-full bg-[#E5CCA0] hover:bg-[#D8BA88] text-[#241B16] font-bold text-sm sm:text-base transition-all shadow-md hover:scale-105 active:scale-95"
            >
              <span>{isEn ? "Explore The Heritage" : "Khám Phá Cội Nguồn"}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            <a
              href="#tu-lieu-ky-su"
              className="inline-flex items-center gap-2.5 px-7 py-3 sm:py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm sm:text-base backdrop-blur-xs border border-white/25 transition-all"
            >
              <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-[#E5CCA0]" />
              <span>{isEn ? "Watch Documentary" : "Xem Thước Phim Ký Sự"}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. CỘI NGUỒN: VÙNG ĐẤT PHỐ HIẾN & CÂY NHÃN TỔ CHÙA HIẾN    */}
      {/* ======================================================== */}
      <section id="vung-dat-pho-hien" className="py-14 sm:py-20 lg:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Cột Trái: Trưng bày nhiếp ảnh di tích nghệ thuật */}
          <div className="lg:col-span-5 relative group">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-[#EAE2D5]">
              <FastImage
                src={chuaHienImg}
                fallbackSrc="/images/chuachuong_hero_bg.jpg"
                alt="Chùa Hiến và Cổ Thụ Nhãn Lồng Hưng Yên"
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-black/45 backdrop-blur-md border border-white/20 text-white space-y-1">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#E5CCA0]">
                  <Landmark className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{isEn ? "National Historic Monument" : "Di Tích Lịch Sử Quốc Gia"}</span>
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                  {isEn ? "Hien Pagoda & The 300-Year Ancestral Tree" : "Chùa Hiến & Cây Nhãn Tổ 300 Năm"}
                </h3>
              </div>
            </div>
          </div>

          {/* Cột Phải: Lời văn ký sự súc tích, dễ nhìn và chữ to rõ */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-xs sm:text-sm font-bold tracking-widest text-[#8C6D53] uppercase flex items-center gap-2">
                <span className="w-8 h-px bg-[#8C6D53]" />
                {isEn ? "Historic Homeland" : "Cội Nguồn Phố Cảng"}
              </span>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1F1B18] tracking-tight leading-tight">
                {isEn ? "The Heritage Land of Pho Hien" : "Vùng Đất Phố Hiến"}
              </h2>

              <p className="font-serif italic text-base sm:text-lg md:text-xl text-amber-900/90 leading-snug">
                {isEn
                  ? "Rich history and timeless cultural values of our homeland."
                  : "Lịch sử và những giá trị văn hóa quê hương ngàn năm."}
              </p>
            </div>

            {/* Ca dao xưa to rõ, trang trọng */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F6EFE5] border-l-4 border-[#8C6D53] text-[#422D1D] shadow-2xs">
              <p className="font-serif italic text-base sm:text-lg md:text-xl leading-relaxed">
                &ldquo;Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến.
                <br />
                Dù ai buôn Bắc bán Đông, đố ai quên được nhãn lồng Hưng Yên.&rdquo;
              </p>
            </div>

            {/* 2 Điểm nhấn súc tích, chữ to rõ ràng */}
            <div className="space-y-4 text-stone-700 text-sm sm:text-base md:text-lg leading-relaxed">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-stone-900 font-bold">{isEn ? "Golden Trading Port: " : "Thương Cảng Đệ Nhị (Thế kỷ 16–17): "}</strong>
                  <span>{isEn ? "Dang Ngoai's most bustling international port, where foreign merchant ships fell in love with autumn longan." : "Tàu buôn Á – Âu tấp nập cập bến sông Hồng giao thương, say đắm vị nhãn chín mọng mùa thu."}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-stone-900 font-bold">{isEn ? "Alluvial Terroir & Ancestral Tree: " : "Đất Mẹ Phù Sa & Cây Nhãn Tổ: "}</strong>
                  <span>{isEn ? "Red River mineral silt and the 300-year-old tree at Hien Pagoda give birth to crisp, honey-sweet royal longan." : "Lớp phù sa màu mỡ và bóng mát Chùa Hiến kết tinh nên giống nhãn Hương Chi cùi dày, ráo giòn ngọt thanh tiến vua."}</span>
                </div>
              </div>
            </div>

            {/* 3 Nét nhận diện độc bản dạng thẻ chữ to, thoáng đãng */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-[#E8DFC8] shadow-xs space-y-1.5">
                <h3 className="font-bold text-sm sm:text-base text-stone-900">Cùi Dày Giòn Ráo</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">Bóc ráo ngón tay, cắn vào giòn sần sật không chảy nước.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E8DFC8] shadow-xs space-y-1.5">
                <h3 className="font-bold text-sm sm:text-base text-stone-900">Sắc Vàng Hổ Phách</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">Ánh vàng cánh gián trong suốt lưu giữ trọn vẹn mật hoa.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E8DFC8] shadow-xs space-y-1.5">
                <h3 className="font-bold text-sm sm:text-base text-stone-900">Ngọt Hậu Sâu Lắng</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">Vị ngọt thanh đượm hương hoa đọng lại lâu nơi cổ họng.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. TINH HOA: TỪ NHÃN ĐẾN MÓN QUÀ THỰC DƯỠNG              */}
      {/* ======================================================== */}
      <section className="py-14 sm:py-20 lg:py-24 bg-[#F5ECE0]/60 border-y border-[#E8DFC8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* Lời tự sự tinh hoa mỹ vị */}
            <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
              <div className="space-y-2">
                <span className="text-xs sm:text-sm font-bold tracking-widest text-[#8C6D53] uppercase flex items-center gap-2">
                  <span className="w-8 h-px bg-[#8C6D53]" />
                  {isEn ? "The Culinary Essence" : "Tinh Hoa Mỹ Vị"}
                </span>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1F1B18] tracking-tight leading-tight">
                  {isEn ? "From Pure Longan to Meaningful Gift" : "Từ Nhãn Đến Món Quà"}
                </h2>

                <p className="font-serif italic text-base sm:text-lg md:text-xl text-amber-900/90 leading-snug">
                  {isEn
                    ? "The exquisite harmony of longan, lotus seeds, and nutritious nuts."
                    : "Sự hòa quyện giữa long nhãn, hạt sen và hạt dinh dưỡng."}
                </p>
              </div>

              {/* Tóm tắt to rõ, dễ theo dõi */}
              <div className="space-y-3.5 text-stone-700 text-sm sm:text-base md:text-lg leading-relaxed">
                <p>
                  <strong className="text-stone-900 font-bold">{isEn ? "Imperial Wellness: " : "Phong vị ngự thiện: "}</strong>
                  {isEn
                    ? "Ancient court physicians revered longan as 'Dragon Eye' to nourish blood, calm the mind, and restore vitality."
                    : "Các ngự y cung đình ca ngợi long nhãn là vị thuốc quý giúp bổ huyết, an thần dưỡng tâm và kiện tỳ."}
                </p>
                <p>
                  <strong className="text-stone-900 font-bold">{isEn ? "Modern Harmony: " : "Giao thoa đương đại: "}</strong>
                  {isEn
                    ? "Dried longan is delicately paired with northern lotus seeds and premium nuts (almond, walnut, cashew, macadamia) for wholesome daily tea."
                    : "Long nhãn sấy dẻo kết hợp tài tình cùng hạt sen Bắc bùi ngậy và hạt thực dưỡng (mắc ca, hạnh nhân, hạt điều), trọn vẹn ân tình sức khỏe."}
                </p>
              </div>

              {/* Bộ điều khiển chọn xem nguyên liệu */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFC8] space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-600 uppercase tracking-wider">
                  <Coffee className="w-4 h-4 text-amber-800" />
                  <span>{isEn ? "Explore The Ingredients" : "Bộ Ba Nguyên Liệu Dưỡng Sinh"}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveIngredientTab("longan")}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      activeIngredientTab === "longan"
                        ? "bg-[#3D263A] text-white shadow-xs"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {isEn ? "Pho Hien Longan" : "Long Nhãn Tiến Vua"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIngredientTab("lotus")}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      activeIngredientTab === "lotus"
                        ? "bg-[#3D263A] text-white shadow-xs"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {isEn ? "Northern Lotus Seed" : "Hạt Sen Bắc Bùi Béo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIngredientTab("nuts")}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      activeIngredientTab === "nuts"
                        ? "bg-[#3D263A] text-white shadow-xs"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {isEn ? "Nutritious Nuts" : "Hạt Dinh Dưỡng"}
                  </button>
                </div>

                <p className="text-xs sm:text-sm md:text-base text-stone-600 italic leading-relaxed pt-1">
                  {activeIngredientTab === "longan" &&
                    (isEn
                      ? "Crisp, thick-pulp longan dried over wood fire, caramelizing natural nectar into glowing amber."
                      : "Cùi nhãn Hương Chi dày cộm, sấy nhiệt đối lưu than củi giữ trọn sắc vàng cánh gián và vị ngọt thanh.")}
                  {activeIngredientTab === "lotus" &&
                    (isEn
                      ? "Peeled northern lotus seeds, gently steamed for a delicate nutty fragrance that complements longan."
                      : "Hạt sen tươi đầm Bắc sơ chế khéo léo, bùi ngậy đậm đà, ôm trọn trong lòng múi long nhãn ngọt ngào.")}
                  {activeIngredientTab === "nuts" &&
                    (isEn
                      ? "Wholesome macadamias, almonds, walnuts, and cashews delivering essential Omega-3 and vitamin E."
                      : "Mắc ca Đắk Lắk, hạnh nhân, óc chó và hạt điều bổ sung dồi dào Omega-3, vitamin E và khoáng chất quý.")}
                </p>
              </div>
            </div>

            {/* Trưng bày ảnh nguyên liệu di sản */}
            <div className="lg:col-span-5 relative group order-1 lg:order-2">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-[#EAE2D5]">
                <FastImage
                  src={ingredientsImg}
                  fallbackSrc="/images/nuts/longnhanomsen.jpg"
                  alt="Long nhãn ôm sen và hạt dinh dưỡng cao cấp"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-black/45 backdrop-blur-md border border-white/20 text-white space-y-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#E5CCA0]">
                    <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{isEn ? "Artisanal Selection" : "Nguyên Liệu Thuần Khiết"}</span>
                  </div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                    {isEn ? "Royal Longan & Lotus Harmony" : "Hộp Quà Long Nhãn Ôm Sen"}
                  </h3>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. HÀNH TRÌNH CHẾ TÁC: KỲ CÔNG NGHỆ NHÂN                  */}
      {/* ======================================================== */}
      <section className="py-14 sm:py-20 lg:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-2.5">
          <span className="text-xs sm:text-sm font-bold tracking-widest text-[#8C6D53] uppercase flex items-center justify-center gap-2">
            <span className="w-8 h-px bg-[#8C6D53]" />
            {isEn ? "Generational Mastery" : "Kỳ Công Nghệ Nhân"}
            <span className="w-8 h-px bg-[#8C6D53]" />
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1F1B18] tracking-tight leading-tight">
            {isEn ? "Artisanal Longan Craftsmanship" : "Hành Trình Chế Tác Long Nhãn"}
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-stone-600 max-w-xl mx-auto leading-relaxed">
            {isEn
              ? "From early morning orchards to glowing earthen jars — each step is an act of devotion."
              : "Từ cữ hái sớm mai trên bãi bồi đến hàng chục giờ canh lửa than củi ấm — mỗi công đoạn là sự nâng niu trọn vẹn hồn quê."}
          </p>
        </div>

        {/* 4 Giai đoạn chế tác trình bày dạng dòng chảy nghệ thuật */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {craftPhases.map((phase, idx) => {
            const IconComp = phase.icon;
            return (
              <div
                key={idx}
                className="relative p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DFC8] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#F6EFE5] text-[#422D1D] flex items-center justify-center transition-colors group-hover:bg-[#3D263A] group-hover:text-white shadow-2xs">
                    <IconComp className="w-6 h-6 stroke-[1.75]" />
                  </div>

                  <div>
                    <span className="text-xs font-bold text-[#8C6D53] uppercase tracking-wider block mb-1">
                      {phase.subtitle}
                    </span>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 leading-snug">
                      {phase.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm md:text-base text-stone-600 leading-relaxed">
                    {phase.desc}
                  </p>
                </div>

                <div className="pt-3.5 mt-4 border-t border-stone-100 flex items-center justify-between text-xs sm:text-sm text-stone-500 font-medium">
                  <span>{isEn ? "Artisanal Craft" : "Thủ công bí truyền"}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. PHẦN BẮT BUỘC GIỮ LẠI: TƯ LIỆU KÝ SỰ DI SẢN           */}
      {/* ======================================================== */}
      <section id="tu-lieu-ky-su" className="w-full">
        <SectionErrorBoundary sectionName="Tư Liệu Ký Sự Di Sản">
          <HeritageVideoSection
            language={language as "vi" | "en"}
            posterUrl={posterUrl}
            youtubeId="X8e-QWaVGQk"
          />
        </SectionErrorBoundary>
      </section>

      {/* ======================================================== */}
      {/* 6. TRIẾT LÝ THƯƠNG HIỆU: KẾT HỢP HÌNH ẢNH THỰC TẾ        */}
      {/* ======================================================== */}
      <section className="py-14 sm:py-20 lg:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14 space-y-2.5">
          <span className="text-xs sm:text-sm font-bold tracking-widest text-[#8C6D53] uppercase flex items-center justify-center gap-2">
            <span className="w-8 h-px bg-[#8C6D53]" />
            {isEn ? "Brand Philosophy" : "Triết Lý Thương Hiệu"}
            <span className="w-8 h-px bg-[#8C6D53]" />
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1F1B18] tracking-tight leading-tight">
            {isEn ? "Preserving Tradition — Presenting Gratitude" : "Giữ Hồn Truyền Thống – Gửi Trao Trân Quý"}
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-stone-600 max-w-xl mx-auto leading-relaxed">
            {isEn
              ? "The sacred meaning and artisan devotion behind Nguyet Nhan Pho Hien."
              : "Ý nghĩa thiêng liêng và tâm huyết đong đầy phía sau từng sản phẩm Nguyệt Nhãn Phố Hiến."}
          </p>
        </div>

        {/* 3 Thẻ Triết Lý Thương Hiệu kết hợp HÌNH ẢNH THỰC TẾ & CHỮ TO RÕ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {brandVisualPillars.map((pillar, idx) => (
            <div
              key={idx}
              className="rounded-3xl bg-white border border-[#E8DFC8] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col group"
            >
              {/* Khung ảnh thực tế phía trên */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                <FastImage
                  src={pillar.image}
                  fallbackSrc={pillar.fallbackImage}
                  alt={pillar.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                
                {/* Huy hiệu chữ triết lý nổi bật */}
                <div className="absolute bottom-3.5 left-3.5 px-3.5 py-1.5 rounded-full bg-[#EBDBC6]/95 backdrop-blur-xs text-[#422D1D] font-serif font-bold text-sm sm:text-base shadow-sm">
                  {pillar.word}
                </div>
              </div>

              {/* Phần nội dung súc tích phía dưới */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs sm:text-sm font-bold text-[#8C6D53] uppercase tracking-wider block">
                    {pillar.tag}
                  </span>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-stone-600 leading-relaxed pt-1">
                    {pillar.desc}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs sm:text-sm text-amber-900 font-semibold">
                  <span>{isEn ? "Heritage Value" : "Giá trị di sản"}</span>
                  <Award className="w-4 h-4 text-amber-700" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 3 Cam kết cốt lõi dạng thanh ngang nhỏ gọn, chữ to rõ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFC8] shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900">100% Cội Nguồn Phố Hiến</h4>
              <p className="text-xs sm:text-sm text-stone-500">Vùng trồng di sản bãi bồi Chùa Hiến.</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFC8] shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900">Thuần Khiết Không Phụ Gia</h4>
              <p className="text-xs sm:text-sm text-stone-500">Không đường, không sấy diêm sinh độc hại.</p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFC8] shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900">{isEn ? "Certified OCOP Specialty" : "Đặc Sản OCOP Hưng Yên"}</h4>
              <p className="text-xs sm:text-sm text-stone-500">{isEn ? "Certified provincial specialty standard." : "Chứng nhận Mỗi Xã Một Sản Phẩm tỉnh Hưng Yên."}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. LỜI MỜI: MANG HƯƠNG VỊ PHỐ HIẾN ĐẾN GẦN HƠN           */}
      {/* ======================================================== */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-[#18342B] to-[#0F221B] text-white overflow-hidden text-center px-4 sm:px-6">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.15)_0%,transparent_70%)] pointer-events-none"
        />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <span className="inline-block text-xs sm:text-sm font-bold tracking-widest text-[#E5CCA0] uppercase">
            {isEn ? "An Invitation to Heritage" : "Lời Mời Thưởng Thức"}
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-white tracking-tight leading-tight [text-wrap:balance]">
            {isEn ? "Bringing Pho Hien Flavor Closer to You" : "Mang Hương Vị Phố Hiến Đến Gần Hơn"}
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-stone-300 max-w-lg mx-auto leading-relaxed">
            {isEn
              ? "Discover our royal gift collections or customize your own wellness mix box."
              : "Thưởng thức thức quà tiến vua ngọt lành hoặc tự tay phối chọn hộp hạt dinh dưỡng theo sở thích của riêng bạn."}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/san-pham"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#E5CCA0] hover:bg-[#D8BA88] text-[#241B16] font-bold text-sm sm:text-base transition-all shadow-md hover:scale-105 active:scale-95"
            >
              <span>{isEn ? "Explore Gift Collections" : "Khám Phá Sản Phẩm"}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            <Link
              href="/am-thuc"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/20 transition-all"
            >
              <BookOpen className="w-4 h-4 text-[#E5CCA0]" />
              <span>{isEn ? "Culinary Culture" : "Văn Hóa Ẩm Thực"}</span>
            </Link>

            <Link
              href="/tu-chon-hat"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/20 transition-all"
            >
              <Layers className="w-4 h-4 text-[#E5CCA0]" />
              <span>{isEn ? "Custom Mix Workshop" : "Xưởng Tự Chọn Hạt"}</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export default StoryPageView;
