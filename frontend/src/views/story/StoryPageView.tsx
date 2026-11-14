"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Landmark,
  Leaf,
  ShieldCheck,
  MapPin,
  Crown,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { FastImage } from "@/components/FastImage";
import { HeritageVideoSection } from "@/components/HeritageVideoSection";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useLanguageStore } from "@/stores/useLanguageStore";

export function StoryPageView() {
  const { language } = useLanguageStore();
  const isEn = language === "en";

  // Quản lý hiển thị ảnh thực tế hay ảnh mô phỏng trên các thẻ 02 & 03
  const [showRealPhoHienPhoto, setShowRealPhoHienPhoto] = useState(false);
  const [showRealIngredientPhoto, setShowRealIngredientPhoto] = useState(false);

  // 4 Bước Hành trình chế tác (04 - HÀNH TRÌNH)
  const journeySteps = [
    {
      num: 1,
      title: isEn ? "Selection" : "Tuyển chọn",
      shortDesc: isEn
        ? "Handpicking late-ripening Huong Chi longan at early dawn from ancient orchards."
        : "Thu hái nhãn Hương Chi cổ thụ đúng độ chín rộ sớm mai, chọn trái tròn cùi dày ráo nước.",
    },
    {
      num: 2,
      title: isEn ? "Processing" : "Chế biến",
      shortDesc: isEn
        ? "Skilled bamboo blade peeling ('Xoáy Long') and 36-hour gentle longan firewood drying."
        : "Tuyệt kỹ xoáy cùi bằng bút tre thủ công, sấy nhiệt đối lưu than củi nhãn 36 giờ tuần hoàn.",
    },
    {
      num: 3,
      title: isEn ? "Finishing" : "Hoàn thiện",
      shortDesc: isEn
        ? "Curing in ceramic jars, blending with northern lotus seeds and nutritious nuts."
        : "Ủ hương trong chum sành đất nung, phối cùng hạt sen Bắc bùi béo và hạt dinh dưỡng cao cấp.",
    },
    {
      num: 4,
      title: isEn ? "Gifting" : "Trao tặng",
      shortDesc: isEn
        ? "Presented in regal gift boxes, conveying centuries of heritage and heartfelt health wishes."
        : "Đóng gói hộp quà tiến vua sang trọng, gửi trao trọn vẹn ân tình và sức khỏe trường thọ.",
    },
  ];

  // 3 Trụ cột giá trị thương hiệu (05 - GIÁ TRỊ THƯƠNG HIỆU)
  const brandPillars = [
    {
      icon: MapPin,
      title: isEn ? "100% Pho Hien Heritage Origin" : "100% Cội Nguồn Phố Hiến",
      desc: isEn
        ? "Harvested directly from ancestral orchards along the Red River dike and Hien Pagoda, preserving the pure Huong Chi cultivar."
        : "Thu hoạch trực tiếp từ các vườn nhãn cổ bãi bồi sông Hồng và quanh Chùa Hiến, bảo tồn trọn vẹn nguồn gen nhãn Hương Chi quý hiếm.",
    },
    {
      icon: ShieldCheck,
      title: isEn ? "Pure & Additive-Free" : "Thuần Khiết Không Phụ Gia",
      desc: isEn
        ? "Zero added sugar, no sulfur bleaching, no artificial flavorings. Only the honeyed warmth of sun, soil, and artisan hands."
        : "Nói không với tẩm ướp đường, không sấy diêm sinh độc hại. Vị ngọt thanh tao tự nhiên đọng lại vị ngọt hậu lắng sâu nơi cuống họng.",
    },
    {
      icon: Crown,
      title: isEn ? "Royal Tribute Excellence" : "Chuẩn Mực Tiến Vua Hiện Đại",
      desc: isEn
        ? "Crafted to ISO & HACCP food safety standards, elevating imperial tribute delicacies into contemporary wellness gifts."
        : "Quy trình sấy khép kín đạt chuẩn an toàn thực phẩm ISO & HACCP, nâng tầm thức quả ngự thiện xưa thành món quà sức khỏe thanh lịch hôm nay.",
    },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden [contain:paint] bg-[#FAF8F5] text-stone-900 py-6 sm:py-10 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-6 sm:space-y-8">
        
        {/* ======================================================== */}
        {/* BREADCRUMB THANH LỊCH                                     */}
        {/* ======================================================== */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-stone-500 pl-1">
          <Link href="/" className="hover:text-amber-800 transition-colors">
            {isEn ? "Home" : "Trang chủ"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          <span className="text-amber-900 font-semibold">{isEn ? "Heritage Story" : "Câu chuyện di sản"}</span>
        </nav>

        {/* ======================================================== */}
        {/* 01 — KHỞI NGUỒN                                          */}
        {/* ======================================================== */}
        <section
          aria-labelledby="section-01-title"
          className="relative bg-[#3D263A] text-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center shadow-sm overflow-hidden"
        >
          {/* Họa tiết ánh sáng trang nhã */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle,rgba(212,175,122,0.18)_0%,transparent_70%)] pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 w-80 h-80 bg-[radial-gradient(circle,rgba(212,175,122,0.12)_0%,transparent_70%)] pointer-events-none"
          />

          <div className="relative z-10 max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <span className="inline-block text-[11px] sm:text-xs font-semibold tracking-[0.22em] text-[#D4AF7A] uppercase">
              {isEn ? "01 — ORIGIN" : "01 — KHỞI NGUỒN"}
            </span>

            <h1
              id="section-01-title"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-medium text-white tracking-tight leading-tight [text-wrap:balance]"
            >
              {isEn ? "A Tale from the Land of Longan" : "Một câu chuyện từ miền đất nhãn"}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-stone-300 font-normal leading-relaxed max-w-2xl mx-auto [text-wrap:pretty]">
              {isEn
                ? "Where traditional flavor is cherished through every meaningful gift."
                : "Nơi hương vị truyền thống được nâng niu qua từng món quà."}
            </p>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 02 — CỘI NGUỒN (2 Cột: Ảnh Phố Hiến - Vùng đất Phố Hiến)  */}
        {/* ======================================================== */}
        <section aria-labelledby="section-02-title" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Cột Trái: Ảnh Phố Hiến Card (Theo đúng mockup) */}
          <div
            onClick={() => setShowRealPhoHienPhoto(!showRealPhoHienPhoto)}
            className="group relative bg-[#EBDBC6] hover:bg-[#E5D3BD] rounded-2xl sm:rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center min-h-[220px] sm:min-h-[280px] shadow-xs transition-all cursor-pointer overflow-hidden border border-[#DECCB5]"
            title={isEn ? "Click to view historic photography" : "Bấm để xem ảnh thực tế di tích Phố Hiến"}
          >
            {showRealPhoHienPhoto ? (
              <div className="absolute inset-0 w-full h-full">
                <FastImage
                  src="/images/chuachuong.jpg"
                  fallbackSrc="/images/chuachuong_hero_bg.jpg"
                  alt={isEn ? "Ancient Pho Hien Temple" : "Di tích Chùa Hiến và Cổ Thụ Nhãn Lồng"}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white text-left p-3 rounded-xl bg-black/40 backdrop-blur-xs border border-white/20">
                  <p className="text-xs font-bold text-amber-300">
                    {isEn ? "Hien Pagoda & The Ancestral Longan Tree" : "Chùa Hiến & Cây Nhãn Tổ 300 Năm"}
                  </p>
                  <p className="text-[11px] text-stone-200 mt-0.5">
                    {isEn ? "Historic landmark in Hung Yen" : "Di tích lịch sử văn hóa quốc gia Phố Hiến"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 text-[#5C422F]">
                <div className="w-16 h-16 rounded-2xl bg-[#DFCCA2]/50 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Landmark className="w-8 h-8 sm:w-9 sm:h-9 text-[#5C422F] stroke-[1.75]" />
                </div>
                <span className="font-serif text-base sm:text-lg font-medium text-[#4B3423] tracking-wide">
                  {isEn ? "Pho Hien Photography" : "Ảnh Phố Hiến"}
                </span>
                <span className="text-xs text-[#7A5F48] flex items-center gap-1 group-hover:underline">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {isEn ? "View landmark photo" : "Xem ảnh Chùa Hiến & Cây nhãn tổ"}
                </span>
              </div>
            )}
          </div>

          {/* Cột Phải: Nội dung Vùng đất Phố Hiến */}
          <div className="flex flex-col justify-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#EADBCC] shadow-xs space-y-3 sm:space-y-4">
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] text-[#8C6D53] uppercase">
              {isEn ? "02 — THE ROOTS" : "02 — CỘI NGUỒN"}
            </span>

            <h2
              id="section-02-title"
              className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight leading-tight"
            >
              {isEn ? "The Heritage Land of Pho Hien" : "Vùng đất Phố Hiến"}
            </h2>

            <p className="text-sm sm:text-base font-medium text-stone-700 leading-snug">
              {isEn
                ? "Rich history and timeless cultural values of our homeland."
                : "Lịch sử và những giá trị văn hóa quê hương."}
            </p>

            <div className="space-y-3 text-stone-600 text-xs sm:text-sm leading-relaxed pt-1 border-t border-stone-100">
              <p>
                {isEn
                  ? "Flourishing in the 16th and 17th centuries as Dang Ngoai's most bustling international trading port, Pho Hien earned the legendary proverb: 'First is Kinh Ky, second is Pho Hien'."
                  : "Vào thế kỷ 16 và 17, Phố Hiến từng là thương cảng quốc tế sầm uất bậc nhất Đàng Ngoài, làm nên câu ca lưu truyền qua bao đời: &ldquo;Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến&rdquo;."}
              </p>
              <p>
                {isEn
                  ? "Nourished by the deep alluvial silt of the Red River and sheltered beside the venerable Hien Pagoda with its 300-year-old mother tree, this land gives birth to longans of unparalleled crispness, translucent amber hue, and lingering honey sweetness."
                  : "Được bồi đắp bởi lớp phù sa màu mỡ sông Hồng và bóng mát cây nhãn tổ hơn 3 thế kỷ tại Chùa Hiến, đất Phố Hiến đã kết tinh nên giống nhãn lồng Hương Chi nức tiếng — cùi dày giòn ráo, sắc vàng cánh gián và vị ngọt thanh đượm hương hoa."}
              </p>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 03 — TINH HOA (2 Cột: Từ nhãn đến món quà - Ảnh nguyên liệu) */}
        {/* ======================================================== */}
        <section aria-labelledby="section-03-title" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Cột Trái: Nội dung Từ nhãn đến món quà */}
          <div className="order-2 md:order-1 flex flex-col justify-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#EADBCC] shadow-xs space-y-3 sm:space-y-4">
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] text-[#8C6D53] uppercase">
              {isEn ? "03 — THE ESSENCE" : "03 — TINH HOA"}
            </span>

            <h2
              id="section-03-title"
              className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight leading-tight"
            >
              {isEn ? "From Pure Longan to Gourmet Gift" : "Từ nhãn đến món quà"}
            </h2>

            <p className="text-sm sm:text-base font-medium text-stone-700 leading-snug">
              {isEn
                ? "The exquisite harmony of dried longan, lotus seeds, and nutritious nuts."
                : "Sự hòa quyện giữa long nhãn, hạt sen và hạt dinh dưỡng."}
            </p>

            <div className="space-y-3 text-stone-600 text-xs sm:text-sm leading-relaxed pt-1 border-t border-stone-100">
              <p>
                {isEn
                  ? "From the delicate 'Xoáy Long' craft that removes the seed while keeping the cup intact, each dried longan is paired with fragrant northern lotus seeds and wholesome nuts (almonds, walnuts, cashews, macadamias)."
                  : "Từ đôi bàn tay khéo léo của người nghệ nhân dùng bút tre xoáy hạt giữ nguyên vẹn đài múi sen, từng múi long nhãn thơm ngát được kết hợp tài tình cùng hạt sen Bắc bùi ngậy và các loại hạt dinh dưỡng (hạnh nhân, óc chó, hạt điều, mắc ca, bí xanh)."}
              </p>
              <p>
                {isEn
                  ? "Not merely a sweet delicacy, it is an ancient imperial nourishment that invigorates blood, calms the mind, and embraces modern well-being in every gentle sip of tea."
                  : "Không chỉ là một thức quà thưởng thức, đây là sự giao thoa hoàn hảo giữa ngự thiện hoàng gia dưỡng tâm an thần và triết lý dinh dưỡng hiện đại, nâng niu sức khỏe người nhận."}
              </p>
            </div>
          </div>

          {/* Cột Phải: Ảnh nguyên liệu Card (Theo đúng mockup) */}
          <div
            onClick={() => setShowRealIngredientPhoto(!showRealIngredientPhoto)}
            className="order-1 md:order-2 group relative bg-[#EBDBC6] hover:bg-[#E5D3BD] rounded-2xl sm:rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center min-h-[220px] sm:min-h-[280px] shadow-xs transition-all cursor-pointer overflow-hidden border border-[#DECCB5]"
            title={isEn ? "Click to view ingredients photography" : "Bấm để xem ảnh thực tế nguyên liệu cao cấp"}
          >
            {showRealIngredientPhoto ? (
              <div className="absolute inset-0 w-full h-full">
                <FastImage
                  src="/images/combo3sp.jpg"
                  fallbackSrc="/images/nuts/longnhanomsen.jpg"
                  alt={isEn ? "Longan, lotus seeds, and premium nuts" : "Long nhãn, hạt sen Bắc và hạt dinh dưỡng"}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white text-left p-3 rounded-xl bg-black/40 backdrop-blur-xs border border-white/20">
                  <p className="text-xs font-bold text-amber-300">
                    {isEn ? "Premium Natural Ingredients" : "Nguyên Liệu Tự Nhiên Tuyển Chọn"}
                  </p>
                  <p className="text-[11px] text-stone-200 mt-0.5">
                    {isEn ? "Longan, lotus seed, almond & cashew" : "Long nhãn ôm sen, hạt sen sấy, mắc ca, hạnh nhân"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 text-[#5C422F]">
                <div className="w-16 h-16 rounded-2xl bg-[#DFCCA2]/50 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Leaf className="w-8 h-8 sm:w-9 sm:h-9 text-[#5C422F] stroke-[1.75]" />
                </div>
                <span className="font-serif text-base sm:text-lg font-medium text-[#4B3423] tracking-wide">
                  {isEn ? "Ingredients Photography" : "Ảnh nguyên liệu"}
                </span>
                <span className="text-xs text-[#7A5F48] flex items-center gap-1 group-hover:underline">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {isEn ? "View longan & nuts photo" : "Xem ảnh long nhãn & hạt dưỡng sinh"}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 04 — HÀNH TRÌNH (Card 4 bước theo đúng mockup)          */}
        {/* ======================================================== */}
        <section
          aria-labelledby="section-04-title"
          className="bg-[#EFE5D6] rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-12 shadow-xs border border-[#DFD1BE]"
        >
          <div className="text-center mb-8 sm:mb-10">
            <span
              id="section-04-title"
              className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] text-[#7A5D45] uppercase block"
            >
              {isEn ? "04 — THE JOURNEY" : "04 — HÀNH TRÌNH"}
            </span>
          </div>

          {/* 4 Vòng tròn tương ứng với Tuyển chọn - Chế biến - Hoàn thiện - Trao tặng */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 relative">
            {/* Đường chỉ nối trang nhã trên màn hình lớn */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-6 left-[12%] right-[12%] h-[1px] bg-[#CBB59F] z-0"
            />

            {journeySteps.map((step) => (
              <div
                key={step.num}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                {/* Vòng tròn số nền tím đậm bo tròn theo mockup */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#42283C] text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-sm transition-transform duration-300 group-hover:scale-110">
                  {step.num}
                </div>

                {/* Tiêu đề bước */}
                <h3 className="mt-3 sm:mt-4 font-serif font-bold text-sm sm:text-base text-stone-900">
                  {step.title}
                </h3>

                {/* Diễn giải chi tiết giúp người dùng hiểu sâu */}
                <p className="mt-1 text-[11px] sm:text-xs text-stone-600 leading-relaxed max-w-[200px]">
                  {step.shortDesc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* PHẦN GIỮ LẠI: TƯ LIỆU KÝ SỰ DI SẢN (VIDEO TƯ LIỆU)       */}
        {/* Theo yêu cầu người dùng: Giữ nguyên phần video tài liệu  */}
        {/* ======================================================== */}
        <section className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-[#EADBCC]">
          <SectionErrorBoundary sectionName="Tư Liệu Ký Sự Di Sản">
            <HeritageVideoSection
              language={language as "vi" | "en"}
              posterUrl="/images/setqua.jpg"
              youtubeId="X8e-QWaVGQk"
            />
          </SectionErrorBoundary>
        </section>

        {/* ======================================================== */}
        {/* 05 — GIÁ TRỊ THƯƠNG HIỆU                                 */}
        {/* ======================================================== */}
        <section
          aria-labelledby="section-05-title"
          className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-14 border border-[#EADBCC] shadow-xs text-center space-y-4 sm:space-y-6"
        >
          <div className="max-w-3xl mx-auto space-y-2">
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] text-[#8C6D53] uppercase block">
              {isEn ? "05 — BRAND VALUES" : "05 — GIÁ TRỊ THƯƠNG HIỆU"}
            </span>

            <h2
              id="section-05-title"
              className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight leading-tight [text-wrap:balance]"
            >
              {isEn
                ? "Preserving Heritage Soul — Presenting Heartfelt Gratitude"
                : "Giữ hồn truyền thống – Gửi trao trân quý"}
            </h2>

            <p className="text-sm sm:text-base text-stone-600 font-normal leading-relaxed max-w-2xl mx-auto [text-wrap:pretty]">
              {isEn
                ? "The story, sacred mission, and artisan dedication behind Nguyet Nhan Pho Hien."
                : "Câu chuyện, sứ mệnh và tâm huyết phía sau Nguyệt Nhãn Phố Hiến."}
            </p>
          </div>

          {/* Triết lý tên gọi thương hiệu: Nguyệt - Nhãn - Phố Hiến */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#FBF7F0] border border-[#E8DFC8] my-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-center">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-[#EBDBC6] mx-auto flex items-center justify-center text-[#5C422F] font-bold text-base font-serif">
                  Nguyệt
                </div>
                <h4 className="font-bold text-sm text-stone-900">{isEn ? "The Autumn Moon" : "Trăng Rằm Mùa Thu"}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {isEn
                    ? "Symbolizes the completeness of family reunions and golden harvest."
                    : "Biểu trưng cho mùa thu hoạch rực vàng, sự vẹn tròn và đoàn viên ấm áp."}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-[#EBDBC6] mx-auto flex items-center justify-center text-[#5C422F] font-bold text-base font-serif">
                  Nhãn
                </div>
                <h4 className="font-bold text-sm text-stone-900">{isEn ? "Dragon Eye Jewel" : "Thức Quả Mắt Rồng"}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {isEn
                    ? "The celestial fruit bestowed upon the riverbank, nourishing vitality and long life."
                    : "Quả ngọc trời ban bồi bổ khí huyết, an thần dưỡng tâm và kiện tỳ."}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-[#EBDBC6] mx-auto flex items-center justify-center text-[#5C422F] font-bold text-base font-serif">
                  Phố Hiến
                </div>
                <h4 className="font-bold text-sm text-stone-900">{isEn ? "Historic Land" : "Cội Nguồn Phố Cảng"}</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {isEn
                    ? "Rooted in the immortal cultural pride of Hung Yen's ancient trading sanctuary."
                    : "Niềm tự hào di sản văn hiến hơn 300 năm lưu giữ thức quả tiến vua."}
                </p>
              </div>
            </div>
          </div>

          {/* 3 Trụ cột cam kết */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left pt-2">
            {brandPillars.map((pillar, idx) => {
              const PillarIcon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#EADBCC] space-y-3 hover:border-amber-700/40 transition-colors shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EBDBC6] flex items-center justify-center text-[#5C422F]">
                    <PillarIcon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-stone-900">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 06 — LỜI MỜI (Card cuối màu tím đậm theo đúng mockup)    */}
        {/* ======================================================== */}
        <section
          aria-labelledby="section-06-title"
          className="relative bg-[#3D263A] text-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center shadow-md overflow-hidden"
        >
          {/* Hào quang nền ấm áp */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[radial-gradient(circle,rgba(212,175,122,0.15)_0%,transparent_70%)] pointer-events-none"
          />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <span className="inline-block text-[11px] sm:text-xs font-semibold tracking-[0.22em] text-[#D4AF7A] uppercase">
              {isEn ? "06 — INVITATION" : "06 — LỜI MỜI"}
            </span>

            <h2
              id="section-06-title"
              className="text-2xl sm:text-3xl md:text-4xl font-serif font-medium text-white tracking-tight leading-tight [text-wrap:balance]"
            >
              {isEn ? "Bringing Pho Hien Flavor Closer to You" : "Mang hương vị Phố Hiến đến gần hơn"}
            </h2>

            {/* Nút bấm Khám phá sản phẩm theo đúng mockup */}
            <div className="pt-2">
              <Link
                href="/san-pham"
                className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#DFB882] hover:bg-[#D4A970] text-[#3D263A] font-bold text-sm sm:text-base transition-all duration-200 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>{isEn ? "Discover Products" : "Khám phá sản phẩm"}</span>
                <ArrowRight className="w-4 h-4 text-[#3D263A]" />
              </Link>
            </div>

            {/* Các liên kết bổ sung khám phá ẩm thực & xưởng hạt */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs text-stone-300">
              <Link
                href="/am-thuc"
                className="hover:text-[#D4AF7A] transition-colors flex items-center gap-1.5 underline underline-offset-4"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isEn ? "Gourmet Culture" : "Văn hóa ẩm thực"}</span>
              </Link>
              <span>•</span>
              <Link
                href="/tu-chon-hat"
                className="hover:text-[#D4AF7A] transition-colors flex items-center gap-1.5 underline underline-offset-4"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isEn ? "Custom Mix Workshop" : "Xưởng tự chọn hạt"}</span>
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

export default StoryPageView;
