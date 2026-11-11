import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout/StorefrontLayout";
import { ContactPageView } from "@/views/contact/ContactPageView";

export const metadata: Metadata = {
  title: "Liên Hệ & Hệ Thống Phân Phối Chính Hãng",
  description:
    "Thông tin liên hệ thương hiệu Nguyệt Nhãn Phố Hiến: hotline tư vấn 24/7, địa chỉ xưởng chế biến tại TP. Hưng Yên, bản đồ và form liên hệ báo giá sỉ quà tặng doanh nghiệp.",
  openGraph: {
    title: "Liên Hệ | Nguyệt Nhãn Phố Hiến",
    description: "Kết nối với Nguyệt Nhãn Phố Hiến để được tư vấn tận tâm và nhận báo giá ưu đãi tốt nhất.",
    images: ["/images/combo3sp.jpg"],
  },
};

export default function LienHePage() {
  return (
    <StorefrontLayout>
      {/* Subpage Header Banner */}
      <section className="bg-gradient-to-b from-amber-100/60 via-[#F7F3EB] to-background pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-[#E8DFC8]/60">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8DFC8] text-primary text-xs sm:text-sm font-semibold shadow-2xs mb-4">
            <span>Kết Nối & Hỗ Trợ Khách Hàng Tận Tâm</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight [text-wrap:balance]">
            Liên Hệ Với Chúng Tôi
          </h1>
          <p className="mt-3 text-base sm:text-lg text-stone-700 leading-relaxed [text-wrap:pretty]">
            Đội ngũ tư vấn viên luôn sẵn sàng giải đáp mọi thắc mắc và hỗ trợ quý khách lựa chọn món quà sức khỏe ý nghĩa nhất.
          </p>
        </div>
      </section>

      <ContactPageView />
    </StorefrontLayout>
  );
}

