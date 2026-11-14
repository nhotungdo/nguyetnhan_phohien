"use client";

import Link from "next/link";
import { Landmark, Sprout, ArrowRight, Heart, ShieldCheck, Award } from "lucide-react";
import { FastImage } from "@/components/FastImage";
import { HeritageVideoSection } from "@/components/HeritageVideoSection";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useLanguageStore } from "@/stores/useLanguageStore";

export function StoryPageView() {
  const { language } = useLanguageStore();

  return (
    <div className="bg-[#FAF8F5] py-8 sm:py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-8 sm:space-y-12 md:space-y-16">
        
        {/* ================= 01 — KHỞI NGUỒN ================= */}
        <section className="bg-[#3D283F] text-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center shadow-lg relative overflow-hidden border border-white/10">
          <div
            aria-hidden
            className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute bottom-0 left-0 w-72 h-72 bg-[#5A385E]/30 rounded-full blur-3xl pointer-events-none"
          />
          <div className="relative z-10 max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#D5B88F] uppercase">
              01 — KHỞI NGUỒN
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight [text-wrap:balance] text-white leading-tight font-serif">
              Một câu chuyện từ miền đất nhãn
            </h1>
            <p className="text-stone-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed [text-wrap:pretty]">
              Nơi hương vị truyền thống được nâng niu qua từng món quà
            </p>
          </div>
        </section>

        {/* ================= 02 — CỘI NGUỒN ================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 items-center">
          {/* Cột trái: Khung ảnh Phố Hiến */}
          <div className="relative w-full aspect-[4/3] rounded-2xl sm:rounded-3xl bg-[#EADDCF] border border-[#DECEBE] p-6 sm:p-8 flex flex-col items-center justify-center text-center overflow-hidden shadow-xs group">
            <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
              <FastImage
                src="/images/chuachuong.jpg"
                fallbackSrc="/images/combo3sp.jpg"
                alt="Vùng đất Phố Hiến"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center text-[#4A3739]">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/60 backdrop-blur-xs flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform duration-300">
                <Landmark className="w-8 h-8 sm:w-10 sm:h-10 text-[#4A3739]" />
              </div>
              <span className="text-base sm:text-lg font-bold text-[#4A3739] tracking-wide">
                Ảnh Phố Hiến
              </span>
              <span className="text-xs text-[#4A3739]/75 mt-1">Đô thị cổ 300 năm ven bờ sông Hồng</span>
            </div>
          </div>

          {/* Cột phải: Nội dung cội nguồn */}
          <div className="space-y-3 sm:space-y-4 px-2 sm:px-4">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-stone-500 uppercase">
              02 — CỘI NGUỒN
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight [text-wrap:balance]">
              Vùng đất Phố Hiến
            </h2>
            <p className="text-sm sm:text-base text-stone-700 font-medium leading-relaxed [text-wrap:pretty]">
              Lịch sử và những giá trị văn hóa quê hương
            </p>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-normal pt-1">
              &ldquo;Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến&rdquo; — nơi đất thiêng sông Hồng bồi đắp lớp phù sa trù phú. 
              Từ thế kỷ 16, thức quả ngọt lành từ những rặng nhãn cổ thụ đã vượt ngàn dặm về kinh kỳ, 
              trở thành niềm tự hào bất biến của người dân xứ nhãn qua bao thăng trầm thời gian.
            </p>
          </div>
        </section>

        {/* ================= 03 — TINH HOA ================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 items-center">
          {/* Cột trái: Nội dung tinh hoa */}
          <div className="order-2 md:order-1 space-y-3 sm:space-y-4 px-2 sm:px-4">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-stone-500 uppercase">
              03 — TINH HOA
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight [text-wrap:balance]">
              Từ nhãn đến món quà
            </h2>
            <p className="text-sm sm:text-base text-stone-700 font-medium leading-relaxed [text-wrap:pretty]">
              Sự hòa quyện giữa long nhãn, hạt sen và hạt dinh dưỡng
            </p>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-normal pt-1">
              Từng cùi long nhãn ráo mật óng ánh ôm trọn hạt sen búp bùi thơm, kết hợp cùng nguồn dưỡng chất dồi dào từ hạt điều, hạnh nhân, macca tuyển chọn. 
              Mỗi thức quà không chỉ ngon ngọt đậm đà mà còn là tấm lòng chăm sóc sức khỏe trọn vẹn dành tặng những người trân quý.
            </p>
          </div>

          {/* Cột phải: Khung ảnh nguyên liệu */}
          <div className="order-1 md:order-2 relative w-full aspect-[4/3] rounded-2xl sm:rounded-3xl bg-[#EADDCF] border border-[#DECEBE] p-6 sm:p-8 flex flex-col items-center justify-center text-center overflow-hidden shadow-xs group">
            <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
              <FastImage
                src="/images/combo3sp.jpg"
                fallbackSrc="/images/setqua.jpg"
                alt="Ảnh nguyên liệu"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center text-[#4A3739]">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/60 backdrop-blur-xs flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform duration-300">
                <Sprout className="w-8 h-8 sm:w-10 sm:h-10 text-[#4A3739]" />
              </div>
              <span className="text-base sm:text-lg font-bold text-[#4A3739] tracking-wide">
                Ảnh nguyên liệu
              </span>
              <span className="text-xs text-[#4A3739]/75 mt-1">Long nhãn hương chi • Sen búp • Hạt dinh dưỡng</span>
            </div>
          </div>
        </section>

        {/* ================= 04 — HÀNH TRÌNH ================= */}
        <section className="rounded-2xl sm:rounded-3xl bg-[#F0E6DC] border border-[#E4D6C7] p-6 sm:p-8 md:p-12 shadow-xs">
          <div className="text-center mb-6 sm:mb-10">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-stone-600 uppercase">
              04 — HÀNH TRÌNH
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {[
              { step: "1", title: "Tuyển chọn", desc: "Hái nhãn cổ thụ chín vàng, lựa sen búp đều hạt" },
              { step: "2", title: "Chế biến", desc: "Xoáy cùi tỉ mỉ, sấy đối lưu giữ trọn vị thanh ngọt" },
              { step: "3", title: "Hoàn thiện", desc: "Phối trộn tỷ lệ vàng, kiểm soát chất lượng khắt khe" },
              { step: "4", title: "Trao tặng", desc: "Đóng gói sang trọng, gửi gắm trọn vẹn tình quê hương" },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center space-y-2.5 group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#3D283F] text-white flex items-center justify-center font-bold text-base sm:text-lg md:text-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                  {item.step}
                </div>
                <h3 className="font-bold text-stone-900 text-sm sm:text-base">
                  {item.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-500 max-w-[190px] leading-relaxed hidden sm:block">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= PHẦN GIỮ LẠI: TƯ LIỆU KÝ SỰ DI SẢN ================= */}
        <section className="rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E8DFC8] shadow-sm">
          <SectionErrorBoundary sectionName="Tư Liệu Ký Sự Di Sản">
            <HeritageVideoSection
              language={language as "vi" | "en"}
              posterUrl="/images/setqua.jpg"
            />
          </SectionErrorBoundary>
        </section>

        {/* ================= 05 — GIÁ TRỊ THƯƠNG HIỆU ================= */}
        <section className="text-center py-6 sm:py-10 max-w-3xl mx-auto space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-stone-500 uppercase">
            05 — GIÁ TRỊ THƯƠNG HIỆU
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight [text-wrap:balance]">
            Giữ hồn truyền thống – Gửi trao trân quý
          </h2>
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto [text-wrap:pretty]">
            Câu chuyện, sứ mệnh và tâm huyết phía sau Nguyệt Nhãn Phố Hiến
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 text-left">
            <div className="p-5 rounded-2xl bg-white border border-[#E8DFC8] shadow-2xs space-y-2 hover:border-[#3D283F]/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#3D283F]/10 flex items-center justify-center text-[#3D283F] font-bold">
                <Award className="w-5 h-5 text-[#3D283F]" />
              </div>
              <h4 className="font-bold text-stone-900 text-sm sm:text-base">Gìn giữ di sản</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Tôn vinh giá trị văn hóa ngàn năm của thức quà tiến vua, đưa long nhãn Phố Hiến vươn xa với vị thế xứng tầm.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8DFC8] shadow-2xs space-y-2 hover:border-[#3D283F]/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#3D283F]/10 flex items-center justify-center text-[#3D283F] font-bold">
                <ShieldCheck className="w-5 h-5 text-[#3D283F]" />
              </div>
              <h4 className="font-bold text-stone-900 text-sm sm:text-base">Thuần khiết tự nhiên</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                100% không chất tạo màu, không hương liệu nhân tạo, giữ vẹn nguyên vị ngọt thanh dịu mát từ đất mẹ.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8DFC8] shadow-2xs space-y-2 hover:border-[#3D283F]/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#3D283F]/10 flex items-center justify-center text-[#3D283F] font-bold">
                <Heart className="w-5 h-5 text-[#3D283F]" />
              </div>
              <h4 className="font-bold text-stone-900 text-sm sm:text-base">Gửi trao tâm huyết</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Chăm chút từng hộp quà tỉ mỉ như lời chúc sức khỏe, an khang và tình cảm chân thành trao gửi người nhận.
              </p>
            </div>
          </div>
        </section>

        {/* ================= 06 — LỜI MỜI ================= */}
        <section className="bg-[#3D283F] text-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-14 text-center shadow-lg relative overflow-hidden border border-white/10">
          <div
            aria-hidden
            className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
          />
          <div className="relative z-10 max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#D5B88F] uppercase">
              06 — LỜI MỜI
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight [text-wrap:balance] text-white leading-tight">
              Mang hương vị Phố Hiến đến gần hơn
            </h2>
            <div className="pt-2">
              <Link
                href="/san-pham"
                prefetch={true}
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#D5B88F] hover:bg-[#C8A97E] text-[#3D283F] font-bold text-sm sm:text-base transition-all duration-300 shadow-md hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Khám phá sản phẩm</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
