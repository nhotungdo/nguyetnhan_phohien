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
} from "lucide-react";
import { FastImage } from "@/components/FastImage";
import { HeritageVideoSection } from "@/components/HeritageVideoSection";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useLanguageStore } from "@/stores/useLanguageStore";

export function StoryPageView() {
  const { language } = useLanguageStore();
  const isEn = language === "en";

  // Tab chuyển đổi góc nhìn nguyên liệu di sản
  const [activeIngredientTab, setActiveIngredientTab] = useState<"longan" | "lotus" | "nuts">("longan");

  // Các giai đoạn chế tác thủ công (Không đánh số theo mục)
  const craftPhases = [
    {
      title: isEn ? "Ancient Grove Harvest" : "Hái Sớm Vườn Cổ",
      subtitle: isEn ? "Peak Autumn Morning" : "Cữ Sớm Tiết Trời Thu",
      desc: isEn
        ? "Harvested at dawn while autumn dew still clings to leaves. Only late-ripening Huong Chi trees from alluvial silt are chosen for dense pulp and small seeds."
        : "Thu hái khi sương sớm còn đọng trên kẽ lá. Chỉ tuyển những chùm nhãn Hương Chi bãi bồi sông Hồng vỏ mỏng rám vàng, múi dày cộm và ráo nước.",
      icon: Trees,
    },
    {
      title: isEn ? "Bamboo Blade 'Xoáy Long'" : "Tuyệt Kỹ Xoáy Bút Tre",
      subtitle: isEn ? "Generational Mastery" : "Đường Dao Bí Truyền",
      desc: isEn
        ? "Using a nimble curved bamboo knife, artisans peel and remove the seed in a single continuous swirl, keeping the pulp cup intact like a blooming lotus."
        : "Nghệ nhân dùng đầu bút tre chuốt cong lượn một đường dứt khoát tách vỏ rút hạt. Múi nhãn tròn vẹn tựa chiếc đài sen, không rách thịt, không chảy mật.",
      icon: Leaf,
    },
    {
      title: isEn ? "Longan Wood Fire Convection" : "Lửa Than Củi Nhãn",
      subtitle: isEn ? "36-Hour Steady Heat" : "36 Giờ Tuần Hoàn",
      desc: isEn
        ? "Dried over glowing embers of dried longan branches. Constant convection heat condenses pure floral honey into a translucent golden amber color."
        : "Sấy nhiệt đối lưu bằng than đượm từ chính cành nhãn già. Hơi ấm lan tỏa ngày đêm cô đọng tinh hoa đất trời thành múi long dẻo quánh, sắc vàng cánh gián.",
      icon: Flame,
    },
    {
      title: isEn ? "Ceramic Jar Curing" : "Ủ Chum Sành Định Hương",
      subtitle: isEn ? "Natural Balance" : "Hạ Hỏa Gia Truyền",
      desc: isEn
        ? "Cured in earthen jars to balance moisture and lock in aroma. Completely free of sulfur bleaching, added sugar, or artificial preservatives."
        : "Ủ trong chum sành đất nung để cân bằng độ ẩm và định hương bền lâu. Múi long để lâu vẫn tơi xốp, ngọt thanh sâu thẳm, tuyệt đối không diêm sinh.",
      icon: Landmark,
    },
  ];

  // 3 Nét nhận diện độc bản nhãn lồng tiến vua
  const hallmarkPoints = [
    {
      title: isEn ? "Crisp & Dense Scale Flesh" : "Cùi Dày Giòn Ráo Nước",
      desc: isEn
        ? "Layers of crisp, firm pulp that pull apart cleanly without sticky moisture, yielding a refreshing snap when bitten."
        : "Múi nhãn dày cộm xếp lớp lồng khít nhau. Bóc ra ráo ngón tay, cắn vào giòn tan sần sật, hoàn toàn khác biệt với giống nhãn nước đại trà.",
    },
    {
      title: isEn ? "Translucent Amber Glow" : "Sắc Hổ Phách Tinh Khiết",
      desc: isEn
        ? "Glowing like ancient amber in golden autumn light, wrapping a tiny obsidian seed with delicate translucence."
        : "Múi nhãn sấy khô ánh lên sắc vàng cánh gián hổ phách trong suốt, tựa viên ngọc quý lưu giữ trọn vẹn sinh khí phù sa sông Hồng.",
    },
    {
      title: isEn ? "Lingering Floral Aftertaste" : "Hương Thơm Sâu Lắng",
      desc: isEn
        ? "Pure floral honey sweetness that blooms gently in the mouth and leaves a soothing, cooling fragrance in the throat."
        : "Vị ngọt thanh tao không gắt, quyện hương hoa nhãn thoang thoảng dịu êm, để lại dư vị ngọt hậu lưu luyến mãi nơi cuống họng.",
    },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden [contain:paint] bg-[#FAF8F5] text-stone-900 selection:bg-[#EBDBC6] selection:text-[#3D263A]">
      
      {/* ======================================================== */}
      {/* 1. HERO BANNER: THƯỚC PHIM CẢM XÚC DI SẢN               */}
      {/* ======================================================== */}
      <section className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] flex items-center justify-center bg-[#132A22] text-[#FAF8F5] overflow-hidden px-4 sm:px-6 lg:px-12 py-20">
        {/* Hình nền mờ ảo giàu chất thơ */}
        <div className="absolute inset-0 z-0">
          <FastImage
            src="/images/chuachuong_hero_bg.jpg"
            fallbackSrc="/images/chuachuong.jpg"
            alt="Di tích lịch sử Phố Hiến Hưng Yên"
            fill
            priority
            sizes="100vw"
            className="w-full h-full object-cover object-center opacity-30 scale-105 transition-transform duration-1000"
          />
          {/* Lớp phủ chuyển sắc mượt mà */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F221B]/90 via-[#132A22]/80 to-[#FAF8F5]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.18)_0%,transparent_75%)]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Huy hiệu di sản */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#E7CBA0] text-xs sm:text-sm font-medium shadow-sm">
            <Crown className="w-3.5 h-3.5 text-[#E7CBA0]" />
            <span className="tracking-widest uppercase">
              {isEn ? "Royal Heritage Chronicle" : "Ký Sự Di Sản Hoàng Gia"}
            </span>
          </div>

          {/* Tiêu đề chính trang nhã */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-white tracking-tight leading-[1.2] [text-wrap:balance]">
            {isEn
              ? "A Tale from the Land of Longan — Royal Silt of Pho Hien"
              : "Một Câu Chuyện Từ Miền Đất Nhãn"}
          </h1>

          {/* Câu trích dẫn thư pháp truyền cảm */}
          <p className="font-serif italic text-lg sm:text-xl md:text-2xl text-[#E9D5B4] max-w-2xl mx-auto leading-relaxed">
            &ldquo;Nơi hương vị truyền thống được nâng niu qua từng món quà.&rdquo;
          </p>

          <p className="text-sm sm:text-base md:text-lg text-stone-300 max-w-2xl mx-auto font-normal leading-relaxed [text-wrap:pretty]">
            {isEn
              ? "Journey back to the 16th century along the Red River, discovering the 300-year-old mother tree of Hien Pagoda and the artisanal craft of royal tribute longan."
              : "Ngược dòng thời gian về thế kỷ 16 bến sông Hồng, lắng nghe câu chuyện cây nhãn tổ Chùa Hiến hơn 300 năm và tuyệt kỹ chế tác thức quả ngọc tiến vua lưu truyền qua bao thế hệ."}
          </p>

          {/* Nút lướt khám phá */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#vung-dat-pho-hien"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E5CCA0] hover:bg-[#D8BA88] text-[#241B16] font-semibold text-xs sm:text-sm transition-all shadow-md hover:scale-105 active:scale-95"
            >
              <span>{isEn ? "Explore The Heritage" : "Khám Phá Cội Nguồn"}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#tu-lieu-ky-su"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm backdrop-blur-xs border border-white/25 transition-all"
            >
              <Landmark className="w-4 h-4 text-[#E5CCA0]" />
              <span>{isEn ? "Watch Documentary" : "Xem Thước Phim Ký Sự"}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. CỘI NGUỒN: VÙNG ĐẤT PHỐ HIẾN & CÂY NHÃN TỔ CHÙA HIẾN    */}
      {/* ======================================================== */}
      <section id="vung-dat-pho-hien" className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Cột Trái: Trưng bày nhiếp ảnh di tích nghệ thuật */}
          <div className="lg:col-span-5 relative group">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-[#EAE2D5]">
              <FastImage
                src="/images/chuachuong.jpg"
                fallbackSrc="/images/chuachuong_hero_bg.jpg"
                alt="Chùa Hiến và Cổ Thụ Nhãn Lồng Hưng Yên"
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Thẻ ghi chú bảo tàng thanh lịch */}
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 text-white space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#E5CCA0]">
                  <Landmark className="w-4 h-4" />
                  <span>{isEn ? "National Historic Monument" : "Di Tích Lịch Sử Văn Hóa Quốc Gia"}</span>
                </div>
                <h3 className="font-serif font-bold text-sm sm:text-base text-white">
                  {isEn ? "Hien Pagoda & The 300-Year Ancestral Tree" : "Chùa Hiến & Cây Nhãn Tổ 300 Năm"}
                </h3>
                <p className="text-xs text-stone-200">
                  {isEn
                    ? "The sacred birthplace of Vietnam's royal longan heritage."
                    : "Cội nguồn phát tích của giống nhãn lồng tiến vua trứ danh."}
                </p>
              </div>
            </div>

            {/* Họa tiết bóng gương mềm mại */}
            <div
              aria-hidden="true"
              className="absolute -bottom-6 -right-6 w-48 h-48 bg-[#EBDBC6] rounded-3xl -z-10 blur-xl opacity-70 pointer-events-none"
            />
          </div>

          {/* Cột Phải: Lời văn ký sự sâu lắng */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-xs sm:text-sm font-semibold tracking-widest text-[#8C6D53] uppercase flex items-center gap-2">
                <span className="w-6 h-px bg-[#8C6D53]" />
                {isEn ? "Historic Homeland" : "Cội Nguồn Phố Cảng"}
              </span>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1F1B18] tracking-tight leading-tight">
                {isEn ? "The Heritage Land of Pho Hien" : "Vùng Đất Phố Hiến"}
              </h2>

              <p className="font-serif italic text-base sm:text-lg text-amber-900/90 leading-snug">
                {isEn
                  ? "Rich history and timeless cultural values of our homeland."
                  : "Lịch sử và những giá trị văn hóa ngàn năm quê hương."}
              </p>
            </div>

            {/* Ca dao xưa */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#F6EFE5] border-l-4 border-[#8C6D53] text-[#422D1D]">
              <p className="font-serif italic text-base sm:text-lg leading-relaxed">
                &ldquo;Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến.
                <br />
                Dù ai buôn Bắc bán Đông, đố ai quên được nhãn lồng Hưng Yên.&rdquo;
              </p>
              <p className="text-xs font-semibold text-[#8C6D53] mt-2 uppercase tracking-wider">
                — {isEn ? "Ancient Folk Verse of Dang Ngoai" : "Ca dao cổ truyền xứ nhãn"}
              </p>
            </div>

            <div className="space-y-4 text-stone-700 text-sm sm:text-base leading-relaxed">
              <p>
                {isEn
                  ? "In the 16th and 17th centuries, Pho Hien flourished as the premier international trading port of Dang Ngoai. Ships from Portugal, the Netherlands, Japan, and China anchored along the Red River to trade precious silks and spices. Amidst this bustling harbor, Pho Hien longan emerged as an unforgettable delight for foreign merchants."
                  : "Vào thế kỷ 16 và 17, Phố Hiến bước vào thời kỳ cực thịnh, trở thành thương cảng quốc tế sầm uất bậc nhất Đàng Ngoài. Các đoàn thuyền buôn Á - Âu tấp nập cập bến đôi bờ sông Hồng để giao thương tơ lụa, gốm sứ. Giữa cảnh phồn hoa bến bãi, thức quả nhãn lồng mọng ngọt đầu thu đã làm say lòng biết bao thương nhân viễn xứ."}
              </p>
              <p>
                {isEn
                  ? "Endowed with rich alluvial silt deposited by the Red River and sheltered beside the ancient Hien Pagoda with its 300-year-old mother tree from the late Le Dynasty, this sacred terroir yields longans of unmatched sweetness, crisp flesh, and regal fragrance."
                  : "Được thiên nhiên ưu ái ban tặng lớp phù sa bồi lắng màu mỡ của sông Hồng và che chở dưới bóng mát cây nhãn tổ Chùa Hiến hơn 3 thế kỷ từ thời Hậu Lê, đất Phố Hiến kết tinh nên thức quả ngọc: cùi dày giòn sần sật, ngọt thanh thuần khiết và hương thơm sâu lắng mà không vùng đất nào sánh được."}
              </p>
            </div>

            {/* 3 Nét độc bản thu gọn */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {hallmarkPoints.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#E8DFC8] shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[#8C6D53]">
                    <CheckCircle2 className="w-4 h-4 text-[#8C6D53] shrink-0" />
                    <h3 className="font-bold text-xs sm:text-sm text-stone-900">{item.title}</h3>
                  </div>
                  <p className="text-[11px] sm:text-xs text-stone-600 leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. TINH HOA: TỪ NHÃN ĐẾN MÓN QUÀ THỰC DƯỠNG              */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-24 bg-[#F5ECE0]/60 border-y border-[#E8DFC8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Lời tự sự tinh hoa mỹ vị */}
            <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
              <div className="space-y-2">
                <span className="text-xs sm:text-sm font-semibold tracking-widest text-[#8C6D53] uppercase flex items-center gap-2">
                  <span className="w-6 h-px bg-[#8C6D53]" />
                  {isEn ? "The Culinary Essence" : "Tinh Hoa Mỹ Vị"}
                </span>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1F1B18] tracking-tight leading-tight">
                  {isEn ? "From Pure Longan to Meaningful Gift" : "Từ Nhãn Đến Món Quà"}
                </h2>

                <p className="font-serif italic text-base sm:text-lg text-amber-900/90 leading-snug">
                  {isEn
                    ? "The exquisite harmony of longan, lotus seeds, and nutritious nuts."
                    : "Sự hòa quyện giữa long nhãn, hạt sen và hạt dinh dưỡng."}
                </p>
              </div>

              <div className="space-y-4 text-stone-700 text-sm sm:text-base leading-relaxed">
                <p>
                  {isEn
                    ? "In ancient imperial courts, physicians revered Pho Hien longan as 'Dragon Eye' — a precious tonic that nourishes blood, calms the mind, and enhances vitality."
                    : "Trong chốn hoàng cung uy nghiêm, các ngự y triều đình ca ngợi long nhãn là vị thuốc quý bồi bổ khí huyết, an thần dưỡng tâm và kiện tỳ khai vị, thường xuyên được dâng lên yến tiệc tiếp đón sứ thần bang giao."}
                </p>
                <p>
                  {isEn
                    ? "Today, Nguyet Nhan inherits this ancient wisdom by pairing authentic Phở Hiến longan with northern lotus seeds and premium nutritious nuts (almonds, walnuts, cashews, macadamias, pumpkin seeds) — crafting wellness gifts that bridge royal heritage with modern mindful living."
                    : "Kế thừa phong vị ngự thiện, Nguyệt Nhãn Phố Hiến kết hợp tinh tế múi long nhãn sấy dẻo cùng hạt sen Bắc bùi béo và các loại hạt dinh dưỡng tuyển chọn (mắc ca, hạnh nhân, hạt điều, óc chó, bí xanh). Từng món quà trao đi vừa thơm đượm vị trà, vừa gói trọn lời chúc an khang trường thọ."}
                </p>
              </div>

              {/* Bộ điều khiển chọn xem nguyên liệu */}
              <div className="p-4 rounded-2xl bg-white border border-[#E8DFC8] space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  <Coffee className="w-4 h-4 text-amber-800" />
                  <span>{isEn ? "Explore The Ingredients" : "Bộ Ba Nguyên Liệu Dưỡng Sinh"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveIngredientTab("longan")}
                    className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
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
                    className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
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
                    className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      activeIngredientTab === "nuts"
                        ? "bg-[#3D263A] text-white shadow-xs"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    {isEn ? "Nutritious Nuts" : "Hạt Dinh Dưỡng Cao Cấp"}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 italic pt-1">
                  {activeIngredientTab === "longan" &&
                    (isEn
                      ? "Crisp, thick-pulp longan dried over wood fire, caramelizing natural fructose into glowing amber."
                      : "Cùi nhãn Hương Chi dày cộm, sấy nhiệt đối lưu than củi giữ trọn sắc vàng cánh gián và vị ngọt thanh.")}
                  {activeIngredientTab === "lotus" &&
                    (isEn
                      ? "Peeled northern lotus seeds, gently steamed and dried for a delicate nutty fragrance that complements longan."
                      : "Hạt sen tươi đầm Bắc được sơ chế khéo léo, bùi ngậy đậm đà, ôm trọn trong lòng múi long nhãn ngọt ngào.")}
                  {activeIngredientTab === "nuts" &&
                    (isEn
                      ? "Wholesome macadamias, almonds, walnuts, and cashews delivering essential fatty acids and antioxidants."
                      : "Mắc ca Đắk Lắk, hạnh nhân, óc chó và hạt điều bổ sung dồi dào Omega-3, vitamin E và khoáng chất quý.")}
                </p>
              </div>
            </div>

            {/* Trưng bày ảnh nguyên liệu di sản */}
            <div className="lg:col-span-5 relative group order-1 lg:order-2">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-[#EAE2D5]">
                <FastImage
                  src="/images/combo3sp.jpg"
                  fallbackSrc="/images/nuts/longnhanomsen.jpg"
                  alt="Long nhãn ôm sen và hạt dinh dưỡng cao cấp"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 text-white space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#E5CCA0]">
                    <Leaf className="w-4 h-4" />
                    <span>{isEn ? "Artisanal Selection" : "Nguyên Liệu Tuyển Chọn Thuần Khiết"}</span>
                  </div>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-white">
                    {isEn ? "Royal Longan & Lotus Harmony" : "Hộp Quà Long Nhãn Ôm Sen"}
                  </h3>
                  <p className="text-xs text-stone-200">
                    {isEn
                      ? "A timeless bridge between ancient royal tribute and modern wellness."
                      : "Món quà tinh tế trao gửi sức khỏe và ân tình trân quý."}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. HÀNH TRÌNH CHẾ TÁC: KỲ CÔNG NGHỆ NHÂN                  */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs sm:text-sm font-semibold tracking-widest text-[#8C6D53] uppercase flex items-center justify-center gap-2">
            <span className="w-6 h-px bg-[#8C6D53]" />
            {isEn ? "Generational Mastery" : "Kỳ Công Nghệ Nhân"}
            <span className="w-6 h-px bg-[#8C6D53]" />
          </span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1F1B18] tracking-tight leading-tight">
            {isEn ? "Artisanal Longan Craftsmanship" : "Hành Trình Chế Tác Long Nhãn"}
          </h2>

          <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? "From early morning orchards to glowing earthen jars — each step is an act of devotion to our cultural heritage."
              : "Từ cữ hái sớm mai trên bãi bồi đến hàng chục giờ canh lửa than củi ấm — mỗi công đoạn là một sự nâng niu trọn vẹn hồn quê."}
          </p>
        </div>

        {/* 4 Giai đoạn chế tác trình bày dạng dòng chảy nghệ thuật (Không đánh số) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {craftPhases.map((phase, idx) => {
            const IconComp = phase.icon;
            return (
              <div
                key={idx}
                className="relative p-6 sm:p-7 rounded-3xl bg-white border border-[#E8DFC8] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Icon trang nhã */}
                  <div className="w-12 h-12 rounded-2xl bg-[#F6EFE5] text-[#422D1D] flex items-center justify-center transition-colors group-hover:bg-[#3D263A] group-hover:text-white">
                    <IconComp className="w-6 h-6 stroke-[1.75]" />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-[#8C6D53] uppercase tracking-wider block mb-1">
                      {phase.subtitle}
                    </span>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 leading-snug">
                      {phase.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {phase.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                  <span>{isEn ? "Traditional Craft" : "Thủ công bí truyền"}</span>
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
            posterUrl="/images/setqua.jpg"
            youtubeId="X8e-QWaVGQk"
          />
        </SectionErrorBoundary>
      </section>

      {/* ======================================================== */}
      {/* 6. GIÁ TRỊ THƯƠNG HIỆU & CAM KẾT CHẤT LƯỢNG              */}
      {/* ======================================================== */}
      <section className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs sm:text-sm font-semibold tracking-widest text-[#8C6D53] uppercase flex items-center justify-center gap-2">
            <span className="w-6 h-px bg-[#8C6D53]" />
            {isEn ? "Brand Philosophy" : "Triết Lý Thương Hiệu"}
            <span className="w-6 h-px bg-[#8C6D53]" />
          </span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1F1B18] tracking-tight leading-tight">
            {isEn ? "Preserving Tradition — Presenting Heartfelt Gratitude" : "Giữ Hồn Truyền Thống – Gửi Trao Trân Quý"}
          </h2>

          <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? "The story, mission, and generational devotion behind Nguyet Nhan Pho Hien."
              : "Câu chuyện, sứ mệnh và tâm huyết đong đầy phía sau từng sản phẩm Nguyệt Nhãn Phố Hiến."}
          </p>
        </div>

        {/* Khối triết lý tên gọi thương hiệu */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#FAF5EE] via-white to-[#F6EFE5] border border-[#E8DFC8] shadow-sm mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-stone-200">
            
            <div className="space-y-3 pt-4 md:pt-0">
              <div className="w-14 h-14 rounded-full bg-[#EBDBC6] text-[#422D1D] font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-xs">
                Nguyệt
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                {isEn ? "The Autumn Moon" : "Trăng Rằm Mùa Thu"}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xs mx-auto">
                {isEn
                  ? "Symbolizes golden harvest time, family reunion, and complete wholeness."
                  : "Biểu trưng cho mùa thu hoạch nhãn chín rộ, sự đoàn viên sum vầy bên ấm trà thơm."}
              </p>
            </div>

            <div className="space-y-3 pt-6 md:pt-0 md:px-6">
              <div className="w-14 h-14 rounded-full bg-[#EBDBC6] text-[#422D1D] font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-xs">
                Nhãn
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                {isEn ? "The Dragon Eye Jewel" : "Thức Quả Mắt Rồng"}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xs mx-auto">
                {isEn
                  ? "The celestial fruit bestowed upon riverbanks, nourishing body, blood, and mind."
                  : "Quả ngọc trời ban bồi bổ khí huyết, an thần dưỡng tâm và bồi đắp sức khỏe trường thọ."}
              </p>
            </div>

            <div className="space-y-3 pt-6 md:pt-0 md:pl-6">
              <div className="w-14 h-14 rounded-full bg-[#EBDBC6] text-[#422D1D] font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-xs">
                Phố Hiến
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                {isEn ? "Historic Homeland" : "Cội Nguồn Phố Cảng"}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xs mx-auto">
                {isEn
                  ? "Rooted in the eternal pride of Hung Yen's ancient cultural trading sanctuary."
                  : "Gắn chặt với niềm kiêu hãnh di sản 300 năm lưu giữ thức quả tiến vua nức tiếng."}
              </p>
            </div>

          </div>
        </div>

        {/* 3 Trụ cột cam kết */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E8DFC8] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              {isEn ? "100% Authentic Heritage Origin" : "100% Cội Nguồn Phố Hiến"}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {isEn
                ? "Directly sourced from ancestral orchards along the Red River dike, preserving the true Huong Chi cultivar."
                : "Thu hoạch trực tiếp từ các vườn nhãn cổ bãi bồi Chùa Hiến, bảo tồn trọn vẹn nguồn gen giống nhãn tiến vua."}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E8DFC8] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              {isEn ? "Pure & Naturally Additive-Free" : "Thuần Khiết Không Phụ Gia"}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {isEn
                ? "Zero added sugar, no sulfur bleaching, no chemicals. Only the natural sweetness of soil and sun."
                : "Nói không với tẩm ướp đường, không sấy diêm sinh độc hại. Vị ngọt thanh tao tự nhiên của đất trời."}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E8DFC8] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              {isEn ? "ISO & HACCP Certified Hygiene" : "Chuẩn Mực Vệ Sinh Quốc Tế"}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {isEn
                ? "Modern closed convection drying meets stringent international food safety standards."
                : "Quy trình sấy đối lưu khép kín đạt tiêu chuẩn ISO/HACCP, an toàn tuyệt đối cho sức khỏe người tiêu dùng."}
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. LỜI MỜI: MANG HƯƠNG VỊ PHỐ HIẾN ĐẾN GẦN HƠN           */}
      {/* ======================================================== */}
      <section className="relative py-20 bg-gradient-to-b from-[#18342B] to-[#0F221B] text-white overflow-hidden text-center px-4 sm:px-6">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.15)_0%,transparent_70%)] pointer-events-none"
        />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <span className="inline-block text-xs font-semibold tracking-widest text-[#E5CCA0] uppercase">
            {isEn ? "An Invitation to Heritage" : "Lời Mời Thưởng Thức"}
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-white tracking-tight leading-tight [text-wrap:balance]">
            {isEn ? "Bringing Pho Hien Flavor Closer to You" : "Mang Hương Vị Phố Hiến Đến Gần Hơn"}
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-stone-300 max-w-xl mx-auto leading-relaxed">
            {isEn
              ? "Discover our imperial gift collections or craft your own personalized wellness mix box."
              : "Thưởng thức trọn vẹn thức quà tiến vua ngọt lành hoặc tự tay phối chọn hộp hạt dinh dưỡng theo sở thích của riêng bạn."}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/san-pham"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E5CCA0] hover:bg-[#D8BA88] text-[#241B16] font-bold text-sm sm:text-base transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              <span>{isEn ? "Explore Gift Collections" : "Khám Phá Sản Phẩm"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/am-thuc"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 transition-all"
            >
              <BookOpen className="w-4 h-4 text-[#E5CCA0]" />
              <span>{isEn ? "Culinary Culture" : "Văn Hóa Ẩm Thực"}</span>
            </Link>

            <Link
              href="/tu-chon-hat"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 transition-all"
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
