import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShoppingCart, Sparkles } from "lucide-react";
import { StorefrontLayout } from "@/components/layout/StorefrontLayout";
import { HistorySection } from "@/views/landing/HistorySection";

export const metadata: Metadata = {
  title: "Văn Hóa Ẩm Thực & Dòng Chảy Lịch Sử Phố Hiến",
  description:
    "Khám phá dòng chảy lịch sử 'Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến', hành trình nghệ nhân sấy đối lưu 48 giờ và cẩm nang ẩm thực thưởng thức long nhãn tiến vua đúng điệu.",
  openGraph: {
    title: "Văn Hóa Ẩm Thực & Lịch Sử Phố Hiến | Nguyệt Nhãn Phố Hiến",
    description:
      "Dòng chảy lịch sử thương cảng Phố Hiến sầm uất và cẩm nang kết hợp long nhãn chuẩn phong vị hoàng gia.",
    images: ["/images/combo3sp.jpg"],
  },
};

export default function AmThucPage() {
  return (
    <StorefrontLayout>
      {/* Subpage Header Banner */}
      <section className="bg-gradient-to-b from-amber-100/60 via-[#F7F3EB] to-background pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-[#E8DFC8]/60">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8DFC8] text-primary text-xs sm:text-sm font-semibold shadow-2xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Nghệ Thuật Thưởng Thức Ẩm Thực Cung Đình</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight [text-wrap:balance]">
            Di Sản Văn Hóa & Ẩm Thực Phố Hiến
          </h1>
          <p className="mt-3 text-base sm:text-lg text-stone-700 leading-relaxed [text-wrap:pretty]">
            Dòng chảy 300 năm lịch sử đất cảng và nghệ thuật kết hợp long nhãn trong từng chén trà, bát chè thanh tao.
          </p>
        </div>
      </section>

      {/* Dòng chảy lịch sử, Scrollytelling nghệ nhân và Nghệ thuật ẩm thực */}
      <HistorySection />

      {/* CTA mua sắm nguyên liệu chuẩn vị */}
      <section className="py-12 sm:py-16 bg-[#451A03] text-white">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-[#FDE68A]">
            Thưởng Thức Hương Vị Long Nhãn Thượng Hạng
          </h2>
          <p className="text-stone-300 mb-6 text-sm sm:text-base leading-relaxed">
            Nguyên liệu hoàn hảo cho những tuần trà sen thanh tịnh hay những bát chè long nhãn hạt sen bổ dưỡng.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/san-pham"
              prefetch={true}
              className="inline-flex items-center gap-2 bg-accent hover:bg-[#9A3412] text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Đặt Mua Sản Phẩm Chính Hãng</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}

