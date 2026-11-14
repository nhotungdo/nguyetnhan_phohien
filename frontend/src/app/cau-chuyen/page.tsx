import type { Metadata } from "next";
import { StorefrontLayout } from "@/components/layout/StorefrontLayout";
import { StoryPageView } from "@/views/story/StoryPageView";

export const metadata: Metadata = {
  title: "Một Câu Chuyện Từ Miền Đất Nhãn | Nguyệt Nhãn Phố Hiến",
  description:
    "Tìm hiểu lịch sử long nhãn Hưng Yên tiến vua từ thế kỷ 16, gìn giữ trọn vẹn hương vị truyền thống phù sa sông Hồng qua tư liệu ký sự di sản Phố Hiến.",
  openGraph: {
    title: "Một Câu Chuyện Từ Miền Đất Nhãn | Nguyệt Nhãn Phố Hiến",
    description:
      "Nơi hương vị truyền thống được nâng niu qua từng món quà. Khám phá câu chuyện và tư liệu ký sự di sản Phố Hiến.",
    images: ["/images/combo3sp.jpg"],
  },
};

export default function CauChuyenPage() {
  return (
    <StorefrontLayout>
      <StoryPageView />
    </StorefrontLayout>
  );
}

