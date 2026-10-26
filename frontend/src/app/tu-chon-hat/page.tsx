import type { Metadata } from "next";
import CustomMixStudio from "@/views/custom-mix/CustomMixStudio";

export const metadata: Metadata = {
  title: "Tự Chọn Hạt & Thiết Kế Bao Bì Riêng | Nguyệt Nhãn Phố Hiến",
  description:
    "Tự tay lựa chọn và tinh chỉnh tỉ lệ 5 loại hạt đặc sản & dinh dưỡng cao cấp (Long nhãn Phố Hiến, hạt macca, hạt điều, hạnh nhân, hạt bí xanh) vào túi zip 150g, hộp nhựa 300g hoặc lễ hộp 900g. Tự do đặt tên riêng cho sản phẩm của bạn!",
  openGraph: {
    title: "Tự Chọn Hạt & Đặt Tên Cho Sản Phẩm Của Bạn | Nguyệt Nhãn Phố Hiến",
    description:
      "Chế tác hộp quà & túi hạt dinh dưỡng độc bản theo sở thích riêng. In tem nhãn mang tên bạn hoàn toàn miễn phí.",
    images: ["/images/setqua.jpg"],
  },
};

export default function TuChonHatPage() {
  return <CustomMixStudio />;
}
