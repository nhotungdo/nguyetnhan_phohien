import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { StorefrontLayout } from "@/components/layout/StorefrontLayout";
import { IntroductionSection } from "@/views/landing/IntroductionSection";
import { StorySection } from "@/views/landing/StorySection";

export const metadata: Metadata = {
  title: "Câu Chuyện Di Sản & Khởi Nguồn Long Nhãn Tiến Vua",
  description:
    "Tìm hiểu lịch sử long nhãn Hưng Yên tiến vua từ thế kỷ 16, gìn giữ trọn vẹn hương vị truyền thống phù sa sông Hồng qua thước phim tài liệu di sản Phố Hiến.",
  openGraph: {
    title: "Câu Chuyện Di Sản Long Nhãn Tiến Vua | Nguyệt Nhãn Phố Hiến",
    description:
      "Từ vườn nhãn cổ thụ Phố Hiến đến bàn tiệc hoàng gia. Khám phá câu chuyện lưu giữ hồn quê hương ngàn xưa.",
    images: ["/images/combo3sp.jpg"],
  },
};

export default function CauChuyenPage() {
  return (
    <StorefrontLayout>
      {/* Subpage Header Banner */}
      <section className="bg-gradient-to-b from-amber-100/60 via-[#F7F3EB] to-background pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-[#E8DFC8]/60">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8DFC8] text-primary text-xs sm:text-sm font-semibold shadow-2xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Di Sản Văn Hóa & Tinh Hoa Đất Việt</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight [text-wrap:balance]">
            Câu Chuyện Nguyệt Nhãn Phố Hiến
          </h1>
          <p className="mt-3 text-base sm:text-lg text-stone-700 leading-relaxed [text-wrap:pretty]">
            Hành trình gìn giữ phong vị long nhãn tiến vua từ thế kỷ 16 trên dải đất phù sa sông Hồng Hưng Yên.
          </p>
        </div>
      </section>

      {/* 1. Giới thiệu thương hiệu & 3 thẻ bảo chứng */}
      <IntroductionSection />

      {/* 2. Khởi nguồn & Câu chuyện di sản & Thước phim tài liệu */}
      <StorySection />

      {/* 3. Lối dẫn tiếp nối sang Ẩm thực hoặc Sản phẩm */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/80 border-t border-[#E8DFC8]">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
            Tiếp Tục Khám Phá Nét Đẹp Phố Hiến
          </h2>
          <p className="text-stone-600 mb-6 text-sm sm:text-base">
            Tìm hiểu dòng chảy lịch sử 300 năm và cẩm nang thưởng thức long nhãn đúng điệu hoàng gia.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/am-thuc"
              prefetch={true}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <BookOpen className="w-4 h-4" />
              <span>Xem Văn Hóa Ẩm Thực</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/san-pham"
              prefetch={true}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <span>Xem Sản Phẩm & Đặt Mua</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}

