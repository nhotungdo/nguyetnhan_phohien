"use client";

import Link from "next/link";
import {
  BookOpen,
  Landmark,
  Trees,
  Sun,
  Flame,
  ShieldCheck,
  CheckCircle,
  MapPin,
  Award,
  Heart,
  Crown,
  ArrowRight,
  Clock,
  Leaf,
  ChevronRight,
  Layers,
} from "lucide-react";
import { FastImage } from "@/components/FastImage";
import { HeritageVideoSection } from "@/components/HeritageVideoSection";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useLanguageStore } from "@/stores/useLanguageStore";
import { scrollToSection } from "@/lib/scrollToSection";

export function StoryPageView() {
  const { language } = useLanguageStore();

  const isEn = language === "en";

  // Danh mục điều hướng nhanh giữa các chương câu chuyện
  const chapters = [
    { id: "coi-nguon", label: isEn ? "1. Origins & Ancient Tree" : "1. Cội Nguồn Địa Linh" },
    { id: "tien-vua", label: isEn ? "2. Golden Age & Royal Tribute" : "2. Kỳ Tích Tiến Vua" },
    { id: "nghe-thuat", label: isEn ? "3. Artisanal Craftsmanship" : "3. Tuyệt Kỹ Xoáy Long" },
    { id: "thuoc-phim", label: isEn ? "4. Heritage Archive Film" : "4. Thước Phim Ký Sự" },
    { id: "duong-dai", label: isEn ? "5. Modern Heritage Legacy" : "5. Tiếp Nối Đương Đại" },
  ];

  // 3 Đặc điểm độc bản nhận diện Nhãn Lồng Phố Hiến
  const uniqueFeatures = [
    {
      icon: Layers,
      title: isEn ? "Thick & Crisp Flesh" : "Cùi Dày Giòn Ráo Nước",
      desc: isEn
        ? "The pulp is thick, firm, and layered like dragon scales. Biting into it yields a crisp, non-watery texture unique to alluvial soil."
        : "Cùi nhãn dày cộm, múi lồng khít vào nhau, ráo nước giòn sần sật. Bóc ra ráo ngón tay, cắn vào giòn tan đậm đà vị ngọt sông Hồng.",
    },
    {
      icon: Sun,
      title: isEn ? "Amber Translucent Hue" : "Sắc Hổ Phách Tinh Khiết",
      desc: isEn
        ? "Translucent ivory flesh holding a tiny obsidian-black seed, glowing with warm amber warmth under golden natural light."
        : "Múi nhãn trắng ngà trong suốt ôm trọn hạt tiêu nhỏ xíu đen tuyền như mắt rồng, phản chiếu ánh hổ phách tự nhiên dưới nắng thu.",
    },
    {
      icon: Leaf,
      title: isEn ? "Lingering Floral Aroma" : "Hương Thơm Sâu Lắng",
      desc: isEn
        ? "A deep, honey-floral sweetness that unfolds gently and lingers in the throat for minutes after savoring."
        : "Vị ngọt thanh thuần không gắt, quyện hương thơm hoa nhãn thoang thoảng dịu nhẹ, đọng lại vị ngọt hậu lắng sâu nơi cuống họng.",
    },
  ];

  // 4 Bước tuyệt kỹ chế tác long nhãn cổ truyền
  const craftingSteps = [
    {
      step: "01",
      icon: Trees,
      tag: isEn ? "Selection" : "Tuyển Chọn Vườn Cổ",
      title: isEn ? "Handpicking at Peak Ripeness" : "Tuyển Trái Hương Chi Đúng Độ Chín Rộ",
      desc: isEn
        ? "Only late-ripening Huong Chi longans from ancient alluvial orchards are harvested in early autumn when sweetness and pulp thickness reach perfection."
        : "Chỉ thu hái những chùm nhãn lồng Hương Chi cổ thụ vào cữ sớm mai tiết trời thu. Trái tròn đều, vỏ mỏng rám vàng, hạt nhỏ cùi dày căng mọng.",
    },
    {
      step: "02",
      icon: FeatherIcon,
      tag: isEn ? "Skillful Peeling" : "Nghệ Thuật Bút Tre",
      title: isEn ? "The Masterful 'Xoáy Long' Technique" : "Tuyệt Kỹ 'Xoáy Long' Tách Hạt Bằng Bút Tre",
      desc: isEn
        ? "Using a curved bamboo blade, artisans skillfully peel and remove the seed in seconds without bruising or tearing the delicate pulp, retaining the sacred lotus cup shape."
        : "Nghệ nhân dùng đầu bút tre uốn cong khéo léo bóc vỏ và tách hạt chỉ trong một đường xoáy dứt khoát. Miệng múi tròn vẹn tựa đóa hoa đài sen, không rách thịt, không dập nước.",
    },
    {
      step: "03",
      icon: Flame,
      tag: isEn ? "Convection Fire" : "Lửa Than Nhãn",
      title: isEn ? "36-Hour Gentle Wood Smoke & Drying" : "Sấy Lửa Than Củi Nhãn 36 Giờ Tuần Hoàn",
      desc: isEn
        ? "Pulp cups are arranged on bamboo racks and dried with gentle, consistent warmth from dried longan firewood, caramelizing natural fructose into glowing amber."
        : "Từng múi long xếp đều tăm tắp trên phên tre, sấy bằng than đượm từ chính cành nhãn già. Hơi ấm lan tỏa suốt ngày đêm, cô đọng từng giọt mật hoa thành sắc vàng cánh gián.",
    },
    {
      step: "04",
      icon: Award,
      tag: isEn ? "Aging & Curing" : "Ủ Hương Chum Sành",
      title: isEn ? "Natural Ceramic Jar Curing" : "Ủ Hương Trong Chum Sành Gia Truyền",
      desc: isEn
        ? "Finished dried longans rest in earthenware jars to balance moisture and deepen aroma naturally. Absolutely zero sugar, sulfur, or artificial preservatives."
        : "Long nhãn nguội được hạ lửa ủ trong chum sành đất nung để cân bằng độ ẩm và định hương. Thành phẩm dẻo thơm tự nhiên, tuyệt đối không tẩm đường hay hóa chất.",
    },
  ];

  // 3 Giá trị cốt lõi di sản
  const commitments = [
    {
      icon: MapPin,
      title: isEn ? "100% Native Pho Hien Origin" : "100% Cội Nguồn Phố Hiến",
      desc: isEn
        ? "Harvested directly from certified ancestral orchards along the Red River dike in Hung Yen city."
        : "Thu hoạch trực tiếp từ vùng trồng nhãn di sản phù sa sông Hồng và Chùa Hiến, bảo tồn trọn vẹn giống cội nguồn.",
    },
    {
      icon: ShieldCheck,
      title: isEn ? "Zero Additives, Pure Nature" : "Chuẩn Sạch 100% Không Phụ Gia",
      desc: isEn
        ? "No added sugar, no sulfur bleaching, no artificial aroma. The natural sweetness of sun, soil, and skilled hands."
        : "Nói không với tẩm ướp đường, không sấy diêm sinh độc hại. Vị ngọt thơm thuần khiết từ lượng đường tự nhiên của đất trời.",
    },
    {
      icon: Crown,
      title: isEn ? "Royal Tribute Quality Standard" : "Chất Lượng Tinh Hoa Tiến Vua",
      desc: isEn
        ? "Modern convection drying meets ISO & HACCP hygiene standards while preserving centuries-old royal taste."
        : "Hệ thống sấy đối lưu khép kín đạt tiêu chuẩn ISO/HACCP, kết hợp khéo léo cùng bí quyết hoàng cung lưu giữ sắc hương vẹn tròn.",
    },
  ];

  return (
    <div className="w-full max-w-full overflow-hidden [contain:paint] bg-[#FAF8F5] text-stone-900">
      {/* ======================================================== */}
      {/* 1. HERO BANNER: KÝ SỰ LONG NHÃN PHỐ HIẾN                 */}
      {/* ======================================================== */}
      <section className="relative py-16 sm:py-24 lg:py-28 bg-[#0B3B2C] text-white overflow-hidden border-b border-[#1E5644]">
        {/* Hào quang nền hoàng kim ấm áp */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 w-96 h-96 bg-[radial-gradient(circle,rgba(217,119,6,0.25)_0%,transparent_70%)] pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-24 w-[30rem] h-[30rem] bg-[radial-gradient(circle,rgba(217,119,6,0.2)_0%,transparent_70%)] pointer-events-none"
        />

        {/* Họa tiết hoa văn văn hóa Đông Đô chìm */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D97706_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-5xl text-center">
          {/* Breadcrumb trang nhã */}
          <nav className="inline-flex items-center gap-2 text-xs sm:text-sm text-emerald-200/80 mb-6 bg-emerald-950/60 px-4 py-1.5 rounded-full border border-emerald-800/70">
            <Link href="/" className="hover:text-amber-300 transition-colors">
              {isEn ? "Home" : "Trang chủ"}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="text-amber-300 font-semibold">{isEn ? "Heritage Story" : "Câu chuyện di sản"}</span>
          </nav>

          {/* Huy hiệu di sản */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-semibold border border-amber-400/40 mb-4 shadow-xs">
            <Landmark className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="uppercase tracking-widest text-[11px] sm:text-xs">
              {isEn ? "300+ Years Heritage Chronicle" : "Chứng Tích 300+ Năm Phố Hiến"}
            </span>
          </div>

          {/* Tiêu đề chính hoàng tráng */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white mb-6 [text-wrap:balance]">
            {isEn
              ? "The Chronicle of Pho Hien Longan — Royal Tribute of Hung Yen"
              : "Ký Sự Long Nhãn Phố Hiến: Hương Vị Tiến Vua Đậm Đà Hồn Đất Hưng Yên"}
          </h1>

          {/* Đoạn mở đầu văn phong ký sự văn hiến */}
          <p className="text-sm sm:text-base md:text-lg text-emerald-100/90 max-w-3xl mx-auto leading-relaxed font-normal mb-10 [text-wrap:pretty]">
            {isEn
              ? "Journey back to the 16th century to uncover the alluvial magic of the Red River, the sacred ancestral mother tree at Hien Pagoda, and the centuries-old artisanal craft of royal tribute longan."
              : "Ngược dòng thời gian về thế kỷ 16, lắng nghe câu chuyện về vùng đất bãi bồi sông Hồng trù phú, cây nhãn tổ hơn 300 năm tuổi và tuyệt kỹ xoáy cùi nhãn tiến vua lưu truyền qua bao thế hệ người con Phố Hiến."}
          </p>

          {/* Thanh chuyển hướng nhanh giữa 5 chương (Chapter Quick Navigation) */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
            {chapters.map((chap) => (
              <button
                key={chap.id}
                type="button"
                onClick={() => scrollToSection(chap.id)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-amber-500/25 text-emerald-100 hover:text-amber-200 border border-white/15 text-xs sm:text-sm font-medium transition-all shadow-xs cursor-pointer active:scale-95"
              >
                {chap.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. CHƯƠNG 1: CỘI NGUỒN ĐỊA LINH & CÂY NHÃN TỔ CHÙA HIẾN  */}
      {/* ======================================================== */}
      <section id="coi-nguon" className="py-14 sm:py-20 lg:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          {/* Header Chương 1 */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              {isEn ? "Chapter 1: The Sacred Origin" : "Chương I: Cội Nguồn Địa Linh"}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0B3B2C] tracking-tight leading-tight [text-wrap:balance]">
              {isEn
                ? "Red River Alluvium & The Sacred Mother Tree at Hien Pagoda"
                : "Phù Sa Sông Hồng & Huyền Tích Cây Nhãn Tổ Chùa Hiến"}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed [text-wrap:pretty]">
              {isEn
                ? "Every sweet drop of longan carries the deep memory of the river delta and the spiritual shade of the ancient Buddhist pagoda."
                : "Mỗi giọt mật long nhãn thơm ngát đều chắt chiu từ linh khí bãi bồi châu thổ sông Hồng và bóng mát thanh tịnh của ngôi chùa cổ trăm năm."}
            </p>
          </div>

          {/* Nội dung kết hợp hình ảnh và câu chuyện */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-16">
            {/* Cột ảnh di tích */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/3] sm:aspect-[4/5] rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-amber-50">
                <FastImage
                  src="/images/chuachuong.jpg"
                  fallbackSrc="/images/combo3sp.jpg"
                  alt={isEn ? "Hien Pagoda and Ancient Longan Grove" : "Chùa Hiến và Cổ Thụ Nhãn Lồng Hưng Yên"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white p-3 rounded-xl bg-black/40 backdrop-blur-xs border border-white/20">
                  <p className="text-xs font-semibold text-amber-300">
                    {isEn ? "Historic Monument in Hung Yen" : "Di Tích Lịch Sử Văn Hóa Phố Hiến"}
                  </p>
                  <p className="text-[11px] text-stone-200 mt-0.5">
                    {isEn
                      ? "Ancient temple where the Mother Longan Tree has stood for over 300 years"
                      : "Nơi gìn giữ cây nhãn tổ hơn 3 thế kỷ bên mái chùa cong rêu phong"}
                  </p>
                </div>
              </div>
            </div>

            {/* Cột lời tự sự ký sự */}
            <div className="lg:col-span-7 space-y-6">
              {/* Đoạn trích ca dao xưa */}
              <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/80 border-l-4 border-amber-600 shadow-2xs">
                <p className="text-amber-950 font-serif italic text-base sm:text-lg leading-relaxed [text-wrap:pretty]">
                  &ldquo;Dù ai buôn Bắc bán Đông
                  <br />
                  Đố ai quên được nhãn lồng Hưng Yên.&rdquo;
                </p>
                <p className="text-xs text-amber-800 font-semibold mt-2 uppercase tracking-wider">
                  — {isEn ? "Ancient Folk Verse of Pho Hien" : "Ca dao cổ truyền ngàn xưa"}
                </p>
              </div>

              <div className="space-y-4 text-stone-700 text-sm sm:text-base leading-relaxed">
                <p>
                  {isEn
                    ? "Nestled on the fertile bends of the Red River, Hung Yen is endowed with rich alluvial silt deposited over millennia. This mineral-rich soil, paired with pure underground aquifers and temperate delta breezes, creates an irreplaceable terroir where the Huong Chi longan variety flourishes with crisp texture, honey sweetness, and intoxicating floral aroma."
                    : "Nằm nép mình bên khúc quanh màu mỡ của dòng sông Hồng và sông Luộc, vùng đất Hưng Yên được thiên nhiên ưu ái ban tặng lớp phù sa bồi lắng ngàn đời. Lớp đất thịt màu mỡ giàu khoáng chất kết hợp cùng mạch nước ngầm thanh khiết và những đợt gió sông mát rượi đã tạo nên một điều kiện thổ nhưỡng độc nhất vô nhị — nơi giống nhãn lồng Hương Chi kết tinh được độ giòn ráo, vị ngọt thanh mát và hương thơm sâu lắng mà không vùng đất nào sánh bằng."}
                </p>
                <p>
                  {isEn
                    ? "In the courtyard of Hien Pagoda stands the venerable Mother Longan Tree, dating back to the late Le Dynasty (over 300 years old). Documented in imperial chronicles as the botanical origin of Pho Hien longan, its roots anchor not only the soil, but the very soul and proud cultural heritage of an entire province."
                    : "Ngay trong khuôn viên Chùa Hiến (thành phố Hưng Yên), cây nhãn tổ đại thụ có niên đại từ thời Hậu Lê (hơn 3 thế kỷ) vẫn sừng sững uy nghiêm. Cành lá sum suê của cây nhãn tổ được ghi chép trong sử sách như cội nguồn sinh sôi của mọi giống nhãn quý Hưng Yên. Đây không chỉ là một chứng tích thực vật, mà còn là linh hồn, là niềm kiêu hãnh ngàn đời của người dân đất nhãn."}
                </p>
              </div>
            </div>
          </div>

          {/* 3 Thẻ Đặc Điểm Độc Bản Nhận Diện */}
          <div className="pt-4 border-t border-[#E8DFC8]">
            <h3 className="text-center text-lg sm:text-xl font-bold text-[#0B3B2C] mb-8">
              {isEn ? "3 Distinct Hallmarks of Pho Hien Longan" : "3 Nét Độc Bản Phân Biệt Nhãn Lồng Tiến Vua"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {uniqueFeatures.map((feat, idx) => {
                const IconComponent = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white border border-[#E8DFC8] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base sm:text-lg font-bold text-stone-900">{feat.title}</h4>
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. CHƯƠNG 2: THƯƠNG CẢNG ĐỆ NHỊ & THỨC QUẢ TIẾN VUA       */}
      {/* ======================================================== */}
      <section id="tien-vua" className="py-14 sm:py-20 lg:py-24 bg-[#F5EFE6] border-y border-[#E2D8C3] relative">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          {/* Header Chương 2 */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#0B3B2C] bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              {isEn ? "Chapter 2: The Royal Tribute" : "Chương II: Kỳ Tích Tiến Vua"}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0B3B2C] tracking-tight leading-tight [text-wrap:balance]">
              {isEn
                ? "First is Kinh Ky, Second is Pho Hien — From River Port to Imperial Court"
                : "Thứ Nhất Kinh Kỳ, Thứ Nhì Phố Hiến — Từ Bến Sông Vào Hoàng Cung"}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed [text-wrap:pretty]">
              {isEn
                ? "How a humble riverfruit captured the admiration of kings, courtiers, and international maritime merchants."
                : "Hành trình thứ quả ngọt ngào chinh phục đấng quân vương và các thương nhân thuyền buôn Á - Âu thế kỷ 16 - 17."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Cột câu chuyện lịch sử */}
            <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
              <div className="space-y-4 text-stone-700 text-sm sm:text-base leading-relaxed">
                <p>
                  {isEn
                    ? "In the 16th and 17th centuries, Pho Hien was the most bustling international trading port of Dang Ngoai. Ships from Portugal, the Netherlands, Japan, and China anchored along the Red River, trading silk, porcelain, and spices. Amidst this grandeur, Pho Hien longan emerged as an unforgettable delight for foreign merchants."
                    : "Vào thế kỷ 16 và 17, Phố Hiến bước vào thời kỳ cực thịnh, trở thành thương cảng quốc tế sầm uất bậc nhất Đàng Ngoài. Các đoàn thuyền buôn từ Bồ Đào Nha, Hà Lan, Nhật Bản và Trung Hoa tấp nập cập bến đôi bờ sông Hồng để giao thương tơ lụa, gốm sứ. Giữa cảnh phồn hoa bến bãi, hương vị quả nhãn chín mọng mùa thu trở thành thứ quà lưu luyến bất cứ ai từng một lần ghé lại."}
                </p>
                <p>
                  {isEn
                    ? "Legend tells that a patrolling imperial mandarin tasted freshly harvested longans in Pho Hien. Spellbound by the amber translucence and honey-sweet purity, he personally selected the finest bunches to present to King Le and Lord Trinh. Delighted by its celestial flavor, the monarch decreed Pho Hien longan an official annual tribute."
                    : "Tương truyền, một vị quan tuần phủ khi kinh lý qua Phố Hiến đúng cữ nhãn chín rộ đầu thu. Nếm thử múi nhãn cùi dày mọng mật, thơm mát thanh tao, vị quan ngỡ ngàng trước thức quả ngọc của đất trời liền cẩn thận chọn lọc những chùm trái thượng hạng dâng về Kinh thành Thăng Long dâng lên Đức Vua và Hoàng tộc. Vua nếm thử tấm tắc ngợi khen, lập tức sắc phong nhãn lồng Phố Hiến làm sản vật tiến vua hàng năm."}
                </p>
                <p>
                  {isEn
                    ? "In royal banquets, longan was served as a prestigious delicacy for high-ranking dignitaries and foreign ambassadors. The court physicians praised it as 'Dragon Eye' (Long Nhãn) — nourishing blood, calming spirit, and revitalizing the royal constitution."
                    : "Trong chốn cung đình nguy nga, long nhãn ngự thiện được dùng để chiêu đãi các sứ thần bang giao và chăm sóc long thể. Các ngự y triều đình ca ngợi long nhãn là vị thuốc quý bồi bổ khí huyết, an thần dưỡng tâm và kiện tỳ khai vị."}
                </p>
              </div>

              {/* Hộp trích dẫn sử liệu */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8DFC8] flex items-start gap-4 shadow-2xs">
                <Crown className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-stone-900">
                    {isEn ? "Imperial Registry Record" : "Ghi Chép Sử Sách Triều Đình"}
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {isEn
                      ? "Recorded in ancient geographic annals as the crowning specialty of Son Nam town, unsurpassed in fragrance and royal value."
                      : "Sách 'Đồng Khánh dư địa chí' và các thư tịch cổ đều khẳng định nhãn lồng xứ Hưng Yên là thứ quả đứng đầu các phẩm vật tiến cống trấn Sơn Nam."}
                  </p>
                </div>
              </div>
            </div>

            {/* Cột ảnh sản phẩm tiến vua */}
            <div className="lg:col-span-5 relative order-1 lg:order-2">
              <div className="relative aspect-[4/3] sm:aspect-[4/5] rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-amber-100">
                <FastImage
                  src="/images/combo3sp.jpg"
                  fallbackSrc="/images/anhdep1.png"
                  alt={isEn ? "Pho Hien Royal Delicacy" : "Phẩm vật long nhãn tiến vua"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white p-3 rounded-xl bg-black/40 backdrop-blur-xs border border-white/20">
                  <p className="text-xs font-semibold text-amber-300">
                    {isEn ? "Imperial Gift Box of Pho Hien" : "Hộp Quà Biếu Tiến Vua Hoàng Gia"}
                  </p>
                  <p className="text-[11px] text-stone-200 mt-0.5">
                    {isEn
                      ? "Preserving royal luxury and timeless gift elegance"
                      : "Trọn vẹn phong vị cung đình cho người trân quý"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. CHƯƠNG 3: TUYỆT KỸ XOÁY LONG & BÍ QUYẾT SẤY CỔ TRUYỀN   */}
      {/* ======================================================== */}
      <section id="nghe-thuat" className="py-14 sm:py-20 lg:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          {/* Header Chương 3 */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
              {isEn ? "Chapter 3: The Artisanal Craft" : "Chương III: Tuyệt Kỹ Xoáy Long"}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0B3B2C] tracking-tight leading-tight [text-wrap:balance]">
              {isEn
                ? "4 Steps of Ancestral Longan Crafting — Heritage in Every Meticulous Motion"
                : "4 Bước Tuyệt Kỹ Chế Tác Long Nhãn — Kỳ Công Từng Múi Quả"}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed [text-wrap:pretty]">
              {isEn
                ? "Not every longan can become a royal tribute. It demands generational mastery, nimble hands, and gentle smoke curation."
                : "Không phải quả nhãn nào cũng thành long nhãn tiến vua. Phải qua đôi bàn tay điêu luyện của nghệ nhân và hàng chục giờ canh lửa than củi ấm."}
            </p>
          </div>

          {/* Quy trình 4 bước hiển thị dạng thẻ timeline trực quan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {craftingSteps.map((stepItem, idx) => {
              const StepIcon = stepItem.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-[#E8DFC8] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-black text-amber-600/30 group-hover:text-amber-600/60 transition-colors font-serif">
                        {stepItem.step}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                        <StepIcon className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                        {stepItem.tag}
                      </span>
                      <h3 className="text-base font-bold text-stone-900 leading-snug">{stepItem.title}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{stepItem.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <span>{isEn ? "Artisanal Method" : "Kỹ thuật thủ công"}</span>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bảng so sánh trực quan: Long Nhãn Phố Hiến Chuẩn vs Long Nhãn Thông Thường */}
          <div className="rounded-3xl bg-white border border-[#E8DFC8] p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-[#0B3B2C] text-center mb-6">
              {isEn
                ? "How to Distinguish Authentic Pho Hien Longan"
                : "Bảng So Sánh Nhận Biết Long Nhãn Chuẩn Phố Hiến"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Cột Chuẩn Phố Hiến */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                  <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
                    {isEn ? "Authentic Nguyet Nhan Pho Hien" : "Long Nhãn Nguyệt Nhãn Phố Hiến"}
                  </h4>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-emerald-900">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span><strong>Màu sắc:</strong> Sắc vàng cánh gián hổ phách trong suốt, bóng tự nhiên.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span><strong>Độ dẻo:</strong> Cùi dày, cầm ráo tay, dẻo quánh, nhai giòn sần sật.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span><strong>Hương vị:</strong> Vị ngọt thanh tao tự nhiên, đọng lại vị ngọt hậu sâu lâu nơi cổ họng.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span><strong>Bảo quản:</strong> Để lâu múi vẫn tơi xốp, không chảy nước, không vón cục.</span>
                  </li>
                </ul>
              </div>

              {/* Cột Hàng Đại Trà */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 opacity-90">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-stone-400 text-white flex items-center justify-center text-xs font-bold">
                    ✕
                  </div>
                  <h4 className="font-bold text-stone-700 text-sm sm:text-base">
                    {isEn ? "Common Commercial Longan" : "Long Nhãn Kém Chất Lượng / Tẩm Đường"}
                  </h4>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-stone-600">
                  <li className="flex items-start gap-2">
                    <span className="text-stone-400 font-bold">•</span>
                    <span><strong>Màu sắc:</strong> Màu nâu xỉn sẫm hoặc vàng vọt do sấy diêm sinh ép nhiệt.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-stone-400 font-bold">•</span>
                    <span><strong>Độ dẻo:</strong> Cùi mỏng, bết dính tay do tẩm đường, nhai bã nhạt vị.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-stone-400 font-bold">•</span>
                    <span><strong>Hương vị:</strong> Ngọt khé cổ, không có hương thơm dịu nhẹ của hoa nhãn.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-stone-400 font-bold">•</span>
                    <span><strong>Bảo quản:</strong> Dễ bị nhớt, ẩm mốc và chua sau thời gian ngắn.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. PHẦN GIỮ LẠI: TƯ LIỆU KÝ SỰ DI SẢN (VIDEO TƯ LIỆU)    */}
      {/* ======================================================== */}
      <SectionErrorBoundary sectionName="Tư Liệu Ký Sự Di Sản">
        <HeritageVideoSection
          language={language as "vi" | "en"}
          posterUrl="/images/setqua.jpg"
          youtubeId="X8e-QWaVGQk"
        />
      </SectionErrorBoundary>

      {/* ======================================================== */}
      {/* 6. CHƯƠNG 4: NGUYỆT NHÃN PHỐ HIẾN — GÌN GIỮ HỒN XƯA      */}
      {/* ======================================================== */}
      <section id="duong-dai" className="py-14 sm:py-20 lg:py-24 bg-white border-t border-[#E8DFC8]">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          {/* Header Chương 4 */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#0B3B2C] bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              {isEn ? "Chapter 4: Modern Legacy" : "Chương IV: Tiếp Nối Đương Đại"}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0B3B2C] tracking-tight leading-tight [text-wrap:balance]">
              {isEn
                ? "Nguyet Nhan Pho Hien — Preserving the Soul of Heritage for Future Generations"
                : "Nguyệt Nhãn Phố Hiến — Lưu Giữ Hồn Xưa Trong Từng Nhịp Sống Hiện Đại"}
            </h2>
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed [text-wrap:pretty]">
              {isEn
                ? "Every box of Nguyet Nhan is not merely a gourmet treat, but a bridge connecting Vietnam's rich heritage with contemporary healthy lifestyles."
                : "Mỗi sản phẩm gửi trao không chỉ là một thức quà tinh hoa ẩm thực, mà là nhịp cầu kết nối di sản ngàn năm của cha ông với lối sống dưỡng sinh bền vững hôm nay."}
            </p>
          </div>

          {/* Triết lý tên gọi thương hiệu */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 border border-[#E8DFC8] mb-12 sm:mb-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-amber-800 font-bold text-lg font-serif">
                  Nguyệt
                </div>
                <h4 className="font-bold text-base text-stone-900">{isEn ? "The Autumn Moon" : "Trăng Rằm Mùa Thu"}</h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {isEn
                    ? "Symbolizes the completeness of family reunions and the golden harvest season."
                    : "Biểu trưng cho mùa thu hoạch rực vàng, sự vẹn tròn, đoàn viên sum vầy bên tách trà thơm."}
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 mx-auto flex items-center justify-center text-emerald-800 font-bold text-lg font-serif">
                  Nhãn
                </div>
                <h4 className="font-bold text-base text-stone-900">{isEn ? "The Dragon Eye" : "Thức Quả Mắt Rồng"}</h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {isEn
                    ? "The celestial jewel bestowed upon the riverbanks, shining with translucent vitality."
                    : "Quả ngọc trời ban bên dải sông Hồng, mắt rồng soi sáng tâm hồn và bồi bổ sức khỏe trường thọ."}
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-amber-800 font-bold text-lg font-serif">
                  Phố Hiến
                </div>
                <h4 className="font-bold text-base text-stone-900">{isEn ? "Historic Homeland" : "Cội Nguồn Phố Cảng"}</h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {isEn
                    ? "Rooted in the eternal pride of Hung Yen's famed historic trading sanctuary."
                    : "Gắn chặt với vùng đất văn hiến Hưng Yên — cái nôi sản sinh thức quả ngọc tiến vua vang danh sử sách."}
                </p>
              </div>
            </div>
          </div>

          {/* 3 Cam kết cốt lõi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {commitments.map((com, idx) => {
              const ComIcon = com.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#FCFBF7] border border-[#E8DFC8] shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-900">
                    <ComIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base sm:text-lg font-bold text-stone-900">{com.title}</h4>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{com.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. LỐI DẪN TIẾP NỐI & KHÁM PHÁ (CTA SECTION)              */}
      {/* ======================================================== */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-[#FCFBF7] via-white to-amber-50/30 border-t border-[#E8DFC8]">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 text-amber-700" />
            <span>{isEn ? "Experience the Heritage" : "Thưởng Thức Trọn Vẹn Di Sản"}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0B3B2C] tracking-tight leading-tight [text-wrap:balance]">
            {isEn
              ? "Continue Your Journey through Pho Hien Culture & Products"
              : "Tiếp Tục Khám Phá Văn Hóa Ẩm Thực & Tuyệt Phẩm Phố Hiến"}
          </h2>

          <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed [text-wrap:pretty]">
            {isEn
              ? "Discover how Pho Hien longan is artfully incorporated into royal gourmet recipes, or craft your own personalized wellness mix box."
              : "Tìm hiểu các bài thuốc ngự thiện và món ăn tiến vua thanh tao, hoặc tự tay chọn lựa công thức mix hạt dinh dưỡng theo khẩu vị của riêng bạn."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4">
            <Link
              href="/am-thuc"
              prefetch={true}
              className="inline-flex items-center gap-2 bg-[#0B3B2C] hover:bg-[#0B3B2C]/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 text-xs sm:text-sm md:text-base"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isEn ? "Gourmet Heritage Culture" : "Xem Văn Hóa Ẩm Thực"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/tu-chon-hat"
              prefetch={true}
              className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 text-xs sm:text-sm md:text-base"
            >
              <Layers className="w-4 h-4" />
              <span>{isEn ? "Custom Mix Workshop" : "Xưởng Tự Chọn Hạt"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/san-pham"
              prefetch={true}
              className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-stone-900 border border-[#E8DFC8] font-bold px-6 py-3 rounded-xl transition-all shadow-xs hover:scale-105 active:scale-95 text-xs sm:text-sm md:text-base"
            >
              <Crown className="w-4 h-4 text-amber-600" />
              <span>{isEn ? "Shop Gift Collections" : "Xem Sản Phẩm Tiến Vua"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Dòng địa chỉ & nguồn cội uy tín */}
          <div className="pt-8 border-t border-stone-200/80 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-700" />
              <span>Số 1, Phố Hiến, Thành phố Hưng Yên</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Phục vụ 24/7 trực tuyến</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

// Icon mỏng thanh lịch cho bút tre (Feather-like quill)
function FeatherIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className || "w-5 h-5"}
    >
      <path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.58 10.02a2 2 0 0 0-.58 1.42V19h7.67Z" />
      <line x1="16" x2="8" y1="8" y2="16" />
    </svg>
  );
}

export default StoryPageView;
