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
      <ContactPageView />
    </StorefrontLayout>
  );
}

